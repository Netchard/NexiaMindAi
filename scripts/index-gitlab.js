#!/usr/bin/env node

/**
 * GitLab Indexer CLI Script
 * 
 * Command-line interface for indexing GitLab repositories
 * 
 * Usage:
 *   node scripts/index-gitlab.js [options]
 * 
 * Options:
 *   --project, -p    GitLab project ID to index
 *   --branch, -b     Branch/tag/commit to index (default: main)
 *   --path, -P       Path within project to index (default: /)
 *   --recursive, -r  Index recursively (default: true)
 *   --dry-run, -d    Dry run - don't save to database
 *   --limit, -l      Maximum number of files to process
 *   --client, -c     Client identifier for tracking
 *   --type, -t       Document type for classification
 *   --help, -h       Show help
 */

const { program } = require('commander')
const { logger } = require('./src/lib/logger')
const { GitLabClient, GitLabIndexer } = require('./src/lib/gitlab')

// Configure commander
program
  .name('index-gitlab')
  .description('GitLab Repository Indexer - Index GitLab projects into the RAG system')
  .version('1.0.0')

// Add options
program
  .option('-p, --project <id>', 'GitLab project ID to index (required)')
  .option('-b, --branch <ref>', 'Branch/tag/commit to index', 'main')
  .option('-P, --path <path>', 'Path within project to index', '/')
  .option('-r, --recursive', 'Index recursively', true)
  .option('-d, --dry-run', 'Dry run - don\'t save to database', false)
  .option('-l, --limit <number>', 'Maximum number of files to process')
  .option('-c, --client <id>', 'Client identifier for tracking', 'cli')
  .option('-t, --type <type>', 'Document type for classification', 'code')
  .option('--api-url <url>', 'GitLab API URL', process.env.GITLAB_URL || 'https://gitlab.com')
  .option('--access-token <token>', 'GitLab access token', process.env.GITLAB_ACCESS_TOKEN)

// Parse arguments
program.parse(process.argv)

// Main execution
async function main() {
  const options = program.opts()
  
  // Show help if no project specified
  if (!options.project) {
    program.help()
    process.exit(1)
  }
  
  // Validate access token
  if (!options.accessToken) {
    logger.error('GitLab access token is required')
    logger.info('Set GITLAB_ACCESS_TOKEN environment variable or use --access-token option')
    process.exit(1)
  }
  
  logger.info('Starting GitLab indexing...', {
    projectId: options.project,
    branch: options.branch,
    path: options.path,
    recursive: options.recursive,
    dryRun: options.dryRun,
    limit: options.limit,
    client: options.client,
    documentType: options.type
  })
  
  try {
    // Create GitLab client
    const gitLabClient = new GitLabClient({
      apiUrl: options.apiUrl,
      accessToken: options.accessToken,
      clientId: options.client
    })
    
    // Create indexer
    const indexer = new GitLabIndexer(gitLabClient)
    
    // Prepare indexing options
    const indexingOptions = {
      projectId: parseInt(options.project),
      ref: options.branch,
      path: options.path,
      recursive: options.recursive,
      dryRun: options.dryRun,
      client: options.client,
      documentType: options.type,
      maxFileSize: 10 * 1024 * 1024 // 10MB default limit
    }
    
    if (options.limit) {
      indexingOptions.maxFiles = parseInt(options.limit)
    }
    
    logger.info('GitLab client configured successfully', {
      apiUrl: options.apiUrl,
      projectId: options.project
    })
    
    // Get project info
    const project = await gitLabClient.getProjectInfo(indexingOptions.projectId)
    logger.info('Indexing GitLab project', {
      projectId: project.id,
      projectName: project.name,
      projectPath: project.path_with_namespace
    })
    
    // Start indexing
    const startTime = Date.now()
    const result = await indexer.indexProject(indexingOptions)
    const processingTime = Date.now() - startTime
    
    // Display results
    logger.info('GitLab indexing completed successfully', {
      projectsProcessed: result.projectsProcessed,
      filesProcessed: result.filesProcessed,
      filesIndexed: result.filesIndexed,
      filesSkipped: result.filesSkipped,
      chunksCreated: result.chunksCreated,
      embeddingsGenerated: result.embeddingsGenerated,
      errors: result.errors,
      processingTime: `${processingTime}ms`,
      dryRun: result.dryRun
    })
    
    if (result.errors > 0) {
      logger.warn('Some files failed to process', {
        errorCount: result.errors,
        errorMessages: result.errorMessages
      })
    }
    
    // Summary
    console.log('\n🎉 GitLab Indexing Summary')
    console.log('========================')
    console.log(`📁 Project: ${project.name} (${project.id})`)
    console.log(`📄 Files Processed: ${result.filesProcessed}`)
    console.log(`✅ Files Indexed: ${result.filesIndexed}`)
    console.log(`⏩ Files Skipped: ${result.filesSkipped}`)
    console.log(`❌ Errors: ${result.errors}`)
    console.log(`🔗 Chunks Created: ${result.chunksCreated}`)
    console.log(`🧠 Embeddings Generated: ${result.embeddingsGenerated}`)
    console.log(`⏱️  Processing Time: ${processingTime}ms`)
    console.log(`💾 Dry Run: ${result.dryRun ? 'Yes' : 'No'}`)
    
    if (result.errors > 0) {
      console.log('\n⚠️  Error Details:')
      result.errorMessages.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }
    
    process.exit(0)
    
  } catch (error) {
    logger.error('GitLab indexing failed', {
      error: error.message,
      stack: error.stack
    })
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Execute main function
main().catch(error => {
  logger.error('Unexpected error in GitLab indexing script', {
    error: error.message,
    stack: error.stack
  })
  console.error('❌ Unexpected error:', error.message)
  process.exit(1)
})