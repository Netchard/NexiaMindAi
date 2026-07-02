const fs = require('fs');
const path = require('path');

// Liste des fichiers de test à corriger
const testFiles = [
  'src/lib/supabase/storage/__tests__/client.test.ts',
  'src/lib/supabase/storage/__tests__/ocr.test.ts',
  'src/lib/supabase/storage/__tests__/indexer.test.ts'
];

// Remplacements à effectuer
const replacements = [
  { from: /jest\.fn\(\)/g, to: 'vi.fn()' },
  { from: /jest\.mock\(/g, to: 'vi.mock(' },
  { from: /jest\.clearAllMocks\(\)/g, to: 'vi.clearAllMocks()' },
  { from: /jest\.mockImplementation\(/g, to: 'vi.fn().mockImplementation(' },
  { from: /jest\.mockResolvedValue\(/g, to: 'vi.fn().mockResolvedValue(' },
  { from: /jest\.mockRejectedValue\(/g, to: 'vi.fn().mockRejectedValue(' },
];

// Ajout des imports Vitest
const vitestImports = `import { vi, describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';
`;

testFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Ajouter les imports Vitest si nécessaire
    if (!content.includes('from \'vitest\'')) {
      // Trouver la position après les imports existants
      const importMatch = content.match(/^import.*;\s*/gm);
      const lastImportIndex = importMatch ? importMatch.join('').length : 0;
      
      // Ajouter les imports Vitest après les imports existants
      content = content.substring(0, lastImportIndex) + vitestImports + content.substring(lastImportIndex);
    }
    
    // Effectuer les remplacements
    replacements.forEach(replacement => {
      content = content.replace(replacement.from, replacement.to);
    });
    
    // Écrire le fichier mis à jour
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fichier mis à jour: ${filePath}`);
  } else {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
  }
});

console.log('✨ Mise à jour des tests terminée !');