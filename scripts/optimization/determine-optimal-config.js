/**
 * Détermination de la Configuration Optimale - ST-402
 * PHASE GREEN : Implémentation pour Tâche 4
 * 
 * Ce script analyse les résultats du benchmark pour déterminer
 * la configuration optimale de l'index vectoriel.
 * 
 * @story ST-402
 * @task Tâche 4 - Déterminer la configuration optimale
 */

const fs = require('fs');
const path = require('path');

// Chemins
const BENCHMARK_REPORT_PATH = path.join(__dirname, '../benchmark/vector-index-benchmark-report.json');
const ANALYSIS_REPORT_PATH = path.join(__dirname, '../analysis/vector-index-analysis-report.json');
const OPTIMAL_CONFIG_PATH = path.join(__dirname, 'optimal-vector-index-config.json');
const DECISION_LOG_PATH = path.join(__dirname, 'optimization-decision-log.md');

/**
 * Logger
 */
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Charger le rapport de benchmark
 */
function loadBenchmarkReport() {
  if (!fs.existsSync(BENCHMARK_REPORT_PATH)) {
    throw new Error(`Rapport de benchmark introuvable: ${BENCHMARK_REPORT_PATH}`);
  }
  const content = fs.readFileSync(BENCHMARK_REPORT_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Charger le rapport d'analyse
 */
function loadAnalysisReport() {
  if (!fs.existsSync(ANALYSIS_REPORT_PATH)) {
    log(`⚠️ Rapport d'analyse introuvable: ${ANALYSIS_REPORT_PATH}, utilisation de valeurs par défaut`);
    return {
      totalEmbeddings: 5000,
      estimatedFutureSize: 7500,
      vectorDimension: 384
    };
  }
  const content = fs.readFileSync(ANALYSIS_REPORT_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Analyser les résultats du benchmark
 */
function analyzeBenchmarkResults(benchmarkReport, analysisReport) {
  const { results, summary } = benchmarkReport;
  const { totalEmbeddings, estimatedFutureSize } = analysisReport;
  
  log('Analyse des résultats du benchmark...');
  log(`Taille actuelle: ${totalEmbeddings} embeddings`);
  log(`Estimation future: ${estimatedFutureSize} embeddings`);
  
  // 1. Filtrer les résultats réussis
  const successfulResults = results.filter(r => !r.error && r.statistics.failedQueries === 0);
  
  if (successfulResults.length === 0) {
    throw new Error('Aucun résultat de benchmark valide trouvé');
  }
  
  // 2. Calculer l'écart-type pour chaque configuration
  const resultsWithStdDev = successfulResults.map(r => {
    const times = r.results.map(rr => rr.time).filter(t => t !== null);
    const stdDev = calculateStandardDeviation(times);
    return { ...r, stdDev };
  });
  
  // 3. Évaluer chaque configuration selon différents critères
  const evaluations = resultsWithStdDev.map(r => {
    const { lists, statistics, stdDev } = r;
    const { avgTime, minTime, maxTime } = statistics;
    
    // Score de vitesse (plus rapide = meilleur)
    const speedScore = 100 - (avgTime / 50); // Normaliser pour < 3s
    
    // Score de stabilité (moins de variation = meilleur)
    const stabilityScore = 100 - (stdDev / 500); // Normaliser pour stdDev < 500ms
    
    // Score de sécurité (marge par rapport à 3s)
    const safetyMargin = 3000 - avgTime;
    const safetyScore = Math.min(100, Math.max(0, safetyMargin / 300));
    
    // Score composite (70% vitesse, 20% stabilité, 10% sécurité)
    const compositeScore = (speedScore * 0.7) + (stabilityScore * 0.2) + (safetyScore * 0.1);
    
    // Vérifier si respecte le critère < 3s
    const meetsCriteria = avgTime < 3000;
    
    // Recommandation basée sur la taille future
    let sizeRecommendation = '';
    if (estimatedFutureSize < 10000) {
      sizeRecommendation = '100-200 listes (dataset petit)';
    } else if (estimatedFutureSize < 100000) {
      sizeRecommendation = '200-400 listes (dataset moyen)';
    } else {
      sizeRecommendation = '400+ listes (dataset grand)';
    }
    
    return {
      lists,
      avgTime,
      minTime,
      maxTime,
      stdDev,
      speedScore,
      stabilityScore,
      safetyScore,
      compositeScore,
      meetsCriteria,
      sizeRecommendation
    };
  });
  
  // 4. Trier par score composite
  const sortedByComposite = [...evaluations].sort((a, b) => b.compositeScore - a.compositeScore);
  
  // 5. Déterminer la configuration optimale
  const optimalConfig = sortedByComposite[0];
  
  // 6. Générer des recommandations
  const recommendations = [];
  
  // Recommandation principale
  recommendations.push({
    type: 'optimale',
    configuration: optimalConfig.lists,
    avgTime: optimalConfig.avgTime,
    stdDev: optimalConfig.stdDev,
    compositeScore: optimalConfig.compositeScore,
    meetsCriteria: optimalConfig.meetsCriteria,
    justification: `Meilleur score composite (${optimalConfig.compositeScore.toFixed(2)})`
  });
  
  // Recommandation par vitesse pure
  const fastest = [...evaluations].sort((a, b) => a.avgTime - b.avgTime)[0];
  if (fastest.lists !== optimalConfig.lists) {
    recommendations.push({
      type: 'vitesse',
      configuration: fastest.lists,
      avgTime: fastest.avgTime,
      justification: 'Configuration la plus rapide'
    });
  }
  
  // Recommandation par stabilité
  const mostStable = [...evaluations].sort((a, b) => a.stdDev - b.stdDev)[0];
  if (mostStable.lists !== optimalConfig.lists) {
    recommendations.push({
      type: 'stabilité',
      configuration: mostStable.lists,
      stdDev: mostStable.stdDev,
      justification: 'Configuration la plus stable'
    });
  }
  
  // Recommandation basée sur la taille
  const sizeBased = getSizeBasedRecommendation(estimatedFutureSize);
  recommendations.push({
    type: 'taille',
    configuration: sizeBased,
    justification: `Recommandation basée sur la taille estimée (${estimatedFutureSize} embeddings)`
  });
  
  // Recommandation respectant le critère < 3s
  const criteriaCompliant = evaluations.find(e => e.meetsCriteria);
  if (criteriaCompliant) {
    recommendations.push({
      type: 'critère',
      configuration: criteriaCompliant.lists,
      avgTime: criteriaCompliant.avgTime,
      justification: 'Respecte le critère < 3s'
    });
  } else {
    log('⚠️ ATTENTION: Aucune configuration ne respecte le critère < 3s');
    recommendations.push({
      type: 'avertissement',
      message: 'Aucune configuration ne respecte le critère de performance (< 3s). Envisagez de réduire le nombre de listes ou d\'optimiser les requêtes.'
    });
  }
  
  return {
    analysisDate: new Date().toISOString(),
    totalEmbeddings,
    estimatedFutureSize,
    evaluations,
    optimalConfiguration: optimalConfig,
    recommendations,
    benchmarkSummary: summary
  };
}

/**
 * Obtenir une recommandation basée sur la taille
 */
function getSizeBasedRecommendation(size) {
  if (size < 1000) return 50;
  if (size < 10000) return 100;
  if (size < 50000) return 200;
  if (size < 100000) return 400;
  return 500;
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
 * Générer le log de décision en Markdown
 */
function generateDecisionLog(analysis) {
  const { analysisDate, totalEmbeddings, estimatedFutureSize, evaluations, optimalConfiguration, recommendations } = analysis;
  
  let log = `# Log de Décision d'Optimisation - ST-402\n\n`;
  log += `**Date:** ${analysisDate}\n\n`;
  log += `## Contexte\n\n`;
  log += `- **Taille actuelle:** ${totalEmbeddings} embeddings\n`;
  log += `- **Taille future estimée:** ${estimatedFutureSize} embeddings\n`;
  log += `- **Dimension vectorielle:** 384\n\n`;
  
  log += `## Résultats du Benchmark\n\n`;
  log += `| Lists | Temps Moyen (ms) | Temps Min (ms) | Temps Max (ms) | Écart-Type | Score Composite | Respecte < 3s |\n`;
  log += `|-------|------------------|----------------|----------------|------------|-----------------|---------------|\n`;
  
  for (const eval of evaluations) {
    log += `| ${eval.lists} | ${eval.avgTime.toFixed(2)} | ${eval.minTime} | ${eval.maxTime} | ${eval.stdDev.toFixed(2)} | ${eval.compositeScore.toFixed(2)} | ${eval.meetsCriteria ? '✅ Oui' : '❌ Non'} |\n`;
  }
  
  log += `\n## Configuration Optimale\n\n`;
  log += `**Choix:** lists = ${optimalConfiguration.lists}\n\n`;
  log += `**Justification:**\n`;
  log += `- Score composite le plus élevé: ${optimalConfiguration.compositeScore.toFixed(2)}\n`;
  log += `- Temps moyen: ${optimalConfiguration.avgTime.toFixed(2)} ms\n`;
  log += `- Écart-type: ${optimalConfiguration.stdDev.toFixed(2)}\n`;
  log += `- Respecte le critère < 3s: ${optimalConfiguration.meetsCriteria ? '✅ Oui' : '❌ Non'}\n\n`;
  
  log += `## Recommandations\n\n`;
  for (const rec of recommendations) {
    if (rec.type !== 'avertissement') {
      log += `### ${rec.type.toUpperCase()}\n`;
      log += `- **Configuration:** lists = ${rec.configuration}\n`;
      if (rec.avgTime) log += `- **Temps moyen:** ${rec.avgTime.toFixed(2)} ms\n`;
      if (rec.stdDev) log += `- **Écart-type:** ${rec.stdDev.toFixed(2)}\n`;
      if (rec.compositeScore) log += `- **Score composite:** ${rec.compositeScore.toFixed(2)}\n`;
      if (rec.meetsCriteria) log += `- **Respecte < 3s:** ${rec.meetsCriteria ? '✅ Oui' : '❌ Non'}\n`;
      log += `- **Justification:** ${rec.justification}\n\n`;
    } else {
      log += `### ⚠️ ${rec.type.toUpperCase()}\n`;
      log += `- ${rec.message}\n\n`;
    }
  }
  
  log += `---\n`;
  log += `*Généré par le script de détermination de configuration optimale - ST-402*\n`;
  
  return log;
}

/**
 * Sauvegarder les fichiers
 */
function saveFiles(analysis) {
  // Sauvegarder la configuration optimale (JSON)
  const config = {
    optimalConfiguration: {
      lists: analysis.optimalConfiguration.lists,
      avgTime: analysis.optimalConfiguration.avgTime,
      stdDev: analysis.optimalConfiguration.stdDev,
      meetsCriteria: analysis.optimalConfiguration.meetsCriteria
    },
    recommendations: analysis.recommendations,
    analysisDate: analysis.analysisDate
  };
  
  fs.writeFileSync(OPTIMAL_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  log(`✅ Configuration optimale sauvegardée: ${OPTIMAL_CONFIG_PATH}`);
  
  // Sauvegarder le log de décision (Markdown)
  const decisionLog = generateDecisionLog(analysis);
  fs.writeFileSync(DECISION_LOG_PATH, decisionLog, 'utf8');
  log(`✅ Log de décision sauvegardé: ${DECISION_LOG_PATH}`);
}

/**
 * Fonction principale
 */
async function determineOptimalConfiguration() {
  try {
    log('🔍 Détermination de la configuration optimale - ST-402');
    log('Tâche 4: Déterminer la configuration optimale');
    
    // Charger les rapports
    const benchmarkReport = loadBenchmarkReport();
    const analysisReport = loadAnalysisReport();
    
    // Analyser les résultats
    const analysis = analyzeBenchmarkResults(benchmarkReport, analysisReport);
    
    // Sauvegarder les fichiers
    saveFiles(analysis);
    
    log('\n✅ Analyse terminée avec succès !');
    log(`Configuration optimale: lists = ${analysis.optimalConfiguration.lists}`);
    log(`Temps moyen: ${analysis.optimalConfiguration.avgTime.toFixed(2)} ms`);
    log(`Respecte le critère < 3s: ${analysis.optimalConfiguration.meetsCriteria ? '✅ Oui' : '❌ Non'}`);
    
    return analysis;
    
  } catch (error) {
    log(`❌ ERREUR: ${error.message}`);
    throw error;
  }
}

// Exporter
module.exports = {
  determineOptimalConfiguration,
  loadBenchmarkReport,
  loadAnalysisReport,
  analyzeBenchmarkResults,
  generateDecisionLog,
  saveFiles,
  OPTIMAL_CONFIG_PATH,
  DECISION_LOG_PATH
};

// Exécution directe
if (require.main === module) {
  determineOptimalConfiguration()
    .then(analysis => {
      console.log('\n✅ Détermination de la configuration optimale terminée !');
      console.log(`Fichiers générés: ${OPTIMAL_CONFIG_PATH}, ${DECISION_LOG_PATH}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERREUR:', error.message);
      process.exit(1);
    });
}
