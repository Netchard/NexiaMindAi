import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Client Supabase pour Server Components et Route Handlers.
 * Lit/écrit la session dans les cookies de la requête (via next/headers),
 * ce qui la rend visible au proxy pour la protection de routes.
 *
 * Utilise les variables NEXT_PUBLIC_* pour être compatible avec le client navigateur
 * (car la session doit être partagée entre client et serveur)
 *
 * Nom distinct de `server.ts` (client anon pour le pipeline RAG/Storage)
 * pour ne pas modifier ce module non lié à l'authentification.
 * 
 * N'utilise PAS le logger winston (incompatible avec Next.js 16 côté client)
 */
export async function createAuthServerClient() {
  const cookieStore = await cookies()
  
  // Utilise les variables NEXT_PUBLIC_* car ce client doit être compatible
  // avec le client navigateur (pour partager la session via cookies)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Configuration Supabase manquante pour l\'authentification serveur', {
      missingUrl: !supabaseUrl,
      missingKey: !supabaseAnonKey,
    });
    throw new Error(
      '[AUTH-SERVER] NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY doivent être définis'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Appelé depuis un Server Component : ignorable car le proxy
          // rafraîchit déjà la session sur chaque requête.
        }
      },
    },
  })
}

/**
 * Crée un client auth serveur avec une clé personnalisée (pour les tests)
 * @param url URL Supabase
 * @param key Clé Supabase
 */
export async function createAuthServerClientWithKey(url: string, key: string) {
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Ignorable dans Server Components
        }
      },
    },
  })
}
