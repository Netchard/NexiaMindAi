/**
 * Client Supabase pour le SERVEUR
 * Utilise les variables d'environnement PROTÉGÉES (sans NEXT_PUBLIC_)
 * 
 * IMPORTANT:
 * - Ce client est pour le code côté SERVEUR uniquement
 * - N'utilise PAS les variables NEXT_PUBLIC_*
 * - La clé anonyme est sécurisée à utiliser côté serveur
 * - Pour les opérations admin, utilisez admin-client.ts
 */

import { createClient } from '@supabase/supabase-js';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack

// Variables SERVEUR uniquement (protégées, non exposées au frontend)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configuration Supabase manquante pour le SERVEUR', {
    missingUrl: !supabaseUrl,
    missingKey: !supabaseAnonKey,
  });
  throw new Error(
    '[SERVEUR] SUPABASE_URL et SUPABASE_ANON_KEY doivent être définis dans .env.local'
  );
}

// Création du client serveur
const supabaseServer = createClient(supabaseUrl, supabaseAnonKey);

console.info('Client Supabase SERVEUR initialisé', {
  url: supabaseUrl.replace(/https?:\/\//, ''),
  // Ne pas logger la clé
});

// Export du client et de la fonction de création
export { supabaseServer as supabase };
export { createClient } from '@supabase/supabase-js';
