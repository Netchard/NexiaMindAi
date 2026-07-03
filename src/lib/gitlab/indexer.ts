import { logger } from '@/lib/logger'
import { GitLabClient } from './client'
import { GitLabIndexingOptions, GitLabIndexingResult, GitLabFileProcessingResult } from './types'
import { OCRService } from '@/lib/supabase/storage/ocr'
import { chunkDocument } from '@/lib/rag/chunker'
import { generateEmbeddings } from '@/lib/rag/embeddings'
import { reindexSource } from '@/lib/rag/retriever'

/**
 * GitLabIndexer - Service for indexing GitLab repository content
 * 
 * This service provides functionality to:
 * - Index all files from a GitLab project
 * - Process individual files from GitLab
 * - Integrate with the RAG pipeline (chunking, embeddings, retrieval)
 * - Handle various file types (text, PDF, Office documents)
 */
export class GitLabIndexer {
  private client: GitLabClient
  private ocrService: OCRService
  
  /**
   * Create a new GitLabIndexer instance
   * @param client GitLabClient instance
   */
  constructor(client: GitLabClient) {
    this.client = client
    this.ocrService = new OCRService()
    
    logger.info('GitLabIndexer initialized', {
      gitLabConfig: client.getConfig()
    })
  }
  
  /**
   * Index all files from a GitLab project
   * @param options Indexing options
   * @returns Promise<GitLabIndexingResult> Indexing results
   */
  async indexProject(options: GitLabIndexingOptions): Promise<GitLabIndexingResult> {
    const startTime = Date.now()
    const result: GitLabIndexingResult = {
      projectsProcessed: 0,
      filesProcessed: 0,
      filesIndexed: 0,
      filesSkipped: 0,
      errors: 0,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      processingTime: 0,
      dryRun: options.dryRun || false,
      errorMessages: []
    }
    
    try {
      logger.info('Starting GitLab project indexing', {
        projectId: options.projectId,
        path: options.path || '/',
        ref: options.ref || 'main',
        dryRun: options.dryRun
      })
      
      // Get project information
      const project = await this.client.getProjectInfo(options.projectId)
      result.projectsProcessed = 1
      
      // List all files in the project
      const files = await this.client.listProjectFiles(
        options.projectId,
        options.path || '/',
        options.ref || 'main',
        options.recursive !== false // default true
      )
      
      logger.info('GitLab files found for indexing', {
        projectId: options.projectId,
        projectName: project.name,
        fileCount: files.length
      })
      
      // Process each file
      for (const file of files) {
        if (file.type !== 'blob') {
          logger.debug('Skipping non-blob file', { filePath: file.path, type: file.type })
          result.filesSkipped++
          continue
        }
        
        // Check file extension filters
        if (options.includeExtensions && options.includeExtensions.length > 0) {
          const fileExtension = this.getFileExtension(file.name)
          if (!options.includeExtensions.includes(fileExtension)) {
            logger.debug('Skipping file - extension not in include list', {
              filePath: file.path,
              extension: fileExtension
            })
            result.filesSkipped++
            continue
          }
        }
        
        if (options.excludeExtensions && options.excludeExtensions.length > 0) {
          const fileExtension = this.getFileExtension(file.name)
          if (options.excludeExtensions.includes(fileExtension)) {
            logger.debug('Skipping file - extension in exclude list', {
              filePath: file.path,
              extension: fileExtension
            })
            result.filesSkipped++
            continue
          }
        }
        
        // Check file size limit
        if (options.maxFileSize && file.size && file.size > options.maxFileSize) {
          logger.debug('Skipping file - exceeds size limit', {
            filePath: file.path,
            fileSize: file.size,
            maxSize: options.maxFileSize
          })
          result.filesSkipped++
          continue
        }
        
        result.filesProcessed++
        
        try {
          const fileResult = await this.processFile(file, options)
          if (fileResult.success) {
            result.filesIndexed++
            result.chunksCreated += fileResult.chunksCreated || 0
            result.embeddingsGenerated += fileResult.embeddingsGenerated || 0
          } else {
            result.errors++
            if (fileResult.error) {
              result.errorMessages.push(fileResult.error)
            }
          }
        } catch (error) {
          result.errors++
          const errorMessage = error instanceof Error ? error.message : String(error)
          result.errorMessages.push(`Failed to process ${file.path}: ${errorMessage}`)
          logger.error('Error processing GitLab file', {
            filePath: file.path,
            error: errorMessage
          })
        }
      }
      
      result.processingTime = Date.now() - startTime
      
      logger.info('GitLab project indexing completed', {
        ...result,
        processingTime: `${result.processingTime}ms`
      })
      
      return result
    } catch (error) {
      result.processingTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Error indexing GitLab project', {
        error: errorMessage,
        projectId: options.projectId
      })
      result.errorMessages.push(`Project indexing failed: ${errorMessage}`)
      throw error
    }
  }
  
  /**
   * Process a single GitLab file
   * @param fileInfo GitLab file information
   * @param options Indexing options
   * @returns Promise<GitLabFileProcessingResult> Processing result
   */
  async processFile(
    fileInfo: any, // GitLabFileInfo
    options: GitLabIndexingOptions
  ): Promise<GitLabFileProcessingResult> {
    const startTime = Date.now()
    const result: GitLabFileProcessingResult = {
      fileInfo,
      success: false
    }
    
    try {
      logger.info('Processing GitLab file', {
        filePath: fileInfo.path,
        fileName: fileInfo.name,
        fileSize: fileInfo.size
      })
      
      // Download file content
      const fileBuffer = await this.client.downloadFile(
        options.projectId,
        fileInfo.path,
        options.ref || 'main'
      )
      
      // Extract text using OCR service
      const extractedText = await this.ocrService.extractText(fileBuffer, fileInfo.name)
      
      if (!extractedText.text || extractedText.text.trim() === '') {
        logger.warn('No text extracted from file', {
          filePath: fileInfo.path,
          contentType: extractedText.contentType
        })
        result.success = false
        result.error = 'No text content extracted'
        return result
      }
      
      // Chunk the document
      const chunkingResult = await chunkDocument({
        text: extractedText.text,
        metadata: {
          source: 'gitlab',
          sourceId: String(options.projectId),
          filePath: fileInfo.path,
          fileName: fileInfo.name,
          projectName: options.client || 'gitlab',
          documentType: options.documentType || 'code',
          contentType: extractedText.contentType,
          pageCount: extractedText.pageCount
        }
      })
      
      const chunks = chunkingResult.chunks
      result.chunksCreated = chunks.length
      
      // Generate embeddings
      const embeddingResults = await generateEmbeddings(
        chunks.map(chunk => chunk.content)
      )
      
      result.embeddingsGenerated = embeddingResults.embeddings.length
      
      // Save to database (unless dry run)
      if (!options.dryRun) {
        await reindexSource({
          source: 'gitlab',
          sourceId: String(options.projectId),
          filePath: fileInfo.path,
          chunks: chunks,
          embeddings: embeddingResults.embeddings,
          metadata: {
            projectId: options.projectId,
            fileName: fileInfo.name,
            fileSize: fileInfo.size,
            contentType: extractedText.contentType,
            documentType: options.documentType || 'code',
            client: options.client,
            processedAt: new Date().toISOString()
          }
        })
      } else {
        logger.info('Dry run - skipping database save', {
          filePath: fileInfo.path
        })
      }
      
      result.success = true
      result.processingTime = Date.now() - startTime
      
      logger.info('GitLab file processed successfully', {
        filePath: fileInfo.path,
        chunksCreated: result.chunksCreated,
        embeddingsGenerated: result.embeddingsGenerated,
        processingTime: `${result.processingTime}ms`
      })
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Error processing GitLab file', {
        filePath: fileInfo.path,
        error: errorMessage
      })
      result.success = false
      result.error = errorMessage
      result.processingTime = Date.now() - startTime
      return result
    }
  }
  
  /**
   * Get file extension from filename
   * @param filename File name
   * @returns string File extension (without dot)
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.')
    if (parts.length > 1) {
      return parts[parts.length - 1].toLowerCase()
    }
    return ''
  }
  
  /**
   * Get the GitLab client instance
   * @returns GitLabClient
   */
  getClient(): GitLabClient {
    return this.client
  }
}