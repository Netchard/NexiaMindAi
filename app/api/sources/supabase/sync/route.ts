/**
 * Endpoint API pour la synchronisation Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { storageIndexer } from '@/lib/supabase/storage/indexer';
import { logger } from '@/lib/logger';
import { IndexationOptions, IndexationResult } from '@/lib/supabase/storage/types';

export interface SyncRequest {
  /** Prefix du bucket à indexer */
  prefix?: string;
  /** Client spécifique */
  client?: string;
  /** Type de document */
  documentType?: string;
  /** Mode test */
  dryRun?: boolean;
  /** Limite de fichiers */
  limit?: number;
}

export interface SyncResponse extends IndexationResult {
  /** Statut de l'opération */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** ID de la tâche */
  taskId: string;
  /** Message */
  message: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification JWT (admin uniquement)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin uniquement)
    // Utiliser AuthService.isAdminByUserId() de ST-108
    const { AuthService } = await import('@/lib/api/auth/service');
    const isAdmin = await AuthService.isAdminByUserId(userId);
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    // 3. Validation de la requête
    const body: SyncRequest = await request.json();
    const options: IndexationOptions = {
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
    const taskId = `supabase_sync_${Date.now()}`;

    // Appel non-blocking
    storageIndexer.indexAll(options)
      .then((result) => {
        logger.info('Synchronisation terminée', {
          taskId,
          result,
          processingTime: `${Date.now() - startTime}ms`,
        });
      })
      .catch((error) => {
        logger.error('Échec de la synchronisation en arrière-plan', {
          error: error.message,
          taskId,
          userId,
        });
      });

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

// GET endpoint pour vérifier le statut (optionnel)
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'Méthode non supportée - utiliser POST pour lancer la synchronisation' 
    },
    { status: 405 }
  );
}