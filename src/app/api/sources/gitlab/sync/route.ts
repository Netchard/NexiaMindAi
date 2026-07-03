import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { GitLabClient, GitLabIndexer } from '@/lib/gitlab'
import { AuthService } from '@/lib/api/auth/service'

/**
 * GitLab Sync API Endpoint
 * 
 * POST /api/sources/gitlab/sync
 * 
 * This endpoint allows administrators to trigger GitLab repository indexing.
 * Requires JWT authentication with admin privileges.
 * 
 * Request Body:
 * {
 *   projectId: number (required) - GitLab project ID
 *   branch?: string - Branch/tag/commit (default: 'main')
 *   path?: string - Path within project (default: '/')
 *   recursive?: boolean - Recursive indexing (default: true)
 *   dryRun?: boolean - Dry run mode (default: false)
 *   client?: string - Client identifier
 *   documentType?: string - Document type classification
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   taskId: string
 *   status: string
 *   message: string
 *   timestamp: string
 * }
 */

export async function POST(request: Request) {
  const startTime = Date.now()
  const taskId = `gitlab-sync-${Date.now()}`
  
  try {
    logger.info('GitLab sync API request received', {
      taskId,
      method: request.method,
      url: request.url
    })
    
    // Validate authentication - admin only
    const authHeader = request.headers.get('authorization')
    const userId = request.headers.get('x-user-id')
    const userEmail = request.headers.get('x-user-email')
    
    if (!authHeader || !userId || !userEmail) {
      logger.warn('GitLab sync API - Missing authentication headers', {
        taskId,
        hasAuthHeader: !!authHeader,
        hasUserId: !!userId,
        hasUserEmail: !!userEmail
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized - Missing authentication headers'
        },
        { status: 401 }
      )
    }
    
    // Check admin privileges
    const isAdmin = await AuthService.isAdminByUserId(userId)
    
    if (!isAdmin) {
      logger.warn('GitLab sync API - Admin access required', {
        taskId,
        userId,
        userEmail
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden - Admin access required'
        },
        { status: 403 }
      )
    }
    
    logger.info('GitLab sync API - Authentication successful', {
      taskId,
      userId,
      userEmail,
      isAdmin: true
    })
    
    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      logger.error('GitLab sync API - Invalid JSON body', {
        taskId,
        error: error instanceof Error ? error.message : String(error)
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request - Invalid JSON body'
        },
        { status: 400 }
      )
    }
    
    // Validate request body
    if (!requestBody || typeof requestBody !== 'object') {
      logger.error('GitLab sync API - Invalid request body', {
        taskId,
        requestBody
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request - Invalid request body'
        },
        { status: 400 }
      )
    }
    
    if (!requestBody.projectId) {
      logger.error('GitLab sync API - Missing required projectId', {
        taskId,
        requestBody
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request - projectId is required'
        },
        { status: 400 }
      )
    }
    
    logger.info('GitLab sync API - Request validation successful', {
      taskId,
      projectId: requestBody.projectId,
      branch: requestBody.branch || 'main',
      path: requestBody.path || '/',
      recursive: requestBody.recursive !== false,
      dryRun: requestBody.dryRun || false
    })
    
    // Get GitLab configuration from environment
    const gitLabAccessToken = process.env.GITLAB_ACCESS_TOKEN
    const gitLabApiUrl = process.env.GITLAB_URL || 'https://gitlab.com'
    
    if (!gitLabAccessToken) {
      logger.error('GitLab sync API - GitLab access token not configured', {
        taskId
      })
      
      return NextResponse.json(
        {
          success: false,
          error: 'Server Error - GitLab access token not configured'
        },
        { status: 500 }
      )
    }
    
    // Create GitLab client and indexer
    const gitLabClient = new GitLabClient({
      apiUrl: gitLabApiUrl,
      accessToken: gitLabAccessToken,
      clientId: 'api'
    })
    
    const indexer = new GitLabIndexer(gitLabClient)
    
    // Prepare indexing options
    const indexingOptions = {
      projectId: requestBody.projectId,
      ref: requestBody.branch || 'main',
      path: requestBody.path || '/',
      recursive: requestBody.recursive !== false,
      dryRun: requestBody.dryRun || false,
      client: requestBody.client || 'api',
      documentType: requestBody.documentType || 'code',
      maxFileSize: 10 * 1024 * 1024 // 10MB default limit
    }
    
    logger.info('GitLab sync API - Starting indexing process', {
      taskId,
      indexingOptions
    })
    
    // Start indexing in background (fire-and-forget for long operations)
    // In a real implementation, you might want to use a queue system
    setTimeout(async () => {
      try {
        const startTime = Date.now()
        const result = await indexer.indexProject(indexingOptions)
        const processingTime = Date.now() - startTime
        
        logger.info('GitLab sync API - Indexing completed', {
          taskId,
          processingTime: `${processingTime}ms`,
          filesProcessed: result.filesProcessed,
          filesIndexed: result.filesIndexed,
          errors: result.errors
        })
        
        if (result.errors > 0) {
          logger.warn('GitLab sync API - Indexing completed with errors', {
            taskId,
            errorCount: result.errors,
            errorMessages: result.errorMessages
          })
        }
        
      } catch (error) {
        logger.error('GitLab sync API - Background indexing failed', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
      }
    }, 0)
    
    const processingTime = Date.now() - startTime
    
    // Return immediate response
    return NextResponse.json(
      {
        success: true,
        taskId,
        status: 'queued',
        message: 'GitLab indexing task has been queued for processing',
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`
      },
      { status: 202 } // 202 Accepted
    )
    
  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    logger.error('GitLab sync API - Unexpected error', {
      taskId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`
    })
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: errorMessage,
        taskId,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Disable GET method
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method Not Allowed - Use POST to trigger GitLab synchronization'
    },
    { status: 405 }
  )
}