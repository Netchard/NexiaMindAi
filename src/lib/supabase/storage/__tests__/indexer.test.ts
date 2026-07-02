import { vi, describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';

/**
 * Tests unitaires pour SupabaseStorageIndexer
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { SupabaseStorageIndexer, storageIndexer } from '../indexer';
import { storageClient } from '../client';
import { ocrService } from '../ocr';
import * as chunkerModule from '../../../rag/chunker';
import * as embeddingsModule from '../../../rag/embeddings';
import * as retrieverModule from '../../../rag/retriever';
import * as loggerModule from '../../../logger';

// Mock des services
vi.mock('../client');
vi.mock('../ocr');



// Mock des services RAG
vi.mock('../../../rag/chunker', () => ({
  chunkDocument: vi.fn().mockResolvedValue({
    chunks: [
      { content: 'chunk1', index: 0, metadata: {} },
      { content: 'chunk2', index: 1, metadata: {} },
    ],
    totalChunks: 2,
    totalTokens: 100,
    processingTime: 100,
  }),
}));

vi.mock('../../../rag/embeddings', () => ({
  generateEmbeddings: vi.fn().mockResolvedValue({
    embeddings: [
      { embedding: [0.1, 0.2, 0.3], tokenCount: 10, createdAt: '2026-06-28T00:00:00Z' },
      { embedding: [0.4, 0.5, 0.6], tokenCount: 10, createdAt: '2026-06-28T00:00:00Z' },
    ],
    totalTokens: 20,
    processingTime: 50,
  }),
}));

vi.mock('../../../rag/retriever', () => ({
  reindexSource: vi.fn().mockResolvedValue({
    documentsProcessed: 1,
    errors: [],
  }),
}));

// Mock du logger
vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

beforeEach(() => {
  // Réinitialiser les mocks avant chaque test
  vi.clearAllMocks();
  
  // Get the mocked functions
  const mockChunkDocument = vi.mocked(chunkerModule.chunkDocument);
  const mockGenerateEmbeddings = vi.mocked(embeddingsModule.generateEmbeddings);
  const mockReindexSource = vi.mocked(retrieverModule.reindexSource);
  const mockLogger = vi.mocked(loggerModule.logger);
  
  // Make them available to the tests
  (globalThis as any).mockChunkDocument = mockChunkDocument;
  (globalThis as any).mockGenerateEmbeddings = mockGenerateEmbeddings;
  (globalThis as any).mockReindexSource = mockReindexSource;
  (globalThis as any).mockLogger = mockLogger;
});

// Mock de Supabase client
const mockInsertResult = { data: { id: 'mock-id' }, error: null };
const mockSupabaseClient = {
  from: vi.fn().mockImplementation((table: string) => ({
    insert: vi.fn().mockImplementation((data: any) => {
      if (table === 'chunks') {
        return { select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'chunk-123' }, error: null }) };
      }
      if (table === 'embeddings') {
        return { insert: vi.fn().mockResolvedValue({ data: { id: 'embedding-456' }, error: null }) };
      }
      return { insert: vi.fn().mockResolvedValue({ data: { id: 'mock-id' }, error: null }) };
    }),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
};

vi.mock('../../server', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
  supabase: mockSupabaseClient,
}));

describe('SupabaseStorageIndexer', () => {
  let indexer: SupabaseStorageIndexer;

  beforeEach(() => {
    vi.clearAllMocks();
    indexer = new SupabaseStorageIndexer('test-bucket');
  });

  describe('Initialisation', () => {
    it('Devrait initialiser avec le bucket par défaut', () => {
      const defaultIndexer = new SupabaseStorageIndexer();
      expect(defaultIndexer.getBucketName()).toBe('documents');
    });

    it('Devrait initialiser avec un bucket personnalisé', () => {
      expect(indexer.getBucketName()).toBe('test-bucket');
    });

    it('Devrait exporter une instance singleton par défaut', () => {
      expect(storageIndexer).toBeInstanceOf(SupabaseStorageIndexer);
      expect(storageIndexer.getBucketName()).toBe('documents');
    });
  });

  describe('indexAll()', () => {
    const mockFiles = [
      { name: 'file1.txt', path: 'documents/file1.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      { name: 'file2.txt', path: 'documents/file2.txt', contentType: 'text/plain', size: 200, updatedAt: '2026-06-28T00:00:00Z' },
    ];

    it('Devrait retourner un résultat vide si aucun fichier', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue([]);

      const result = await indexer.indexAll();

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.chunksCreated).toBe(0);
      expect(result.embeddingsGenerated).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('Devrait traiter plusieurs fichiers avec succès', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      const result = await indexer.indexAll();

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(mockChunkDocument).toHaveBeenCalledTimes(2);
    });

    it('Devrait gérer les erreurs d\'extraction de texte', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockImplementation((buffer: Buffer, fileName: string) => {
        if (fileName === 'documents/file2.txt') {
          throw new Error('Extraction failed');
        }
        return Promise.resolve({ text: 'extracted', contentType: 'text' });
      });

      const result = await indexer.indexAll();

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('documents/file2.txt');
    });

    it('Devrait respecter la limite de fichiers', async () => {
      const allFiles = [
        ...mockFiles,
        { name: 'file3.txt', path: 'documents/file3.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
        { name: 'file4.txt', path: 'documents/file4.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];
      (storageClient.listFiles as jest.Mock).mockResolvedValue(allFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: allFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted',
        contentType: 'text',
      });

      const result = await indexer.indexAll({ limit: 2 });

      expect(result.processed).toBe(2);
      expect(storageClient.downloadFile).toHaveBeenCalledTimes(2);
    });

    it('Devrait utiliser le prefix fourni', async () => {
      (storageClient.listFiles as jest.Mock).mockImplementation((prefix?: string, limit?: number) => {
        expect(prefix).toBe('subfolder');
        return Promise.resolve(mockFiles);
      });

      await indexer.indexAll({ prefix: 'subfolder' });
    });

    it('Devrait passer les options au service d\'indexation', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted',
        contentType: 'text',
      });

      const options = {
        prefix: 'test/',
        client: 'test-client',
        documentType: 'contract',
        dryRun: true,
        limit: 10,
      };

      await indexer.indexAll(options);

      // Vérifier que les options sont passées à indexFile
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Début de l\'indexation Supabase Storage',
        expect.objectContaining(options)
      );
    });
  });

  describe('indexAll() avec dryRun', () => {
    const mockFiles = [
      { name: 'file1.txt', path: 'documents/file1.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
    ];

    it('Devrait ne pas sauvegarder en base en mode dryRun', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted',
        contentType: 'text',
      });

      const result = await indexer.indexAll({ dryRun: true });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockSupabaseClient.from).not.toHaveBeenCalled(); // Pas de sauvegarde en base
      expect(mockChunkDocument).toHaveBeenCalledTimes(1); // Mais chunking est appelé
    });

    it('Devrait logger le mode dryRun', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted',
        contentType: 'text',
      });

      await indexer.indexAll({ dryRun: true });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('[DRY RUN]'),
        expect.any(Object)
      );
    });
  });

  describe('Gestion des erreurs globales', () => {
    it('Devrait gérer les erreurs de listFiles', async () => {
      (storageClient.listFiles as jest.Mock).mockRejectedValue(new Error('Access denied'));

      await expect(indexer.indexAll()).rejects.toThrow('Access denied');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Logging', () => {
    it('Devrait logger le début de l\'indexation', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue([]);

      await indexer.indexAll({ client: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Début de l\'indexation Supabase Storage',
        expect.objectContaining({
          bucket: 'test-bucket',
          client: 'test',
        })
      );
    });

    it('Devrait logger la fin de l\'indexation', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue([]);

      await indexer.indexAll();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Indexation terminée',
        expect.any(Object)
      );
    });

    it('Devrait logger les erreurs de traitement de fichier', async () => {
      const mockFiles = [
        { name: 'file1.txt', path: 'documents/file1.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockRejectedValue(new Error('Download failed'));

      await indexer.indexAll();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Échec de l\'indexation du fichier'),
        expect.any(Object)
      );
    });
  });

  describe('indexAll() avec gestion des erreurs partielles', () => {
    const mockFiles = [
      { name: 'good-file1.txt', path: 'documents/good-file1.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      { name: 'bad-file.txt', path: 'documents/bad-file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      { name: 'good-file2.txt', path: 'documents/good-file2.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
    ];

    it('Devrait continuer le traitement après une erreur sur un fichier', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      
      // Le premier et troisième fichier réussissent, le deuxième échoue
      let callCount = 0;
      (storageClient.downloadFile as jest.Mock).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('File corrupted'));
        }
        return Promise.resolve({
          data: Buffer.from('test content'),
          fileInfo: mockFiles[callCount - 1],
        });
      });

      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      const result = await indexer.indexAll();

      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].file).toBe('documents/bad-file.txt');
    });

    it('Devrait gérer les erreurs de sauvegarde en base sans arrêter le traitement', async () => {
      (storageClient.listFiles as jest.Mock).mockResolvedValue([mockFiles[0]]);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      // Forcer une erreur sur la sauvegarde du chunk
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'chunks') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert error' } }),
            select: vi.fn().mockReturnThis(),
            single: vi.fn(),
          };
        }
        return { insert: vi.fn().mockResolvedValue(mockInsertResult) };
      });

      const result = await indexer.indexAll();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1); // Le fichier est marqué comme réussi même si chunk échoue
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('indexAll() avec options avancées', () => {
    it('Devrait utiliser toutes les options dans les métadonnées', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      const options = {
        prefix: 'test/prefix',
        client: 'test-client',
        documentType: 'test-type',
        dryRun: false,
        limit: 100,
      };

      await indexer.indexAll(options);

      expect(mockChunkDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            client: 'test-client',
            documentType: 'test-type',
          }),
        })
      );
    });

    it('Devrait gérer les fichiers avec différents types de contenu', async () => {
      const mockFiles = [
        { name: 'file1.pdf', path: 'documents/file1.pdf', contentType: 'application/pdf', size: 2048, updatedAt: '2026-06-28T00:00:00Z' },
        { name: 'file2.txt', path: 'documents/file2.txt', contentType: 'text/plain', size: 512, updatedAt: '2026-06-28T00:00:00Z' },
        { name: 'file3.md', path: 'documents/file3.md', contentType: 'text/markdown', size: 768, updatedAt: '2026-06-28T00:00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      
      let currentFileIndex = 0;
      (storageClient.downloadFile as jest.Mock).mockImplementation(() => {
        const file = mockFiles[currentFileIndex++];
        return Promise.resolve({
          data: Buffer.from(`content for ${file.name}`),
          fileInfo: file,
        });
      });

      (ocrService.extractText as jest.Mock).mockImplementation((buffer: Buffer, fileName: string) => {
        if (fileName.includes('.pdf')) {
          return Promise.resolve({ text: 'PDF extracted text', contentType: 'pdf', pageCount: 5 });
        } else if (fileName.includes('.txt')) {
          return Promise.resolve({ text: 'Text file content', contentType: 'text', pageCount: 0 });
        } else {
          return Promise.resolve({ text: 'Markdown content', contentType: 'text', pageCount: 0 });
        }
      });

      const result = await indexer.indexAll({ dryRun: true });

      expect(result.processed).toBe(3);
      expect(result.succeeded).toBe(3);
      expect(mockChunkDocument).toHaveBeenCalledTimes(3);
    });
  });

  describe('indexAll() avec reindexSource', () => {
    it('Devrait appeler reindexSource pour chaque fichier en mode non-dryRun', async () => {
      const mockFiles = [
        { name: 'file1.txt', path: 'documents/file1.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
        { name: 'file2.txt', path: 'documents/file2.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      await indexer.indexAll({ dryRun: false });

      expect(mockReindexSource).toHaveBeenCalledTimes(2);
      expect(mockReindexSource).toHaveBeenCalledWith(
        'documents/file1.txt',
        expect.objectContaining({
          client: undefined,
          documentType: undefined,
          userId: 'system',
        })
      );
    });

    it('Devrait appeler reindexSource avec les options fournies', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      const options = {
        client: 'nexia-client',
        documentType: 'contract',
        dryRun: false,
      };

      await indexer.indexAll(options);

      expect(mockReindexSource).toHaveBeenCalledWith(
        'documents/file.txt',
        expect.objectContaining({
          client: 'nexia-client',
          documentType: 'contract',
          userId: 'system',
        })
      );
    });

    it('Devrait continuer même si reindexSource échoue', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      mockReindexSource.mockRejectedValue(new Error('Reindex failed'));

      const result = await indexer.indexAll({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Échec de la re-indexation'),
        expect.any(Object)
      );
    });
  });

  describe('indexAll() avec gestion des embeddings', () => {
    it('Devrait générer des embeddings pour chaque chunk', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      await indexer.indexAll({ dryRun: false });

      // mockChunkDocument retourne 2 chunks
      expect(mockGenerateEmbeddings).toHaveBeenCalledTimes(2);
    });

    it('Devrait gérer les erreurs de génération d\'embeddings', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      // Forcer une erreur sur la génération d'embeddings
      mockGenerateEmbeddings.mockRejectedValue(new Error('Embedding generation failed'));

      const result = await indexer.indexAll({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1); // Le fichier est quand même marqué comme réussi
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('(3) Échec du traitement du chunk'),
        expect.any(Object)
      );
    });
  });

  describe('indexAll() avec gestion des erreurs de base de données', () => {
    it('Devrait gérer les erreurs de sauvegarde des embeddings', async () => {
      const mockFiles = [
        { name: 'file.txt', path: 'documents/file.txt', contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted text',
        contentType: 'text',
      });

      // Forcer une erreur sur la sauvegarde des embeddings
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'embeddings') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Embedding save failed' } }),
          };
        }
        return { insert: vi.fn().mockResolvedValue(mockInsertResult), select: vi.fn().mockReturnThis(), single: vi.fn() };
      });

      const result = await indexer.indexAll({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Échec de la sauvegarde de l\'embedding'),
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    it('Devrait gérer les fichiers avec du texte vide extrait', async () => {
      const mockFiles = [
        { name: 'empty.txt', path: 'documents/empty.txt', contentType: 'text/plain', size: 0, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from(''),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: '',
        contentType: 'text',
      });

      const result = await indexer.indexAll();

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.chunksCreated).toBe(0); // Pas de chunks créés pour du texte vide
      expect(result.embeddingsGenerated).toBe(0);
    });

    it('Devrait gérer les fichiers avec un seul caractère', async () => {
      const mockFiles = [
        { name: 'single.txt', path: 'documents/single.txt', contentType: 'text/plain', size: 1, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('A'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'A',
        contentType: 'text',
      });

      const result = await indexer.indexAll({ dryRun: true });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });

    it('Devrait gérer les noms de fichiers très longs', async () => {
      const longFileName = 'a'.repeat(255) + '.txt';
      const mockFiles = [
        { name: longFileName, path: `documents/${longFileName}`, contentType: 'text/plain', size: 100, updatedAt: '2026-06-28T00:00:00Z' },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'test content',
        contentType: 'text',
      });

      const result = await indexer.indexAll({ dryRun: true });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });

    it('Devrait gérer les fichiers avec des métadonnées complexes', async () => {
      const mockFiles = [
        {
          name: 'complex-file.pdf',
          path: 'documents/complex-file.pdf',
          contentType: 'application/pdf',
          size: 5242880, // 5MB
          updatedAt: '2026-06-28T12:34:56.789Z',
          metadata: {
            customField: 'customValue',
            tags: ['tag1', 'tag2'],
          },
        },
      ];

      (storageClient.listFiles as jest.Mock).mockResolvedValue(mockFiles);
      (storageClient.downloadFile as jest.Mock).mockResolvedValue({
        data: Buffer.from('test'),
        fileInfo: mockFiles[0],
      });
      (ocrService.extractText as jest.Mock).mockResolvedValue({
        text: 'extracted content',
        contentType: 'pdf',
        pageCount: 10,
      });

      const result = await indexer.indexAll({ dryRun: true });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });
  });
});
