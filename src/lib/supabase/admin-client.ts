/**
 * Client Supabase ADMIN pour les opérations sensibles
 * Utilise la SERVICE ROLE KEY (toutes les permissions)
 * 
 * ⚠️⚠️⚠️ ATTENTION ⚠️⚠️⚠️
 * 
 * NE JAMAIS utiliser ce client côté navigateur !
 * NE JAMAIS exposer la SUPABASE_SERVICE_ROLE_KEY au frontend !
 * 
 * Utilisations autorisées :
 * - Bypass RLS (Row Level Security)
 * - Opérations admin (suppression, mise à jour massive)
 * - Requêtes nécessitant des permissions élevées
 * - Code côté SERVEUR uniquement (API routes, server components)
 * 
 * @packageDocumentation
 */

import { createClient } from '@supabase/supabase-js';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack

// Variables SERVEUR uniquement pour les opérations admin
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Configuration Supabase ADMIN manquante', {
    missingUrl: !supabaseUrl,
    missingServiceKey: !supabaseServiceKey,
  });
  throw new Error(
    '[ADMIN] SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans .env.local '
    + 'pour les opérations admin'
  );
}

// Création du client admin avec la service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.info('Client Supabase ADMIN initialisé', {
  url: supabaseUrl.replace(/https?:\/\//, ''),
  // Ne JAMAIS logger la service role key !
});

/**
 * Client Supabase avec la service role key (toutes les permissions)
 * 
 * ⚠️ NE JAMAIS exporter ce client vers le frontend !
 * ⚠️ NE JAMAIS utiliser dans des composants React !
 * ⚠️ Réservé au code serveur uniquement !
 */
export { supabaseAdmin as supabase };

/**
 * Fonction pour créer un nouveau client admin
 * @returns Nouveau client Supabase avec la service role key
 */
export function createAdminClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('[ADMIN] Configuration manquante');
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Vérifie si le client admin est disponible
 * @returns true si la service role key est configurée
 */
export function isAdminConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
