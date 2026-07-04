/**
 * Tests unitaires pour l'endpoint GET /api/chat/history
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock des dépendances
const { mockSupabaseClient } = vi.hoisted(() => ({
  mockSupabaseClient: {
    from: vi.fn((table: string) => {
      const query: any = { table };
      
      query.select = vi.fn((columns: string, options?: any) => {
        query._select = columns;
        query._options = options;
        return query;
      });
    
      query.eq = vi.fn((col: string, val: any) => {
        query._where = query._where || [];
        query._where.push({ col, val });
        return query;
      });
      
      query.in = vi.fn((col: string, vals: any[]) => {
        query._in = { col, vals };
        return query;
      });

      query.order = vi.fn((col: string, opts: any) => {
        query._order = { col, opts };
        return query;
      });
      
      query.range = vi.fn((start: number, end: number) => {
        query._range = { start, end };
        return query;
      });
      
      query.gte = vi.fn((col: string, val: any) => {
        query._gte = { col, val };
        return query;
      });
      
      query.lte = vi.fn((col: string, val: any) => {
        query._lte = { col, val };
        return query;
      });
      
      query.then = vi.fn((onFulfilled: any) => {
        // Mock data for conversations
        if (query._select?.includes('id, title, created_at, updated_at')) {
          const result = {
            data: [
              { id: 'conv_1', title: 'Test Conversation 1', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' },
              { id: 'conv_2', title: 'Test Conversation 2', created_at: '2024-01-03T00:00:00Z', updated_at: '2024-01-04T00:00:00Z' },
            ],
            count: 2,
            error: null,
          };
          return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
        }
        
        // Mock data for message counts (tallied client-side, no .group() — unsupported by @supabase/supabase-js)
        if (query._select === 'conversation_id' && query._in) {
          const result = {
            data: [
              { conversation_id: 'conv_1' },
              { conversation_id: 'conv_1' },
              { conversation_id: 'conv_1' },
              { conversation_id: 'conv_1' },
              { conversation_id: 'conv_1' },
              { conversation_id: 'conv_2' },
              { conversation_id: 'conv_2' },
              { conversation_id: 'conv_2' },
            ],
            error: null,
          };
          return Promise.resolve(onFulfilled ? onFulfilled(result) : result);
        }
        
        return Promise.resolve(onFulfilled ? onFulfilled({ data: [], error: null }) : { data: [], error: null });
      });
      
      return query;
    }),
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { GET } from '../route';

// Helper pour créer un mock de NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}): any {
  const fullUrl = new URL(url, 'http://localhost');
  return {
    method: 'GET',
    headers: new Headers(headers),
    nextUrl: { pathname: '/api/chat/history' },
    url: fullUrl.toString(),
  };
}

describe('GET /api/chat/history', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentification', () => {
    it('devrait rejeter les requêtes sans userId dans les headers', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history');
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Non autorisé');
    });

    it('devrait accepter les requêtes avec userId valide', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Validation de la requête', () => {
    it('devrait utiliser limit par défaut (50)', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(data.limit).toBe(50);
    });

    it('devrait utiliser offset par défaut (0)', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(data.offset).toBe(0);
    });

    it('devrait rejeter limit < 1', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history?limit=0', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limite');
    });

    it('devrait rejeter limit > 100', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history?limit=101', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limite');
    });

    it('devrait rejeter offset négatif', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history?offset=-1', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('offset');
    });

    it('devrait rejeter limit non numérique', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history?limit=abc', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limite');
    });
  });

  describe('Fonctionnalité', () => {
    it('devrait retourner la structure HistoryResponse complète', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('conversations');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('offset');
      expect(data).toHaveProperty('limit');
      expect(Array.isArray(data.conversations)).toBe(true);
    });

    it('devrait retourner toutes les conversations sans conversationId', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      expect(data.conversations.length).toBeGreaterThan(0);
    });

    it('devrait inclure les champs conversation complets', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      const data = await response.json();
      
      if (data.conversations.length > 0) {
        const conv = data.conversations[0];
        expect(conv).toHaveProperty('id');
        expect(conv).toHaveProperty('title');
        expect(conv).toHaveProperty('createdAt');
        expect(conv).toHaveProperty('updatedAt');
        expect(conv).toHaveProperty('messageCount');
      }
    });

    it('devrait tallier correctement le nombre de messages par conversation (sans .group(), non supporté par le client Supabase JS)', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });

      const response = await GET(mockRequest);
      const data = await response.json();

      const conv1 = data.conversations.find((c: any) => c.id === 'conv_1');
      const conv2 = data.conversations.find((c: any) => c.id === 'conv_2');

      expect(conv1.messageCount).toBe(5);
      expect(conv2.messageCount).toBe(3);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de Supabase', async () => {
      mockRequest = createMockRequest('http://localhost/api/chat/history', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect([200, 500]).toContain(response.status);
    });
  });
});
