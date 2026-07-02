/**
 * Tests unitaires pour l'endpoint API /api/sources/supabase/sync
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { POST, GET, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';
import { storageIndexer } from '@/lib/supabase/storage';
import { AuthService } from '@/lib/api/auth/service';

// Mock des dépendances
jest.mock('@/lib/supabase/storage/indexer');
jest.mock('@/lib/api/auth/service');

// Mock de logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
jest.mock('@/lib/logger', () => ({ logger: mockLogger }));

describe('POST /api/sources/supabase/sync', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de NextRequest
    mockRequest = {
      headers: {
        get: jest.fn(),
      },
      json: jest.fn(),
      nextUrl: {
        pathname: '/api/sources/supabase/sync',
      },
    } as Partial<NextRequest>;
  });

  describe('Authentification', () => {
    it('Devrait rejeter les requêtes sans JWT (401)', async () => {
      // Mock: pas de userId
      (mockRequest.headers?.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'x-user-id') return null;
        return null;
      });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Non autorisé');
    });

    it('Devrait rejeter les requêtes sans rôle admin (403)', async () => {
      // Mock: userId présent mais pas admin
      (mockRequest.headers?.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'x-user-id') return 'user-123';
        if (key === 'x-user-email') return 'user@example.com';
        return null;
      });
      (AuthService.isAdminByUserId as jest.Mock).mockResolvedValue(false);

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Accès refusé');
    });

    it('Devrait accepter les requêtes avec JWT valide et rôle admin (202)', async () => {
      (mockRequest.headers?.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'x-user-id') return 'admin-123';
        if (key === 'x-user-email') return 'admin@example.com';
        return null;
      });
      (AuthService.isAdminByUserId as jest.Mock).mockResolvedValue(true);
      (mockRequest.json as jest.Mock).mockResolvedValue({});
      (storageIndexer.indexAll as jest.Mock).mockResolvedValue({
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        chunksCreated: 0,
        embeddingsGenerated: 0,
      });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data.status).toBe('queued');
      expect(data.taskId).toBeTruthy();
      expect(data.message).toContain('Synchronisation');
    });
  });

  describe('Validation de requête', () => {
    beforeEach(() => {
      // Setup admin user
      (mockRequest.headers?.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'x-user-id') return 'admin-123';
        return null;
      });
      (AuthService.isAdminByUserId as jest.Mock).mockResolvedValue(true);
    });

    it('Devrait rejeter les requêtes avec prefix non string (400)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ prefix: 123 });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('prefix');
    });

    it('Devrait rejeter les requêtes avec client non string (400)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ client: 123 });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('client');
    });

    it('Devrait rejeter les requêtes avec documentType non string (400)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ documentType: 123 });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('documentType');
    });

    it('Devrait rejeter les requêtes avec dryRun non booléen (400)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ dryRun: 'yes' });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('dryRun');
    });

    it('Devrait rejeter les requêtes avec limit non positif (400)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({ limit: -5 });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limit');
    });

    it('Devrait rejeter les requêtes avec JSON mal formaté (400)', async () => {
      (mockRequest.json as jest.Mock).mockRejectedValue(new SyntaxError('Unexpected token'));

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('JSON mal formaté');
    });

    it('Devrait accepter les requêtes avec tous les paramètres valides (202)', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        prefix: 'clients/nexia',
        client: 'nexia',
        documentType: 'contract',
        dryRun: true,
        limit: 10,
      });
      (storageIndexer.indexAll as jest.Mock).mockResolvedValue({
        processed: 10,
        succeeded: 8,
        failed: 2,
        errors: [],
        chunksCreated: 40,
        embeddingsGenerated: 40,
      });

      const response = await POST(mockRequest as NextRequest);
      expect(response.status).toBe(202);
      const data = await response.json();
      expect(data.status).toBe('queued');
    });
  });

  describe('Exécution de l\'indexation', () => {
    beforeEach(() => {
      (mockRequest.headers?.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'x-user-id') return 'admin-123';
        return null;
      });
      (AuthService.isAdminByUserId as jest.Mock).mockResolvedValue(true);
      (mockRequest.json as jest.Mock).mockResolvedValue({});
    });

    it('Devrait retourner un taskId unique', async () => {
      (storageIndexer.indexAll as jest.Mock).mockResolvedValue({
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        chunksCreated: 0,
        embeddingsGenerated: 0,
      });

      const response1 = await POST(mockRequest as NextRequest);
      const data1 = await response1.json();
      
      // Attendre un peu pour un taskId différent
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const response2 = await POST(mockRequest as NextRequest);
      const data2 = await response2.json();

      expect(data1.taskId).not.toBe(data2.taskId);
    });

    it('Devrait déclencher l\'indexation avec les bonnes options', async () => {
      (mockRequest.json as jest.Mock).mockResolvedValue({
        prefix: 'test/',
        client: 'test-client',
        documentType: 'test-type',
        dryRun: true,
        limit: 5,
      });

      await POST(mockRequest as NextRequest);

      expect(storageIndexer.indexAll).toHaveBeenCalledWith({
        prefix: 'test/',
        client: 'test-client',
        documentType: 'test-type',
        dryRun: true,
        limit: 5,
      });
    });
  });
});

describe('Autres méthodes HTTP', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    mockRequest = {
      nextUrl: {
        pathname: '/api/sources/supabase/sync',
      },
    } as Partial<NextRequest>;
  });

  it('Devrait rejeter GET avec 405', async () => {
    const response = await GET(mockRequest as NextRequest);
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.error).toContain('Méthode non supportée');
  });

  it('Devrait rejeter PUT avec 405', async () => {
    const response = await PUT(mockRequest as NextRequest);
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.error).toContain('Méthode non supportée');
  });

  it('Devrait rejeter DELETE avec 405', async () => {
    const response = await DELETE(mockRequest as NextRequest);
    expect(response.status).toBe(405);
    const data = await response.json();
    expect(data.error).toContain('Méthode non supportée');
  });
});
