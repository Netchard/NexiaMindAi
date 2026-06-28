/**
 * Endpoint POST /api/chat/refresh
 * Déclenche le rafraîchissement (re-indexation) d'une source de documents
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Types pour les requêtes et réponses
interface RefreshRequest {
  sourceId: string;
  client?: string;
  documentType?: string;
}

interface RefreshResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  taskId: string;
  message: string;
  documentsProcessed?: number;
  errors?: string[];
}

// Initialiser Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  logger.error('SUPABASE_URL and SUPABASE_ANON_KEY must be defined');
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Vérifie si l'utilisateur est admin
 * À implémenter: Vérifier le rôle via Supabase ou JWT custom claims
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  // TODO: Implémenter la vérification du rôle admin
  // Pour l'instant, retourner false par défaut
  // En production: vérifier via Supabase auth ou JWT claims
  logger.warn('Vérification admin non implémentée - tous les utilisateurs sont refusés');
  return false;
}

/**
 * Déclenche la re-indexation d'une source
 * Appel asynchrone via ST-104 (retriever.ts)
 */
async function triggerReindexing(sourceId: string, options: { client?: string; documentType?: string; userId: string }): Promise<void> {
  // TODO: Intégrer avec ST-104 reindexSource()
  // Pour l'instant, simuler l'appel
  logger.info(`Rafraîchissement déclenché pour source: ${sourceId}`, {
    client: options.client,
    documentType: options.documentType,
    userId: options.userId,
  });
  
  // Simulation de travail asynchrone
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Endpoint POST /api/chat/refresh
 * Déclenche le rafraîchissement d'une source de documents
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification de l'utilisateur (déjà authentifié par le middleware)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      logger.warn('Accès non autorisé - utilisateur non authentifié', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Vérification autorisation (admin ou rôle autorisé)
    const isAdmin = await isUserAdmin(userId);
    
    if (!isAdmin) {
      logger.warn('Accès refusé - droits insuffisants', {
        userId,
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    // 3. Validation de la requête
    let body: RefreshRequest;

    try {
      body = await request.json();
    } catch (jsonError) {
      logger.warn('Erreur de parsing JSON', {
        error: (jsonError as Error).message,
        userId,
      });

      return NextResponse.json(
        { error: 'Requête invalide - JSON mal formaté' },
        { status: 400 }
      );
    }

    if (!body.sourceId || typeof body.sourceId !== 'string') {
      logger.warn('SourceId manquant ou invalide', {
        sourceId: body?.sourceId,
        userId,
      });

      return NextResponse.json(
        { error: 'Le champ "sourceId" est obligatoire et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    logger.info(`Début du rafraîchissement pour la source: ${body.sourceId}`, {
      userId,
      client: body.client,
      documentType: body.documentType,
    });

    // 4. Déclenchement de la re-indexation (asynchrone)
    try {
      // Appel non-blocking - retourne immédiatement avec statut
      triggerReindexing(body.sourceId, {
        client: body.client,
        documentType: body.documentType,
        userId,
      }).catch(error => {
        logger.error('Échec du rafraîchissement en arrière-plan', {
          error: (error as Error).message,
          sourceId: body.sourceId,
          userId,
        });
      });

      const response: RefreshResponse = {
        status: 'queued',
        taskId: `refresh_${Date.now()}_${body.sourceId}_${userId}`,
        message: `Rafraîchissement de la source ${body.sourceId} lancé avec succès`,
      };

      logger.info('Rafraîchissement lancé', {
        sourceId: body.sourceId,
        taskId: response.taskId,
        userId,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return NextResponse.json(response, { status: 202 }); // 202 Accepted

    } catch (indexError: any) {
      logger.error('Échec du lancement du rafraîchissement', {
        error: indexError.message,
        stack: indexError.stack,
        sourceId: body.sourceId,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec du lancement du rafraîchissement', details: indexError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error('Échec du traitement de la requête de rafraîchissement', {
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

// Fonction utilitaire pour appeler l'endpoint depuis le frontend
export async function triggerRefresh(
  sourceId: string,
  client?: string,
  documentType?: string
): Promise<RefreshResponse> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL('/api/chat/refresh', baseUrl);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, client, documentType }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur ${response.status}: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}
