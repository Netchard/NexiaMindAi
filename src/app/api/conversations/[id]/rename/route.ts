/**
 * Endpoint PATCH /api/conversations/[id]/rename
 * Renomme une conversation existante
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
// Client admin (service role) : proxy.ts a déjà revalidé la session et injecté
// x-user-id, donc l'autorisation est appliquée en code applicatif (.eq('user_id', ...))
// plutôt que via RLS — voir src/lib/supabase/admin-client.ts.
import { supabase as supabaseServer } from '@/lib/supabase/admin-client';

/**
 * Endpoint PATCH /api/conversations/[id]/rename
 * Renomme une conversation existante
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    // 1. Verification de l'utilisateur
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      console.warn('Acces non autorise - utilisateur non authentifie', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Non autorise - utilisateur non authentifie' },
        { status: 401 }
      );
    }

    // 2. Recuperation de l'ID de conversation
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;

    if (!conversationId) {
      console.warn('ID de conversation manquant', { userId });

      return NextResponse.json(
        { error: 'L ID de la conversation est obligatoire' },
        { status: 400 }
      );
    }

    // 3. Parsing du body
    let body;

    try {
      body = await request.json();
    } catch (jsonError) {
      console.warn('Erreur de parsing JSON', {
        error: (jsonError as Error).message,
        userId,
        conversationId,
      });

      return NextResponse.json(
        { error: 'Requete invalide - JSON mal formate' },
        { status: 400 }
      );
    }

    // 4. Validation du body
    const { title } = body || {};

    if (!title || typeof title !== 'string') {
      console.warn('Titre manquant ou invalide', {
        title,
        userId,
        conversationId,
      });

      return NextResponse.json(
        { error: 'Le champ title est obligatoire et doit etre une chaine de caracteres' },
        { status: 400 }
      );
    }

    if (title.trim() === '') {
      console.warn('Titre vide', { userId, conversationId });

      return NextResponse.json(
        { error: 'Le titre ne peut pas etre vide' },
        { status: 400 }
      );
    }

    // Limiter la longueur du titre
    if (title.length > 200) {
      console.warn('Titre trop long', { length: title.length, userId, conversationId });

      return NextResponse.json(
        { error: 'Le titre ne peut pas depasser 200 caracteres' },
        { status: 400 }
      );
    }

    console.info(`Renommage de la conversation ${conversationId}`, {
      userId,
      newTitle: title,
    });

    // 5. Verifier que l'utilisateur a acces a cette conversation
    const { data: conversation, error: convError } = await supabaseServer
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      console.warn('Conversation non trouvee ou acces refuse', {
        conversationId,
        userId,
        error: convError?.message,
      });

      return NextResponse.json(
        { error: 'Conversation non trouvee ou acces non autorise' },
        { status: 404 }
      );
    }

    // 6. Mise a jour du titre
    const { error: updateError } = await supabaseServer
      .from('conversations')
      .update({
        title: title.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Echec du renommage de la conversation', {
        error: updateError.message,
        conversationId,
        userId,
        newTitle: title,
      });

      return NextResponse.json(
        { error: 'Echec du renommage de la conversation' },
        { status: 500 }
      );
    }

    console.info('Conversation renommee avec succes', {
      conversationId,
      userId,
      newTitle: title,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      {
        conversation: {
          id: conversationId,
          title: title.trim(),
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Echec du traitement de la requete rename', {
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
