/**
 * Endpoint POST /api/conversations
 * Crée une nouvelle conversation sans envoyer de message
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
// Client admin (service role) : proxy.ts a déjà revalidé la session et injecté
// x-user-id, donc l'autorisation est appliquée en code applicatif (.eq('user_id', ...))
// plutôt que via RLS — voir src/lib/supabase/admin-client.ts.
import { supabase as supabaseServer } from '@/lib/supabase/admin-client';

/**
 * Endpoint POST /api/conversations
 * Crée une nouvelle conversation vide
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification de l'utilisateur
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      console.warn('Accès non autorisé - utilisateur non authentifié', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // 2. Parsing du body
    let body;

    try {
      body = await request.json();
    } catch (jsonError) {
      console.warn('Erreur de parsing JSON', {
        error: (jsonError as Error).message,
        userId,
      });

      return NextResponse.json(
        { error: 'Requête invalide - JSON mal formaté' },
        { status: 400 }
      );
    }

    // 3. Validation du body
    const { title = 'Nouvelle conversation' } = body || {};

    if (!title || typeof title !== 'string') {
      console.warn('Titre manquant ou invalide', {
        title,
        userId,
      });

      return NextResponse.json(
        { error: 'Le champ title doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (title.trim() === '') {
      console.warn('Titre vide', { userId });

      return NextResponse.json(
        { error: 'Le titre ne peut pas être vide' },
        { status: 400 }
      );
    }

    // Limiter la longueur du titre
    if (title.length > 200) {
      console.warn('Titre trop long', { length: title.length, userId });

      return NextResponse.json(
        { error: 'Le titre ne peut pas dépasser 200 caractères' },
        { status: 400 }
      );
    }

    console.info(`Création d'une nouvelle conversation`, {
      userId,
      title: title.trim(),
    });

    // 4. Créer la conversation dans Supabase
    // `id` doit être un UUID valide (colonne `conversations.id UUID`) — voir
    // architecture.md:256-268. `message_count` n'existe pas comme colonne : le
    // nombre de messages est toujours calculé à la volée (voir /api/chat/history).
    const newConversationId = randomUUID();

    const { error: convError } = await supabaseServer
      .from('conversations')
      .insert({
        id: newConversationId,
        user_id: userId,
        title: title.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (convError) {
      console.error('Échec de la création de la conversation', {
        error: convError.message,
        errorDetails: convError,
        userId,
        title: title.trim(),
        newConversationId,
        idLength: newConversationId.length,
      });

      return NextResponse.json(
        { error: 'Échec de la création de la conversation', details: convError?.message },
        { status: 500 }
      );
    }

    console.info('Conversation créée avec succès', {
      conversationId: newConversationId,
      userId,
      title: title.trim(),
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      {
        conversation: {
          id: newConversationId,
          title: title.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messageCount: 0,
        },
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Échec du traitement de la requête create conversation', {
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
