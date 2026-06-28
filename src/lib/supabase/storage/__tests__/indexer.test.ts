/**
 * Tests unitaires pour SupabaseStorageIndexer
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { SupabaseStorageIndexer, storageIndexer } from '../indexer';
import { storageClient } from '../client';
import { ocrService } from '../ocr';

// Mock de logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('@/lib/logger', () => ({ logger: mockLogger }));

// Mock des services
jest.mock('../client');
jest.mock('../ocr');

// Mock des services RAG
const mockChunkDocument = jest.fn().mockResolvedValue({
  chunks: [
    { content: 'chunk1', index: 0, metadata: {} },
    { content: 'chunk2', index: 1, metadata: {} },
  ],
  totalChunks: 2,
  totalTokens: 100,
  processingTime: 100,
});

const mockGenerateEmbeddings = jest.fn().mockResolvedValue({
  embeddings: [
    { embedding: [0.1, 0.2, 0.3], tokenCount: 10, createdAt: '2026-06-28T00:00:00Z' },
    { embedding: [0.4, 0.5, 0.6], tokenCount: 10, createdAt: '2026-06-28T00:00:00Z' },
  ],
  totalTokens: 20,
  processingTime: 50,
});

const mockReindexSource = jest.fn().mockResolvedValue({
  documentsProcessed: 1,
  errors: [],
});

jest.mock('@/lib/rag/chunker', () => ({
  chunkDocument: mockChunkDocument,
}));

jest.mock('@/lib/rag/embeddings', () => ({
  generateEmbeddings: mockGenerateEmbeddings,
}));

jest.mock('@/lib/rag/retriever', () => ({
  reindexSource: mockReindexSource,
}));

// Mock de Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  storage: {
    from: jest.fn(),
  },
};

const mockInsertResult = {
  data: { id: 'chunk-123' },
  error: null,
};

const mockInsertError = {
  data: null,
  error: { message: 'Insert failed' },
};

mockSupabase.from.mockImplementation((table: string) => ({
  insert: jest.fn().mockImplementation((data: any) => {
    if (table === 'chunks') {
      return { select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue(mockInsertResult) };
    }
    if (table === 'embeddings') {
      return { insert: jest.fn().mockResolvedValue(mockInsertResult) };
    }
    return { insert: jest.fn().mockResolvedValue(mockInsertResult) };
  }),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

describe('SupabaseStorageIndexer', () => {
  let indexer: SupabaseStorageIndexer;

  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(mockSupabase.from).not.toHaveBeenCalled(); // Pas de sauvegarde en base
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
});
