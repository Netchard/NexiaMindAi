/**
 * Endpoint DELETE /api/conversations/[id]
 * Supprime une conversation et ses messages (cascade)
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
// Client admin (service role) : proxy.ts a déjà revalidé la session et injecté
// x-user-id, donc l'autorisation est appliquée en code applicatif (.eq('user_id', ...))
// plutôt que via RLS — voir src/lib/supabase/admin-client.ts.
import { supabase as supabaseServer } from '@/lib/supabase/admin-client';

/**
 * Endpoint DELETE /api/conversations/[id]
 * Supprime une conversation et ses messages associes
 */
export async function DELETE(
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

    console.info(`Suppression de la conversation ${conversationId}`, {
      userId,
    });

    // 3. Verifier que l'utilisateur a acces a cette conversation
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

    // 4. Suppression de la conversation (avec cascade sur les messages)
    // La contrainte de cle etrangere dans la base de donnees gere la suppression
    // en cascade des messages associes
    const { error: deleteError } = await supabaseServer
      .from('conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Echec de la suppression de la conversation', {
        error: deleteError.message,
        conversationId,
        userId,
      });

      return NextResponse.json(
        { error: 'Echec de la suppression de la conversation' },
        { status: 500 }
      );
    }

    // 5. Verification que les messages ont bien ete supprimes (cascade)
    // Optionnel : verifier que les messages sont bien supprimes
    // Pas de colonne `user_id` sur `messages` (voir architecture.md:271-282) —
    // l'acces est deja verifie via `conversations.user_id` a l'etape 3.
    const { data: remainingMessages, error: checkError } = await supabaseServer
      .from('messages')
      .select('id')
      .eq('conversation_id', conversationId)
      .limit(1);

    if (checkError) {
      console.warn('Impossible de verifier la suppression des messages', {
        error: checkError.message,
        conversationId,
        userId,
      });
    } else if (remainingMessages && remainingMessages.length > 0) {
      console.warn('Des messages sont toujours presents apres la suppression', {
        remainingCount: remainingMessages.length,
        conversationId,
        userId,
      });
      // Ce n'est pas une erreur bloquante, la cascade peut prendre un peu de temps
    }

    console.info('Conversation supprimee avec succes', {
      conversationId,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      {
        message: 'Conversation deleted successfully',
        conversationId,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Echec du traitement de la requete delete', {
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
