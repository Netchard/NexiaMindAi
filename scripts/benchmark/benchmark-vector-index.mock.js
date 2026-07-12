/**
 * MOCK du script de Benchmark pour l'Index Vectoriel - ST-402
 * PHASE GREEN : Version MOCK pour tests sans base de données
 * 
 * @story ST-402
 * @task Tâche 2 - Créer le script de benchmark
 */

const fs = require('fs');
const path = require('path');

const BENCHMARK_REPORT_PATH = path.join(__dirname, 'vector-index-benchmark-report.json');
const BENCHMARK_LOG_PATH = path.join(__dirname, 'vector-index-benchmark.log');

// Configuration des tests
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400],
  testIterations: 5,
  queryLimit: 10,
  warmupQueries: 3
};

// Logger simple
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data || '');
  const logContent = `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}\n`;
  fs.appendFileSync(BENCHMARK_LOG_PATH, logContent, 'utf8');
}

/**
 * Génère des résultats de benchmark MOCK
 */
function generateMockBenchmarkResults() {
  const results = [];
  
  for (const lists of BENCHMARK_CONFIG.listConfigurations) {
    // Générer des temps aléatoires réalistes
    // Plus lists = plus lent mais plus stable
    const baseTime = 1500 - (lists * 2); // Temps de base inversement proportionnel
    
    const resultTimes = [];
    for (let i = 0; i < BENCHMARK_CONFIG.testIterations; i++) {
      // Variation aléatoire de ±10%
      const variation = 1 + (Math.random() * 0.2 - 0.1);
      resultTimes.push(Math.max(100, Math.round(baseTime * variation)));
    }
    
    // Calculer les statistiques
    const avgTime = resultTimes.reduce((a, b) => a + b, 0) / resultTimes.length;
    const minTime = Math.min(...resultTimes);
    const maxTime = Math.max(...resultTimes);
    
    results.push({
      lists: lists,
      indexName: `idx_embeddings_vector_bench_${lists}`,
      results: resultTimes.map((time, i) => ({
        success: true,
        time: time,
        results: BENCHMARK_CONFIG.queryLimit
      })),
      statistics: {
        avgTime: avgTime,
        minTime: minTime,
        maxTime: maxTime,
        totalQueries: BENCHMARK_CONFIG.testIterations,
        failedQueries: 0,
        totalTime: resultTimes.reduce((a, b) => a + b, 0)
      }
    });
  }
  
  return results;
}

/**
 * Calcule l'écart-type
 */
function calculateStandardDeviation(values) {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Génère un résumé des résultats
 */
function generateSummary(results) {
  const summary = {
    totalConfigurations: results.length,
    successfulConfigurations: results.length,
    failedConfigurations: 0,
    bestConfiguration: null,
    recommendations: []
  };
  
  // Trouver la configuration la plus rapide
  const sortedBySpeed = [...results].sort((a, b) => a.statistics.avgTime - b.statistics.avgTime);
  summary.bestConfiguration = {
    lists: sortedBySpeed[0].lists,
    avgTime: sortedBySpeed[0].statistics.avgTime,
    description: 'Configuration la plus rapide'
  };
  
  // Recommandations
  summary.recommendations.push({
    type: 'vitesse',
    configuration: sortedBySpeed[0].lists,
    avgTime: sortedBySpeed[0].statistics.avgTime,
    description: 'Configuration la plus rapide'
  });
  
  // Meilleure stabilité
  const resultsWithStdDev = results.map(r => ({
    ...r,
    stdDev: calculateStandardDeviation(r.results.map(rr => rr.time))
  }));
  const sortedByStability = [...resultsWithStdDev].sort((a, b) => a.stdDev - b.stdDev);
  summary.recommendations.push({
    type: 'stabilité',
    configuration: sortedByStability[0].lists,
    stdDev: sortedByStability[0].stdDev,
    description: 'Configuration la plus stable'
  });
  
  // Meilleur compromis (70% vitesse, 30% stabilité)
  const scoredResults = resultsWithStdDev.map(r => {
    const speedScore = 1 / (r.statistics.avgTime + 1);
    const stabilityScore = 1 / (r.stdDev + 1);
    return {
      ...r,
      compositeScore: (speedScore * 0.7) + (stabilityScore * 0.3)
    };
  });
  const sortedByComposite = [...scoredResults].sort((a, b) => b.compositeScore - a.compositeScore);
  summary.recommendations.push({
    type: 'compromis',
    configuration: sortedByComposite[0].lists,
    compositeScore: sortedByComposite[0].compositeScore,
    description: 'Meilleur compromis vitesse/stabilité'
  });
  
  // Trouver les configurations qui respectent < 3s
  const fastEnough = results.filter(r => r.statistics.avgTime < 3000);
  if (fastEnough.length > 0) {
    summary.recommendations.push({
      type: 'critère',
      configuration: fastEnough[0].lists,
      avgTime: fastEnough[0].statistics.avgTime,
      description: 'Respecte le critère < 3s'
    });
  }
  
  return summary;
}

/**
 * Sauvegarde le rapport de benchmark
 */
function saveBenchmarkReport(report) {
  const content = JSON.stringify(report, null, 2);
  fs.writeFileSync(BENCHMARK_REPORT_PATH, content, 'utf8');
  log(`✅ Rapport de benchmark sauvegardé: ${BENCHMARK_REPORT_PATH}`);
}

/**
 * Initialise les fichiers de log
 */
function initBenchmarkLogs() {
  const timestamp = new Date().toISOString();
  const header = `
========================================
Benchmark de l'Index Vectoriel - ST-402 (MOCK)
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
 * Fonction principale MOCK
 */
async function runVectorIndexBenchmark() {
  try {
    initBenchmarkLogs();
    
    log('🚀 Démarrage du benchmark MOCK pour ST-402', 'blue');
    log('Tâche 2: Créer le script de benchmark (MOCK)');
    
    // Générer les résultats MOCK
    const results = generateMockBenchmarkResults();
    
    const report = {
      benchmarkDate: new Date().toISOString(),
      configuration: BENCHMARK_CONFIG,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        mock: true
      },
      results: results,
      summary: generateSummary(results)
    };
    
    // Sauvegarder le rapport
    saveBenchmarkReport(report);
    
    log('\n✅ Benchmark MOCK terminé avec succès !', 'green');
    log('\nRésumé:', report.summary, 'cyan');
    
    return report;
    
  } catch (error) {
    log(`❌ ERREUR: ${error.message}`, 'red');
    throw error;
  }
}

// Exporter la fonction principale
module.exports = {
  runVectorIndexBenchmark,
  BENCHMARK_CONFIG,
  BENCHMARK_REPORT_PATH,
  BENCHMARK_LOG_PATH
};

// Permettre l'exécution directe
if (require.main === module) {
  runVectorIndexBenchmark()
    .then(report => {
      console.log('\n✅ Benchmark MOCK terminé avec succès !');
      console.log(`Rapport sauvegardé: ${BENCHMARK_REPORT_PATH}`);
      console.log(`Log sauvegardé: ${BENCHMARK_LOG_PATH}`);
      console.log('\nMeilleure configuration:', JSON.stringify(report.summary.bestConfiguration, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERREUR:', error.message);
      process.exit(1);
    });
}
