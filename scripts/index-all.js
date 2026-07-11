#!/usr/bin/env node

/**
 * Master Indexation Script - Orchestrates all source indexers
 * 
 * Part of ST-204 - Create Complete Indexation Script
 * 
 * Usage:
 *   node scripts/index-all.js [options]
 *   npm run index:all [options]
 * 
 * Options:
 *   --dry-run           Dry run mode (no database changes)
 *   --limit=<n>        Limit files per source (default: no limit)
 *   --client=<id>      Client identifier for tracking
 *   --type=<type>      Document type classification
 *   --help, -h         Show help
 */

require('dotenv').config();

// Simple logger for script execution
const logger = {
  info: (message, context = {}) => {
    console.log(`[INFO] ${message}`, context);
  },
  error: (message, context = {}) => {
    console.error(`[ERROR] ${message}`, context);
  },
  warn: (message, context = {}) => {
    console.warn(`[WARN] ${message}`, context);
  },
  debug: (message, context = {}) => {
    console.debug(`[DEBUG] ${message}`, context);
  }
};
const { execSync } = require('child_process');
const path = require('path');

// Configuration
const SOURCES = [
  {
    name: 'Supabase',
    script: 'scripts/index-supabase.ts',
    command: 'npx ts-node scripts/index-supabase.ts',
    enabled: true
  },
  {
    name: 'GitLab', 
    script: 'scripts/index-gitlab.js',
    command: 'node scripts/index-gitlab.js',
    enabled: true
  }
  /*
  ,{
    name: 'Nexia',
    script: 'scripts/index-nexia.js',
    command: 'node scripts/index-nexia.js',
    enabled: true
  }*/
];

/**
 * Execute a source indexer script
 * @param {string} sourceName - Name of the source
 * @param {string} command - Command to execute
 * @param {boolean} dryRun - Dry run mode
 * @returns {Promise<{success: boolean, error?: string, stats?: any}>}
 */
async function executeSource(sourceName, command, dryRun = false) {
  try {
    logger.info(`Starting ${sourceName} indexation`, { dryRun });
    
    // Add dry-run flag if specified
    const fullCommand = dryRun ? `${command} --dry-run` : command;
    
    // Execute the command
    const result = execSync(fullCommand, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    logger.info(`Completed ${sourceName} indexation successfully`);
    
    return {
      success: true,
      stats: {
        source: sourceName,
        status: 'completed'
      }
    };
  } catch (error) {
    logger.error(`Failed to execute ${sourceName} indexation`, {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message,
      stats: {
        source: sourceName,
        status: 'failed'
      }
    };
  }
}

/**
 * Main indexation function
 * @param {Object} options - Indexation options
 * @returns {Promise<{success: boolean, results: Array, stats: Object}>}
 */
async function indexAll(options = {}) {
  const startTime = Date.now();
  const results = [];
  let totalFiles = 0;
  let totalSuccess = 0;
  let totalErrors = 0;

  logger.info('Starting complete indexation process', {
    options,
    sources: SOURCES.map(s => s.name)
  });

  // Execute each source sequentially
  for (const source of SOURCES) {
    if (!source.enabled) {
      logger.info(`Skipping ${source.name} - disabled`);
      continue;
    }

    try {
      const result = await executeSource(source.name, source.command, options.dryRun);
      results.push(result);
      
      if (result.success) {
        totalSuccess++;
      } else {
        totalErrors++;
      }
      
      // Increment file count (would be enhanced with actual stats)
      totalFiles++;
    } catch (error) {
      logger.error(`Unexpected error processing ${source.name}`, {
        error: error.message
      });
      results.push({
        success: false,
        error: error.message,
        stats: {
          source: source.name,
          status: 'failed'
        }
      });
      totalErrors++;
    }
  }

  const processingTime = Date.now() - startTime;

  logger.info('Complete indexation process finished', {
    totalSources: SOURCES.length,
    totalSuccess,
    totalErrors,
    processingTime: `${processingTime}ms`
  });

  return {
    success: totalErrors === 0,
    results,
    stats: {
      totalSources: SOURCES.length,
      totalSuccess,
      totalErrors,
      processingTime,
      timestamp: new Date().toISOString()
    }
  };
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (options.help) {
    console.log(`
Usage: node scripts/index-all.js [options]

Options:
  --dry-run           Dry run mode (no database changes)
  --help, -h          Show this help message

Examples:
  node scripts/index-all.js
  node scripts/index-all.js --dry-run
  npm run index:all
  npm run index:all -- --dry-run
`);
    process.exit(0);
  }

  try {
    logger.info('Starting master indexation script', { options });
    
    const result = await indexAll(options);
    
    console.log('\n=== Complete Indexation Report ===');
    console.log(`Total Sources: ${result.stats.totalSources}`);
    console.log(`Successful: ${result.stats.totalSuccess}`);
    console.log(`Failed: ${result.stats.totalErrors}`);
    console.log(`Processing Time: ${result.stats.processingTime}ms`);
    console.log(`Timestamp: ${result.stats.timestamp}`);
    
    if (result.stats.totalErrors > 0) {
      console.log('\n=== Errors ===');
      result.results.forEach(r => {
        if (!r.success) {
          console.log(`  ${r.stats.source}: ${r.error}`);
        }
      });
    }
    
    process.exit(result.stats.totalErrors > 0 ? 1 : 0);
  } catch (error) {
    logger.error('Master indexation script failed', {
      error: error.message,
      stack: error.stack
    });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = {
  indexAll,
  executeSource
};

// Run if called directly
if (require.main === module) {
  main();
}