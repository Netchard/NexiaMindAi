import { GitLabIndexer } from '../indexer'
import { GitLabClient } from '../client'
import { GitLabConfig, GitLabFileInfo } from '../types'
import { logger } from '@/lib/logger'

// Mock dependencies
import { vi } from 'vitest'

vi.mock('../client')
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

const mockOCRService = {
  extractText: jest.fn()
}

const mockChunkDocument = jest.fn()
const mockGenerateEmbeddings = jest.fn()
const mockReindexSource = jest.fn()

jest.mock('@/lib/supabase/storage/ocr', () => ({
  OCRService: jest.fn().mockImplementation(() => mockOCRService)
}))

jest.mock('@/lib/rag/chunker', () => ({
  chunkDocument: mockChunkDocument
}))

jest.mock('@/lib/rag/embeddings', () => ({
  generateEmbeddings: mockGenerateEmbeddings
}))

jest.mock('@/lib/rag/retriever', () => ({
  reindexSource: mockReindexSource
}))

describe('GitLabIndexer', () => {
  let indexer: GitLabIndexer
  let mockClient: jest.Mocked<GitLabClient>

  beforeEach(() => {
    mockClient = {
      listProjectFiles: jest.fn(),
      downloadFile: jest.fn(),
      getConfig: jest.fn().mockReturnValue({ apiUrl: 'https://gitlab.com/api/v4', accessToken: 'test' })
    } as unknown as jest.Mocked<GitLabClient>

    indexer = new GitLabIndexer(mockClient)
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with GitLab client', () => {
      expect(indexer['client']).toBe(mockClient)
      expect(logger.info).toHaveBeenCalledWith('GitLabIndexer initialized', {
        gitLabConfig: { apiUrl: 'https://gitlab.com/api/v4', accessToken: 'test' }
      })
    })
  })

  describe('indexProject', () => {
    const mockFileInfo: GitLabFileInfo = {
      name: 'test.txt',
      path: 'path/to/test.txt',
      content: 'test content',
      contentType: 'text/plain',
      size: 12,
      lastModified: '2023-01-01T00:00:00Z',
      metadata: {
        projectId: '123',
        projectName: 'Test Project',
        repository: 'test-repo',
        branch: 'main',
        commit: 'abc123',
        author: 'test-user'
      }
    }

    it('should index project successfully', async () => {
      // Mock listProjectFiles to return one file
      mockClient.listProjectFiles.mockResolvedValue([mockFileInfo])

      // Mock downloadFile
      mockClient.downloadFile.mockResolvedValue({
        data: Buffer.from('test content'),
        fileInfo: mockFileInfo
      })

      // Mock OCR extraction
      mockOCRService.extractText.mockResolvedValue({
        text: 'extracted text',
        metadata: {}
      })

      // Mock chunking
      const mockChunks = [
        { content: 'chunk1', metadata: {}, index: 0 },
        { content: 'chunk2', metadata: {}, index: 1 }
      ]
      mockChunkDocument.mockResolvedValue(mockChunks)

      // Mock embeddings
      mockGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3])

      const result = await indexer.indexProject({
        projectId: '123',
        branch: 'main',
        dryRun: true
      })

      expect(result).toEqual({
        projectsProcessed: 1,
        filesProcessed: 1,
        filesIndexed: 1,
        filesSkipped: 0,
        errors: 0,
        chunksCreated: 2,
        embeddingsGenerated: 0, // 0 in dry run
        processingTime: expect.any(Number)
      })

      // Verify calls
      expect(mockClient.listProjectFiles).toHaveBeenCalledWith('123', { ref: 'main', path: undefined })
      expect(mockClient.downloadFile).toHaveBeenCalledWith('123', 'path/to/test.txt', 'main')
      expect(mockOCRService.extractText).toHaveBeenCalled()
      expect(mockChunkDocument).toHaveBeenCalled()
      expect(mockGenerateEmbeddings).toHaveBeenCalledTimes(2)
      expect(mockReindexSource).not.toHaveBeenCalled() // Not called in dry run
    })

    it('should handle file processing errors gracefully', async () => {
      const errorFileInfo = { ...mockFileInfo, path: 'error.txt' }
      
      mockClient.listProjectFiles.mockResolvedValue([mockFileInfo, errorFileInfo])
      mockClient.downloadFile
        .mockResolvedValueOnce({ data: Buffer.from('test content'), fileInfo: mockFileInfo })
        .mockRejectedValueOnce(new Error('Download failed'))

      mockOCRService.extractText.mockResolvedValue({ text: 'extracted text', metadata: {} })
      mockChunkDocument.mockResolvedValue([{ content: 'chunk1', metadata: {}, index: 0 }])

      const result = await indexer.indexProject({ projectId: '123', dryRun: true })

      expect(result).toEqual({
        projectsProcessed: 1,
        filesProcessed: 2,
        filesIndexed: 1,
        filesSkipped: 0,
        errors: 1,
        chunksCreated: 1,
        embeddingsGenerated: 0,
        processingTime: expect.any(Number)
      })

      expect(logger.error).toHaveBeenCalledWith('Failed to process GitLab file', {
        error: 'Download failed',
        filePath: 'error.txt'
      })
    })

    it('should skip files with no extracted text', async () => {
      mockClient.listProjectFiles.mockResolvedValue([mockFileInfo])
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from(''), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockResolvedValue({ text: '', metadata: {} })

      const result = await indexer.indexProject({ projectId: '123', dryRun: true })

      expect(result).toEqual({
        projectsProcessed: 1,
        filesProcessed: 1,
        filesIndexed: 0, // Skipped due to no text
        filesSkipped: 1,
        errors: 0,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: expect.any(Number)
      })

      expect(logger.warn).toHaveBeenCalledWith('No text extracted for GitLab file', {
        filePath: 'path/to/test.txt'
      })
    })

    it('should respect file limit option', async () => {
      const files = [mockFileInfo, { ...mockFileInfo, path: 'file2.txt' }]
      mockClient.listProjectFiles.mockResolvedValue(files)
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from('test'), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockResolvedValue({ text: 'text', metadata: {} })
      mockChunkDocument.mockResolvedValue([{ content: 'chunk', metadata: {}, index: 0 }])

      const result = await indexer.indexProject({ projectId: '123', limit: 1, dryRun: true })

      expect(result.filesProcessed).toBe(1)
      expect(mockClient.downloadFile).toHaveBeenCalledTimes(1)
    })

    it('should handle API errors when listing files', async () => {
      mockClient.listProjectFiles.mockRejectedValue(new Error('API error'))

      await expect(indexer.indexProject({ projectId: '123' }))
        .rejects.toThrow('API error')

      expect(logger.error).toHaveBeenCalledWith('Failed to index GitLab project', {
        error: 'API error'
      })
    })
  })

  describe('indexFile', () => {
    const mockFileInfo: GitLabFileInfo = {
      name: 'test.txt',
      path: 'path/to/test.txt',
      content: 'test content',
      contentType: 'text/plain',
      size: 12,
      lastModified: '2023-01-01T00:00:00Z',
      metadata: {
        projectId: '123',
        projectName: 'Test Project',
        repository: 'test-repo',
        branch: 'main',
        commit: 'abc123',
        author: 'test-user'
      }
    }

    it('should index file successfully in dry run mode', async () => {
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from('test'), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockResolvedValue({ text: 'extracted', metadata: {} })
      mockChunkDocument.mockResolvedValue([{ content: 'chunk', metadata: {}, index: 0 }])

      await indexer['indexFile'](mockFileInfo, { dryRun: true })

      expect(mockClient.downloadFile).toHaveBeenCalledWith('123', 'path/to/test.txt', 'main')
      expect(mockOCRService.extractText).toHaveBeenCalledWith(expect.any(Buffer), 'test.txt')
      expect(mockChunkDocument).toHaveBeenCalledWith({
        content: 'extracted',
        metadata: expect.objectContaining({
          source: 'path/to/test.txt',
          sourceType: 'gitlab',
          projectId: '123'
        })
      })
      expect(mockReindexSource).not.toHaveBeenCalled() // Not called in dry run
    })

    it('should index file successfully with database persistence', async () => {
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from('test'), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockResolvedValue({ text: 'extracted', metadata: {} })
      mockChunkDocument.mockResolvedValue([{ content: 'chunk', metadata: {}, index: 0 }])
      mockGenerateEmbeddings.mockResolvedValue([0.1, 0.2, 0.3])

      await indexer['indexFile'](mockFileInfo, { dryRun: false })

      expect(mockGenerateEmbeddings).toHaveBeenCalledWith('chunk')
      expect(mockReindexSource).toHaveBeenCalledWith('path/to/test.txt', {
        sourceType: 'gitlab',
        projectId: '123',
        projectName: 'Test Project',
        repository: 'test-repo',
        branch: 'main'
      })
    })

    it('should handle download errors', async () => {
      mockClient.downloadFile.mockRejectedValue(new Error('Download error'))

      await expect(indexer['indexFile'](mockFileInfo, { dryRun: true }))
        .rejects.toThrow('Download error')

      expect(logger.error).toHaveBeenCalledWith('Failed to download GitLab file', {
        error: 'Download error',
        filePath: 'path/to/test.txt'
      })
    })

    it('should handle OCR extraction errors', async () => {
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from('test'), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockRejectedValue(new Error('OCR error'))

      await expect(indexer['indexFile'](mockFileInfo, { dryRun: true }))
        .rejects.toThrow('OCR error')

      expect(logger.error).toHaveBeenCalledWith('Failed to extract text from GitLab file', {
        error: 'OCR error',
        filePath: 'path/to/test.txt'
      })
    })

    it('should handle chunking errors', async () => {
      mockClient.downloadFile.mockResolvedValue({ data: Buffer.from('test'), fileInfo: mockFileInfo })
      mockOCRService.extractText.mockResolvedValue({ text: 'extracted', metadata: {} })
      mockChunkDocument.mockRejectedValue(new Error('Chunking error'))

      await expect(indexer['indexFile'](mockFileInfo, { dryRun: true }))
        .rejects.toThrow('Chunking error')

      expect(logger.error).toHaveBeenCalledWith('Failed to chunk GitLab file content', {
        error: 'Chunking error',
        filePath: 'path/to/test.txt'
      })
    })
  })

  describe('filterFiles', () => {
    it('should filter files by extension', () => {
      const files = [
        { name: 'file.txt', path: 'file.txt', contentType: 'text/plain', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} },
        { name: 'file.pdf', path: 'file.pdf', contentType: 'application/pdf', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} },
        { name: 'file.jpg', path: 'file.jpg', contentType: 'image/jpeg', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} }
      ]

      const filtered = indexer['filterFiles'](files, { extensions: ['.txt', '.md'] })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('file.txt')
    })

    it('should filter files by size', () => {
      const files = [
        { name: 'small.txt', path: 'small.txt', contentType: 'text/plain', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} },
        { name: 'large.txt', path: 'large.txt', contentType: 'text/plain', size: 20000000, lastModified: '2023-01-01T00:00:00Z', metadata: {} }
      ]

      const filtered = indexer['filterFiles'](files, { maxSize: 10000000 })
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe('small.txt')
    })

    it('should return all files when no filters applied', () => {
      const files = [
        { name: 'file1.txt', path: 'file1.txt', contentType: 'text/plain', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} },
        { name: 'file2.txt', path: 'file2.txt', contentType: 'text/plain', size: 100, lastModified: '2023-01-01T00:00:00Z', metadata: {} }
      ]

      const filtered = indexer['filterFiles'](files, {})
      expect(filtered).toHaveLength(2)
    })
  })
})