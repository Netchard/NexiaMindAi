/**
 * Endpoint API pour la synchronisation Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 * 
 * POST /api/sources/supabase/sync
 * Nécessite un rôle admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageIndexer } from '@/lib/supabase/storage/indexer';
import { AuthService } from '@/lib/api/auth/service';
import { logger } from '@/lib/logger';
import { SyncRequest, SyncResponse, IndexationResult } from '@/lib/supabase/storage/types';

/**
 * Lance la synchronisation/indexation des fichiers depuis Supabase Storage
 * 
 * @param request Requête HTTP avec les options de synchronisation
 * @returns Réponse avec le statut de la tâche
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification JWT (via middleware - headers x-user-id)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId) {
      logger.warn('Tentative d\'accès à /api/sources/supabase/sync sans JWT', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin uniquement)
    const isAdmin = await AuthService.isAdminByUserId(userId);

    if (!isAdmin) {
      logger.warn(`Tentative d'accès admin refusée pour userId: ${userId}`, {
        path: request.nextUrl.pathname,
        email: userEmail,
      });

      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    // 3. Validation de la requête
    let body: SyncRequest = {};

    try {
      const requestBody = await request.json();
      
      // Validation des champs
      if (requestBody.prefix !== undefined && typeof requestBody.prefix !== 'string') {
        return NextResponse.json(
          { error: 'Le champ "prefix" doit être une chaîne de caractères' },
          { status: 400 }
        );
      }

      if (requestBody.client !== undefined && typeof requestBody.client !== 'string') {
        return NextResponse.json(
          { error: 'Le champ "client" doit être une chaîne de caractères' },
          { status: 400 }
        );
      }

      if (requestBody.documentType !== undefined && typeof requestBody.documentType !== 'string') {
        return NextResponse.json(
          { error: 'Le champ "documentType" doit être une chaîne de caractères' },
          { status: 400 }
        );
      }

      if (requestBody.dryRun !== undefined && typeof requestBody.dryRun !== 'boolean') {
        return NextResponse.json(
          { error: 'Le champ "dryRun" doit être un booléen' },
          { status: 400 }
        );
      }

      if (requestBody.limit !== undefined) {
        if (typeof requestBody.limit !== 'number' || requestBody.limit <= 0) {
          return NextResponse.json(
            { error: 'Le champ "limit" doit être un nombre positif' },
            { status: 400 }
          );
        }
      }

      body = requestBody;
    } catch (parseError: any) {
      logger.error('Échec du parsing du JSON de la requête', {
        error: parseError.message,
        userId,
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Requête invalide - JSON mal formaté' },
        { status: 400 }
      );
    }

    const options = {
      prefix: body.prefix,
      client: body.client,
      documentType: body.documentType,
      dryRun: body.dryRun || false,
      limit: body.limit,
    };

    logger.info('Début de la synchronisation Supabase Storage', {
      userId,
      userEmail,
      options,
    });

    // 4. Lancer l'indexation (asynchrone)
    const taskId = `supabase_sync_${Date.now()}_${userId}`;

    // Appel non-blocking - retourne immédiatement avec statut queued
    storageIndexer.indexAll(options)
      .then((indexResult: IndexationResult) => {
        const processingTime = Date.now() - startTime;

        logger.info('Synchronisation terminée', {
          taskId,
          userId,
          result: indexResult,
          processingTime: `${processingTime}ms`,
        });
      })
      .catch((error: any) => {
        logger.error('Échec de la synchronisation en arrière-plan', {
          error: error.message,
          stack: error.stack,
          taskId,
          userId,
        });
      });

    // 5. Retourner la réponse avec statut queued
    const response: SyncResponse = {
      ...{
        processed: 0,
        succeeded: 0,
        failed: 0,
        errors: [],
        chunksCreated: 0,
        embeddingsGenerated: 0,
      },
      status: 'queued',
      taskId,
      message: `Synchronisation Supabase Storage lancée avec succès`,
    };

    logger.info('Synchronisation lancée', {
      taskId,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(response, { status: 202 }); // 202 Accepted

  } catch (error: any) {
    logger.error('Échec du traitement de la requête de synchronisation', {
      error: error.message,
      stack: error.stack,
      userId: request.headers.get('x-user-id') || 'unknown',
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Méthode non supportée - retourner une erreur 405
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Méthode non supportée - utiliser POST pour lancer la synchronisation' },
    { status: 405 }
  );
}

/**
 * Méthode non supportée - retourner une erreur 405
 */
export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { error: 'Méthode non supportée' },
    { status: 405 }
  );
}

/**
 * Méthode non supportée - retourner une erreur 405
 */
export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { error: 'Méthode non supportée' },
    { status: 405 }
  );
}
