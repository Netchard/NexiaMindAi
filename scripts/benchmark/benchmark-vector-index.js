/**
 * Script de Benchmark pour l'Index Vectoriel - ST-402
 * PHASE GREEN : Implémentation minimale pour Tâche 2
 * 
 * Ce script teste différentes configurations d'index IVFFlat
 * pour déterminer la configuration optimale.
 * 
 * @story ST-402
 * @task Tâche 2 - Créer le script de benchmark
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Chemins des fichiers de sortie
const BENCHMARK_REPORT_PATH = path.join(__dirname, 'vector-index-benchmark-report.json');
const BENCHMARK_LOG_PATH = path.join(__dirname, 'vector-index-benchmark.log');

// Configuration des tests
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400], // Différentes valeurs de 'lists'
  testIterations: 5, // Nombre de tests par configuration
  queryLimit: 10, // Nombre de résultats par requête
  warmupQueries: 3, // Requêtes de réchauffement
};

// Logger simple
function log(message, data = null, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  };
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  const coloredMessage = `${colors[color] || ''}${logMessage}${colors.reset || ''}`;
  console.log(coloredMessage, data || '');
  
  // Écrire dans le fichier de log
  const logContent = `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}\n`;
  fs.appendFileSync(BENCHMARK_LOG_PATH, logContent, 'utf8');
}

/**
 * Initialise le client Supabase Admin
 */
function initAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[BENCHMARK] SUPABASE_URL non défini');
  }
  if (!supabaseServiceKey) {
    throw new Error('[BENCHMARK] SUPABASE_SERVICE_ROLE_KEY non défini');
  }

  log('Initialisation du client Supabase Admin pour benchmark', {}, 'blue');
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Crée un index avec une configuration spécifique
 */
async function createIndexWithConfig(client, lists) {
  const indexName = `idx_embeddings_vector_bench_${lists}`;
  
  log(`Création de l'index ${indexName} avec lists=${lists}...`, {}, 'cyan');
  
  // Supprimer l'index s'il existe
  const { error: dropError } = await client.rpc('drop_index_if_exists', {
    index_name: indexName
  }).catch(() => ({ error: null }));
  
  if (dropError) {
    log(`⚠️ Impossible de supprimer l'index existant: ${dropError.message}`, {}, 'yellow');
  }
  
  // Créer le nouvel index
  const { data, error } = await client.rpc('create_ivfflat_index', {
    table_name: 'embeddings',
    column_name: 'vector',
    index_name: indexName,
    lists: lists
  }).catch(() => ({ data: null, error: { message: 'RPC non disponible' } }));
  
  if (error) {
    log(`❌ Erreur lors de la création de l'index: ${error.message}`, {}, 'red');
    throw error;
  }
  
  log(`✅ Index ${indexName} créé avec succès`, {}, 'green');
  return indexName;
}

/**
 * Exécute une requête de benchmark sur un index
 */
async function runBenchmarkQuery(client, indexName, iteration) {
  const startTime = Date.now();
  
  // Générer un embedding de test (vecteur aléatoire de 384 dimensions)
  const testVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
  
  // Exécuter la requête
  const { data, error } = await client
    .from('embeddings')
    .select('chunk_id, vector <=> array[' + testVector.map((v, i) => `'${v}'`).join(',') + '] as distance')
    .order('distance', { ascending: true })
    .limit(BENCHMARK_CONFIG.queryLimit);
  
  const endTime = Date.now();
  const queryTime = endTime - startTime;
  
  if (error) {
    log(`❌ Erreur de requête (itération ${iteration}): ${error.message}`, {}, 'red');
    return { success: false, time: null, error: error.message, results: 0 };
  }
  
  return {
    success: true,
    time: queryTime,
    results: data ? data.length : 0
  };
}

/**
 * Effectue un benchmark complet pour une configuration
 */
async function benchmarkConfiguration(client, lists) {
  const configResults = {
    lists: lists,
    indexName: null,
    results: [],
    statistics: {
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      totalQueries: 0,
      failedQueries: 0,
      totalTime: 0
    }
  };
  
  log(`\n🎯 Benchmark pour lists=${lists}`, {}, 'magenta');
  
  try {
    // Créer l'index
    configResults.indexName = await createIndexWithConfig(client, lists);
    
    // Attendre un peu pour que l'index soit prêt
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Requêtes de réchauffement
    log(`⏳ Exécution de ${BENCHMARK_CONFIG.warmupQueries} requêtes de réchauffement...`, {}, 'yellow');
    for (let i = 1; i <= BENCHMARK_CONFIG.warmupQueries; i++) {
      await runBenchmarkQuery(client, configResults.indexName, `warmup-${i}`);
    }
    
    // Exécuter les tests de benchmark
    log(`📊 Exécution de ${BENCHMARK_CONFIG.testIterations} itérations de test...`, {}, 'blue');
    
    for (let i = 1; i <= BENCHMARK_CONFIG.testIterations; i++) {
      const result = await runBenchmarkQuery(client, configResults.indexName, i);
      configResults.results.push(result);
      
      if (result.success) {
        configResults.statistics.totalQueries++;
        configResults.statistics.totalTime += result.time;
        configResults.statistics.minTime = Math.min(configResults.statistics.minTime, result.time);
        configResults.statistics.maxTime = Math.max(configResults.statistics.maxTime, result.time);
      } else {
        configResults.statistics.failedQueries++;
      }
      
      log(`  Itération ${i}: ${result.success ? `${result.time}ms` : 'ÉCHOUÉ'}`, {}, result.success ? 'green' : 'red');
    }
    
    // Calculer les statistiques
    if (configResults.statistics.totalQueries > 0) {
      configResults.statistics.avgTime = configResults.statistics.totalTime / configResults.statistics.totalQueries;
    }
    if (configResults.statistics.minTime === Infinity) {
      configResults.statistics.minTime = 0;
    }
    
    log(`✅ Benchmark terminé pour lists=${lists}`, {}, 'green');
    log(`   Temps moyen: ${configResults.statistics.avgTime.toFixed(2)}ms`, {}, 'cyan');
    log(`   Temps min: ${configResults.statistics.minTime}ms`, {}, 'cyan');
    log(`   Temps max: ${configResults.statistics.maxTime}ms`, {}, 'cyan');
    
  } catch (error) {
    log(`❌ Erreur lors du benchmark pour lists=${lists}: ${error.message}`, {}, 'red');
    configResults.error = error.message;
  }
  
  return configResults;
}

/**
 * Exécute le benchmark complet
 */
async function runFullBenchmark(client) {
  const report = {
    benchmarkDate: new Date().toISOString(),
    configuration: BENCHMARK_CONFIG,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    },
    results: [],
    summary: null
  };
  
  log('🚀 Démarrage du benchmark complet de l\'index vectoriel', {}, 'magenta');
  log('Configuration:', BENCHMARK_CONFIG, 'blue');
  
  // Exécuter le benchmark pour chaque configuration
  for (const lists of BENCHMARK_CONFIG.listConfigurations) {
    try {
      const configResult = await benchmarkConfiguration(client, lists);
      report.results.push(configResult);
    } catch (error) {
      log(`❌ Erreur fatale pour lists=${lists}: ${error.message}`, {}, 'red');
      report.results.push({
        lists: lists,
        error: error.message,
        indexName: null,
        results: [],
        statistics: {
          avgTime: 0,
          minTime: 0,
          maxTime: 0,
          totalQueries: 0,
          failedQueries: BENCHMARK_CONFIG.testIterations
        }
      });
    }
  }
  
  // Générer le résumé
  report.summary = generateSummary(report.results);
  
  return report;
}

/**
 * Génère un résumé des résultats
 */
function generateSummary(results) {
  const summary = {
    totalConfigurations: results.length,
    successfulConfigurations: 0,
    failedConfigurations: 0,
    bestConfiguration: null,
    recommendations: []
  };
  
  // Trouver les configurations réussies
  const successfulResults = results.filter(r => !r.error && r.statistics.totalQueries > 0);
  summary.successfulConfigurations = successfulResults.length;
  summary.failedConfigurations = results.length - successfulResults.length;
  
  // Trouver la configuration avec le meilleur temps moyen
  if (successfulResults.length > 0) {
    const sortedBySpeed = [...successfulResults].sort((a, b) => a.statistics.avgTime - b.statistics.avgTime);
    summary.bestConfiguration = {
      lists: sortedBySpeed[0].lists,
      avgTime: sortedBySpeed[0].statistics.avgTime,
      description: 'Configuration la plus rapide'
    };
    
    // Trouver la configuration avec la meilleure stabilité (écart-type le plus faible)
    const resultsWithStdDev = successfulResults.map(r => ({
      ...r,
      stdDev: calculateStandardDeviation(r.results.map(r => r.time).filter(t => t !== null))
    }));
    const sortedByStability = [...resultsWithStdDev].sort((a, b) => a.stdDev - b.stdDev);
    
    summary.recommendations.push({
      type: 'vitesse',
      configuration: summary.bestConfiguration.lists,
      avgTime: summary.bestConfiguration.avgTime,
      description: 'Configuration la plus rapide'
    });
    
    summary.recommendations.push({
      type: 'stabilité',
      configuration: sortedByStability[0].lists,
      stdDev: sortedByStability[0].stdDev,
      description: 'Configuration la plus stable'
    });
    
    // Trouver un compromis (vitesse + stabilité)
    // On peut utiliser un score composite
    const scoredResults = successfulResults.map(r => {
      const speedScore = 1 / (r.statistics.avgTime + 1); // +1 pour éviter division par zéro
      const stabilityScore = 1 / (calculateStandardDeviation(r.results.map(rr => rr.time).filter(t => t !== null)) + 1);
      return {
        ...r,
        compositeScore: (speedScore * 0.7) + (stabilityScore * 0.3) // 70% vitesse, 30% stabilité
      };
    });
    const sortedByComposite = [...scoredResults].sort((a, b) => b.compositeScore - a.compositeScore);
    
    summary.recommendations.push({
      type: 'compromis',
      configuration: sortedByComposite[0].lists,
      compositeScore: sortedByComposite[0].compositeScore,
      description: 'Meilleur compromis vitesse/stabilité'
    });
  }
  
  // Vérifier si une configuration respecte le critère < 3s
  const fastEnough = successfulResults.find(r => r.statistics.avgTime < 3000);
  if (fastEnough) {
    summary.recommendations.push({
      type: 'critère',
      configuration: fastEnough.lists,
      avgTime: fastEnough.statistics.avgTime,
      description: 'Respecte le critère < 3s'
    });
  }
  
  return summary;
}

/**
 * Calcule l'écart-type d'un tableau de nombres
 */
function calculateStandardDeviation(values) {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Sauvegarde le rapport de benchmark
 */
function saveBenchmarkReport(report) {
  const content = JSON.stringify(report, null, 2);
  fs.writeFileSync(BENCHMARK_REPORT_PATH, content, 'utf8');
  log(`✅ Rapport de benchmark sauvegardé: ${BENCHMARK_REPORT_PATH}`, {}, 'green');
}

/**
 * Initialise les fichiers de log
 */
function initBenchmarkLogs() {
  const timestamp = new Date().toISOString();
  const header = `
========================================
Benchmark de l'Index Vectoriel - ST-402
Date: ${timestamp}
========================================

Configuration:
- Itérations par config: ${BENCHMARK_CONFIG.testIterations}
- Requêtes de réchauffement: ${BENCHMARK_CONFIG.warmupQueries}
- Limite de résultats: ${BENCHMARK_CONFIG.queryLimit}
- Configurations testées: [${BENCHMARK_CONFIG.listConfigurations.join(', ')}]

`;
  fs.writeFileSync(BENCHMARK_LOG_PATH, header, 'utf8');
}

/**
 * Fonction principale
 */
async function runVectorIndexBenchmark() {
  try {
    // Initialiser les logs
    initBenchmarkLogs();
    
    log('🔍 Démarrage du benchmark pour ST-402', {}, 'magenta');
    log('Tâche 2: Créer le script de benchmark', {}, 'blue');
    
    // Initialiser le client
    const client = initAdminClient();
    
    // Exécuter le benchmark
    const report = await runFullBenchmark(client);
    
    // Sauvegarder le rapport
    saveBenchmarkReport(report);
    
    log('\n✅ Benchmark terminé avec succès !', {}, 'green');
    log('\nRésumé:', report.summary, 'cyan');
    
    return report;
    
  } catch (error) {
    log(`❌ ERREUR fatale: ${error.message}`, {}, 'red');
    log(`Stack: ${error.stack}`, {}, 'yellow');
    throw error;
  }
}

// Exporter la fonction principale
module.exports = {
  runVectorIndexBenchmark,
  BENCHMARK_CONFIG,
  BENCHMARK_REPORT_PATH,
  BENCHMARK_LOG_PATH,
  benchmarkConfiguration,
  createIndexWithConfig,
  runBenchmarkQuery,
  generateSummary
};

// Permettre l'exécution directe
if (require.main === module) {
  runVectorIndexBenchmark()
    .then(report => {
      console.log('\n✅ Benchmark terminé avec succès !');
      console.log(`Rapport sauvegardé: ${BENCHMARK_REPORT_PATH}`);
      console.log(`Log sauvegardé: ${BENCHMARK_LOG_PATH}`);
      console.log('\nMeilleure configuration:', JSON.stringify(report.summary.bestConfiguration, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERREUR:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
