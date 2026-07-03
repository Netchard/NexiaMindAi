import { GitLabClient } from '../client'
import { GitLabConfig } from '../types'
import { logger } from '@/lib/logger'

// Mock the logger
import { vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('GitLabClient', () => {
  let client: GitLabClient
  let mockConfig: GitLabConfig

  beforeEach(() => {
    mockConfig = {
      apiUrl: 'https://gitlab.com/api/v4',
      accessToken: 'test-token'
    }
    client = new GitLabClient(mockConfig)
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default GitLab URL when not provided', () => {
      const defaultClient = new GitLabClient({ accessToken: 'test' })
      expect(defaultClient['baseUrl']).toBe('https://gitlab.com/api/v4')
    })

    it('should initialize with custom GitLab URL when provided', () => {
      const customClient = new GitLabClient({
        apiUrl: 'https://custom-gitlab.com/api/v4',
        accessToken: 'test'
      })
      expect(customClient['baseUrl']).toBe('https://custom-gitlab.com/api/v4')
    })

    it('should throw error when access token is not provided', () => {
      expect(() => new GitLabClient({ apiUrl: 'https://gitlab.com/api/v4' }))
        .toThrow('GitLab access token is required')
    })

    it('should log initialization info', () => {
      expect(logger.info).toHaveBeenCalledWith('GitLabClient initialized', {
        baseUrl: 'https://gitlab.com/api/v4',
        hasAccessToken: true
      })
    })
  })

  describe('listProjects', () => {
    it('should list projects successfully', async () => {
      const mockProjects = [
        { id: '1', name: 'Project 1', path_with_namespace: 'namespace/project1' },
        { id: '2', name: 'Project 2', path_with_namespace: 'namespace/project2' }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProjects)
      }) as jest.Mock

      const projects = await client.listProjects()
      
      expect(projects).toEqual(mockProjects)
      expect(fetch).toHaveBeenCalledWith('https://gitlab.com/api/v4/projects?membership=true&per_page=100', {
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'PRIVATE-TOKEN': 'test-token',
          'User-Agent': 'NexiaMind-GitLab-Client/1.0'
        })
      })
      expect(logger.info).toHaveBeenCalledWith('Listing GitLab projects', {
        url: 'https://gitlab.com/api/v4/projects?membership=true&per_page=100'
      })
    })

    it('should handle API errors when listing projects', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      }) as jest.Mock

      await expect(client.listProjects()).rejects.toThrow('GitLab API error: 401 Unauthorized')
      expect(logger.error).toHaveBeenCalledWith('Failed to list GitLab projects', {
        status: 401,
        url: 'https://gitlab.com/api/v4/projects?membership=true&per_page=100'
      })
    })

    it('should handle network errors when listing projects', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as jest.Mock

      await expect(client.listProjects()).rejects.toThrow('Network error')
      expect(logger.error).toHaveBeenCalledWith('Failed to list GitLab projects', {
        error: 'Network error'
      })
    })
  })

  describe('listProjectFiles', () => {
    it('should list project files successfully', async () => {
      const mockFiles = [
        {
          name: 'file1.txt',
          path: 'path/to/file1.txt',
          type: 'blob',
          last_commit_at: '2023-01-01T00:00:00Z',
          last_commit_id: 'abc123'
        }
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFiles)
      }) as jest.Mock

      const files = await client.listProjectFiles('123', { ref: 'main', path: 'src' })
      
      expect(files).toHaveLength(1)
      expect(files[0]).toEqual({
        name: 'file1.txt',
        path: 'path/to/file1.txt',
        contentType: 'text/plain',
        size: 0,
        lastModified: '2023-01-01T00:00:00Z',
        metadata: {
          projectId: '123',
          projectName: '',
          repository: '',
          branch: 'main',
          commit: 'abc123',
          author: 'unknown'
        }
      })
    })

    it('should handle API errors when listing project files', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }) as jest.Mock

      await expect(client.listProjectFiles('999')).rejects.toThrow('GitLab API error: 404 Not Found')
      expect(logger.error).toHaveBeenCalledWith('Failed to list GitLab project files', {
        status: 404,
        projectId: '999',
        ref: 'main',
        path: ''
      })
    })
  })

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const mockContent = 'file content here'
      const mockBuffer = Buffer.from(mockContent, 'utf-8')

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockContent)
      }) as jest.Mock

      const result = await client.downloadFile('123', 'path/to/file.txt', 'main')
      
      expect(result.data).toEqual(mockBuffer)
      expect(result.fileInfo).toEqual({
        name: 'file.txt',
        path: 'path/to/file.txt',
        content: mockContent,
        contentType: 'text/plain',
        size: mockBuffer.length,
        lastModified: expect.any(String),
        metadata: {
          projectId: '123',
          projectName: '',
          repository: '',
          branch: 'main',
          commit: '',
          author: 'unknown'
        }
      })
    })

    it('should handle API errors when downloading file', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      }) as jest.Mock

      await expect(client.downloadFile('123', 'invalid/file.txt')).rejects.toThrow('GitLab API error: 403 Forbidden')
      expect(logger.error).toHaveBeenCalledWith('Failed to download GitLab file', {
        status: 403,
        projectId: '123',
        filePath: 'invalid/file.txt',
        ref: 'main'
      })
    })
  })

  describe('getProjectInfo', () => {
    it('should get project info successfully', async () => {
      const mockProject = {
        id: '123',
        name: 'Test Project',
        path_with_namespace: 'namespace/test-project'
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockProject)
      }) as jest.Mock

      const project = await client.getProjectInfo('123')
      expect(project).toEqual(mockProject)
    })

    it('should handle API errors when getting project info', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      }) as jest.Mock

      await expect(client.getProjectInfo('999')).rejects.toThrow('GitLab API error: 404 Not Found')
      expect(logger.error).toHaveBeenCalledWith('Failed to get GitLab project info', {
        status: 404,
        projectId: '999'
      })
    })
  })

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ name: 'file.txt', path: 'path/to/file.txt' }])
      }) as jest.Mock

      const exists = await client.fileExists('123', 'path/to/file.txt', 'main')
      expect(exists).toBe(true)
    })

    it('should return false when file does not exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([])
      }) as jest.Mock

      const exists = await client.fileExists('123', 'nonexistent/file.txt', 'main')
      expect(exists).toBe(false)
    })
  })

  describe('detectContentType', () => {
    it('should detect content type for known extensions', () => {
      expect(client['detectContentType']('file.txt')).toBe('text/plain')
      expect(client['detectContentType']('file.json')).toBe('application/json')
      expect(client['detectContentType']('file.pdf')).toBe('application/pdf')
      expect(client['detectContentType']('file.md')).toBe('text/markdown')
      expect(client['detectContentType']('file.js')).toBe('application/javascript')
      expect(client['detectContentType']('file.ts')).toBe('application/typescript')
      expect(client['detectContentType']('file.py')).toBe('text/x-python')
      expect(client['detectContentType']('file.java')).toBe('text/x-java')
      expect(client['detectContentType']('file.png')).toBe('image/png')
      expect(client['detectContentType']('file.jpg')).toBe('image/jpeg')
    })

    it('should return application/octet-stream for unknown extensions', () => {
      expect(client['detectContentType']('file.unknown')).toBe('application/octet-stream')
      expect(client['detectContentType']('file')).toBe('application/octet-stream')
    })
  })
})