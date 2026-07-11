#!/usr/bin/env ts-node
/**
 * Script de test manuel pour PDF avec ST-201
 * Ce script permet de tester l'extraction de texte depuis un vrai PDF local
 * 
 * Usage:
 *   npx ts-node scripts/test-pdf-manual.ts --path=./test-data/sample.pdf
 *   OU: npx ts-node scripts/test-pdf-manual.ts --path="C:/chemin/vers/votre.pdf"
 *   OU: npx ts-node scripts/test-pdf-manual.ts (utilise le PDF par défaut)
 * 
 * Options:
 *   --path=<chemin>     Chemin vers le fichier PDF à tester
 *   --help, -h          Afficher cette aide
 */

import 'dotenv/config';
import { OCRService, ocrService } from '../src/lib/supabase/storage/ocr';
import { SupabaseStorageIndexer } from '../src/lib/supabase/storage/indexer';
import { logger } from '../src/lib/logger';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

/**
 * Parse les arguments de la ligne de commande
 */
function parseArgs(): { path: string; help: boolean } {
  const args = process.argv.slice(2);
  const options = {
    path: './test-data/sample.pdf', // Chemin par défaut
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      break;
    }

    if (arg.startsWith('--path=')) {
      options.path = arg.substring('--path='.length);
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
Usage: npx ts-node scripts/test-pdf-manual.ts [options]

Options:
  --path=<chemin>     Chemin vers le fichier PDF a tester
                     Par defaut: ./test-data/sample.pdf
                     Exemple: --path=./documents/mon-fichier.pdf
                     Exemple: --path="C:/Users/name/Documents/test.pdf"
  
  --help, -h          Afficher cette aide

Exemples:
  # Tester avec le PDF par defaut
  npx ts-node scripts/test-pdf-manual.ts

  # Tester avec un PDF specifique
  npx ts-node scripts/test-pdf-manual.ts --path=./mon-document.pdf

  # Tester avec un PDF avec chemin absolu
  npx ts-node scripts/test-pdf-manual.ts --path="C:/chemin/vers/le/fichier.pdf"
`);
}

/**
 * Teste l'extraction de texte depuis un PDF
 */
async function testPdfExtraction(pdfPath: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('Test d\'extraction de texte depuis PDF');
  console.log('='.repeat(60));

  // Vérifier que le fichier existe
  if (!existsSync(pdfPath)) {
    console.error(`\n❌ Fichier non trouvé: ${pdfPath}`);
    console.error('💡 Vérifiez que le chemin est correct et que le fichier existe.');
    console.error('   Vous pouvez utiliser un chemin absolu ou relatif.');
    process.exit(1);
  }

  console.log(`\n✅ Fichier trouvé: ${pdfPath}`);

  // Lire le fichier
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = readFileSync(pdfPath);
    console.log(`📊 Taille du fichier: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`📊 Taille en octets: ${pdfBuffer.length}`);
  } catch (error: any) {
    console.error(`\n❌ Erreur de lecture du fichier: ${error.message}`);
    process.exit(1);
  }

  // Créer le service OCR
  const service = new OCRService();

  // Extraire le texte
  console.log('\n🔄 Extraction du texte...');
  let startTime = Date.now();

  try {
    const result = await service.extractText(pdfBuffer, pdfPath);

    const processingTime = Date.now() - startTime;

    console.log(`\n✅ Extraction réussie en ${processingTime}ms`);
    console.log('─'.repeat(60));
    console.log(`📝 Type de contenu: ${result.contentType}`);
    console.log(`📄 Nombre de pages: ${result.pageCount}`);
    console.log(`📊 Longueur du texte: ${result.text.length} caractères`);
    console.log(`📦 Taille estimée: ${(Buffer.byteLength(result.text, 'utf-8') / 1024).toFixed(2)} KB`);

    // Afficher un extrait du texte
    if (result.text.length > 0) {
      const previewLength = Math.min(500, result.text.length);
      console.log('\n📝 Aperçu du texte extrait (premiers ' + previewLength + ' caractères):');
      console.log('─'.repeat(60));
      console.log(result.text.substring(0, previewLength) + (result.text.length > previewLength ? '...' : ''));
      console.log('─'.repeat(60));
    } else {
      console.log('\n⚠️  Aucun texte extrait du PDF.');
      console.log('   Cela peut indiquer:');
      console.log('   - Le PDF ne contient pas de texte (images uniquement)');
      console.log('   - Le PDF est protégé ou corrompu');
      console.log('   - Le PDF utilise un format non supporté');
    }

    // Si c'est un PDF, donner des informations supplémentaires
    if (result.contentType === 'pdf' && result.pageCount !== undefined) {
      console.log('\n📊 Statistiques PDF:');
      console.log(`   - Pages: ${result.pageCount}`);
      console.log(`   - Texte moyen par page: ${result.pageCount > 0 ? (result.text.length / result.pageCount).toFixed(0) : 0} caractères`);
    }

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error(`\n❌ Erreur d'extraction après ${processingTime}ms`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.constructor.name}`);
    
    // Donner des suggestions selon le type d'erreur
    if (error.message.includes('OCR pour images non implémenté')) {
      console.error('\n💡 Solution: Ce fichier semble être une image, pas un PDF.');
      console.error('   L\'OCR pour images n\'est pas encore implémenté.');
    } else if (error.message.includes('Échec de l\'extraction PDF')) {
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez que le fichier est bien un PDF valide');
      console.error('   2. Essayez avec un autre fichier PDF');
      console.error('   3. Le PDF peut être protégé par mot de passe');
      console.error('   4. Le PDF peut être corrompu');
      console.error('   5. Le PDF peut utiliser des fonctionnalités avancées non supportées');
    } else {
      console.error('\n💡 Solution: Vérifiez que le fichier est accessible et qu\'il s\'agit bien d\'un PDF.');
    }
    
    process.exit(1);
  }
}

/**
 * Teste l'indexation complète d'un fichier
 */
async function testFullIndexation(pdfPath: string): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('Test d\'indexation complète (mode dry-run)');
  console.log('='.repeat(60));

  if (!existsSync(pdfPath)) {
    console.error(`\n❌ Fichier non trouvé: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`\n📄 Fichier à indexer: ${pdfPath}`);

  // Créer un indexeur
  const indexer = new SupabaseStorageIndexer('test-bucket');

  // Lire le fichier
  const pdfBuffer = readFileSync(pdfPath);
  const fileSize = pdfBuffer.length;
  const fileName = pdfPath.split(/[\\/]/).pop() || 'file.pdf';

  console.log(`📊 Taille: ${(fileSize / 1024).toFixed(2)} KB`);

  // Simuler un fichier depuis Supabase Storage
  const mockFileInfo = {
    name: fileName,
    path: `test-bucket/${fileName}`,
    contentType: 'application/pdf',
    size: fileSize,
    updatedAt: new Date().toISOString(),
    metadata: {},
  };

  // Options d'indexation
  const options = {
    dryRun: true, // Mode test, pas de sauvegarde en base
    client: 'test-client',
    documentType: 'test-document',
  };

  console.log('\n🔄 Début de l\'indexation...');

  try {
    // Utiliser indexFile directement (méthode privée normalement)
    // Comme c'est privé, on va simuler le processus
    const service = new OCRService();
    
    console.log('\n📖 Étape 1: Extraction du texte');
    const extractedText = await service.extractText(pdfBuffer, fileName);
    console.log(`   ✅ Texte extrait: ${extractedText.text.length} caractères`);

    if (!extractedText.text || extractedText.text.trim().length === 0) {
      console.log('\n⚠️  Aucun texte extrait, indexation annulée.');
      return;
    }

    console.log('\n🧩 Étape 2: Chunking du document');
    // Importer dynamiquement le chunker
    const { chunkDocument } = await import('../src/lib/rag/chunker');
    
    const chunkResult = await chunkDocument({
      content: extractedText.text,
      metadata: {
        source: mockFileInfo.path,
        sourceType: 'supabase_storage',
        sourceBucket: 'test-bucket',
        client: options.client,
        documentType: options.documentType || extractedText.contentType,
        fileName: mockFileInfo.name,
        fileSize: mockFileInfo.size,
        fileContentType: mockFileInfo.contentType,
        extractionMethod: extractedText.contentType,
      },
    });

    console.log(`   ✅ Chunks créés: ${chunkResult.chunks.length}`);
    console.log(`   📊 Tokens totaux: ${chunkResult.totalTokens}`);

    console.log('\n🎯 Étape 3: Génération des embeddings (simulée)');
    const { generateEmbeddings } = await import('../src/lib/rag/embeddings');
    
    const embeddingsResult = await generateEmbeddings(
      chunkResult.chunks.map(chunk => chunk.content)
    );
    
    console.log(`   ✅ Embeddings générés: ${embeddingsResult.embeddings.length}`);
    console.log(`   📊 Tokens totaux: ${embeddingsResult.totalTokens}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test d\'indexation complète terminé avec succès');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - Fichier: ${fileName}`);
    console.log(`   - Taille: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   - Texte extrait: ${extractedText.text.length} caractères`);
    console.log(`   - Chunks créés: ${chunkResult.chunks.length}`);
    console.log(`   - Embeddings générés: ${embeddingsResult.embeddings.length}`);
    console.log(`   - [DRY RUN] Aucune modification n\'a été apportée à la base de données`);

  } catch (error: any) {
    console.error(`\n❌ Erreur lors de l'indexation: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
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
    // Initialiser le logger
    logger.info('='.repeat(60));
    logger.info('Script de test manuel PDF pour ST-201');
    logger.info('='.repeat(60));

    console.log('\n🚀 Démarrage du test manuel PDF');
    console.log(`   Fichier: ${options.path}`);

    // Proposer le choix entre extraction simple et indexation complète
    console.log('\n📋 Options disponibles:');
    console.log('   1. Extraction de texte simple (test basique)');
    console.log('   2. Indexation complète (test le flux complet)');
    console.log('   3. Les deux');

    // Pour l'instant, faire les deux tests
    console.log('\n🔄 Exécution des tests...\n');

    // Test 1: Extraction simple
    await testPdfExtraction(options.path);

    // Test 2: Indexation complète
    await testFullIndexation(options.path);

    console.log('\n✅ Tous les tests ont été exécutés avec succès!');
    process.exit(0);

  } catch (error: any) {
    logger.error('Échec du script de test manuel', {
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
main().catch((error) => {
  console.error('Erreur non capturée:', error);
  process.exit(1);
});
