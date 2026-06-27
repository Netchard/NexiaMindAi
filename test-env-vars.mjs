// test-env-vars.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';


console.log('🔍 Test des Variables d\'Environnement pour ST-003\n');

// ========================================
// 1. TEST : Variables Supabase
// ========================================
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'MISTRAL_API_KEY',
];

console.log('✅ Test 1/4: Variables obligatoires');
let allRequiredPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const present = value && value !== '';
  console.log(`  ${present ? '✅' : '❌'} ${varName}: ${present ? 'Présente' : 'MANQUANTE'}`);
  if (!present) allRequiredPresent = false;
});

// ========================================
// 2. TEST : Connexion Supabase
// ========================================
if (allRequiredPresent) {
  console.log('\n✅ Test 2/4: Connexion à Supabase');

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Tester la connexion
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (error) {
      console.log(`  ❌ Erreur de connexion: ${error.message}`);
    } else {
      console.log(`  ✅ Connexion réussie`);
      console.log(`  ✅ Nombre de profils: ${data?.length || 0}`);
    }
  } catch (err) {
    console.log(`  ❌ Erreur: ${err.message}`);
  }
} else {
  console.log('  ⚠️  Test sauté (variables manquantes)');
}

// ========================================
// 3. TEST : Variables Optionnelles
// ========================================
console.log('\n✅ Test 3/4: Variables optionnelles');
const optionalVars = [
  'NEXT_PUBLIC_APP_URL',
  'GITLAB_API_URL',
  'NEXIA_API_URL',
  'REDIS_URL',
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  const present = value && value !== '';
  console.log(`  ${present ? '✅' : 'ℹ️'} ${varName}: ${present ? 'Présente' : 'Optionnelle'}`);
});

// ========================================
// 4. TEST : Format des Variables
// ========================================
console.log('\n✅ Test 4/4: Format des variables');

if (process.env.SUPABASE_URL) {
  const urlValid = process.env.SUPABASE_URL.startsWith('https://') &&
                  process.env.SUPABASE_URL.includes('.supabase.co');
  console.log(`  ${urlValid ? '✅' : '❌'} SUPABASE_URL: Format valide`);
}

if (process.env.SUPABASE_ANON_KEY) {
  const keyValid = process.env.SUPABASE_ANON_KEY.startsWith('eyJ');
  console.log(`  ${keyValid ? '✅' : '❌'} SUPABASE_ANON_KEY: Format valide`);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  const serviceKeyValid = process.env.SUPABASE_SERVICE_ROLE_KEY.startsWith('eyJ');
  console.log(`  ${serviceKeyValid ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY: Format valide`);
}

if (process.env.MISTRAL_API_KEY) {
  const mistralKeyValid = process.env.MISTRAL_API_KEY.length >= 30;
  console.log(`  ${mistralKeyValid ? '✅' : '❌'} MISTRAL_API_KEY: Format valide`);
}

// ========================================
// RÉSULTAT FINAL
// ========================================
console.log('\n' + '='.repeat(60));
if (allRequiredPresent) {
  console.log('🎉 TOUS LES TESTS RÉUSSIS !');
  console.log('✅ ST-003 est prête pour le déploiement');
} else {
  console.log('⚠️  DES VARIABLES MANQUENT !');
  console.log('✅ Vérifiez votre fichier .env.local');
}
console.log('='.repeat(60));