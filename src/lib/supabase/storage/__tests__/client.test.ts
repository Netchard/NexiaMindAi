/**
 * Tests unitaires pour SupabaseStorageClient
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { SupabaseStorageClient, storageClient } from '../client';
import { createClient } from '../../server';

// Mock de Supabase
import { vi, describe, it, expect, beforeEach } from 'vitest';

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
  data: {
    arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode('test content')),
  },
  error: null,
};

// Mock Blob pour les tests
class MockBlob {
  constructor(public parts: any[]) {}
  
  arrayBuffer() {
    return Promise.resolve(new TextEncoder().encode(this.parts.join('')));
  }
}

// Mock global pour Supabase
let mockSupabase: any;

vi.mock('../../server', () => ({
  get supabase() {
    return mockSupabase;
  },
  createClient: vi.fn(() => mockSupabase),
}));

beforeEach(() => {
  // Initialiser mockSupabase avant chaque test
  mockSupabase = {
    storage: {
      from: vi.fn(() => mockSupabase.storage.from),
    },
  };
});

vi.mock('../../../logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('SupabaseStorageClient', () => {
  let client: SupabaseStorageClient;

  beforeEach(() => {
    vi.clearAllMocks();
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
        list: vi.fn().mockResolvedValue(mockListResult),
      });

      const files = await client.listFiles();

      expect(files).toHaveLength(2);
      expect(files[0].name).toBe('test-file.pdf');
      // Sans prefix (listing à la racine), le chemin complet est le nom du
      // fichier tel quel — l'API Supabase Storage ne renvoie jamais
      // `metadata.full_path` en réalité, voir la note dans listFiles().
      expect(files[0].path).toBe('test-file.pdf');
      expect(files[0].contentType).toBe('application/pdf');
      expect(files[0].size).toBe(1024);
    });

    it('Devrait filtrer par prefix', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockImplementation((prefix: string, options: any) => {
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
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const files = await client.listFiles();
      expect(files).toHaveLength(0);
    });

    it('Devrait gérer les erreurs de Supabase', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
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
        list: vi.fn().mockImplementation((prefix: string, options: any) => {
          expect(options.limit).toBe(1000);
          return Promise.resolve(mockListResult);
        }),
      });

      await client.listFiles();
    });

    it('Devrait gérer les fichiers avec des métadonnées manquantes', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [
            {
              name: 'file-without-metadata.txt',
              id: 'file-3',
              updated_at: '2026-06-28T12:00:00Z',
              metadata: null,
            },
          ],
          error: null,
        }),
      });

      const files = await client.listFiles();
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('file-without-metadata.txt');
      expect(files[0].path).toBe('file-without-metadata.txt');
      expect(files[0].contentType).toBe('');
      expect(files[0].size).toBe(0);
    });

    it('Devrait gérer les fichiers avec des métadonnées partielles', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [
            {
              name: 'partial-metadata.txt',
              id: 'file-4',
              metadata: {
                size: 256,
                // full_path et mimetype manquants
              },
            },
          ],
          error: null,
        }),
      });

      const files = await client.listFiles();
      expect(files[0].size).toBe(256);
      expect(files[0].contentType).toBe('');
      expect(files[0].path).toBe('partial-metadata.txt');
    });
  });

  describe('getFileInfo()', () => {
    it('Devrait récupérer les métadonnées d\'un fichier spécifique', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue(mockListResult),
      });

      const fileInfo = await client.getFileInfo('documents/test-file.pdf');

      expect(fileInfo.name).toBe('test-file.pdf');
      expect(fileInfo.path).toBe('documents/test-file.pdf');
      expect(fileInfo.contentType).toBe('application/pdf');
    });

    it('Devrait lancer une erreur si le fichier n\'existe pas', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      await expect(client.getFileInfo('nonexistent-file.pdf')).rejects.toThrow(
        'Fichier non trouvé: nonexistent-file.pdf'
      );
    });

    it('Devrait gérer les erreurs de Supabase', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
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
        list: vi.fn().mockResolvedValue(mockListResult),
      });

      const exists = await client.fileExists('documents/test-file.pdf');
      expect(exists).toBe(true);
    });

    it('Devrait retourner false si le fichier n\'existe pas', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({ data: [], error: null }),
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

  describe('downloadFile()', () => {
    it('Devrait télécharger un fichier avec succès', async () => {
      const mockBlob = new MockBlob(['test file content']);
      mockSupabase.storage.from.mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
        list: vi.fn().mockResolvedValue(mockListResult),
      });

      const result = await client.downloadFile('documents/test-file.pdf');

      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.toString()).toBe('test file content');
      expect(result.fileInfo.name).toBe('test-file.pdf');
    });

    it('Devrait gérer les erreurs de téléchargement', async () => {
      mockSupabase.storage.from.mockReturnValue({
        download: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'File not found' },
        }),
      });

      await expect(client.downloadFile('documents/nonexistent.pdf')).rejects.toThrow(
        'Échec du téléchargement: File not found'
      );
    });

    it('Devrait gérer les erreurs de récupération des métadonnées après téléchargement', async () => {
      const mockBlob = new MockBlob(['test content']);
      mockSupabase.storage.from.mockReturnValue({
        download: vi.fn().mockResolvedValue({ data: mockBlob, error: null }),
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Metadata error' },
        }),
      });

      await expect(client.downloadFile('documents/file-with-error.pdf')).rejects.toThrow(
        'Échec de la récupération des métadonnées: Metadata error'
      );
    });
  });

  describe('fileExists()', () => {
    it('Devrait retourner false en cas d\'erreur lors de la vérification', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Access denied' },
        }),
      });

      const exists = await client.fileExists('documents/restricted-file.pdf');
      expect(exists).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('Devrait gérer les noms de fichiers avec des caractères spéciaux', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [
            {
              name: 'file with spaces & special chars.txt',
              id: 'file-5',
              metadata: {
                full_path: 'documents/file with spaces & special chars.txt',
                mimetype: 'text/plain',
                size: 100,
              },
            },
          ],
          error: null,
        }),
      });

      const files = await client.listFiles();
      expect(files[0].name).toBe('file with spaces & special chars.txt');
      expect(files[0].path).toBe('file with spaces & special chars.txt');
    });

    it('Devrait gérer les chemins avec des sous-dossiers imbriqués', async () => {
      mockSupabase.storage.from.mockReturnValue({
        list: vi.fn().mockResolvedValue({
          data: [
            {
              name: 'deep-file.txt',
              id: 'file-6',
              metadata: {
                full_path: 'documents/sub1/sub2/sub3/deep-file.txt',
                mimetype: 'text/plain',
                size: 500,
              },
            },
          ],
          error: null,
        }),
      });

      const files = await client.listFiles('documents/sub1/sub2/sub3');
      expect(files[0].path).toBe('documents/sub1/sub2/sub3/deep-file.txt');
    });
  });
});
