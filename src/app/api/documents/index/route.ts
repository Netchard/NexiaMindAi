import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { storageIndexer } from '@/lib/supabase/storage/indexer';
import { isValidUploadPrefix } from '@/lib/supabase/storage/upload-prefix';

/**
 * Lance l'indexation (chunking + embeddings) des fichiers d'un préfixe donné
 * de Supabase Storage. Fait partie de la spec "Page Documents — upload et
 * indexation manuelle RAG" (_bmad-output/implementation-artifacts/
 * spec-documents-upload-indexation.md) : appelée depuis /documents après un
 * upload réussi, avec le préfixe dédié à la session d'upload courante
 * (jamais tout le bucket).
 *
 * Contrairement à /api/sources/supabase/sync, cette route `await` le
 * résultat et le retourne de façon synchrone (pas de mode fire-and-forget
 * 202) : l'utilisateur doit voir le résumé final immédiatement après le clic.
 *
 * Protégée par src/proxy.ts (préfixe /api/documents) : x-user-id est déjà
 * injecté et revalidé côté serveur. On le revérifie ici aussi (défense en
 * profondeur, même pattern que src/app/api/sources/supabase/sync/route.ts).
 */
export async function POST(request: Request) {
  const startTime = Date.now();
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    logger.warn('Tentative d\'accès à /api/documents/index sans utilisateur authentifié', {
      path: '/api/documents/index',
    });
    return NextResponse.json(
      { error: 'Non autorisé - utilisateur non authentifié' },
      { status: 401 }
    );
  }

  try {
    let body: { prefix?: unknown };

    try {
      body = await request.json();
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      logger.error('Échec du parsing du JSON de la requête', {
        error: errorMessage,
        userId,
      });
      return NextResponse.json(
        { error: 'Requête invalide - JSON mal formaté' },
        { status: 400 }
      );
    }

    const { prefix } = body;

    // Format strict "uploads/{slug}/" (un seul segment, pas de sous-dossiers,
    // pas de "..") : sans cette validation, un client pourrait envoyer un
    // préfixe trop large (ex. "uploads/") et déclencher l'indexation de TOUS
    // les uploads de TOUS les utilisateurs — interdit par la spec ("jamais
    // de ré-indexation globale du bucket depuis cette page").
    if (!isValidUploadPrefix(prefix)) {
      logger.warn('Prefix manquant ou invalide pour /api/documents/index', { userId, prefix });
      return NextResponse.json(
        { error: 'Le champ "prefix" est requis et doit être au format "uploads/{slug}/"' },
        { status: 400 }
      );
    }

    logger.info(`Début de l'indexation pour le préfixe: ${prefix}`, { userId });

    const result = await storageIndexer.indexAll({ prefix });

    logger.info('Indexation terminée', {
      userId,
      prefix,
      result,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Erreur dans documents/index', {
      error: errorMessage,
      stack: errorStack,
      userId,
    });
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET endpoint to list documents
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    logger.info(`Liste des documents demandée`, { source, limit, offset });
    
    // TODO: Récupérer la liste depuis Supabase
    // Pour l'instant, retourner une liste vide
    const documents: any[] = [];
    
    logger.info(`Liste des documents retournée (${documents.length} documents)`);
    
    return NextResponse.json({
      documents,
      total: 0,
      limit,
      offset,
    }, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans documents/index GET', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
