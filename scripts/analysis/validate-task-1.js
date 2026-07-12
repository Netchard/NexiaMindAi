/**
 * Script de validation pour la Tâche 1 - ST-402
 * Valide que le rapport et le log ont été générés correctement
 * 
 * Ce script peut être exécuté sans dépendances externes (sauf Node.js)
 * 
 * @story ST-402
 * @task Tâche 1 - Analyser la charge de données actuelle
 */

const fs = require('fs');
const path = require('path');

const REPORT_PATH = path.join(__dirname, 'vector-index-analysis-report.json');
const LOG_PATH = path.join(__dirname, 'vector-index-analysis.log');
const SCRIPT_PATH = path.join(__dirname, 'analyze-vector-index.js');
const MOCK_SCRIPT_PATH = path.join(__dirname, 'analyze-vector-index.mock.js');
const GREEN_TEST_PATH = path.join(__dirname, 'analyze-vector-index.green.test.js');
const RED_TEST_PATH = path.join(__dirname, 'analyze-vector-index.test.js');

/**
 * Couleurs pour l'affichage
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Affiche un message avec couleur
 */
function print(message, color = 'reset') {
  console.log(`${colors[color] || ''}${message}${colors.reset || ''}`);
}

/**
 * Affiche un résultat de test
 */
function assert(condition, message, details = '') {
  if (condition) {
    print(`✅ ${message}`, 'green');
    if (details) print(`   ${details}`, 'cyan');
    return true;
  } else {
    print(`❌ ${message}`, 'red');
    if (details) print(`   ${details}`, 'yellow');
    return false;
  }
}

/**
 * Valide la structure du rapport JSON
 */
function validateReportStructure() {
  print('\n📋 Validation de la structure du rapport...', 'blue');
  
  if (!fs.existsSync(REPORT_PATH)) {
    print('❌ Fichier de rapport introuvable', 'red');
    return false;
  }

  let allPassed = true;
  
  try {
    const content = fs.readFileSync(REPORT_PATH, 'utf8');
    const report = JSON.parse(content);
    
    // Vérifier les propriétés requises
    allPassed &= assert(
      report.tableName === 'public.embeddings',
      'tableName = public.embeddings'
    );
    
    allPassed &= assert(
      report.analysisDate && new Date(report.analysisDate).getTime(),
      'analysisDate est une date valide',
      report.analysisDate
    );
    
    allPassed &= assert(
      typeof report.totalEmbeddings === 'number' && report.totalEmbeddings >= 0,
      'totalEmbeddings est un nombre ≥ 0',
      `Valeur: ${report.totalEmbeddings}`
    );
    
    allPassed &= assert(
      report.vectorDimension === 384,
      'vectorDimension = 384'
    );
    
    allPassed &= assert(
      report.dimensionValid === true,
      'dimensionValid = true'
    );
    
    allPassed &= assert(
      report.currentIndex && report.currentIndex.indexType === 'ivfflat',
      'currentIndex.indexType = ivfflat'
    );
    
    allPassed &= assert(
      report.currentIndex && typeof report.currentIndex.lists === 'number',
      'currentIndex.lists est un nombre',
      `Valeur: ${report.currentIndex.lists}`
    );
    
    allPassed &= assert(
      typeof report.estimatedFutureSize === 'number' && report.estimatedFutureSize > 0,
      'estimatedFutureSize est un nombre > 0',
      `Valeur: ${report.estimatedFutureSize}`
    );
    
    allPassed &= assert(
      Array.isArray(report.tableStructure) && report.tableStructure.length > 0,
      'tableStructure est un array non vide',
      `Nombre de colonnes: ${report.tableStructure.length}`
    );
    
    return allPassed;
  } catch (error) {
    print(`❌ Erreur lors de la validation du rapport: ${error.message}`, 'red');
    return false;
  }
}

/**
 * Valide le log
 */
function validateLog() {
  print('\n📝 Validation du log...', 'blue');
  
  if (!fs.existsSync(LOG_PATH)) {
    print('❌ Fichier de log introuvable', 'red');
    return false;
  }

  const content = fs.readFileSync(LOG_PATH, 'utf8');
  
  let allPassed = true;
  
  allPassed &= assert(
    content.length > 0,
    'Log n\'est pas vide',
    `Taille: ${content.length} octets`
  );
  
  allPassed &= assert(
    content.includes('Analyse de l\'Index Vectoriel'),
    'Log contient le titre de l\'analyse'
  );
  
  allPassed &= assert(
    content.includes('ST-402'),
    'Log contient la référence à ST-402'
  );
  
  allPassed &= assert(
    content.includes('Démarrage de l\'analyse'),
    'Log contient le message de démarrage'
  );
  
  allPassed &= assert(
    content.includes('Analyse terminée avec succès'),
    'Log contient le message de succès'
  );
  
  // Vérifier la présence d'un timestamp
  allPassed &= assert(
    content.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
    'Log contient des timestamps au format ISO'
  );
  
  return allPassed;
}

/**
 * Valide les fichiers du script
 */
function validateScripts() {
  print('\n📁 Validation des fichiers du script...', 'blue');
  
  let allPassed = true;
  
  allPassed &= assert(
    fs.existsSync(SCRIPT_PATH),
    'Script principal existe',
    'analyze-vector-index.js'
  );
  
  allPassed &= assert(
    fs.existsSync(MOCK_SCRIPT_PATH),
    'Script MOCK existe',
    'analyze-vector-index.mock.js'
  );
  
  allPassed &= assert(
    fs.existsSync(RED_TEST_PATH),
    'Tests RED existent',
    'analyze-vector-index.test.js'
  );
  
  allPassed &= assert(
    fs.existsSync(GREEN_TEST_PATH),
    'Tests GREEN existent',
    'analyze-vector-index.green.test.js'
  );
  
  allPassed &= assert(
    fs.existsSync(path.join(__dirname, 'package.json')),
    'package.json existe'
  );
  
  return allPassed;
}

/**
 * Valide les Critères d'Acceptation
 */
function validateAcceptanceCriteria() {
  print('\n✅ Validation des Critères d\'Acceptation (Tâche 1)...', 'blue');
  
  if (!fs.existsSync(REPORT_PATH)) {
    print('❌ Rapport introuvable - impossible de valider les AC', 'red');
    return false;
  }
  
  const content = fs.readFileSync(REPORT_PATH, 'utf8');
  const report = JSON.parse(content);
  
  let allPassed = true;
  
  // AC #1: Index IVFFlat configuré avec le bon nombre de listes
  print('\n   📌 AC #1: Index IVFFlat configuré', 'cyan');
  allPassed &= assert(
    report.currentIndex && report.currentIndex.indexType === 'ivfflat',
    '   Type d\'index est ivfflat'
  );
  allPassed &= assert(
    report.currentIndex && report.currentIndex.lists === 100,
    '   Nombre de listes détecté (100)',
    `   Valeur actuelle: ${report.currentIndex.lists}`
  );
  
  // AC #2: Test de performance avec différents paramètres
  print('\n   📌 AC #2: Préparation pour les tests de benchmark', 'cyan');
  allPassed &= assert(
    typeof report.totalEmbeddings === 'number',
    '   Nombre total d\'embeddings disponible'
  );
  allPassed &= assert(
    typeof report.estimatedFutureSize === 'number',
    '   Estimation de taille future disponible'
  );
  
  // AC #3: Temps de réponse < 3s
  print('\n   📌 AC #3: Préparation pour les tests de performance', 'cyan');
  allPassed &= assert(
    report.currentIndex !== null,
    '   Configuration de l\'index documentée'
  );
  
  // AC #4: Documentation des choix d'optimisation
  print('\n   📌 AC #4: Documentation générée', 'cyan');
  allPassed &= assert(
    fs.existsSync(REPORT_PATH),
    '   Rapport JSON généré'
  );
  allPassed &= assert(
    fs.existsSync(LOG_PATH),
    '   Log d\'exécution généré'
  );
  allPassed &= assert(
    report.dimensionValid === true && report.vectorDimension === 384,
    '   Dimension validée (384)'
  );
  
  return allPassed;
}

/**
 * Fonction principale
 */
function main() {
  print('\n═══════════════════════════════════════════════════════════', 'magenta');
  print('  ST-402: Tâche 1 - Validation de l\'Analyse de la Charge', 'magenta');
  print('═══════════════════════════════════════════════════════════\n', 'magenta');

  const results = {
    scripts: validateScripts(),
    report: validateReportStructure(),
    log: validateLog(),
    acceptanceCriteria: validateAcceptanceCriteria()
  };

  print('\n═══════════════════════════════════════════════════════════', 'magenta');
  print('  RÉSULTATS DE VALIDATION', 'magenta');
  print('═══════════════════════════════════════════════════════════\n', 'magenta');

  const allPassed = Object.values(results).every(r => r);
  
  print(`Scripts:     ${results.scripts ? '✅ PASS' : '❌ FAIL'}`, results.scripts ? 'green' : 'red');
  print(`Rapport:     ${results.report ? '✅ PASS' : '❌ FAIL'}`, results.report ? 'green' : 'red');
  print(`Log:         ${results.log ? '✅ PASS' : '❌ FAIL'}`, results.log ? 'green' : 'red');
  print(`AC Tâche 1: ${results.acceptanceCriteria ? '✅ PASS' : '❌ FAIL'}`, results.acceptanceCriteria ? 'green' : 'red');

  print('\n═══════════════════════════════════════════════════════════\n', 'magenta');

  if (allPassed) {
    print('🎉 TOUS LES TESTS DE LA TÂCHE 1 ONT RÉUSSI !', 'green');
    print('\nLa Tâche 1 peut être marquée comme COMPLÈTE', 'green');
    process.exit(0);
  } else {
    print('❌ CERTAINS TESTS ONT ÉCHOUÉ', 'red');
    print('\nCorrigez les problèmes avant de marquer la tâche comme complète', 'yellow');
    process.exit(1);
  }
}

// Exécuter
main();
