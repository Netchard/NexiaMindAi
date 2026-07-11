/**
 * Tests unitaires pour le service d'embeddings
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Utiliser vi.hoisted pour définir MockAxiosError avant que les mocks ne soient hoisted
const MockAxiosError = vi.hoisted(() => 
  class extends Error {
    response?: any;
    constructor(message: string, response?: any) {
      super(message);
      this.name = 'AxiosError';
      this.response = response;
    }
  }
);

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock de axios pour éviter les appels API réels
vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();
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
    AxiosError: MockAxiosError,
  };
});

// Importer après les mocks
import {
  EmbeddingService,
  generateEmbedding,
  generateEmbeddings,
  embedChunks,
  EmbeddingError
} from '../embeddings';
import { Chunk } from '../types';

describe('EmbeddingService', () => {
  let service: EmbeddingService;

  beforeEach(() => {
    // Configurer avec une clé API mock
    process.env.MISTRAL_API_KEY = 'test-api-key';
    service = new EmbeddingService();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(service).toBeDefined();
      expect(service.isConfigured()).toBe(true);
    });

    it('devrait détecter si non configuré', () => {
      // Sauvegarder et nettoyer l'env
      const originalEnv = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      // Vérifier que la création d'un service sans clé lève une erreur
      expect(() => new EmbeddingService({ apiKey: '' })).toThrow(EmbeddingError);
      expect(() => new EmbeddingService()).toThrow(EmbeddingError);
      
      // Restaurer l'env
      process.env.MISTRAL_API_KEY = originalEnv;
    });
  });

  describe('Estimation de tokens', () => {
    it('devrait estimer le nombre de tokens', () => {
      // @ts-ignore - accéder à la méthode privée via any
      const tokenCount = (service as any).estimateTokenCount('test');
      expect(tokenCount).toBeGreaterThan(0);
    });
  });

  describe('Cache', () => {
    it('devrait mettre en cache les embeddings', () => {
      // Mock de la méthode callMistralApi
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }
      });
      (service as any).client.post = mockPost;

      // Premier appel - devrait appeler l'API
      return service.generateEmbedding('test', { useCache: true }).then(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);

        // Deuxième appel avec le même texte - devrait utiliser le cache
        return service.generateEmbedding('test', { useCache: true }).then(() => {
          expect(mockPost).toHaveBeenCalledTimes(1); // Toujours 1 appel
        });
      });
    });

    it('devrait ignorer le cache si demandé', () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{ embedding: [0.1, 0.2, 0.3] }]
        }
      });
      (service as any).client.post = mockPost;

      // Premier appel sans cache
      return service.generateEmbedding('test', { useCache: false }).then(() => {
        expect(mockPost).toHaveBeenCalledTimes(1);

        // Deuxième appel sans cache - devrait appeler l'API à nouveau
        return service.generateEmbedding('test', { useCache: false }).then(() => {
          expect(mockPost).toHaveBeenCalledTimes(2);
        });
      });
    });

    it('devrait vider le cache', () => {
      service.clearCache();
      expect(service.getCacheStats().size).toBe(0);
    });

    it('devrait retourner les statistiques du cache', () => {
      const stats = service.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('ttl');
    });
  });

  describe('Génération d\'embedding', () => {
    it('devrait gérer un texte vide', async () => {
      await expect(service.generateEmbedding('')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer un texte valide', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [{
            embedding: new Array(1536).fill(0.1),
          }]
        }
      });
      (service as any).client.post = mockPost;

      const result = await service.generateEmbedding('test');

      expect(result).toBeDefined();
      expect(result.embedding).toBeDefined();
      expect(result.embedding.length).toBe(1536);
      expect(result.createdAt).toBeDefined();
      expect(result.tokenCount).toBeGreaterThan(0);
    });

    it('devrait générer des embeddings en batch', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
          ]
        }
      });
      (service as any).client.post = mockPost;

      const texts = ['text1', 'text2'];
      const result = await service.generateEmbeddings(texts);

      expect(result.embeddings).toHaveLength(2);
      expect(result.totalTokens).toBeGreaterThan(0);
      expect(result.processingTime).toBeDefined();
    });

    it('devrait gérer une liste vide', async () => {
      await expect(service.generateEmbeddings([])).rejects.toThrow(EmbeddingError);
    });

    it('devrait embedder des chunks', async () => {
      const mockPost = vi.fn().mockResolvedValue({
        data: {
          data: [
            { embedding: new Array(1536).fill(0.1) },
            { embedding: new Array(1536).fill(0.2) },
          ]
        }
      });
      (service as any).client.post = mockPost;

      const chunks: Chunk[] = [
        {
          content: 'text1',
          metadata: {
            chunkIndex: 0,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
          }
        },
        {
          content: 'text2',
          metadata: {
            chunkIndex: 1,
            totalChunks: 2,
            contentType: 'text',
            tokenCount: 10,
          }
        }
      ];

      const result = await service.embedChunks(chunks);

      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].embedding).toBeDefined();
      expect(result.chunks[0].embedding.length).toBe(1536);
      expect(result.totalTokens).toBeGreaterThan(0);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs 400', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 400,
          data: {
            object: 'error',
            message: 'Bad request',
            type: 'BadRequestError',
          }
        }
      });
      (service as any).client.post = mockPost;

      await expect(service.generateEmbedding('test')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer les erreurs 401', async () => {
      const mockPost = vi.fn().mockRejectedValue({
        response: {
          status: 401,
          data: {
            object: 'error',
            message: 'Invalid API key',
            type: 'InvalidRequestError',
          }
        }
      });
      (service as any).client.post = mockPost;

      await expect(service.generateEmbedding('test')).rejects.toThrow(EmbeddingError);
    });

    it('devrait gérer les erreurs 429 (rate limit)', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Rate limit exceeded', {
          status: 429,
          data: {
            object: 'error',
            message: 'Rate limit exceeded',
            type: 'RateLimitError',
          }
        })
      );
      (service as any).client.post = mockPost;

      try {
        await service.generateEmbedding('test');
      } catch (error) {
        expect(error).toBeInstanceOf(EmbeddingError);
        const embeddingError = error as EmbeddingError;
        expect(embeddingError.retryable).toBe(true);
        expect(embeddingError.statusCode).toBe(429);
      }
    });

    it('devrait gérer les erreurs serveur 500', async () => {
      const mockPost = vi.fn().mockRejectedValue(
        new MockAxiosError('Internal server error', {
          status: 500,
          data: {
            object: 'error',
            message: 'Internal server error',
            type: 'InternalServerError',
          }
        })
      );
      (service as any).client.post = mockPost;

      try {
        await service.generateEmbedding('test');
      } catch (error) {
        expect(error).toBeInstanceOf(EmbeddingError);
        const embeddingError = error as EmbeddingError;
        expect(embeddingError.retryable).toBe(true);
      }
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter generateEmbedding', async () => {
      // Créer un mock du service directement pour éviter les problèmes de singleton
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            data: [{ embedding: new Array(1536).fill(0.1) }]
          }
        })
      };
      
      // Créer une instance temporaire avec le client mocké
      const tempService = new EmbeddingService();
      (tempService as any).client = mockClient;
      
      // Remplacer temporairement le client du singleton
      const { embeddingService } = await import('../embeddings');
      (embeddingService as any).client = mockClient;

      const result = await generateEmbedding('test');
      expect(result).toBeDefined();
    });

    it('devrait exporter generateEmbeddings', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            data: [{ embedding: new Array(1536).fill(0.1) }]
          }
        })
      };
      
      const { embeddingService } = await import('../embeddings');
      (embeddingService as any).client = mockClient;

      const result = await generateEmbeddings(['test']);
      expect(result).toBeDefined();
    });

    it('devrait exporter embedChunks', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: {
            data: [{ embedding: new Array(1536).fill(0.1) }]
          }
        })
      };
      
      const { embeddingService } = await import('../embeddings');
      (embeddingService as any).client = mockClient;

      const chunks: Chunk[] = [{
        content: 'test',
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          contentType: 'text',
          tokenCount: 10,
        }
      }];

      const result = await embedChunks(chunks);
      expect(result).toBeDefined();
    });
  });
});

describe('EmbeddingError', () => {
  it('devrait créer une erreur avec les bons propriétés', () => {
    const error = new EmbeddingError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('EmbeddingError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new EmbeddingError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });
});
