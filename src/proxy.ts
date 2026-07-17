import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack (même raison que src/lib/supabase/server.ts).
// Le proxy s'exécute sur chaque requête protégée ; une exception ici casse
// silencieusement l'injection de x-user-id et fait échouer l'auth en aval.

/**
 * Proxy (anciennement "middleware", renommé en Next.js 16 — voir le guide de
 * migration officiel) exécuté sur chaque requête. Doit rester à la racine de
 * `src/`, au même niveau que `app/`, pour être détecté.
 *
 * Rafraîchit la session Supabase, protège les pages non publiques en
 * redirigeant vers /auth/login, et protège les préfixes `/api/*` listés dans
 * PROTECTED_API_PREFIXES en vérifiant la session Supabase et en injectant un
 * header `x-user-id` fiable (revalidé, pas fourni par le client) pour les
 * routes qui en dépendent (@/lib/api/auth/service).
 *
 * Remplace l'ancien src/middleware.ts, qui vérifiait un cookie `access_token`
 * jamais posé par aucun flux réel (code mort depuis sa création).
 */

const PUBLIC_PAGE_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
]

// Préfixes API nécessitant une session Supabase valide. x-user-id est injecté
// ci-dessous à partir de cette session vérifiée — jamais fourni par le client.
const PROTECTED_API_PREFIXES = ['/api/chat', '/api/conversations', '/api/documents', '/api/admin', '/api/sources']

function isPublicPageRoute(pathname: string): boolean {
  return PUBLIC_PAGE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )
}

function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function proxy(request: NextRequest) {
  const start = Date.now()
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  
  // Log pour débogage ST-306
  console.log('[PROXY] Requête reçue:', { pathname, method: request.method })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Proxy: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY manquants — auth désactivée pour cette requête', { path: pathname })
    return NextResponse.next({ request })
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: getUser() revalide le token auprès de Supabase (contrairement à
  // getSession() qui ne fait que lire le cookie), donc ne pas le retirer.
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null
  try {
    const userResult = await supabase.auth.getUser()
    user = userResult.data.user
  } catch (error) {
    console.error('Proxy: échec de la vérification de session Supabase', {
      path: pathname,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  if (isApiRoute) {
    console.info('API_REQUEST', {
      method: request.method,
      path: pathname,
      userId: user?.id,
      authCheckMs: Date.now() - start,
    })

    if (isProtectedApiRoute(pathname)) {
      if (!user) {
        console.warn('[PROXY] Utilisateur non authentifié pour route protégée:', { pathname })
        return NextResponse.json({ error: 'Non autorisé - utilisateur non authentifié' }, { status: 401 })
      }
      console.log('[PROXY] Utilisateur authentifié:', { userId: user.id, pathname })
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-user-id', user.id)
      if (user.email) {
        requestHeaders.set('x-user-email', user.email)
      }
      const authedResponse = NextResponse.next({ request: { headers: requestHeaders } })
      // Préserver les cookies de rafraîchissement de session déjà posés sur `response`.
      response.cookies.getAll().forEach((cookie) => authedResponse.cookies.set(cookie))
      return authedResponse
    }

    return response
  }

  if (!user && !isPublicPageRoute(pathname)) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
