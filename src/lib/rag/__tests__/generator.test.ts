/**
 * Tests unitaires pour le service de génération
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock de axios
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
  
  // Créer une vraie MockAxiosError qui étend AxiosError
  class MockAxiosErrorWithBase extends actual.AxiosError {
    constructor(message: string, response?: any) {
      super(message);
      this.name = 'AxiosError';
      this.response = response;
    }
  }
  
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        post: vi.fn(),
        get: vi.fn(),
        interceptors: {
          request: { use: vi.fn(), eject: vi.fn() },
          response: { use: vi.fn(), eject: vi.fn() },
        },
      })),
    },
    AxiosError: MockAxiosErrorWithBase,
  };
});

// Importer après les mocks
import {
  ResponseGenerator,
  generateResponse,
  streamResponse,
  GenerationError,
  UserRole,
} from '../generator';
import { Chunk } from '../types';
import axios from 'axios';

// Créer une fonction pour générer des erreurs Axios mockées
// Puisque AxiosError est mocké, nous devons créer nos propres erreurs
class TestAxiosError extends Error {
  response?: any;
  constructor(message: string, response?: any) {
    super(message);
    this.name = 'AxiosError';
    this.response = response;
  }
}

// Importer les fonctions de prompts directement depuis prompts.ts (pas mocké)
import {
  buildPrompt,
  getPromptsForRole,
  replacePromptVariables,
} from '../prompts';

describe('ResponseGenerator', () => {
  let generator: ResponseGenerator;

  beforeEach(() => {
    process.env.MISTRAL_API_KEY = 'test-api-key';
    generator = new ResponseGenerator();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(generator).toBeDefined();
      expect(generator.isConfigured()).toBe(true);
    });

    it('devrait détecter si non configuré', () => {
      const originalEnv = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      const unconfiguredGenerator = new ResponseGenerator({ apiKey: '' });
      expect(unconfiguredGenerator.isConfigured()).toBe(false);
      
      process.env.MISTRAL_API_KEY = originalEnv;
    });

    it('devrait permettre de mettre à jour la configuration', () => {
      generator.updateConfig({ temperature: 0.9, model: 'mistral-medium' });
      expect(generator.isConfigured()).toBe(true);
    });
  });

  describe('Construction du contexte', () => {
    it('devrait construire le contexte à partir des chunks', () => {
      const chunks: Chunk[] = [
        {
          content: 'Ceci est le premier chunk',
          metadata: {
            chunkIndex: 0,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/guide.md',
          }
        },
        {
          content: 'Ceci est le deuxième chunk',
          metadata: {
            chunkIndex: 1,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/api.md',
          }
        }
      ];
      
      const context = (generator as any).buildContextFromChunks(chunks);
      
      expect(context).toContain('--- Source: /docs/guide.md ---');
      expect(context).toContain('Ceci est le premier chunk');
      expect(context).toContain('--- Source: /docs/api.md ---');
      expect(context).toContain('Ceci est le deuxième chunk');
    });

    it('devrait retourner un contexte vide si aucun chunk', () => {
      const context = (generator as any).buildContextFromChunks([]);
      expect(context).toBe('');
    });

    it('devrait utiliser source comme fallback pour documentPath', () => {
      const chunks: Chunk[] = [
        {
          content: 'Chunk avec source',
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            contentType: 'text',
            tokenCount: 10,
            source: 'gitlab',
          }
        }
      ];
      
      const context = (generator as any).buildContextFromChunks(chunks);
      expect(context).toContain('--- Source: gitlab ---');
    });
  });

  describe('Génération de réponse', () => {
    it('devrait gérer une requête vide', async () => {
      await expect(generator.generateResponse('')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer une requête valide', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse de test' },
          }],
          usage: { total_tokens: 50 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse('Test query');

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse de test');
      expect(result.tokenCount).toBe(50);
      expect(result.createdAt).toBeDefined();
      expect(result.contextChunks).toBe(0);
      expect(result.generationTime).toBeDefined();
    });

    it('devrait générer avec du contexte', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse avec contexte' },
          }],
          usage: { total_tokens: 100 },
        }
      });
      (generator as any).client.post = mockPost;

      const chunks: Chunk[] = [
        {
          content: 'Contexte important',
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            contentType: 'text',
            tokenCount: 10,
            documentPath: '/docs/context.md',
          }
        }
      ];

      const result = await generator.generateResponse('Test query', chunks);

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse avec contexte');
      expect(result.contextChunks).toBe(1);
    });

    it('devrait générer avec une liste vide de chunks', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse sans contexte' },
          }],
          usage: { total_tokens: 30 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse('Test query', []);

      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse sans contexte');
      expect(result.contextChunks).toBe(0);
    });

    it('devrait générer avec un rôle utilisateur spécifique', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse pour admin' },
          }],
          usage: { total_tokens: 40 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse(
        'Test query',
        [],
        { userRole: 'admin' }
      );

      expect(result).toBeDefined();
      expect(result.userRole).toBe('admin');
    });

    it('devrait générer avec un conversationId', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          choices: [{
            message: { content: 'Réponse avec conversation' },
          }],
          usage: { total_tokens: 45 },
        }
      });
      (generator as any).client.post = mockPost;

      const result = await generator.generateResponse(
        'Test query',
        [],
        { conversationId: 'conv-123' }
      );

      expect(result).toBeDefined();
      expect(result.conversationId).toBe('conv-123');
    });
  });

  describe('Streaming', () => {
    it('devrait gérer une requête vide en streaming', async () => {
      await expect(
        generator.streamResponse('')
      ).rejects.toThrow(GenerationError);
    });

    it('devrait streamer une réponse avec callback', async () => {
      const chunks = [
        { choices: [{ delta: { role: 'assistant' }, finish_reason: null }] },
        { choices: [{ delta: { content: 'chunk1' }, finish_reason: null }] },
        { choices: [{ delta: { content: 'chunk2' }, finish_reason: null }] },
        { choices: [{ delta: {}, finish_reason: 'stop' }] },
      ];

      let receivedChunks: any[] = [];
      const mockPost = vi.fn().mockImplementation(() => ({
        data: {
          [Symbol.asyncIterator]: () => ({
            next: async () => {
              const chunk = chunks.shift();
              if (!chunk) return { done: true, value: undefined };
              // Retourner le chunk directement (parseSSEChunk gère les objets)
              return { done: false, value: chunk };
            }
          })
        }
      }));
      (generator as any).client.post = mockPost;

      await generator.streamResponse('Test', [], {
        onChunk: (chunk) => {
          receivedChunks.push(chunk);
        }
      });

      expect(receivedChunks.length).toBeGreaterThan(0);
      expect(receivedChunks[0].role).toBe('assistant');
      expect(receivedChunks.some(c => c.done === true)).toBe(true);
    });

    it('devrait gérer une requête non configurée en streaming', async () => {
      const originalEnv = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      const unconfiguredGenerator = new ResponseGenerator({ apiKey: '' });
      
      await expect(
        unconfiguredGenerator.streamResponse('test')
      ).rejects.toThrow(GenerationError);
      
      process.env.MISTRAL_API_KEY = originalEnv;
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs 400', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new TestAxiosError('Bad request', {
          status: 400,
          data: {
            object: 'error',
            message: 'Bad request',
            type: 'BadRequestError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      await expect(generator.generateResponse('test')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer les erreurs 401', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new TestAxiosError('Invalid API key', {
          status: 401,
          data: {
            object: 'error',
            message: 'Invalid API key',
            type: 'InvalidRequestError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      await expect(generator.generateResponse('test')).rejects.toThrow(GenerationError);
    });

    it('devrait gérer les erreurs 429 (rate limit)', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new TestAxiosError('Rate limit exceeded', {
          status: 429,
          data: {
            object: 'error',
            message: 'Rate limit exceeded',
            type: 'RateLimitError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      try {
        await generator.generateResponse('test');
      } catch (error) {
        expect(error).toBeInstanceOf(GenerationError);
        const genError = error as GenerationError;
        expect(genError.retryable).toBe(true);
        expect(genError.statusCode).toBe(429);
      }
    });

    it('devrait gérer les erreurs serveur 500', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new TestAxiosError('Internal server error', {
          status: 500,
          data: {
            object: 'error',
            message: 'Internal server error',
            type: 'InternalServerError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      try {
        await generator.generateResponse('test');
      } catch (error) {
        expect(error).toBeInstanceOf(GenerationError);
        const genError = error as GenerationError;
        expect(genError.retryable).toBe(true);
      }
    });

    it('devrait gérer les erreurs 404', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new TestAxiosError('Model not found', {
          status: 404,
          data: {
            object: 'error',
            message: 'Model not found',
            type: 'NotFoundError',
          }
        })
      );
      (generator as any).client.post = mockPost;

      await expect(generator.generateResponse('test')).rejects.toThrow(GenerationError);
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter generateResponse', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            choices: [{
              message: { content: 'Réponse exportée' },
            }],
            usage: { total_tokens: 40 },
          }
        })
      };
      
      const { responseGenerator } = await import('../generator');
      (responseGenerator as any).client = mockClient;

      const result = await generateResponse('Test');
      expect(result).toBeDefined();
      expect(result.response).toBe('Réponse exportée');
    });

    it('devrait exporter streamResponse', async () => {
      const mockClient = {
        post: vi.fn().mockImplementation(() => ({
          data: {
            [Symbol.asyncIterator]: () => ({
              async next() {
                return { done: true, value: undefined };
              }
            })
          }
        }))
      };
      
      const { responseGenerator } = await import('../generator');
      (responseGenerator as any).client = mockClient;

      await expect(
        streamResponse('Test', [], { onChunk: vi.fn() })
      ).resolves.toBeUndefined();
    });
  });
});

describe('Prompts', () => {
  describe('replacePromptVariables', () => {
    it('devrait remplacer les variables simples', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        { name: 'World' }
      );
      expect(result).toBe('Hello World!');
    });

    it('devrait laisser les variables non définies', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        {}
      );
      expect(result).toBe('Hello {name}!');
    });

    it('devrait remplacer plusieurs variables', () => {
      const result = replacePromptVariables(
        '{greeting} {name}! {exclamation}',
        { greeting: 'Hello', name: 'World', exclamation: '!!!' }
      );
      expect(result).toBe('Hello World! !!!');
    });

    it('devrait gérer les variables avec des valeurs vides', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        { name: '' }
      );
      expect(result).toBe('Hello !');
    });

    it('devrait gérer les variables avec des valeurs undefined', () => {
      const result = replacePromptVariables(
        'Hello {name}!',
        { name: undefined }
      );
      expect(result).toBe('Hello {name}!');
    });
  });

  describe('getPromptsForRole', () => {
    it('devrait retourner les prompts par défaut pour user', () => {
      const prompts = getPromptsForRole('user');
      expect(prompts).toBeDefined();
      expect(prompts.system).toBeDefined();
      expect(prompts.system.role).toBe('system');
    });

    it('devrait retourner les prompts pour admin', () => {
      const prompts = getPromptsForRole('admin');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('admin');
      expect(prompts.system.content).toContain('expert');
    });

    it('devrait retourner les prompts pour developer', () => {
      const prompts = getPromptsForRole('developer');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('technique');
    });

    it('devrait retourner les prompts pour analyst', () => {
      const prompts = getPromptsForRole('analyst');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('insights');
    });

    it('devrait retourner les prompts pour guest', () => {
      const prompts = getPromptsForRole('guest');
      expect(prompts).toBeDefined();
      expect(prompts.system.content).toContain('visiteurs');
    });

    it('devrait retourner user prompts pour un rôle inconnu', () => {
      const prompts = getPromptsForRole('unknown' as UserRole);
      expect(prompts).toBeDefined();
      expect(prompts).toEqual(getPromptsForRole('user'));
    });
  });

  describe('buildPrompt', () => {
    it('devrait construire un prompt complet', () => {
      const messages = buildPrompt(
        'Test query',
        'Contexte important',
        'user'
      );

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('Contexte important');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Test query');
    });

    it('devrait construire un prompt avec des variables supplémentaires', () => {
      const messages = buildPrompt(
        'Test query',
        'Contexte',
        'admin',
        { instructions: 'Sois précis' }
      );

      expect(messages[0].content).toContain('Sois précis');
    });

    it('devrait utiliser user comme rôle par défaut', () => {
      const messages = buildPrompt('Test query', 'Contexte');
      expect(messages[0].content).toContain('général');
    });

    it('devrait construire un prompt sans contexte', () => {
      const messages = buildPrompt('Test query', '');
      expect(messages[0].content).not.toContain('Contexte :');
      expect(messages[1].content).toBe('Test query');
    });
  });
});

describe('GenerationError', () => {
  it('devrait créer une erreur avec les bonnes propriétés', () => {
    const error = new GenerationError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('GenerationError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new GenerationError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur avec seulement message et code', () => {
    const error = new GenerationError('Test error', 500);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur retryable', () => {
    const error = new GenerationError('Test error', 500, 'server_error', true);
    expect(error.retryable).toBe(true);
  });
});
