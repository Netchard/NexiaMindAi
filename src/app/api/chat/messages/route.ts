/**
 * Endpoint GET /api/chat/messages
 * Récupère tous les messages d'une conversation spécifique
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
// Client admin (service role) : proxy.ts a déjà revalidé la session et injecté
// x-user-id, donc l'autorisation est appliquée en code applicatif (.eq('user_id', ...))
// plutôt que via RLS — voir src/lib/supabase/admin-client.ts.
import { supabase as supabaseServer } from '@/lib/supabase/admin-client';

// Types pour les réponses
interface Message {
  id: string;
  conversationId: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: Array<{
    path: string;
    type: string;
    relevance?: number;
  }>;
  createdAt: string;
}

interface MessagesResponse {
  messages: Message[];
  total: number;
  offset: number;
  limit: number;
}

/**
 * Endpoint GET /api/chat/messages
 * Récupère tous les messages d'une conversation spécifique
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification de l'utilisateur (déjà authentifié par le middleware)
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

    // 2. Validation de la requête
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // conversationId est obligatoire
    if (!conversationId) {
      console.warn('conversationId manquant', { userId });

      return NextResponse.json(
        { error: 'Le paramètre conversationId est obligatoire' },
        { status: 400 }
      );
    }

    // Validation de limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      console.warn('Limite invalide', { limit, userId });

      return NextResponse.json(
        { error: 'La limite doit être un nombre entre 1 et 100' },
        { status: 400 }
      );
    }

    // Validation de offset
    if (isNaN(offset) || offset < 0) {
      console.warn('Offset invalide', { offset, userId });

      return NextResponse.json(
        { error: 'L\'offset doit être un nombre positif ou zéro' },
        { status: 400 }
      );
    }

    console.info(`Récupération des messages pour conversation ${conversationId}`, {
      userId,
      conversationId,
      limit,
      offset,
    });

    // 3. Vérifier que l'utilisateur a accès à cette conversation
    const { data: conversation, error: convError } = await supabaseServer
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (convError || !conversation) {
      console.warn('Conversation non trouvée ou accès refusée', {
        conversationId,
        userId,
        error: convError?.message,
      });

      return NextResponse.json(
        { error: 'Conversation non trouvée ou accès non autorisé' },
        { status: 404 }
      );
    }

    // 4. Récupération des messages depuis Supabase
    // Pas de colonne `user_id` sur `messages` (voir architecture.md:271-282) —
    // l'accès est déjà scopé via la vérification `conversations.user_id` ci-dessus.
    const { data: messages, error: msgError, count } = await supabaseServer
      .from('messages')
      .select('id, conversation_id, content, role, sources, created_at', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (msgError) {
      console.error('Échec de récupération des messages', {
        error: msgError.message,
        conversationId,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec de récupération des messages' },
        { status: 500 }
      );
    }

    // 5. Formattage de la réponse
    const response: MessagesResponse = {
      messages: messages?.map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        content: m.content,
        role: m.role as 'user' | 'assistant',
        sources: m.sources as Message['sources'],
        createdAt: m.created_at,
      })) || [],
      total: count || 0,
      offset,
      limit,
    };

    console.info('Messages récupérés avec succès', {
      messageCount: response.messages.length,
      total: response.total,
      conversationId,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Échec du traitement de la requête messages', {
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
