/**
 * Analyse de l'Index Vectoriel pour ST-402
 * PHASE GREEN : Implémentation minimale pour faire passer les tests
 * 
 * Ce script se connecte à Supabase avec les permissions admin (service role key)
 * pour analyser la table embeddings et son index vectoriel.
 * 
 * @story ST-402
 * @task Tâche 1 - Analyser la charge de données actuelle
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env
require('dotenv').config();

// Chemins des fichiers de sortie
const REPORT_PATH = path.join(__dirname, 'vector-index-analysis-report.json');
const LOG_PATH = path.join(__dirname, 'vector-index-analysis.log');

// Logger simple avec protection des E/S et masquage des données sensibles
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage, data || '');
  
  // Écrire dans le fichier de log avec protection try/catch
  try {
    // Masquer les données sensibles (URL, clés)
    const safeMessage = logMessage.replace(/https?:\/\/[^\s]+/g, '[URL_MASKED]');
    const safeData = data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)) : '';
    const logContent = `${safeMessage}\n${safeData}\n`;
    fs.appendFileSync(LOG_PATH, logContent, 'utf8');
  } catch (logError) {
    // Ne pas faire crash le script si le log échoue
    console.error('[LOG ERROR]', logError.message);
  }
}

/**
 * Initialise le client Supabase Admin
 * @returns {Object} Client Supabase avec service role key
 */
function initAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    const error = new Error('[ANALYSE-VECTOR] SUPABASE_URL non défini dans les variables d\'environnement. Veuillez créer un fichier .env avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    log('ERREUR: ' + error.message);
    throw error;
  }

  if (!supabaseServiceKey) {
    const error = new Error('[ANALYSE-VECTOR] SUPABASE_SERVICE_ROLE_KEY non défini dans les variables d\'environnement. Veuillez créer un fichier .env avec SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY');
    log('ERREUR: ' + error.message);
    throw error;
  }

  log('Initialisation du client Supabase Admin', {
    timestamp: new Date().toISOString()
  });

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Analyse la table embeddings et son index vectoriel
 * @param {Object} client - Client Supabase
 * @returns {Promise<Object>} Rapport d'analyse
 */
async function analyzeEmbeddingsTable(client) {
  log('Analyse de la table embeddings...');

  const report = {
    tableName: 'public.embeddings',
    analysisDate: new Date().toISOString(),
    totalEmbeddings: 0,
    vectorDimension: null,
    dimensionValid: false,
    currentIndex: null,
    estimatedFutureSize: 0,
    tableExists: false,
    vectorColumnExists: false
  };

  try {
    // 0. Vérifier que la table existe et est accessible
    log('Vérification de l\'existence de la table...');
    const { data: tableCheck, error: tableCheckError } = await client
      .from('embeddings')
      .select('*')
      .limit(1);

    if (tableCheckError) {
      log('ERREUR: Impossible d\'accéder à la table embeddings:', tableCheckError.message);
      throw new Error(`Impossible d'accéder à la table embeddings: ${tableCheckError.message}`);
    }
    
    report.tableExists = true;
    log('✅ Table embeddings accessible');

    // 1. Détecter la dimension du vecteur (MÉTHODE UNIQUE FIABLE)
    //    On utilise une requête directe sur embeddings avec LIMIT 1
    //    C'est la SEULE méthode qui fonctionne avec PostgREST
    //    NOTE: information_schema et pg_indexes ne sont PAS exposés par PostgREST
    log('Détection de la dimension du vecteur...');
    const { data: sampleData, error: sampleError } = await client
      .from('embeddings')
      .select('vector')
      .limit(1);

    if (sampleError) {
      log('ERREUR: Impossible de récupérer un échantillon:', sampleError.message);
      throw new Error(`Impossible de détecter la dimension: ${sampleError.message}`);
    }

    if (!sampleData || sampleData.length === 0) {
      log('ERREUR: Aucune donnée dans la table embeddings');
      throw new Error('La table embeddings est vide. Impossible de détecter la dimension.');
    }

    const firstRow = sampleData[0];
    
    // Vérifier que la colonne vector existe
    if (!firstRow || !firstRow.vector) {
      report.vectorColumnExists = false;
      log('ERREUR: Colonne "vector" non trouvée dans la table embeddings');
      throw new Error('Colonne "vector" non trouvée. La structure de la table a peut-être changé.');
    }
    
    report.vectorColumnExists = true;

    // Détecter la dimension
    const vector = firstRow.vector;
    let detectedDimension = null;
    
    if (Array.isArray(vector)) {
      detectedDimension = vector.length;
      log(`Dimension du vecteur détectée (Array): ${detectedDimension}`);
    } else if (vector && typeof vector === 'object') {
      // vector pourrait être un objet avec des propriétés numérotées (format pgvector)
      const keys = Object.keys(vector);
      // Vérifier si les clés sont des indices numériques
      const numericKeys = keys.filter(k => !isNaN(parseInt(k)));
      if (numericKeys.length > 0) {
        detectedDimension = numericKeys.length;
        log(`Dimension du vecteur détectée (Object): ${detectedDimension} (clés: ${numericKeys.length})`);
      }
    }

    if (detectedDimension === null) {
      log('ERREUR: Impossible de déterminer la dimension du vecteur. Format inconnu:', typeof vector, vector);
      throw new Error(`Format de vecteur inconnu: ${typeof vector}. Attendu: Array ou Object avec clés numériques.`);
    }

    report.vectorDimension = detectedDimension;
    report.dimensionValid = validateDimension(detectedDimension);
    
    if (!report.dimensionValid) {
      log(`⚠️ ATTENTION: Dimension détectée (${detectedDimension}) ne correspond PAS à la dimension attendue (384)`);
      log('Ceci est une VIOLATION CRITIQUE de la contrainte ST-401!');
      log('La dimension DOIT être 384. Vérifiez votre configuration de base de données.');
    } else {
      log(`✅ Dimension valide: ${detectedDimension}`);
    }

    // 2. Compter le nombre total d'embeddings
    log('Comptage du nombre total d\'embeddings...');
    const { count, error: countError } = await client
      .from('embeddings')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      log('ERREUR lors du comptage:', countError.message);
      throw countError;
    }

    // Vérifier que count est un nombre (G2-M-002)
    if (typeof count !== 'number' || isNaN(count)) {
      log('ERREUR: Le comptage a retourné une valeur non numérique:', count);
      throw new Error(`Comptage invalide: attendu number, obtenu ${typeof count}`);
    }

    report.totalEmbeddings = count;
    log(`Nombre total d'embeddings: ${count}`);

    // 3. Estimer la taille future
    // D'après l'architecture, on a des sources multiples : Supabase Storage, GitLab, Nexia GED
    // On va estimer en fonction de la taille actuelle
    const currentSize = report.totalEmbeddings;
    
    // Estimation conservative : croissance de 50% dans les 6 prochains mois
    report.estimatedFutureSize = Math.ceil(currentSize * 1.5);
    
    // Si on a très peu de données, estimer au moins 10K pour les tests de performance
    if (report.estimatedFutureSize < 10000) {
      report.estimatedFutureSize = 10000;
    }
    
    log(`Taille actuelle: ${currentSize}, Estimation future: ${report.estimatedFutureSize}`);

    // 4. Note sur l'index: 
    //    On ne peut PAS accéder à pg_indexes via PostgREST (schéma non exposé)
    //    L'information sur l'index sera obtenue via la migration SQL (Groupe 1)
    //    qui a accès direct à PostgreSQL
    log('Note: Les informations sur l\'index seront récupérées via les scripts SQL (Groupe 1)');
    log('PostgREST ne permet pas d\'accéder à pg_indexes/information_schema');

    return report;

  } catch (error) {
    log('ERREUR lors de l\'analyse:', error.message);
    throw error;
  }
}

/**
 * Valide que la dimension détectée correspond à la dimension attendue (384)
 * Cette validation est CRITIQUE pour éviter une récidive de ST-401
 * où la dimension était incorrectement définie à 8 au lieu de 384.
 * 
 * @param {number} detectedDimension - Dimension détectée
 * @returns {boolean} true si la dimension est valide (384), false sinon
 */
function validateDimension(detectedDimension) {
  // La contrainte architecturale de ST-401: la dimension DOIT être 384
  // Ne PAS utiliser de fallback silencieux - échouer explicitement si non-384
  return detectedDimension === 384;
}

/**
 * Extrait le paramètre 'lists' de la définition de l'index
 * @param {string} indexDef - Définition de l'index
 * @returns {number|null} Nombre de listes ou null
 */
function extractListsFromIndexDef(indexDef) {
  if (!indexDef) return null;
  
  const match = indexDef.match(/WITH\s*\([^)]*lists\s*=\s*(\d+)[^)]*\)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Sauvegarde le rapport d'analyse
 * @param {Object} report - Rapport d'analyse
 */
function saveReport(report) {
  try {
    const content = JSON.stringify(report, null, 2);
    fs.writeFileSync(REPORT_PATH, content, 'utf8');
    log(`Rapport sauvegardé: ${REPORT_PATH}`);
  } catch (error) {
    log('ERREUR lors de la sauvegarde du rapport:', error.message);
    throw error;
  }
}

/**
 * Initialise les fichiers de log
 */
function initLogs() {
  try {
    const timestamp = new Date().toISOString();
    const header = `
========================================
Analyse de l'Index Vectoriel - ST-402
Date: ${timestamp}
========================================

`;
    fs.writeFileSync(LOG_PATH, header, 'utf8');
    log('Début de l\'analyse de l\'index vectoriel');
  } catch (error) {
    console.error('[INIT LOGS ERROR]', error.message);
    // Ne pas faire crash le script si l'initialisation des logs échoue
  }
}

/**
 * Fonction principale d'analyse
 * @returns {Promise<Object>} Rapport d'analyse
 */
async function analyzeVectorIndex() {
  try {
    // Initialiser les logs
    initLogs();
    
    log('🔍 Démarrage de l\'analyse pour ST-402: Optimiser l\'Index Vectoriel');
    log('Tâche 1: Analyser la charge de données actuelle');

    // Initialiser le client
    const client = initAdminClient();

    // Exécuter l'analyse
    const report = await analyzeEmbeddingsTable(client);

    // Sauvegarder le rapport
    saveReport(report);

    log('✅ Analyse terminée avec succès');
    log('Rapport généré:', report);

    return report;

  } catch (error) {
    log('❌ ERREUR fatale:', error.message);
    log('Stack:', error.stack);
    throw error;
  }
}

// Exporter la fonction principale
module.exports = {
  analyzeVectorIndex,
  initAdminClient,
  analyzeEmbeddingsTable,
  extractListsFromIndexDef,
  validateDimension,
  saveReport,
  initLogs,
  REPORT_PATH,
  LOG_PATH
};

// Permettre l'exécution directe
if (require.main === module) {
  analyzeVectorIndex()
    .then(report => {
      console.log('\n✅ Analyse terminée avec succès !');
      console.log(`Rapport sauvegardé: ${REPORT_PATH}`);
      console.log(`Log sauvegardé: ${LOG_PATH}`);
      console.log('\nRésumé:');
      console.log(`- Total embeddings: ${report.totalEmbeddings}`);
      console.log(`- Dimension: ${report.vectorDimension} (valide: ${report.dimensionValid})`);
      console.log(`- Index actuel: ${report.currentIndex ? report.currentIndex.indexName : 'Non trouvé'}`);
      console.log(`- Lists: ${report.currentIndex ? report.currentIndex.lists : 'N/A'}`);
      console.log(`- Estimation future: ${report.estimatedFutureSize}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ ERREUR:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}
