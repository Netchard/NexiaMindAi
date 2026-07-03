/**
 * GitLab Integration Module - Centralized Exports
 * 
 * This module provides integration with GitLab API for indexing
 * repository content into the RAG system.
 */

export { GitLabClient } from './client'
export { GitLabIndexer } from './indexer'
export {
  GitLabConfig,
  GitLabProject,
  GitLabFileInfo,
  GitLabIndexingOptions,
  GitLabIndexingResult,
  GitLabFileProcessingResult
} from './types'