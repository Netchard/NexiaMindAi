#!/usr/bin/env node
/**
 * Script de test local pour PDF avec ST-201
 * Version simplifiée qui utilise ts-node pour exécuter du TypeScript
 * 
 * Usage:
 *   npx ts-node scripts/test-pdf-local.ts
 *   OU: node scripts/test-pdf-local.js (si déjà compilé)
 */

require('dotenv').config();

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('Test PDF Local pour ST-201');
console.log('='.repeat(60));

// Vérifier si ts-node est disponible
try {
  execSync('npx ts-node --version', { stdio: 'pipe' });
  console.log('✅ ts-node est disponible');
  
  // Créer un fichier de test TypeScript temporaire
  const testScript = `
import { OCRService } from './src/lib/supabase/storage/ocr';
import { readFileSync } from 'fs';
import { logger } from './src/lib/logger';

async function testPdf() {
  console.log('\\n📄 Test d\\'extraction de texte depuis PDF');
  console.log('-'.repeat(40));
  
  // Créer un test avec un PDF simple
  const ocrService = new OCRService();
  
  // Chemin vers un PDF de test (à adapter)
  const testPdfPath = './test-data/sample.pdf';
  
  if (!fs.existsSync(testPdfPath)) {
    console.log('❌ Fichier PDF non trouvé:', testPdfPath);
    console.log('💡 Placez un fichier PDF dans test-data/sample.pdf');
    process.exit(1);
  }
  
  console.log('✅ Fichier PDF trouvé:', testPdfPath);
  
  // Lire le PDF
  const pdfBuffer = readFileSync(testPdfPath);
  console.log('📊 Taille du fichier:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
  
  // Extraire le texte
  try {
    const result = await ocrService.extractText(pdfBuffer, 'sample.pdf');
    
    console.log('\\n✅ Extraction réussie!');
    console.log('📝 Type:', result.contentType);
    console.log('📄 Pages:', result.pageCount);
    console.log('📊 Texte extrait:', result.text.length, 'caractères');
    console.log('\\n📝 Premier 200 caractères:');
    console.log(result.text.substring(0, 200) + '...');
    
  } catch (error) {
    console.log('\\n❌ Erreur d\\'extraction:', error.message);
    process.exit(1);
  }
}

testPdf().catch(e => {
  console.error('Erreur:', e.message);
  process.exit(1);
});
`;

  // Écrire le script temporaire
  const tempScriptPath = path.join(__dirname, 'test-pdf-temp.ts');
  fs.writeFileSync(tempScriptPath, testScript);
  
  console.log('\n🚀 Exécution du test avec ts-node...\n');
  
  try {
    execSync(`npx ts-node ${tempScriptPath}`, { 
      stdio: 'inherit',
      cwd: __dirname
    });
  } finally {
    // Nettoyer
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }

} catch (error) {
  console.log('❌ ts-node non disponible');
  console.log('💡 Installer ts-node avec: npm install -g ts-node');
  console.log('   OU utiliser: npx ts-node scripts/index-supabase.ts');
  
  console.log('\n--- Alternative: Utiliser ts-node directement ---');
  console.log('Commande: npx ts-node scripts/index-supabase.ts --dry-run --limit=1');
  
  process.exit(1);
}
