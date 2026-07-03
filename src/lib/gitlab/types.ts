/**
 * GitLab Integration Types and Interfaces
 * 
 * This file defines all TypeScript interfaces for GitLab API integration
 */

export interface GitLabConfig {
  /**
   * GitLab API base URL (e.g., 'https://gitlab.com/api/v4')
   * Defaults to GitLab.com if not specified
   */
  apiUrl?: string
  
  /**
   * GitLab personal access token for authentication
   * Required for private repositories
   */
  accessToken: string
  
  /**
   * Optional client identifier for logging and tracking
   */
  clientId?: string
  
  /**
   * Default branch/ref to use when not specified
   */
  defaultRef?: string
}

export interface GitLabProject {
  /**
   * GitLab internal project ID
   */
  id: number
  
  /**
   * Project name
   */
  name: string
  
  /**
   * Project description
   */
  description: string | null
  
  /**
   * Project path with namespace (e.g., 'group/project')
   */
  path_with_namespace: string
  
  /**
   * Project default branch
   */
  default_branch: string
  
  /**
   * Project visibility (private, internal, public)
   */
  visibility: 'private' | 'internal' | 'public'
  
  /**
   * Project web URL
   */
  web_url: string
  
  /**
   * Project created at timestamp
   */
  created_at: string
  
  /**
   * Project last activity timestamp
   */
  last_activity_at: string
  
  /**
   * Whether the current user is a member of the project
   */
  membership?: boolean
}

export interface GitLabFileInfo {
  /**
   * File ID
   */
  id: string
  
  /**
   * File name
   */
  name: string
  
  /**
   * File type (blob, tree, commit)
   */
  type: 'blob' | 'tree' | 'commit'
  
  /**
   * File path within the project
   */
  path: string
  
  /**
   * File mode/permissions
   */
  mode: string
  
  /**
   * File size in bytes (for blobs)
   */
  size?: number
  
  /**
   * Last commit ID for this file
   */
  last_commit_id?: string
}

export interface GitLabIndexingOptions {
  /**
   * GitLab project ID to index
   */
  projectId: number
  
  /**
   * Path within the project to index (default: '/')
   */
  path?: string
  
  /**
   * Branch, tag, or commit SHA to index (default: 'main')
   */
  ref?: string
  
  /**
   * Whether to index recursively (default: true)
   */
  recursive?: boolean
  
  /**
   * File extensions to include (default: all)
   */
  includeExtensions?: string[]
  
  /**
   * File extensions to exclude
   */
  excludeExtensions?: string[]
  
  /**
   * Maximum file size to index in bytes
   */
  maxFileSize?: number
  
  /**
   * Client identifier for tracking
   */
  client?: string
  
  /**
   * Document type for classification
   */
  documentType?: string
  
  /**
   * Dry run mode - don't save to database
   */
  dryRun?: boolean
}

export interface GitLabIndexingResult {
  /**
   * Number of projects processed
   */
  projectsProcessed: number
  
  /**
   * Number of files processed
   */
  filesProcessed: number
  
  /**
   * Number of files successfully indexed
   */
  filesIndexed: number
  
  /**
   * Number of files skipped
   */
  filesSkipped: number
  
  /**
   * Number of errors encountered
   */
  errors: number
  
  /**
   * Number of chunks created
   */
  chunksCreated: number
  
  /**
   * Number of embeddings generated
   */
  embeddingsGenerated: number
  
  /**
   * Total processing time in milliseconds
   */
  processingTime: number
  
  /**
   * Whether this was a dry run
   */
  dryRun: boolean
  
  /**
   * Detailed error messages
   */
  errorMessages: string[]
}

export interface GitLabFileProcessingResult {
  /**
   * GitLab file information
   */
  fileInfo: GitLabFileInfo
  
  /**
   * Whether the file was successfully processed
   */
  success: boolean
  
  /**
   * Error message if processing failed
   */
  error?: string
  
  /**
   * Number of chunks created from this file
   */
  chunksCreated?: number
  
  /**
   * Number of embeddings generated from this file
   */
  embeddingsGenerated?: number
  
  /**
   * Processing time for this file in milliseconds
   */
  processingTime?: number
}