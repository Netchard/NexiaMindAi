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

// Charger les variables d'environnement depuis .env
require('dotenv').config();

// Chemins des fichiers de sortie avec identifiant unique pour éviter conflits
// G3-H-001: Éviter les conflits entre exécutions concurrentes
const BENCHMARK_REPORT_PATH = path.join(__dirname, `vector-index-benchmark-report-${Date.now()}.json`);
const BENCHMARK_LOG_PATH = path.join(__dirname, `vector-index-benchmark-${Date.now()}.log`);

// Configuration des tests
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400], // Différentes valeurs de 'lists'
  testIterations: 5, // Nombre de tests par configuration
  queryLimit: 10, // Nombre de résultats par requête
  warmupQueries: 3, // Requêtes de réchauffement
};

/**
 * Valide la configuration du benchmark
 * G3-H-002: Validation au démarrage
 */
function validateBenchmarkConfig() {
  const errors = [];
  
  if (!BENCHMARK_CONFIG.listConfigurations || BENCHMARK_CONFIG.listConfigurations.length === 0) {
    errors.push('listConfigurations doit contenir au moins une valeur');
  }
  
  if (BENCHMARK_CONFIG.testIterations <= 0) {
    errors.push('testIterations doit être > 0');
  }
  
  if (BENCHMARK_CONFIG.queryLimit <= 0) {
    errors.push('queryLimit doit être > 0');
  }
  
  if (BENCHMARK_CONFIG.warmupQueries < 0) {
    errors.push('warmupQueries doit être >= 0');
  }
  
  // G3-F-004: Vérifier absence de doublons dans listConfigurations
  const uniqueConfigs = new Set(BENCHMARK_CONFIG.listConfigurations);
  if (uniqueConfigs.size !== BENCHMARK_CONFIG.listConfigurations.length) {
    errors.push('listConfigurations contient des valeurs dupliquées');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration invalide:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }
  
  log('✅ Configuration BENCHMARK_CONFIG validée', BENCHMARK_CONFIG, 'green');
}

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
 * Vérifie les pré-conditions: table, colonne, extension pgvector
 * G3-H-004: Vérification préalable
 */
async function verifyPreconditions(client) {
  log('🔍 Vérification des pré-conditions...', {}, 'cyan');
  
  // Vérifier l'extension pgvector
  const { data: extensionData, error: extensionError } = await client
    .from('pg_extension')
    .select('extname')
    .eq('extname', 'vector')
    .single();
  
  if (extensionError || !extensionData) {
    throw new Error('Extension pgvector non trouvée. Exécutez: CREATE EXTENSION IF NOT EXISTS vector;');
  }
  log('✅ Extension pgvector installée', {}, 'green');
  
  // Vérifier la table embeddings
  const { data: tableData, error: tableError } = await client
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'embeddings')
    .single();
  
  if (tableError || !tableData) {
    throw new Error('Table public.embeddings non trouvée');
  }
  log('✅ Table embeddings existe', {}, 'green');
  
  // Vérifier la colonne vector
  const { data: columnData, error: columnError } = await client
    .from('information_schema.columns')
    .select('column_name, udt_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'embeddings')
    .eq('column_name', 'vector')
    .single();
  
  if (columnError || !columnData) {
    throw new Error('Colonne vector non trouvée dans public.embeddings');
  }
  
  if (columnData.udt_name !== 'vector') {
    throw new Error(`Colonne vector n'est pas de type vector (trouvé: ${columnData.udt_name})`);
  }
  log('✅ Colonne vector de type vector existe', {}, 'green');
  
  // Vérifier la dimension (doit être 384 - leçon de ST-401)
  // G3-M-001: Validation dimension colonne
  const { data: embeddingsData, error: embeddingsError } = await client
    .from('embeddings')
    .select('vector')
    .limit(1)
    .single();
  
  if (embeddingsError) {
    log('⚠️ Impossible de vérifier la dimension: table vide ou erreur', {}, 'yellow');
  } else if (embeddingsData && embeddingsData.vector) {
    const actualDimension = embeddingsData.vector.length;
    if (actualDimension !== 384) {
      throw new Error(`Dimension vectorielle invalide: attendu 384, trouvé ${actualDimension}. Vérifiez ST-401.`);
    }
    log('✅ Dimension vectorielle validée: 384', {}, 'green');
  }
  
  log('✅ Toutes les pré-conditions validées', {}, 'green');
}

/**
 * Initialise le client Supabase Admin
 * G3-M-003: Validation du format des variables d'environnement
 */
function initAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('[BENCHMARK] SUPABASE_URL non défini\n' +
      'Solution: Copiez .env.example en .env et configurez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY\n' +
      '       ou passez les variables en ligne de commande: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node benchmark-vector-index.js');
  }
  if (!supabaseServiceKey) {
    throw new Error('[BENCHMARK] SUPABASE_SERVICE_ROLE_KEY non défini\n' +
      'Solution: Voir .env.example pour la configuration requise');
  }
  
  // Valider le format de l'URL
  try {
    new URL(supabaseUrl);
  } catch (e) {
    throw new Error(`[BENCHMARK] SUPABASE_URL invalide: ${supabaseUrl} - ${e.message}`);
  }

  log('Initialisation du client Supabase Admin pour benchmark', {}, 'blue');
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Génère un vecteur de test de dimension 384
 * G3-CR-003: Dimension validée et vecteur généré proprement
 */
function generateTestVector() {
  // Dimension FIXÉE à 384 (leçon de ST-401)
  const dimension = 384;
  return Array.from({ length: dimension }, () => Math.random() * 2 - 1);
}

/**
 * Supprime tous les index de benchmark existants
 * G3-CR-004: Isolation entre configurations
 * G3-CR-005: Nettoyage explicite avant chaque création
 */
async function cleanupBenchmarkIndexes(client) {
  log('🧹 Nettoyage des index de benchmark existants...', {}, 'yellow');
  
  // Supprimer tous les index bench_*
  for (const lists of BENCHMARK_CONFIG.listConfigurations) {
    const indexName = `idx_embeddings_vector_bench_${lists}`;
    
    // G3-CR-005: Ne pas avaler les erreurs silencieusement
    // Mais ignorer l'erreur "index non trouvé" qui est normale
    try {
      await client.rpc('drop_index_if_exists', { index_name: indexName });
      log(`  ✅ Index ${indexName} supprimé (ou non existant)`, {}, 'cyan');
    } catch (error) {
      // Seules les erreurs "index non trouvé" sont acceptables
      if (error.message && !error.message.includes('non trouvée') && 
          !error.message.includes('does not exist') &&
          !error.message.includes('not found')) {
        log(`  ⚠️ Erreur lors de la suppression de ${indexName}: ${error.message}`, {}, 'yellow');
      }
    }
  }
  
  log('✅ Nettoyage des index de benchmark terminé', {}, 'green');
}

/**
 * Crée un index avec une configuration spécifique
 * G3-CR-005: Nettoyage explicite avant création
 */
async function createIndexWithConfig(client, lists) {
  const indexName = `idx_embeddings_vector_bench_${lists}`;
  
  log(`Création de l'index ${indexName} avec lists=${lists}...`, {}, 'cyan');
  
  // G3-CR-005: Ne pas avaler les erreurs du drop silencieusement
  // Utiliser drop_index_if_exists qui gère déjà le cas "non trouvé"
  try {
    await client.rpc('drop_index_if_exists', { index_name: indexName });
    log(`  ✅ Ancien index ${indexName} supprimé si existant`, {}, 'cyan');
  } catch (error) {
    // Erreur inattendue - ne pas ignorer
    log(`  ⚠️ Erreur lors de la suppression de l'index existant: ${error.message}`, {}, 'yellow');
    throw error;
  }
  
  // Créer le nouvel index
  const { error } = await client.rpc('create_ivfflat_index', {
    table_name: 'embeddings',
    column_name: 'vector',
    index_name: indexName,
    lists: lists
  });
  
  if (error) {
    log(`❌ Erreur lors de la création de l'index: ${error.message}`, {}, 'red');
    throw error;
  }
  
  log(`✅ Index ${indexName} créé avec succès`, {}, 'green');
  return indexName;
}

/**
 * Attend que l'index soit prêt
 * G3-H-005: Attente réelle via get_index_construction_status
 */
async function waitForIndexReady(client, indexName, maxAttempts = 30, delayMs = 1000) {
  log(`⏳ Attente que l'index ${indexName} soit prêt...`, {}, 'yellow');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { data, error } = await client.rpc('get_index_construction_status', {
        index_name: indexName
      });
      
      if (error) {
        log(`  ⚠️ Erreur lors de la vérification (attempt ${attempt}/${maxAttempts}): ${error.message}`, {}, 'yellow');
      } else if (data && data.length > 0 && data[0].done === true) {
        log(`✅ Index ${indexName} est prêt (après ${attempt} vérifications)`, {}, 'green');
        return true;
      }
    } catch (e) {
      log(`  ⚠️ Exception lors de la vérification: ${e.message}`, {}, 'yellow');
    }
    
    // Attendre avant la prochaine tentative
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error(`Timeout: Index ${indexName} n'est pas prêt après ${maxAttempts * delayMs / 1000} secondes`);
}

/**
 * Exécute une requête de benchmark sur un index
 * G3-CR-003: Utilisation de RPC pour éviter l'injection SQL
 */
async function runBenchmarkQuery(client, indexName, iteration) {
  const startTime = Date.now();
  
  // Générer un vecteur de test valide (dimension 384)
  // G3-M-001: Dimension validée
  const testVector = generateTestVector();
  
  // G3-CR-003: Utiliser la RPC dédiée au lieu de concaténation de chaîne
  // Cela évite l'injection SQL et garantit une syntaxe valide
  const { data, error } = await client.rpc('benchmark_vector_similarity', {
    query_vector: testVector,
    limit_count: BENCHMARK_CONFIG.queryLimit
  });
  
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
    
    // Attendre que l'index soit prêt
    // G3-H-005: Attente réelle au lieu de setTimeout arbitraire
    await waitForIndexReady(client, configResults.indexName);
    
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
    // G3-M-002: Harmoniser failedQueries - si erreur avant les tests, tout a échoué
    configResults.statistics.failedQueries = BENCHMARK_CONFIG.testIterations;
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
  
  // Nettoyer les index existants avant de commencer
  // G3-CR-004: Isolation garantie
  await cleanupBenchmarkIndexes(client);
  
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
  
  // Nettoyer les index de benchmark après exécution
  // G3-F-002: Nettoyage final
  try {
    log('\n🧹 Nettoyage final des index de benchmark...', {}, 'yellow');
    await cleanupBenchmarkIndexes(client);
    log('✅ Nettoyage final terminé', {}, 'green');
  } catch (cleanupError) {
    log(`⚠️ Erreur lors du nettoyage final: ${cleanupError.message}`, {}, 'yellow');
  }
  
  // Générer le résumé
  report.summary = generateSummary(report.results);
  
  // G3-M-003: Échouer explicitement si aucune configuration n'a réussi
  if (report.summary.successfulConfigurations === 0) {
    throw new Error('AUCUNE configuration de benchmark n\'a réussi. Vérifiez les erreurs ci-dessus.');
  }
  
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
    
    // G3-H-002: Valider la configuration
    validateBenchmarkConfig();
    
    // Initialiser le client
    const client = initAdminClient();
    
    // G3-H-004: Vérifier les pré-conditions
    await verifyPreconditions(client);
    
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
  generateSummary,
  calculateStandardDeviation,
  generateTestVector,
  cleanupBenchmarkIndexes,
  waitForIndexReady,
  validateBenchmarkConfig,
  verifyPreconditions
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
