/**
 * Script de test en direct pour vérifier si le problème d'API key est résolu
 * 
 * INSTRUCTIONS:
 * 1. Copiez ce fichier dans votre projet
 * 2. Définissez votre clé API Mistral dans les variables d'environnement:
 *    - Soit dans un fichier .env: MISTRAL_API_KEY=votre_cle
 *    - Soit directement: export MISTRAL_API_KEY="votre_cle"
 * 3. Exécutez: ts-node test-embeddings-live.ts
 * 
 * CE QUE CE SCRIPT FAIT:
 * - Teste la configuration de l'API
 * - Fait un appel API réel avec votre clé
 * - Affiche le résultat ou l'erreur
 */

import { EmbeddingService, generateEmbedding } from '../embeddings';

async function testEmbeddings() {
  console.log('=== Test des Embeddings - Mode Live ===\n');

  // 1. Vérifier la configuration
  console.log('1. Vérification de la configuration...');
  const apiKey = process.env.MISTRAL_API_KEY;
  const baseUrl = process.env.MISTRAL_API_BASE_URL || 'https://api.mistral.ai/v1/';
  
  console.log(`   Clé API définie: ${apiKey ? '✓ Oui' : '✗ Non'}`);
  console.log(`   Longueur de la clé: ${apiKey ? apiKey.length : 0} caractères`);
  console.log(`   URL de base: ${baseUrl}`);
  
  if (!apiKey) {
    console.error('\n❌ ERREUR: MISTRAL_API_KEY n\'est pas définie !');
    console.error('   Solution: Définissez la variable d\'environnement MISTRAL_API_KEY');
    console.error('   Exemple: export MISTRAL_API_KEY="votre_clé_api"');
    process.exit(1);
  }

  // 2. Créer le service
  console.log('\n2. Création du service d\'embeddings...');
  try {
    const service = new EmbeddingService({ apiKey, baseUrl });
    console.log('   ✓ Service créé avec succès');
    console.log(`   Modèle: ${service['config'].model}`);
  } catch (error) {
    console.error(`   ✗ Échec de la création: ${error.message}`);
    process.exit(1);
  }

  // 3. Faire un appel de test
  console.log('\n3. Test d\'un appel API...');
  try {
    const result = await generateEmbedding('Ceci est un test', { useCache: false });
    console.log('   ✓ Appel API réussi !');
    console.log(`   Dimensions de l'embedding: ${result.embedding.length}`);
    console.log(`   Nombre de tokens: ${result.tokenCount}`);
    console.log(`   Créé à: ${result.createdAt}`);
    console.log('\n=== ✅ TOUT FONCTIONNE ! ===');
  } catch (error) {
    console.error('   ✗ Échec de l\'appel API');
    console.error(`   Message: ${error.message}`);
    console.error(`   Type: ${error.errorType || 'unknown'}`);
    console.error(`   Code: ${error.statusCode || 'N/A'}`);
    
    // Analyse des erreurs courantes
    console.error('\n=== ANALYSE DES ERREURS ===');
    if (error.message.includes('API key') || error.statusCode === 401) {
      console.error('❌ Problème de clé API:');
      console.error('   - Vérifiez que votre clé est valide');
      console.error('   - Vérifiez que votre clé n\'a pas expiré');
      console.error('   - Vérifiez que vous utilisez la bonne région (EU, US, etc.)');
    } else if (error.statusCode === 404) {
      console.error('❌ Modèle non trouvé:');
      console.error('   - Vérifiez que le modèle "mistral-embed" existe');
      console.error('   - Essayez avec "mistral-embed-768" ou un autre modèle');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('❌ Problème de connexion:');
      console.error('   - Vérifiez votre connexion internet');
      console.error('   - Vérifiez que l\'URL de l\'API est correcte');
    } else {
      console.error('❌ Erreur inconnue - voir détails ci-dessus');
    }
    
    process.exit(1);
  }
}

// Exécuter le test
testEmbeddings().catch(error => {
  console.error('Erreur inattendue:', error);
  process.exit(1);
});
