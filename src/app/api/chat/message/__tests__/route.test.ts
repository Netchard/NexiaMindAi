/**
 * Tests unitaires pour l'endpoint /api/chat/message
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// Utiliser vi.hoisted pour créer des mocks qui peuvent être référencés
const {
  mockRetrieveRelevantChunks,
  mockGenerateResponse,
  mockFormatResponse,
} = vi.hoisted(() => ({
  mockRetrieveRelevantChunks: vi.fn().mockResolvedValue({
    chunks: [],
    totalChunks: 0,
  }),
  mockGenerateResponse: vi.fn().mockResolvedValue({
    response: 'Test response from LLM',
    tokensUsed: 100,
  }),
  mockFormatResponse: vi.fn().mockResolvedValue({
    formattedContent: 'Formatted test response',
    citations: [],
    citationCount: 0,
    formatTime: 50,
  }),
}));

vi.mock('@/lib/rag', () => ({
  retrieveRelevantChunks: mockRetrieveRelevantChunks,
  generateResponse: mockGenerateResponse,
  formatResponse: mockFormatResponse,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@supabase/supabase-js', () => {
  // Mock simplifié qui retourne les résultats attendus
  const mockClient = {
    from: vi.fn((table: string) => {
      const queryBuilder: any = {
        table,
        select: vi.fn((columns: string) => {
          queryBuilder._select = columns;
          return queryBuilder;
        }),
        eq: vi.fn((col: string, val: any) => {
          queryBuilder._where = queryBuilder._where || [];
          queryBuilder._where.push({ col, val });
          return queryBuilder;
        }),
        order: vi.fn((col: string, opts: any) => {
          queryBuilder._order = { col, opts };
          return queryBuilder;
        }),
        insert: vi.fn((data: any) => {
          return Promise.resolve({ data: null, error: null });
        }),
        upsert: vi.fn((data: any) => {
          return Promise.resolve({ data: null, error: null });
        }),
        // Make the builder thenable
        then: vi.fn((onFulfilled: any) => {
          const result = {
            data: queryBuilder._select ? [] : null,
            error: null,
          };
          return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
        }),
      };
      return queryBuilder;
    }),
  };

  return {
    createClient: vi.fn(() => mockClient),
  };
});

import { POST } from '../route';

// Helper pour créer un mock de NextRequest
function createMockRequest(body: any, headers: Record<string, string> = {}): any {
  return {
    method: 'POST',
    headers: new Headers(headers),
    cookies: {
      get: vi.fn((name: string) => ({ value: name === 'access_token' ? 'valid_token' : undefined })),
    },
    json: vi.fn().mockResolvedValue(body),
    nextUrl: { pathname: '/api/chat/message' },
  };
}

describe('POST /api/chat/message', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Réinitialiser les mocks
    mockRetrieveRelevantChunks.mockResolvedValue({
      chunks: [],
      totalChunks: 0,
    });
    mockGenerateResponse.mockResolvedValue({
      response: 'Test response from LLM',
      tokensUsed: 100,
    });
    mockFormatResponse.mockResolvedValue({
      formattedContent: 'Formatted test response',
      citations: [],
      citationCount: 0,
      formatTime: 50,
    });
  });

  describe('Validation de la requête', () => {
    it('devrait rejeter les requêtes sans userId dans les headers', async () => {
      mockRequest = createMockRequest({});
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Non autorisé');
    });

    it('devrait rejeter les requêtes avec userId mais sans message', async () => {
      mockRequest = createMockRequest(
        {},
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('message');
    });

    it('devrait rejeter les requêtes avec userId et message vide', async () => {
      mockRequest = createMockRequest(
        { message: '' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('message');
    });

    it('devrait rejeter les requêtes avec userId et message non chaîne', async () => {
      mockRequest = createMockRequest(
        { message: 123 },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('chaîne de caractères');
    });

    it('devrait rejeter les requêtes avec message avec seulement des espaces', async () => {
      mockRequest = createMockRequest(
        { message: '   ' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('vide');
    });
  });

  describe('Authentification', () => {
    it('devrait accepter les requêtes avec userId valide', async () => {
      mockRequest = createMockRequest(
        { message: 'Test message' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Pipeline RAG', () => {
    beforeEach(() => {
      mockRequest = createMockRequest(
        { message: 'Test message' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
    });

    it('devrait appeler retrieveRelevantChunks', async () => {
      const response = await POST(mockRequest);
      
      expect(mockRetrieveRelevantChunks).toHaveBeenCalledWith(
        'Test message',
        expect.objectContaining({
          client: 'nexia',
          userId: 'user_123',
          limit: 5,
        })
      );
    });

    it('devrait appeler generateResponse', async () => {
      const response = await POST(mockRequest);
      
      expect(mockGenerateResponse).toHaveBeenCalledWith(
        'Test message',
        [], // chunks
        expect.any(Object)
      );
    });

    it('devrait appeler formatResponse', async () => {
      const response = await POST(mockRequest);
      
      expect(mockFormatResponse).toHaveBeenCalledWith(
        'Test response from LLM',
        []
      );
    });
  });

  describe('Réponse', () => {
    it('devrait retourner une réponse avec les bons champs', async () => {
      mockRequest = createMockRequest(
        { message: 'Test message' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('conversationId');
      expect(data).toHaveProperty('role', 'assistant');
      expect(data).toHaveProperty('content', 'Test response from LLM');
      expect(data).toHaveProperty('formattedContent', 'Formatted test response');
      expect(data).toHaveProperty('citations', []);
      expect(data).toHaveProperty('metadata');
      expect(data.metadata).toHaveProperty('model', 'default');
      expect(data.metadata).toHaveProperty('tokensUsed', 100);
      expect(data.metadata).toHaveProperty('processingTime');
      expect(data.metadata).toHaveProperty('timestamp');
    });

    it('devrait utiliser le conversationId fourni', async () => {
      mockRequest = createMockRequest(
        { message: 'Test message', conversationId: 'conv_existing_123' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(data.conversationId).toBe('conv_existing_123');
    }, 15000);

    it('devrait créer une nouvelle conversation si pas de conversationId', async () => {
      mockRequest = createMockRequest(
        { message: 'Test message' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      const response = await POST(mockRequest);
      const data = await response.json();
      
      expect(data.conversationId).toBeDefined();
      expect(data.conversationId).toContain('conv_');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de parsing JSON', async () => {
      mockRequest = createMockRequest(
        { message: 'Test' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      // Forcer une erreur de parsing JSON
      mockRequest.json = vi.fn().mockRejectedValue(new SyntaxError('Unexpected token'));
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('JSON');
    });

    it('devrait gérer les erreurs du pipeline RAG', async () => {
      mockRequest = createMockRequest(
        { message: 'Test' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      // Forcer une erreur dans retrieveRelevantChunks
      mockRetrieveRelevantChunks.mockRejectedValueOnce(new Error('Retrieval failed'));
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('devrait gérer les erreurs de génération', async () => {
      mockRequest = createMockRequest(
        { message: 'Test' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      // Forcer une erreur dans generateResponse
      mockGenerateResponse.mockRejectedValueOnce(new Error('Generation failed'));
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('devrait gérer les erreurs de formatage', async () => {
      mockRequest = createMockRequest(
        { message: 'Test' },
        { 'x-user-id': 'user_123', 'x-user-email': 'test@example.com' }
      );
      
      // Forcer une erreur dans formatResponse
      mockFormatResponse.mockRejectedValueOnce(new Error('Formatting failed'));
      
      const response = await POST(mockRequest);
      
      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
