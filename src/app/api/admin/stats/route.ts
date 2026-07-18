/**
 * Endpoint GET /api/admin/stats
 * Récupère les statistiques d'utilisation pour l'administration
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/api/auth/service';
import { supabase as supabaseServer } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// Types pour les réponses
interface UsageStats {
  conversations: number;
  messages: number;
  tokensUsed: number;
}

interface StatsResponse {
  general: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
  };
  byPeriod: {
    today: UsageStats;
    last7Days: UsageStats;
    last30Days: UsageStats;
  };
  byClient?: Record<string, UsageStats>;
}

// Utilise le client serveur standardisé
// La validation est déjà faite dans server.ts

/**
 * Récupère les statistiques pour une période donnée
 */
interface MessageWithTokens {
  tokensUsed?: string | null;
}

async function getPeriodStats(startDate: string, endDate: string): Promise<UsageStats> {
  const [conversations, messages, tokens] = await Promise.all([
    supabaseServer
      .from('conversations')
      .select('id', { head: true, count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabaseServer
      .from('messages')
      .select('id', { head: true, count: 'exact' })
      .gte('created_at', startDate)
      .lte('created_at', endDate),
    supabaseServer
      .from('messages')
      .select('metadata->>tokensUsed')
      .gte('created_at', startDate)
      .lte('created_at', endDate),
  ]);

  const tokensUsed = (tokens.data as MessageWithTokens[])?.reduce((sum, m) => {
    return sum + (parseInt(m.tokensUsed || '0') || 0);
  }, 0) || 0;

  return {
    conversations: conversations.count || 0,
    messages: messages.count || 0,
    tokensUsed,
  };
}

/**
 * Endpoint GET /api/admin/stats
 * Récupère les statistiques d'utilisation
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

    // 2. Vérification autorisation (admin uniquement)
    const isAdmin = await AuthService.isAdminByUserId(userId);
    
    if (!isAdmin) {
      logger.warn('Accès refusé - droits administrateur requis', {
        userId,
        path: request.nextUrl.pathname,
      });

      return NextResponse.json(
        { error: 'Accès refusé - droits administrateur requis' },
        { status: 403 }
      );
    }

    logger.info(`Récupération des statistiques par ${userId}`);

    // 3. Calcul des statistiques
    try {
      // Stats générales
      const [
        usersResult,
        conversationsResult,
        messagesResult,
        tokensResult,
      ] = await Promise.all([
        supabaseServer.from('profiles').select('id', { head: true, count: 'exact' }),
        supabaseServer.from('conversations').select('id', { head: true, count: 'exact' }),
        supabaseServer.from('messages').select('id', { head: true, count: 'exact' }),
        supabaseServer.from('messages').select('metadata->>tokensUsed'),
      ]);

      const totalUsers = usersResult.count || 0;
      const totalConversations = conversationsResult.count || 0;
      const totalMessages = messagesResult.count || 0;
      const totalTokensUsed = (tokensResult.data as MessageWithTokens[])?.reduce((sum, m) => {
        return sum + (parseInt(m.tokensUsed || '0') || 0);
      }, 0) || 0;

      // Stats par période
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [todayStats, last7DaysStats, last30DaysStats] = await Promise.all([
        getPeriodStats(today, today),
        getPeriodStats(sevenDaysAgo, today),
        getPeriodStats(thirtyDaysAgo, today),
      ]);

      interface MessageWithClient {
        client?: string | null;
      }

      // Stats par client (optionnel)
      // Stats par client - En Supabase v2, on utilise une requête RPC ou on utilise count
      // sans group pour éviter l'erreur TypeScript. On utilise une approche alternative.
      const { data: allMessages, error: clientError } = await supabaseServer
      .from('messages')
      .select('metadata->>client')

      const byClientStats: Record<string, UsageStats> = {}
      allMessages?.forEach((msg: MessageWithClient) => {
        const client = msg.client || 'unknown'
        if (!byClientStats[client]) {
          byClientStats[client] = { conversations: 0, messages: 0, tokensUsed: 0 }
        }
        byClientStats[client].messages++
      })

      // 4. Formattage de la réponse
      const response: StatsResponse = {
        general: {
          totalUsers,
          totalConversations,
          totalMessages,
          totalTokensUsed,
        },
        byPeriod: {
          today: todayStats,
          last7Days: last7DaysStats,
          last30Days: last30DaysStats,
        },
        byClient: Object.keys(byClientStats).length > 0 ? byClientStats : undefined,
      };

      logger.info('Statistiques récupérées avec succès', {
        userId,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return NextResponse.json(response, { status: 200 });

    } catch (statsError: any) {
      logger.error('Échec du calcul des statistiques', {
        error: statsError.message,
        stack: statsError.stack,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec du calcul des statistiques', details: statsError.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    logger.error('Échec du traitement de la requête de statistiques', {
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
