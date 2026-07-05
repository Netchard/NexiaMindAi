import { createBrowserClient } from '@supabase/ssr';

/**
 * Client Supabase pour le NAVIGATEUR
 * Utilise UNIQUEMENT les variables NEXT_PUBLIC_*
 * 
 * IMPORTANT:
 * - Ce client est pour le code côté CLIENT (navigateur) uniquement
 * - Utilise UNIQUEMENT les variables préfixées par NEXT_PUBLIC_
 * - La clé anonyme (anon key) est SÉCURISÉE à exposer au frontend
 * - Ne JAMAIS utiliser la service role key ici !
 * - N'utilise PAS le logger winston (incompatible navigateur)
 */

// Variables FRONTEND uniquement (exposées au navigateur)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Configuration Supabase manquante pour le CLIENT (navigateur)', {
    missingUrl: !supabaseUrl,
    missingKey: !supabaseAnonKey,
  });
  throw new Error(
    '[CLIENT] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définis dans .env.local'
  );
}

// Client navigateur avec stockage dans les cookies
// Cela permet au serveur (proxy) de lire/écrire les cookies de session
// pour une protection de routes côté serveur
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

console.info('Client Supabase NAVIGATEUR initialisé', {
  url: supabaseUrl.replace(/https?:\/\//, ''),
  // Ne pas logger la clé
});