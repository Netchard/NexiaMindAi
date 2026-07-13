/**
 * Script de Benchmark MOCK pour le Cache des Embeddings - ST-403
 * PHASE GREEN: Version mock pour tests sans dépendances externes
 * 
 * Ce script simule les benchmarks sans dépendre de Redis ou de l'API Mistral.
 * Idéal pour les tests automatisés et l'exécution en CI.
 * 
 * @story ST-403
 * @task Tâche 4.1 - Créer le script de benchmark
 */

const fs = require('fs');
const path = require('path');

// Chemins des fichiers de sortie avec identifiant unique
const BENCHMARK_REPORT_PATH = path.join(__dirname, `embedding-cache-benchmark-report-${Date.now()}.json`);
const BENCHMARK_LOG_PATH = path.join(__dirname, `embedding-cache-benchmark-${Date.now()}.log`);

// Configuration des tests (similée)
const BENCHMARK_CONFIG = {
  uniqueRequestsCount: 100,
  repeatedRequestsCount: 100,
  textLength: 100,
  testIterations: 1,
  cacheHitThresholdMs: 50,
  cacheHitRateThreshold: 30,
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
  try {
    fs.appendFileSync(BENCHMARK_LOG_PATH, logContent, 'utf8');
  } catch (e) {
    // Silencieux
  }
}

/**
 * Génère des résultats MOCK réalistes pour le benchmark
 * Simule les comportements attendus avec et sans cache
 */
function generateMockResults() {
  log('\n🎭 Génération des résultats MOCK pour le benchmark...', {}, 'cyan');
  
  // Générer des timings réalistes avec distributions normales
  const generateTimings = (count, baseTime, variation) => {
    const timings = [];
    for (let i = 0; i < count; i++) {
      // Distribution normale simplifiée
      let time = baseTime;
      for (let j = 0; j < 6; j++) {
        time += (Math.random() * 2 - 1) * variation;
      }
      time = Math.max(0, time);
      timings.push(time);
    }
    return timings;
  };
  
  // Configuration 1: Avec Cache (Redis + In-Memory)
  // Les cache hits doivent être très rapides (< 50ms)
  // Les cache misses sont lents (200-500ms)
  const withCacheUniqueTimings = generateTimings(100, 300, 100); // Cache misses: ~300ms
  const withCacheRepeatedTimings = generateTimings(100, 10, 5); // Cache hits: ~10ms
  
  // Configuration 2: Avec Cache In-Memory seulement (similaire)
  const inMemoryUniqueTimings = generateTimings(100, 280, 90);
  const inMemoryRepeatedTimings = generateTimings(100, 8, 4);
  
  // Configuration 3: Sans Cache (toujours lent)
  const noCacheUniqueTimings = generateTimings(100, 350, 100);
  const noCacheRepeatedTimings = generateTimings(100, 350, 100);
  
  // Calculer les statistiques
  const calculateStats = (timings, cacheHits, cacheMisses) => {
    const totalTime = timings.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / timings.length;
    const minTime = Math.min(...timings);
    const maxTime = Math.max(...timings);
    
    return {
      count: timings.length,
      times: timings,
      totalTime,
      avgTime,
      minTime,
      maxTime,
      cacheHits,
      cacheMisses,
      apiCalls: cacheMisses, // Chaque miss = 1 appel API
    };
  };
  
  // Résultats pour chaque configuration
  const results = [
    {
      config: 'Avec Cache Redis + In-Memory',
      uniqueRequests: calculateStats(withCacheUniqueTimings, 0, 100), // 0 hits, 100 misses
      repeatedRequests: calculateStats(withCacheRepeatedTimings, 100, 0), // 100 hits, 0 misses
    },
    {
      config: 'Avec Cache In-Memory seulement',
      uniqueRequests: calculateStats(inMemoryUniqueTimings, 0, 100),
      repeatedRequests: calculateStats(inMemoryRepeatedTimings, 100, 0),
    },
    {
      config: 'Sans Cache',
      uniqueRequests: calculateStats(noCacheUniqueTimings, 0, 100),
      repeatedRequests: calculateStats(noCacheRepeatedTimings, 0, 100),
    },
  ];
  
  // Ajouter les métriques globales
  results.forEach(result => {
    result.overall = {
      totalRequests: result.uniqueRequests.count + result.repeatedRequests.count,
      totalTime: result.uniqueRequests.totalTime + result.repeatedRequests.totalTime,
      avgTime: (result.uniqueRequests.totalTime + result.repeatedRequests.totalTime) / 
               (result.uniqueRequests.count + result.repeatedRequests.count),
    };
    
    const totalCacheHits = result.uniqueRequests.cacheHits + result.repeatedRequests.cacheHits;
    const totalCacheMisses = result.uniqueRequests.cacheMisses + result.repeatedRequests.cacheMisses;
    const totalRequests = totalCacheHits + totalCacheMisses;
    result.overall.cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;
    
    const apiCallsWithoutCache = result.uniqueRequests.count + result.repeatedRequests.count;
    const apiCallsWithCache = result.uniqueRequests.apiCalls + result.repeatedRequests.apiCalls;
    result.overall.apiCallReduction = apiCallsWithoutCache > 0 
      ? ((apiCallsWithoutCache - apiCallsWithCache) / apiCallsWithoutCache) * 100 
      : 0;
  });
  
  log('✅ Résultats MOCK générés', {
    configurations: results.map(r => r.config),
    sampleStats: {
      withCache: {
        uniqueAvg: results[0].uniqueRequests.avgTime.toFixed(2) + 'ms',
        repeatedAvg: results[0].repeatedRequests.avgTime.toFixed(2) + 'ms',
      },
      noCache: {
        uniqueAvg: results[2].uniqueRequests.avgTime.toFixed(2) + 'ms',
        repeatedAvg: results[2].repeatedRequests.avgTime.toFixed(2) + 'ms',
      },
    },
  }, 'green');
  
  return results;
}

/**
 * Génère un rapport de benchmark
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    benchmarkVersion: '1.0.0-mock',
    story: 'ST-403',
    task: 'Tâche 4.1 - Créer le script de benchmark (MOCK)',
    configuration: BENCHMARK_CONFIG,
    isMock: true,
    results: results.map(r => ({
      config: r.config,
      summary: {
        uniqueRequests: {
          count: r.uniqueRequests.count,
          avgTimeMs: Math.round(r.uniqueRequests.avgTime * 100) / 100,
          minTimeMs: Math.round(r.uniqueRequests.minTime * 100) / 100,
          maxTimeMs: Math.round(r.uniqueRequests.maxTime * 100) / 100,
          cacheHits: r.uniqueRequests.cacheHits,
          cacheMisses: r.uniqueRequests.cacheMisses,
          apiCalls: r.uniqueRequests.apiCalls,
        },
        repeatedRequests: {
          count: r.repeatedRequests.count,
          avgTimeMs: Math.round(r.repeatedRequests.avgTime * 100) / 100,
          minTimeMs: Math.round(r.repeatedRequests.minTime * 100) / 100,
          maxTimeMs: Math.round(r.repeatedRequests.maxTime * 100) / 100,
          cacheHits: r.repeatedRequests.cacheHits,
          cacheMisses: r.repeatedRequests.cacheMisses,
          apiCalls: r.repeatedRequests.apiCalls,
        },
        overall: {
          totalRequests: r.overall.totalRequests,
          totalTimeMs: Math.round(r.overall.totalTime * 100) / 100,
          avgTimeMs: Math.round(r.overall.avgTime * 100) / 100,
          cacheHitRate: Math.round(r.overall.cacheHitRate * 100) / 100,
          apiCallReduction: Math.round(r.overall.apiCallReduction * 100) / 100,
        },
      },
    })),
  };
  
  // Sauvegarder le rapport
  fs.writeFileSync(BENCHMARK_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  
  log(`✅ Rapport MOCK sauvegardé: ${BENCHMARK_REPORT_PATH}`, {}, 'green');
  
  return report;
}

/**
 * Valide les Acceptance Criteria avec les données MOCK
 */
function validateAcceptanceCriteria(results) {
  log('\n🎯 Validation des Acceptance Criteria (MOCK)...', {}, 'cyan');
  
  const acResults = {
    ac1: { satisfied: false, message: '', details: {} },
    ac2: { satisfied: false, message: '', details: {} },
    ac3: { satisfied: false, message: '', details: {} },
  };
  
  // Trouver les résultats avec cache
  const cacheResults = results.find(r => r.config.includes('Cache'));
  
  if (!cacheResults) {
    log('❌ Impossible de trouver les résultats avec cache', {}, 'red');
    return acResults;
  }
  
  // AC1: Cache hit ratio > 30% pour les requêtes répétées
  const repeatedHitRate = cacheResults.overall.cacheHitRate;
  acResults.ac1.satisfied = repeatedHitRate > BENCHMARK_CONFIG.cacheHitRateThreshold;
  acResults.ac1.message = acResults.ac1.satisfied 
    ? `✅ Cache hit ratio ${repeatedHitRate.toFixed(2)}% > ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`
    : `❌ Cache hit ratio ${repeatedHitRate.toFixed(2)}% <= ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`;
  acResults.ac1.details = { required: `> ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`, actual: `${repeatedHitRate.toFixed(2)}%` };
  
  // AC2: Temps de réponse < 50ms pour les cache hits
  const cacheHitAvgTime = cacheResults.repeatedRequests.avgTime;
  acResults.ac2.satisfied = cacheHitAvgTime < BENCHMARK_CONFIG.cacheHitThresholdMs;
  acResults.ac2.message = acResults.ac2.satisfied
    ? `✅ Cache hit temps moyen ${cacheHitAvgTime.toFixed(2)}ms < ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`
    : `❌ Cache hit temps moyen ${cacheHitAvgTime.toFixed(2)}ms >= ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`;
  acResults.ac2.details = { required: `< ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`, actual: `${cacheHitAvgTime.toFixed(2)}ms` };
  
  // AC3: Réduction des appels API
  const apiReduction = cacheResults.overall.apiCallReduction;
  acResults.ac3.satisfied = apiReduction > 0;
  acResults.ac3.message = acResults.ac3.satisfied
    ? `✅ Réduction des appels API: ${apiReduction.toFixed(2)}%`
    : `❌ Pas de réduction des appels API: ${apiReduction.toFixed(2)}%`;
  acResults.ac3.details = { required: '> 0%', actual: `${apiReduction.toFixed(2)}%` };
  
  // Log les résultats
  Object.keys(acResults).forEach(ac => {
    const result = acResults[ac];
    log(result.message, result.details, result.satisfied ? 'green' : 'red');
  });
  
  const allSatisfied = Object.values(acResults).every(r => r.satisfied);
  log(`\n${allSatisfied ? '✅ TOUS LES AC SATISFAITS (MOCK)' : '❌ CERTAINS AC NON SATISFAITS (MOCK)'}`, {}, allSatisfied ? 'green' : 'red');
  
  return acResults;
}

/**
 * Fonction principale du benchmark MOCK
 */
async function runCacheBenchmark() {
  log('\n' + '='.repeat(60), {}, 'cyan');
  log('🚀 DÉMARRAGE DU BENCHMARK CACHE EMBEDDINGS (MOCK)', {}, 'cyan');
  log('Story: ST-403 - Implémenter le Cache des Embeddings', {}, 'cyan');
  log('Tâche: 4.1 - Créer le script de benchmark (MOCK)', {}, 'cyan');
  log('='.repeat(60), {}, 'cyan');
  
  // Générer les résultats MOCK
  const results = generateMockResults();
  
  // Générer le rapport
  const report = generateReport(results);
  
  // Valider les Acceptance Criteria
  const acResults = validateAcceptanceCriteria(results);
  
  // Résumé final
  log('\n' + '='.repeat(60), {}, 'cyan');
  log('📊 RÉSULTATS DU BENCHMARK (MOCK)', {}, 'cyan');
  log('='.repeat(60), {}, 'cyan');
  
  results.forEach((result, index) => {
    log(`\n${result.config}:`, {}, 'magenta');
    log(`  Requêtes uniques (${result.uniqueRequests.count}):`, {}, 'yellow');
    log(`    - Temps moyen: ${result.uniqueRequests.avgTime.toFixed(2)}ms`, {}, 'white');
    log(`    - Cache hits: ${result.uniqueRequests.cacheHits}`, {}, 'white');
    log(`    - Cache misses: ${result.uniqueRequests.cacheMisses}`, {}, 'white');
    
    log(`  Requêtes répétées (${result.repeatedRequests.count}):`, {}, 'yellow');
    log(`    - Temps moyen: ${result.repeatedRequests.avgTime.toFixed(2)}ms`, {}, 'white');
    log(`    - Cache hits: ${result.repeatedRequests.cacheHits}`, {}, 'white');
    log(`    - Cache misses: ${result.repeatedRequests.cacheMisses}`, {}, 'white');
    
    log(`  Global:`, {}, 'yellow');
    log(`    - Taux cache hit: ${result.overall.cacheHitRate.toFixed(2)}%`, {}, 'white');
    log(`    - Réduction appels API: ${result.overall.apiCallReduction.toFixed(2)}%`, {}, 'white');
  });
  
  log('\n' + '='.repeat(60), {}, 'cyan');
  log('✅ BENCHMARK MOCK TERMINÉ', {}, 'green');
  log(`Fichiers générés:`, {}, 'green');
  log(`  - Rapport: ${BENCHMARK_REPORT_PATH}`, {}, 'green');
  log(`  - Log: ${BENCHMARK_LOG_PATH}`, {}, 'green');
  log('='.repeat(60), {}, 'cyan');
  
  return {
    results,
    report,
    acResults,
    reportPath: BENCHMARK_REPORT_PATH,
    logPath: BENCHMARK_LOG_PATH,
  };
}

/**
 * Exporter les fonctions pour les tests
 */
module.exports = {
  runCacheBenchmark,
  generateMockResults,
  generateReport,
  validateAcceptanceCriteria,
  BENCHMARK_CONFIG,
};

// Exécuter si ce fichier est lancé directement
if (require.main === module) {
  runCacheBenchmark().catch(error => {
    log('❌ ERREUR: Échec du benchmark MOCK', error, 'red');
    process.exit(1);
  });
}
