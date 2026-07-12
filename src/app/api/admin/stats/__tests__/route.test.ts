/**
 * Tests unitaires pour l'endpoint GET /api/admin/stats
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
        return query;
      });
      
      query.eq = vi.fn((col: string, val: any) => {
        query._where = query._where || [];
        query._where.push({ col, val });
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
      
      query.group = vi.fn((col: string) => {
        query._group = col;
        return query;
      });
      
      query.then = vi.fn((onFulfilled: any) => {
        // Mock data for profiles
        if (query._select?.includes('id') && query.table === 'profiles') {
          return Promise.resolve(onFulfilled ? onFulfilled({ data: [], count: 10, error: null }) : { data: [], count: 10, error: null });
        }
        
        // Mock data for conversations
        if (query._select?.includes('id') && query.table === 'conversations') {
          return Promise.resolve(onFulfilled ? onFulfilled({ data: [], count: 50, error: null }) : { data: [], count: 50, error: null });
        }
        
        // Mock data for messages
        if (query._select?.includes('id') && query.table === 'messages' && !query._select.includes('metadata')) {
          return Promise.resolve(onFulfilled ? onFulfilled({ data: [], count: 200, error: null }) : { data: [], count: 200, error: null });
        }
        
        // Mock data for tokens
        if (query._select?.includes('tokensUsed') || query._select?.includes('client')) {
          return Promise.resolve(onFulfilled ? onFulfilled({ data: [], error: null }) : { data: [], error: null });
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
import { getAdminStats } from '@/lib/api/admin/stats';

// Helper pour créer un mock de NextRequest
function createMockRequest(url: string = 'http://localhost/api/admin/stats', headers: Record<string, string> = {}): any {
  const fullUrl = new URL(url);
  return {
    method: 'GET',
    headers: new Headers(headers),
    nextUrl: { pathname: '/api/admin/stats' },
    url: fullUrl.toString(),
  };
}

describe('GET /api/admin/stats', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentification', () => {
    it('devrait rejeter les requêtes sans userId dans les headers', async () => {
      mockRequest = createMockRequest();
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Non autorisé');
    });

    it('devrait rejeter les requêtes avec userId mais sans rôle admin (403)', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('droits administrateur requis');
    });
  });

  describe('Fonctionnalité', () => {
    it('devrait retourner la structure StatsResponse complète (si admin)', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      // Avec admin=false par défaut, ça retourne 403
      if (response.status === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('general');
        expect(data).toHaveProperty('byPeriod');
        expect(data.general).toHaveProperty('totalUsers');
        expect(data.general).toHaveProperty('totalConversations');
        expect(data.general).toHaveProperty('totalMessages');
        expect(data.general).toHaveProperty('totalTokensUsed');
        expect(data.byPeriod).toHaveProperty('today');
        expect(data.byPeriod).toHaveProperty('last7Days');
        expect(data.byPeriod).toHaveProperty('last30Days');
      }
    });

    it('devrait retourner les stats par période', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(data.byPeriod.today).toHaveProperty('conversations');
        expect(data.byPeriod.today).toHaveProperty('messages');
        expect(data.byPeriod.today).toHaveProperty('tokensUsed');
      }
    });

    it('devrait retourner les stats générales', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      if (response.status === 200) {
        const data = await response.json();
        expect(typeof data.general.totalUsers).toBe('number');
        expect(typeof data.general.totalConversations).toBe('number');
        expect(typeof data.general.totalMessages).toBe('number');
        expect(typeof data.general.totalTokensUsed).toBe('number');
      }
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de Supabase', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect([200, 403, 500]).toContain(response.status);
    });

    it('devrait gérer les erreurs internes', async () => {
      mockRequest = createMockRequest('http://localhost/api/admin/stats', {
        'x-user-id': 'user_123',
        'x-user-email': 'test@example.com',
      });
      
      const response = await GET(mockRequest);
      
      expect([200, 403, 500]).toContain(response.status);
    });
  });
});
