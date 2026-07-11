#!/usr/bin/env node
/**
 * Script CLI pour l'indexation des fichiers Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 * 
 * USAGE AVEC TS-NODE (Recommandé):
 *   npx ts-node scripts/index-supabase.ts --dry-run --limit=1
 * 
 * USAGE AVEC COMPILATION:
 *   1. Compiler: tsc scripts/index-supabase.ts --module commonjs --target es2020
 *   2. Exécuter: node scripts/index-supabase.js --dry-run --limit=1
 * 
 * OU UTILISER CE SCRIPT SIMPLE (pour test rapide):
 *   node scripts/index-supabase-simple.js --help
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');

// ============================================================================
// SOLUTION POUR ÉVITER LES PROBLÈMES DE REQUIRE + TYPESCRIPT
// Ce script simple évite d'importer directement les fichiers TypeScript
// ============================================================================

console.log('='.repeat(60));
console.log('Script d\'indexation Supabase Storage - Mode Simplifié');
console.log('='.repeat(60));

// Vérifier si on peut utiliser ts-node
function checkTsNode() {
  try {
    require.resolve('ts-node/register');
    return true;
  } catch {
    return false;
  }
}

// Vérifier si les fichiers compilés existent
function checkCompiledFiles() {
  const compiledPath = path.join(__dirname, 'index-supabase.js');
  return fs.existsSync(compiledPath);
}

const hasTsNode = checkTsNode();
const hasCompiled = checkCompiledFiles();

console.log('\n🔍 Détection de l\'environnement:');
console.log(`  ts-node disponible: ${hasTsNode ? '✅' : '❌'}`);
console.log(`  Fichier compilé disponible: ${hasCompiled ? '✅' : '❌'}`);

if (hasTsNode) {
  console.log('\n🚀 Exécution avec ts-node...\n');
  
  // Construire la commande avec les arguments
  const args = process.argv.slice(2).join(' ');
  const tsNodePath = require.resolve('ts-node/register');
  
  // Exécuter avec ts-node
  require('child_process').execSync(
    `node -r ${tsNodePath} scripts/index-supabase.ts ${args}`,
    { stdio: 'inherit' }
  );
} else if (hasCompiled) {
  console.log('\n🚀 Exécution du fichier compilé...\n');
  
  // Exécuter le fichier compilé directement
  const args = process.argv.slice(2).join(' ');
  require('child_process').execSync(
    `node scripts/index-supabase.js ${args}`,
    { stdio: 'inherit' }
  );
} else {
  console.log('\n❌ Aucune méthode d\'exécution disponible');
  console.log('\n💡 Solutions:');
  console.log('\n  1. Installer ts-node:');
  console.log('     npm install -g ts-node');
  console.log('     Puis exécuter: npx ts-node scripts/index-supabase.ts [options]');
  console.log('\n  2. Compiler le TypeScript:');
  console.log('     tsc scripts/index-supabase.ts --module commonjs --target es2020');
  console.log('     Puis exécuter: node scripts/index-supabase.js [options]');
  console.log('\n  3. Pour un test rapide local:');
  console.log('     node scripts/test-pdf-local.js');
  
  process.exit(1);
}
