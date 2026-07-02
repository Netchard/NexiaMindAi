import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_ANON_KEY is not defined');
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

/**
 * Middleware pour vérifier l'authentification
 * Protège les routes API qui nécessitent une authentification
 */
export async function authMiddleware(request: Request, context: any) {
  const path = request.nextUrl.pathname;
  
  // Ne pas appliquer le middleware aux routes publiques
  const publicRoutes = ['/api/auth/login', '/api/auth/logout'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  try {
    // Récupérer le token d'accès
    const access_token = request.cookies.get('access_token')?.value ||
                        request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!access_token) {
      console.warn('Accès non autorisé - pas de token', {
        path,
        method: request.method,
      });
      
      return NextResponse.json(
        { error: 'Unauthorized - No access token provided' },
        { status: 401 }
      );
    }
    
    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      console.warn('Accès non autorisé - token invalide', {
        path,
        error: error?.message,
      });
      
      return NextResponse.json(
        { error: 'Unauthorized - Invalid access token' },
        { status: 401 }
      );
    }
    
    // Ajouter l'utilisateur à la requête via headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email || '');
    
    console.log(`Utilisateur authentifié: ${user.email}`, {
      path,
      userId: user.id,
    });
    
    // Exécuter la requête suivante
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    
    return response;
  } catch (error: any) {
    console.error('Erreur dans authMiddleware', {
      error: error.message,
      stack: error.stack,
      path,
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Middleware principal qui combine logging et auth
 */
export async function middleware(request: Request) {
  const start = Date.now();
  const path = request.nextUrl.pathname;
  
  // Ne pas logger les requêtes vers les assets statiques
  if (path.startsWith('/_next') || path.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Appliquer le middleware d'authentification pour les routes API protégées
  const protectedRoutes = [
    '/api/chat/',
    '/api/documents/',
    '/api/admin/',
    '/api/auth/me',
    '/api/auth/refresh'
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  if (isProtectedRoute) {
    const response = await authMiddleware(request, {});
    if (response.status !== 200) {
      return response;
    }
  }
  
  // Exécuter la requête
  const response = NextResponse.next();
  
  // Log à la fin de la requête
  const duration = Date.now() - start;
  response.cookies.set('x-response-time', String(duration));
  
  console.log(JSON.stringify({
    type: 'API_REQUEST',
    method: request.method,
    path: path,
    status: response.status,
    duration: `${duration}ms`,
    ip: request.ip || request.headers.get('x-forwarded-for'),
    userAgent: request.headers.get('user-agent'),
  }));
  
  return response;
}

// Configuration du middleware
export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
