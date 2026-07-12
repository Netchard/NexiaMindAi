/**
 * Index centralisé pour les clients Supabase
 * 
 * IMPORTANT : Choisissez le bon client selon le contexte !
 * 
 * 🌐 CLIENT (Navigateur/Composants React) :
 *   - Utilise `client` ou `supabase` depuis './client'
 *   - Utilise les variables NEXT_PUBLIC_*
 *   - Stocke la session dans les cookies
 *   - La clé anonyme est SÉCURISÉE à exposer
 * 
 * 🖥️ SERVEUR (API routes, server components) :
 *   - Utilise `serverClient` ou `supabase` depuis './server'
 *   - Utilise les variables SERVEUR (sans NEXT_PUBLIC_)
 *   - La clé anonyme est protégée
 * 
 * 🔒 ADMIN (Opérations sensibles) :
 *   - Utilise `adminClient` depuis './admin-client'
 *   - Utilise la SERVICE ROLE KEY
 *   - NE JAMAIS utiliser côté client !
 *   - Contournement RLS, opérations admin
 * 
 * 🪪 AUTH (Server Components avec cookies) :
 *   - Utilise `createAuthServerClient()` depuis './auth-server'
 *   - Nécessite les variables NEXT_PUBLIC_* (pour compatibilité client/serveur)
 */

// Ré-exports

// Client Navigateur (pour les composants React)
//export { supabase } from './client';
export { supabase as client } from './client';
export type { SupabaseClient } from '@supabase/supabase-js';

// Client Serveur (pour les API routes, server components)
export { supabase as serverClient, supabase as server } from './server';

// Client Admin (pour les opérations sensibles côté serveur)
export { supabase, createAdminClient, isAdminConfigured } from './admin-client';
export { supabase as adminClient } from './admin-client';

// Client Auth Serveur (pour les server components avec gestion des cookies)
export { createAuthServerClient, createAuthServerClientWithKey } from './auth-server';

// Client Storage (utilise le client serveur)
export * from './storage/client';
