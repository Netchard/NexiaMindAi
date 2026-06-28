#!/usr/bin/env node
/**
 * Script CLI pour l'indexation des fichiers Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 * 
 * Usage:
 *   node scripts/index-supabase.js [options]
 * 
 * Options:
 *   --prefix=<path>       Prefix du bucket à indexer
 *   --client=<name>       Client spécifique
 *   --type=<type>         Type de document
 *   --dry-run            Mode test (ne pas sauvegarder)
 *   --limit=<n>           Limite de fichiers à traiter
 *   --bucket=<name>       Nom du bucket (par défaut: documents)
 *   --help, -h            Afficher cette aide
 */

// Charger les dépendances - note: chemin relatif depuis la racine du projet
const { logger } = require('./src/lib/logger');
const { storageIndexer, SupabaseStorageIndexer } = require('./src/lib/supabase/storage/indexer');

/**
 * Parse les arguments de la ligne de commande
 * @returns Objet avec les options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    prefix: null,
    client: null,
    type: null,
    documentType: null,
    dryRun: false,
    limit: null,
    bucket: 'documents',
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      break;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg.startsWith('--prefix=')) {
      options.prefix = arg.substring('--prefix='.length);
      continue;
    }

    if (arg.startsWith('--client=')) {
      options.client = arg.substring('--client='.length);
      continue;
    }

    if (arg.startsWith('--type=')) {
      options.type = arg.substring('--type='.length);
      options.documentType = options.type; // Alias
      continue;
    }

    if (arg.startsWith('--documentType=')) {
      options.documentType = arg.substring('--documentType='.length);
      continue;
    }

    if (arg.startsWith('--limit=')) {
      const limitStr = arg.substring('--limit='.length);
      options.limit = parseInt(limitStr, 10);
      if (isNaN(options.limit) || options.limit <= 0) {
        console.error(`Erreur: La limite doit être un nombre positif: ${limitStr}`);
        process.exit(1);
      }
      continue;
    }

    if (arg.startsWith('--bucket=')) {
      options.bucket = arg.substring('--bucket='.length);
      continue;
    }

    // Option inconnue
    console.error(`Option inconnue: ${arg}`);
    console.error('Utiliser --help pour afficher les options disponibles');
    process.exit(1);
  }

  return options;
}

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log(`
Usage: node scripts/index-supabase.js [options]

Options:
  --prefix=<path>       Prefix du bucket à indexer
                         Exemple: --prefix=clients/nexia
  
  --client=<name>       Client spécifique pour les métadonnées
                         Exemple: --client=nexia
  
  --type=<type>         Type de document pour les métadonnées
  --documentType=<type> (alias de --type)
                         Exemple: --type=contract
  
  --dry-run            Mode test - ne pas sauvegarder en base
                         Utile pour tester l'extraction sans modifier la base
  
  --limit=<n>           Limite de fichiers à traiter
                         Exemple: --limit=10 (pour tester avec 10 fichiers)
  
  --bucket=<name>       Nom du bucket à indexer
                         Par défaut: documents
                         Exemple: --bucket=contracts
  
  --help, -h            Afficher cette aide

Exemples:
  # Indexation complète du bucket documents
  node scripts/index-supabase.js

  # Indexation des contrats Nexia
  node scripts/index-supabase.js --prefix=clients/nexia --client=nexia --type=contract

  # Test avec 5 fichiers maximum
  node scripts/index-supabase.js --limit=5 --dry-run

  # Indexation d'un bucket différent
  node scripts/index-supabase.js --bucket=contracts --type=legal
`);
}

/**
 * Fonction principale
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  try {
    // Initialiser le logger pour la console
    logger.info('='.repeat(60));
    logger.info('Script d\'indexation Supabase Storage');
    logger.info('='.repeat(60));

    // Afficher les options
    console.log('\nOptions de l\'indexation:');
    console.log(`  Bucket:      ${options.bucket}`);
    console.log(`  Prefix:      ${options.prefix || '(aucun)'}`);
    console.log(`  Client:      ${options.client || '(aucun)'}`);
    console.log(`  Type:        ${options.documentType || '(aucun)'}`);
    console.log(`  Dry Run:     ${options.dryRun ? 'OUI' : 'NON'}`);
    console.log(`  Limite:      ${options.limit || '(illimitée)'}`);

    // Si un bucket différent est spécifié, créer une nouvelle instance
    const indexer = options.bucket !== 'documents'
      ? new SupabaseStorageIndexer(options.bucket)
      : storageIndexer;

    logger.info(`\nDébut de l'indexation...`);

    // Appeler l'indexation
    const result = await indexer.indexAll({
      prefix: options.prefix,
      client: options.client,
      documentType: options.documentType,
      dryRun: options.dryRun,
      limit: options.limit,
    });

    // Afficher le rapport
    console.log('\n' + '='.repeat(60));
    console.log('Rapport d\'indexation');
    console.log('='.repeat(60));
    console.log(`Fichiers traités:     ${result.processed}`);
    console.log(`  → Réussis:          ${result.succeeded}`);
    console.log(`  → Échoués:          ${result.failed}`);
    console.log(`Chunks créés:        ${result.chunksCreated}`);
    console.log(`Embeddings générés:  ${result.embeddingsGenerated}`);

    if (result.errors.length > 0) {
      console.log(`\nErreurs (${result.errors.length}):`);
      result.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.file}`);
        console.log(`     → ${err.error}`);
      });
    }

    // Mode dry-run
    if (options.dryRun) {
      console.log('\n[DRY RUN] Aucune modification n\'a été apportée à la base de données');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Indexation terminée');
    console.log('='.repeat(60));

    // Terminer avec le bon code de sortie
    process.exit(result.failed > 0 ? 1 : 0);

  } catch (error: any) {
    logger.error('Échec du script d\'indexation', {
      error: error.message,
      stack: error.stack,
    });
    console.error('\n' + '='.repeat(60));
    console.error('ERREUR');
    console.error('='.repeat(60));
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Démarrer le script
main();
