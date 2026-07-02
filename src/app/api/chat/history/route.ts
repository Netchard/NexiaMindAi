/**
 * Endpoint GET /api/chat/history
 * Récupère l'historique des conversations d'un utilisateur
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Types pour les réponses
interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface HistoryResponse {
  conversations: Conversation[];
  total: number;
  offset: number;
  limit: number;
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
 * Endpoint GET /api/chat/history
 * Récupère l'historique des conversations d'un utilisateur
 */
export async function GET(request: NextRequest) {
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

    // 2. Validation de la requête
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validation de limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      logger.warn('Limite invalide', { limit, userId });

      return NextResponse.json(
        { error: 'La limite doit être un nombre entre 1 et 100' },
        { status: 400 }
      );
    }

    // Validation de offset
    if (isNaN(offset) || offset < 0) {
      logger.warn('Offset invalide', { offset, userId });

      return NextResponse.json(
        { error: 'L\'offset doit être un nombre positif ou zéro' },
        { status: 400 }
      );
    }

    logger.info(`Récupération de l'historique pour ${userId}`, {
      conversationId: conversationId || 'toutes',
      limit,
      offset,
    });

    // 3. Récupération depuis Supabase
    let query = supabase
      .from('conversations')
      .select('id, title, created_at, updated_at', { head: true, count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    // Filtrer par conversationId si fourni
    if (conversationId) {
      query = query.eq('id', conversationId);
    }

    // Appliquer pagination
    const { data: conversations, error: convError, count } = await query
      .range(offset, offset + limit - 1);

    if (convError) {
      logger.error('Échec de récupération des conversations', {
        error: convError.message,
        userId,
        conversationId: conversationId || 'toutes',
      });

      return NextResponse.json(
        { error: 'Échec de récupération de l\'historique' },
        { status: 500 }
      );
    }

    // 4. Récupération du nombre de messages par conversation
    const conversationIds = conversations?.map(c => c.id) || [];
    const messageCounts: Record<string, number> = {};

    if (conversationIds.length > 0) {
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('conversation_id, count()')
        .in('conversation_id', conversationIds)
        .group('conversation_id');

      if (msgError) {
        logger.warn('Échec de récupération du count de messages', {
          error: msgError.message,
          userId,
        });
      } else {
        (messages as any[])?.forEach(m => {
          messageCounts[m.conversation_id] = m.count || 0;
        });
      }
    }

    // 5. Formattage de la réponse
    const response: HistoryResponse = {
      conversations: conversations?.map(c => ({
        id: c.id,
        title: c.title || 'Nouvelle conversation',
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        messageCount: messageCounts[c.id] || 0,
      })) || [],
      total: count || 0,
      offset,
      limit,
    };

    logger.info('Historique récupéré avec succès', {
      conversationCount: response.conversations.length,
      total: response.total,
      userId,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    logger.error('Échec du traitement de la requête historique', {
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
export async function getChatHistory(
  conversationId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<HistoryResponse> {
  // Note: In browser environment, use window.location
  // In Node.js environment (tests), this will fail - that's expected
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL('/api/chat/history', baseUrl);
  
  if (conversationId) url.searchParams.set('conversationId', conversationId);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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
