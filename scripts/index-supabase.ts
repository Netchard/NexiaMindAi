#!/usr/bin/env ts-node
/**
 * Script CLI pour l'indexation des fichiers Supabase Storage
 * Fait partie de ST-201 - Integrer Supabase Storage
 * 
 * Usage:
 *   npx ts-node scripts/index-supabase.ts [options]
 * 
 * Options:
 *   --prefix=<path>       Prefix du bucket a indexer
 *   --client=<name>       Client specifique
 *   --type=<type>         Type de document
 *   --dry-run            Mode test (ne pas sauvegarder)
 *   --limit=<n>           Limite de fichiers a traiter
 *   --bucket=<name>       Nom du bucket (par defaut: documents)
 *   --help, -h            Afficher cette aide
 */

import 'dotenv/config';
import { logger } from '../src/lib/logger';
import { storageIndexer, SupabaseStorageIndexer } from '../src/lib/supabase/storage/indexer';
import { IndexationOptions } from '../src/lib/supabase/storage/types';

/**
 * Parse les arguments de la ligne de commande
 * @returns Objet avec les options
 */
function parseArgs(): {
  prefix: string | undefined;
  client: string | undefined;
  type: string | undefined;
  documentType: string | undefined;
  dryRun: boolean;
  limit: number | undefined;
  bucket: string;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const options: {
    prefix: string | undefined;
    client: string | undefined;
    type: string | undefined;
    documentType: string | undefined;
    dryRun: boolean;
    limit: number | undefined;
    bucket: string;
    help: boolean;
  } = {
    prefix: undefined,
    client: undefined,
    type: undefined,
    documentType: undefined,
    dryRun: false,
    limit: undefined,
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
        console.error(`Erreur: La limite doit etre un nombre positif: ${limitStr}`);
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
function showHelp(): void {
  console.log(`
Usage: npx ts-node scripts/index-supabase.ts [options]

Options:
  --prefix=<path>       Prefix du bucket a indexer
                         Exemple: --prefix=clients/nexia
  
  --client=<name>       Client specifique pour les metadonnees
                         Exemple: --client=nexia
  
  --type=<type>         Type de document pour les metadonnees
  --documentType=<type> (alias de --type)
                         Exemple: --type=contract
  
  --dry-run            Mode test - ne pas sauvegarder en base
                         Utile pour tester l'extraction sans modifier la base
  
  --limit=<n>           Limite de fichiers a traiter
                         Exemple: --limit=10 (pour tester avec 10 fichiers)
  
  --bucket=<name>       Nom du bucket a indexer
                         Par defaut: documents
                         Exemple: --bucket=contracts
  
  --help, -h            Afficher cette aide

Exemples:
  # Indexation complete du bucket documents
  npx ts-node scripts/index-supabase.ts

  # Indexation des contrats Nexia
  npx ts-node scripts/index-supabase.ts --prefix=clients/nexia --client=nexia --type=contract

  # Test avec 5 fichiers maximum
  npx ts-node scripts/index-supabase.ts --limit=5 --dry-run

  # Indexation d'un bucket different
  npx ts-node scripts/index-supabase.ts --bucket=contracts --type=legal
`);
}

/**
 * Fonction principale
 */
async function main(): Promise<void> {
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
    console.log(`  Limite:      ${options.limit || '(illimitee)'}`);

    // Si un bucket different est specifie, creer une nouvelle instance
    const indexer = options.bucket !== 'documents'
      ? new SupabaseStorageIndexer(options.bucket)
      : storageIndexer;

    logger.info(`\nDebut de l'indexation...`);

    // Appeler l'indexation
    const indexationOptions: IndexationOptions = {
      prefix: options.prefix,
      client: options.client,
      documentType: options.documentType,
      dryRun: options.dryRun,
      limit: options.limit,
    };

    const result = await indexer.indexAll(indexationOptions);

    // Afficher le rapport
    console.log('\n' + '='.repeat(60));
    console.log('Rapport d\'indexation');
    console.log('='.repeat(60));
    console.log(`Fichiers traites:     ${result.processed}`);
    console.log(`  -> Reussis:          ${result.succeeded}`);
    console.log(`  -> Echoues:          ${result.failed}`);
    console.log(`Chunks crees:        ${result.chunksCreated}`);
    console.log(`Embeddings generes:  ${result.embeddingsGenerated}`);

    if (result.errors.length > 0) {
      console.log(`\nErreurs (${result.errors.length}):`);
      result.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.file}`);
        console.log(`     -> ${err.error}`);
      });
    }

    // Mode dry-run
    if (options.dryRun) {
      console.log('\n[DRY RUN] Aucune modification n\'a ete apportee a la base de donnees');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Indexation terminee');
    console.log('='.repeat(60));

    // Terminer avec le bon code de sortie
    process.exit(result.failed > 0 ? 1 : 0);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error('Echec du script d\'indexation', {
      error: err?.message,
      stack: err?.stack,
    });
    console.error('\n' + '='.repeat(60));
    console.error('ERREUR');
    console.error('='.repeat(60));
    console.error(`Message: ${err?.message ?? String(error)}`);
    console.error(`Stack: ${err?.stack ?? ''}`);
    process.exit(1);
  }
}

// Demarrer le script
main().catch((error) => {
  console.error('Erreur non capturee:', error);
  process.exit(1);
});
