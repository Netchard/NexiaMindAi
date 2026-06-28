/**
 * Tests unitaires pour SupabaseStorageClient
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { SupabaseStorageClient, storageClient } from '../client';
import { createClient } from '@/lib/supabase/server';

// Mock de Supabase
const mockSupabase = {
  storage: {
    from: jest.fn(() => mockSupabase.storage.from),
  },
};

const mockListResult = {
  data: [
    {
      name: 'test-file.pdf',
      id: 'file-1',
      updated_at: '2026-06-28T10:00:00Z',
      created_at: '2026-06-28T09:00:00Z',
      metadata: {
        full_path: 'documents/test-file.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        last_modified: '2026-06-28T10:00:00Z',
      },
    },
    {
      name: 'test-file.txt',
      id: 'file-2',
      updated_at: '2026-06-28T11:00:00Z',
      created_at: '2026-06-28T10:00:00Z',
      metadata: {
        full_path: 'documents/test-file.txt',
        mimetype: 'text/plain',
        size: 512,
        last_modified: '2026-06-28T11:00:00Z',
      },
    },
  ],
  error: null,
};

const mockDownloadResult = {
  data: new Blob(['test content']),
  error: null,
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('SupabaseStorageClient', () => {
  let client: SupabaseStorageClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new SupabaseStorageClient('test-bucket');
  });

  describe('Initialisation', () => {
    it('Devrait initialiser avec le bucket par défaut', () => {
      const defaultClient = new SupabaseStorageClient();
      expect(defaultClient.getBucketName()).toBe('documents');
    });

    it('Devrait initialiser avec un bucket personnalisé', () => {
      const customClient = new SupabaseStorageClient('custom-bucket');
      expect(customClient.getBucketName()).toBe('custom-bucket');
    });

    it('Devrait exporter une instance singleton par défaut', () => {
      expect(storageClient).toBeInstanceOf(SupabaseStorageClient);
      expect(storageClient.getBucketName()).toBe('documents');
    });
  });

  describe('listFiles()', () => {
    it('Devrait lister les fichiers du bucket', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue(mockListResult),
      });

      const files = await client.listFiles();

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('test-file.pdf');
      expect(files[0].path).toBe('documents/test-file.pdf');
      expect(files[0].contentType).toBe('application/pdf');
      expect(files[0].size).toBe(1024);
    });

    it('Devrait filtrer par prefix', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockImplementation((prefix: string, options: any) => {
          expect(prefix).toBe('documents/subfolder');
          expect(options.limit).toBe(100);
          return Promise.resolve(mockListResult);
        }),
      });

      const files = await client.listFiles('documents/subfolder', 100);
      expect(files).toHaveLength(2);
    });

    it('Devrait retourner une liste vide si aucun fichier', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const files = await client.listFiles();
      expect(files).toHaveLength(0);
    });

    it('Devrait gérer les erreurs de Supabase', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Bucket not found' },
        }),
      });

      await expect(client.listFiles()).rejects.toThrow(
        'Échec de la liste des fichiers: Bucket not found'
      );
    });

    it('Devrait utiliser la limite par défaut de 1000', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockImplementation((prefix: string, options: any) => {
          expect(options.limit).toBe(1000);
          return Promise.resolve(mockListResult);
        }),
      });

      await client.listFiles();
    });
  });

  describe('getFileInfo()', () => {
    it('Devrait récupérer les métadonnées d\'un fichier spécifique', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue(mockListResult),
      });

      const fileInfo = await client.getFileInfo('documents/test-file.pdf');

      expect(fileInfo.name).toBe('test-file.pdf');
      expect(fileInfo.path).toBe('documents/test-file.pdf');
      expect(fileInfo.contentType).toBe('application/pdf');
    });

    it('Devrait lancer une erreur si le fichier n\'existe pas', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      await expect(client.getFileInfo('nonexistent-file.pdf')).rejects.toThrow(
        'Fichier non trouvé: nonexistent-file.pdf'
      );
    });

    it('Devrait gérer les erreurs de Supabase', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Access denied' },
        }),
      });

      await expect(client.getFileInfo('restricted-file.pdf')).rejects.toThrow(
        'Échec de la récupération des métadonnées: Access denied'
      );
    });
  });

  describe('fileExists()', () => {
    it('Devrait retourner true si le fichier existe', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue(mockListResult),
      });

      const exists = await client.fileExists('documents/test-file.pdf');
      expect(exists).toBe(true);
    });

    it('Devrait retourner false si le fichier n\'existe pas', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const exists = await client.fileExists('nonexistent-file.pdf');
      expect(exists).toBe(false);
    });
  });

  describe('getSupabaseClient()', () => {
    it('Devrait retourner un client Supabase', () => {
      const supabaseClient = client.getSupabaseClient();
      expect(supabaseClient).toBeDefined();
    });
  });
});
