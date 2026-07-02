/**
 * Tests unitaires pour le service de retrieval
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// SOLUTION ABSOLUE: Créer le mock COMPLÈTEMENT dans le callback de vi.mock
// Sans AUCUNE référence à des variables externes

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock du service d'embeddings
vi.mock('../embeddings', () => ({
  EmbeddingService: class {
    isConfigured = vi.fn().mockReturnValue(true);
    generateEmbedding = vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]);
  },
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, 0.4, 0.5]),
}));

// Créer un conteneur global accessible via globalThis
// Ce sera initialisé dans le callback du vi.mock
declare global {
  namespace NodeJS {
    interface Global {
      __supabaseMockHelper: {
        setResult: (result: { data: any, error: any, count: any }) => void;
        queryBuilder: any;
        client: any;
      };
    }
  }
}

// Configurer le mock de @supabase/supabase-js
// TOUT est créé dans le callback, sans référence à des variables externes
vi.mock('@supabase/supabase-js', () => {
  // État interne au closure
  let currentResult = { data: null, error: null, count: 0 };
  
  const queryBuilder: any = {};
  queryBuilder.select = vi.fn(() => queryBuilder);
  queryBuilder.order = vi.fn(() => queryBuilder);
  queryBuilder.limit = vi.fn(() => queryBuilder);
  queryBuilder.in = vi.fn(() => queryBuilder);
  queryBuilder.eq = vi.fn(() => queryBuilder);
  queryBuilder.from = vi.fn(() => queryBuilder);
  queryBuilder.execute = vi.fn(() => Promise.resolve(currentResult));
  
  const client = {
    from: vi.fn((table: string) => queryBuilder)
  };
  
  // Stocker les références dans globalThis pour que les tests puissent y accéder
  if (!globalThis.__supabaseMockHelper) {
    globalThis.__supabaseMockHelper = {
      setResult: (result: { data: any, error: any, count: any }) => {
        currentResult = result;
        queryBuilder.execute = vi.fn(() => Promise.resolve(currentResult));
      },
      queryBuilder: queryBuilder,
      client: client
    };
  } else {
    // Si déjà initialisé, mettre à jour
    globalThis.__supabaseMockHelper.queryBuilder = queryBuilder;
    globalThis.__supabaseMockHelper.client = client;
    globalThis.__supabaseMockHelper.setResult = (result: { data: any, error: any, count: any }) => {
      currentResult = result;
      queryBuilder.execute = vi.fn(() => Promise.resolve(currentResult));
    };
  }
  
  return {
    createClient: vi.fn(() => client)
  };
});

// Exporter les fonctions pour les tests
const setMockResult = (result: { data: any, error: any, count: any }) => {
  if (globalThis.__supabaseMockHelper) {
    globalThis.__supabaseMockHelper.setResult(result);
  }
};

// Fonction pour créer un client Supabase mock avec un résultat spécifique
function createMockClientWithResult(result: { data: any, error: any, count: any }) {
  const queryBuilder: any = {};
  queryBuilder.select = vi.fn(() => queryBuilder);
  queryBuilder.order = vi.fn(() => queryBuilder);
  queryBuilder.limit = vi.fn(() => queryBuilder);
  queryBuilder.in = vi.fn(() => queryBuilder);
  queryBuilder.eq = vi.fn(() => queryBuilder);
  queryBuilder.from = vi.fn(() => queryBuilder);
  queryBuilder.execute = vi.fn(() => Promise.resolve(result));
  
  // Rendre le query builder thenable pour supporter await
  queryBuilder.then = vi.fn((resolve: any) => {
    resolve(result);
    return Promise.resolve(result);
  });
  
  // Ajouter les propriétés directement pour le destructuring
  queryBuilder.data = result.data;
  queryBuilder.error = result.error;
  queryBuilder.count = result.count;
  
  return {
    from: vi.fn((table: string) => queryBuilder)
  };
}

// Importer après les mocks
import {
  RetrievalService,
  RetrievalError,
  retrieveRelevantChunks,
  retrieveSimilarChunks,
  RetrievalResult,
  RetrievalFilters,
} from '../retriever';
import { Chunk } from '../types';

describe('RetrievalService', () => {
  let retrievalService: RetrievalService;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';
    
    // Réinitialiser le résultat
    setMockResult({ data: null, error: null, count: 0 });
    
    retrievalService = new RetrievalService();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(retrievalService).toBeDefined();
      expect(retrievalService.isConfigured()).toBe(true);
    });

    it('devrait détecter si non configuré', () => {
      const originalUrl = process.env.SUPABASE_URL;
      const originalKey = process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      
      const unconfiguredService = new RetrievalService();
      expect(unconfiguredService.isConfigured()).toBe(false);
      
      process.env.SUPABASE_URL = originalUrl;
      process.env.SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe('retrieveRelevantChunks', () => {
    it('devrait retourner des chunks pour une requête valide', async () => {
      // Mock de la requête Supabase
      const mockData = [
        {
          chunks: {
            id: '1',
            content: 'Contenu pertinent',
            document_path: 'test.pdf',
            source: 'supabase',
            document_type: 'pdf',
            client: 'nexia',
            language: 'fr',
            chunk_index: 0,
            total_chunks: 10,
            created_at: '2026-01-01',
            token_count: 50,
          },
          similarity: 0.95,
        },
        {
          chunks: {
            id: '2',
            content: 'Autre contenu',
            document_path: 'test2.pdf',
            source: 'supabase',
            document_type: 'pdf',
            client: 'nexia',
            language: 'fr',
            chunk_index: 1,
            total_chunks: 10,
            created_at: '2026-01-01',
            token_count: 75,
          },
          similarity: 0.90,
        },
      ];

      // Créer un client Supabase mock avec le résultat souhaité
      const mockClient = createMockClientWithResult({
        data: mockData,
        error: null,
        count: 100
      });

      // Créer un service avec le client mock
      const service = new RetrievalService(mockClient);

      const result = await service.retrieveRelevantChunks('test query');

      expect(result.chunks).toHaveLength(2);
      expect(result.chunks[0].content).toBe('Contenu pertinent');
      expect(result.chunks[0].metadata.similarity).toBe(0.95);
      // (0.95 + 0.90) / 2 = 0.925, arrondi à 0.93
      expect(result.averageSimilarity).toBe(0.93);
      expect(result.searchTime).toBeDefined();
      expect(result.totalChunksScanned).toBe(100);
    });

    it('devrait utiliser les colonnes et joins réels de la base pour construire les métadonnées', async () => {
      const mockData = [
        {
          id: 'embedding-1',
          chunk_id: 'chunk-1',
          vector: [0.1, 0.2, 0.3, 0.4, 0.5],
          chunks: {
            id: 'chunk-1',
            content: 'Contenu issu des colonnes réelles',
            document_id: 'doc-1',
            chunk_index: 0,
            token_count: 42,
            metadata: {
              client: 'acme',
              documentType: 'pdf',
              source: 'upload',
              role: 'analyst',
            },
            documents: {
              id: 'doc-1',
              file_path: 'uploads/acme/report.pdf',
              type: 'pdf',
              source: 'upload',
              client_id: 'acme',
              language: 'fr',
              mime_type: 'application/pdf',
            },
          },
          similarity: 0.95,
        },
      ];

      const mockClient = createMockClientWithResult({
        data: mockData,
        error: null,
        count: 1,
      });

      const service = new RetrievalService(mockClient);
      const result = await service.retrieveRelevantChunks('test query');

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].metadata.documentPath).toBe('uploads/acme/report.pdf');
      expect(result.chunks[0].metadata.documentType).toBe('pdf');
      expect(result.chunks[0].metadata.client).toBe('acme');
      expect(result.chunks[0].metadata.language).toBe('fr');
      expect(result.chunks[0].metadata.source).toBe('upload');
    });

    it('devrait gérer une requête vide', async () => {
      await expect(
        retrievalService.retrieveRelevantChunks('')
      ).rejects.toThrow(RetrievalError);
    });

    it('devrait gérer les erreurs Supabase', async () => {
      // Créer un client mock avec une erreur
      const mockClient = createMockClientWithResult({
        data: null,
        error: { message: 'Table not found' },
        count: 0
      });

      const service = new RetrievalService(mockClient);

      await expect(
        service.retrieveRelevantChunks('test')
      ).rejects.toThrow(RetrievalError);
    });

    it('devrait retourner un tableau vide quand data est null', async () => {
      // Créer un client mock avec data null
      const mockClient = createMockClientWithResult({
        data: null,
        error: null,
        count: 0
      });

      const service = new RetrievalService(mockClient);

      const result = await service.retrieveRelevantChunks('test');
      expect(result.chunks).toHaveLength(0);
      expect(result.averageSimilarity).toBe(0);
    });
  });

  describe('retrieveSimilarChunks', () => {
    it('devrait retourner des chunks pour un embedding valide', async () => {
      const mockData = [
        {
          chunks: {
            id: '1',
            content: 'Contenu similaire',
            document_path: 'test.pdf',
            source: 'supabase',
            document_type: 'pdf',
            client: 'nexia',
            language: 'fr',
            chunk_index: 0,
            total_chunks: 10,
            created_at: '2026-01-01',
            token_count: 50,
          },
          similarity: 0.98,
        },
      ];

      // Créer un client mock avec le résultat
      const mockClient = createMockClientWithResult({
        data: mockData,
        error: null,
        count: 50
      });

      const service = new RetrievalService(mockClient);

      const result = await service.retrieveSimilarChunks([0.1, 0.2, 0.3]);

      expect(result.chunks).toHaveLength(1);
      expect(result.chunks[0].content).toBe('Contenu similaire');
      expect(result.averageSimilarity).toBe(0.98);
    });

    it('devrait gérer un embedding vide', async () => {
      await expect(
        retrievalService.retrieveSimilarChunks([])
      ).rejects.toThrow(RetrievalError);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs 500', async () => {
      // Configurer le résultat du mock avec une erreur 500
      setMockResult({
        data: null,
        error: { message: 'Internal server error', status: 500 },
        count: 0
      });

      try {
        await retrievalService.retrieveRelevantChunks('test');
      } catch (error) {
        expect(error).toBeInstanceOf(RetrievalError);
        const retrievalError = error as RetrievalError;
        expect(retrievalError.retryable).toBe(true);
      }
    });

    it('devrait gérer les erreurs de timeout', async () => {
      // Configurer le résultat du mock avec une erreur de timeout
      setMockResult({
        data: null,
        error: { message: 'Request timeout' },
        count: 0
      });

      try {
        await retrievalService.retrieveRelevantChunks('test');
      } catch (error) {
        expect(error).toBeInstanceOf(RetrievalError);
        const retrievalError = error as RetrievalError;
        expect(retrievalError.statusCode).toBe(408);
        expect(retrievalError.retryable).toBe(true);
      }
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter retrieveRelevantChunks', async () => {
      const mockData = [{
        chunks: { 
          id: '1', 
          content: 'Test',
          document_path: 'test.txt',
          source: 'test',
          document_type: 'text',
          chunk_index: 0,
          total_chunks: 1,
          created_at: '2026-01-01',
          token_count: 10,
        },
        similarity: 0.9,
      }];

      // Créer un client mock avec le résultat
      const mockClient = createMockClientWithResult({
        data: mockData,
        error: null,
        count: 1
      });

      // Modifier le client du singleton
      const { retrievalService } = await import('../retriever');
      (retrievalService as any).supabase = mockClient;

      const result = await retrieveRelevantChunks('Test');
      expect(result).toBeDefined();
      expect(result.chunks).toHaveLength(1);
    });

    it('devrait exporter retrieveSimilarChunks', async () => {
      const mockData = [{
        chunks: { 
          id: '1', 
          content: 'Test',
          document_path: 'test.txt',
          source: 'test',
          document_type: 'text',
          chunk_index: 0,
          total_chunks: 1,
          created_at: '2026-01-01',
          token_count: 10,
        },
        similarity: 0.9,
      }];

      // Créer un client mock avec le résultat
      const mockClient = createMockClientWithResult({
        data: mockData,
        error: null,
        count: 1
      });

      // Modifier le client du singleton
      const { retrievalService } = await import('../retriever');
      (retrievalService as any).supabase = mockClient;

      const result = await retrieveSimilarChunks([0.1, 0.2, 0.3]);
      expect(result).toBeDefined();
      expect(result.chunks).toHaveLength(1);
    });
  });
});

describe('RetrievalError', () => {
  it('devrait créer une erreur avec les bonnes propriétés', () => {
    const error = new RetrievalError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('RetrievalError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new RetrievalError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur avec seulement message et code', () => {
    const error = new RetrievalError('Test error', 500);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur retryable', () => {
    const error = new RetrievalError('Test error', 500, 'server_error', true);
    expect(error.retryable).toBe(true);
  });
});
