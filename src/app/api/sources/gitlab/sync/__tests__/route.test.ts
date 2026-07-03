import { POST, GET } from '../route'
import { NextRequest } from 'next/server'
import { GitLabIndexer } from '@/lib/gitlab/indexer'
import { AuthService } from '@/lib/api/auth/service'
import { logger } from '@/lib/logger'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('@/lib/gitlab/indexer')
vi.mock('@/lib/api/auth/service')
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('GitLab Sync API Endpoint', () => {
  let mockIndexer: jest.Mocked<GitLabIndexer>
  let mockAuthService: jest.Mocked<typeof AuthService>

  beforeEach(() => {
    mockIndexer = {
      indexProject: jest.fn()
    } as unknown as jest.Mocked<GitLabIndexer>

    mockAuthService = {
      isAdminByUserId: jest.fn()
    } as unknown as jest.Mocked<typeof AuthService>

    ;(GitLabIndexer as jest.Mock).mockImplementation(() => mockIndexer)
    ;(AuthService as unknown as jest.Mock).mockImplementation(() => mockAuthService)

    vi.clearAllMocks()
  })

  describe('POST endpoint', () => {
    const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
      return {
        json: () => Promise.resolve(body),
        headers: {
          get: (key: string) => headers[key] || null
        },
        nextUrl: {
          pathname: '/api/sources/gitlab/sync'
        }
      } as unknown as NextRequest
    }

    it('should return 401 when no user ID provided', async () => {
      const request = createMockRequest({ projectId: '123' })
      const response = await POST(request)
      
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non autorisé - utilisateur non authentifié')
    })

    it('should return 403 when user is not admin', async () => {
      mockAuthService.isAdminByUserId.mockResolvedValue(false)
      
      const request = createMockRequest(
        { projectId: '123' },
        { 'x-user-id': 'user123', 'x-user-email': 'user@example.com' }
      )
      const response = await POST(request)
      
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Accès refusé - droits administrateur requis')
      expect(mockAuthService.isAdminByUserId).toHaveBeenCalledWith('user123')
    })

    it('should return 202 and launch indexing when request is valid', async () => {
      mockAuthService.isAdminByUserId.mockResolvedValue(true)
      mockIndexer.indexProject.mockResolvedValue({
        projectsProcessed: 1,
        filesProcessed: 5,
        filesIndexed: 5,
        filesSkipped: 0,
        errors: 0,
        chunksCreated: 10,
        embeddingsGenerated: 10,
        processingTime: 1000
      })

      const request = createMockRequest(
        { projectId: '123', branch: 'main', dryRun: false },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const response = await POST(request)
      
      expect(response.status).toBe(202)
      const data = await response.json()
      expect(data.status).toBe('queued')
      expect(data.taskId).toBeDefined()
      expect(data.taskId).toMatch(/^gitlab_sync_\d+$/)
      expect(data.message).toBe('Synchronisation GitLab lancée avec succès')
      expect(data.processed).toBe(0) // Initial state
      expect(data.succeeded).toBe(0)
      expect(data.failed).toBe(0)
      expect(data.errors).toEqual([])
      expect(data.chunksCreated).toBe(0)
      expect(data.embeddingsGenerated).toBe(0)

      // Verify that indexProject was called in the background
      expect(mockIndexer.indexProject).toHaveBeenCalledWith({
        projectId: '123',
        branch: 'main',
        dryRun: false,
        repository: undefined,
        path: undefined,
        limit: undefined
      })

      expect(logger.info).toHaveBeenCalledWith('Début de la synchronisation GitLab', {
        userId: 'admin123',
        userEmail: 'admin@example.com',
        options: expect.objectContaining({ projectId: '123', branch: 'main', dryRun: false })
      })

      expect(logger.info).toHaveBeenCalledWith('Synchronisation GitLab lancée', {
        taskId: expect.any(String),
        userId: 'admin123',
        processingTime: expect.any(String)
      })
    })

    it('should handle missing projectId in request body', async () => {
      mockAuthService.isAdminByUserId.mockResolvedValue(true)

      const request = createMockRequest(
        { branch: 'main' },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const response = await POST(request)
      
      expect(response.status).toBe(202) // Should still work with undefined projectId
      expect(mockIndexer.indexProject).toHaveBeenCalledWith(
        expect.objectContaining({ projectId: undefined })
      )
    })

    it('should handle API errors gracefully', async () => {
      mockAuthService.isAdminByUserId.mockResolvedValue(true)
      mockIndexer.indexProject.mockRejectedValue(new Error('GitLab API error'))

      const request = createMockRequest(
        { projectId: '123' },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const response = await POST(request)
      
      expect(response.status).toBe(202) // Background processing still launched
      expect(logger.error).toHaveBeenCalledWith('Échec de la synchronisation GitLab en arrière-plan', {
        error: 'GitLab API error',
        taskId: expect.any(String),
        userId: 'admin123'
      })
    })

    it('should handle internal server errors', async () => {
      // Simulate an unexpected error
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest(
        { projectId: '123' },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Erreur serveur interne')
      expect(data.details).toBe('Unexpected error')

      global.fetch = originalFetch
    })
  })

  describe('GET endpoint', () => {
    it('should return 405 for GET requests', async () => {
      const request = {
        nextUrl: {
          pathname: '/api/sources/gitlab/sync'
        }
      } as unknown as NextRequest

      const response = await GET(request)
      
      expect(response.status).toBe(405)
      const data = await response.json()
      expect(data.error).toBe('Méthode non supportée - utiliser POST pour lancer la synchronisation')
    })
  })

  describe('Request Validation', () => {
    it('should handle invalid JSON body', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
        headers: {
          get: () => 'admin123'
        },
        nextUrl: {
          pathname: '/api/sources/gitlab/sync'
        }
      } as unknown as NextRequest

      mockAuthService.isAdminByUserId.mockResolvedValue(true)

      const response = await POST(request)
      
      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Erreur serveur interne')
      expect(data.details).toBe('Invalid JSON')
    })

    it('should handle missing headers gracefully', async () => {
      const request = {
        json: () => Promise.resolve({ projectId: '123' }),
        headers: {
          get: () => null
        },
        nextUrl: {
          pathname: '/api/sources/gitlab/sync'
        }
      } as unknown as NextRequest

      const response = await POST(request)
      
      expect(response.status).toBe(401)
    })
  })

  describe('Task ID Generation', () => {
    it('should generate unique task IDs', async () => {
      mockAuthService.isAdminByUserId.mockResolvedValue(true)

      const request1 = createMockRequest(
        { projectId: '123' },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const request2 = createMockRequest(
        { projectId: '456' },
        { 'x-user-id': 'admin123', 'x-user-email': 'admin@example.com' }
      )

      const response1 = await POST(request1)
      const response2 = await POST(request2)

      const data1 = await response1.json()
      const data2 = await response2.json()

      expect(data1.taskId).not.toBe(data2.taskId)
      expect(data1.taskId).toMatch(/^gitlab_sync_\d+$/)
      expect(data2.taskId).toMatch(/^gitlab_sync_\d+$/)
    })
  })
})