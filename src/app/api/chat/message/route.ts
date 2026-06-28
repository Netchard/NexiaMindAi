import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import {
  retrieveRelevantChunks,
  generateResponse,
  formatResponse,
  RetrievalResult,
  GenerationResult,
  FormattedResponse,
} from '@/lib/rag';
import { Citation } from '@/lib/rag/formatter';

// Types pour les requêtes et réponses
interface ChatMessageRequest {
  /** Message de l'utilisateur */
  message: string;
  /** ID de la conversation (optionnel pour nouvelle conversation) */
  conversationId?: string;
  /** Options supplémentaires */
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  };
}

interface ChatMessageResponse {
  /** ID du message */
  id: string;
  /** ID de la conversation */
  conversationId: string;
  /** Rôle (user ou assistant) */
  role: 'user' | 'assistant';
  /** Contenu du message */
  content: string;
  /** Réponse formatée (avec citations) */
  formattedContent?: string;
  /** Liste des citations */
  citations?: Citation[];
  /** Métadonnées */
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    timestamp: string;
  };
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
 * Endpoint POST /api/chat/message
 * Traite les messages utilisateurs et retourne les réponses du pipeline RAG
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification de l'utilisateur (déjà authentifié par le middleware)
    // Le middleware ajoute x-user-id dans les headers
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

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
    let body: ChatMessageRequest;

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

    if (!body.message || typeof body.message !== 'string') {
      logger.warn('Message manquant ou invalide', {
        message: body?.message,
        userId,
      });

      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (body.message.trim() === '') {
      logger.warn('Message vide', { userId });

      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    logger.info(`Nouveau message de ${userId}`, {
      messageLength: body.message.length,
      conversationId: body.conversationId || 'new',
    });

    // 3. Récupération du contexte conversationnel
    const conversationId = body.conversationId;
    let conversationContext = '';

    if (conversationId) {
      // Récupérer l'historique de la conversation
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (msgError) {
        logger.warn('Échec de récupération de l\'historique de la conversation', {
          error: msgError.message,
          conversationId,
          userId,
        });
      } else if (messages && messages.length > 0) {
        conversationContext = messages
          .map((m: any) => `${m.role}: ${m.content}`)
          .join('\n');

        logger.info('Contexte conversationnel récupéré', {
          messageCount: messages.length,
          conversationId,
        });
      }
    }

    // 4. Appel retrieveRelevantChunks()
    let retrievalResult: RetrievalResult;

    try {
      retrievalResult = await retrieveRelevantChunks(body.message, {
        client: 'nexia',
        userId,
        limit: 5,
      });

      logger.info('Chunks récupérés', {
        chunkCount: retrievalResult.chunks.length,
        totalChunks: retrievalResult.totalChunks,
      });
    } catch (retrieveError) {
      logger.error('Échec de la récupération des chunks', {
        error: (retrieveError as Error).message,
        stack: (retrieveError as Error).stack,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec de la récupération des informations pertinentes' },
        { status: 500 }
      );
    }

    // 5. Appel generateResponse()
    let generationResult: GenerationResult;

    try {
      generationResult = await generateResponse(body.message, retrievalResult.chunks, {
        userRole: 'user',
        conversationContext: conversationContext || undefined,
        model: body.options?.model || 'default',
        temperature: body.options?.temperature,
        maxTokens: body.options?.maxTokens,
      });

      logger.info('Réponse générée', {
        responseLength: generationResult.response.length,
        tokensUsed: generationResult.tokensUsed,
      });
    } catch (generateError) {
      logger.error('Échec de la génération de la réponse', {
        error: (generateError as Error).message,
        stack: (generateError as Error).stack,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec de la génération de la réponse' },
        { status: 500 }
      );
    }

    // 6. Appel formatResponse()
    let formatted: FormattedResponse;

    try {
      formatted = await formatResponse(generationResult.response, retrievalResult.chunks);

      logger.info('Réponse formatée', {
        citationCount: formatted.citationCount,
        formatTime: formatted.formatTime,
      });
    } catch (formatError) {
      logger.error('Échec du formatage de la réponse', {
        error: (formatError as Error).message,
        stack: (formatError as Error).stack,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec du formatage de la réponse' },
        { status: 500 }
      );
    }

    // 7. Stockage du message assistant dans la base
    const newConversationId = conversationId || `conv_${Date.now()}_${userId}`;

    // Stocker le message utilisateur
    const userMessageId = `msg_${Date.now()}_user_${userId}`;

    try {
      const { error: userMsgError } = await supabase.from('messages').insert({
        id: userMessageId,
        conversation_id: newConversationId,
        role: 'user',
        content: body.message,
        user_id: userId,
        metadata: {
          model: body.options?.model || 'default',
          source: 'api',
          tokens: body.message.length,
        },
      });

      if (userMsgError) {
        logger.error('Échec du stockage du message utilisateur', {
          error: userMsgError.message,
          userId,
          conversationId: newConversationId,
        });
      } else {
        logger.info('Message utilisateur stocké', {
          messageId: userMessageId,
          conversationId: newConversationId,
          userId,
        });
      }
    } catch (storeUserError) {
      logger.error('Échec du stockage du message utilisateur', {
        error: (storeUserError as Error).message,
        userId,
        conversationId: newConversationId,
      });
    }

    // Stocker le message assistant
    const assistantMessageId = `msg_${Date.now() + 1}_assistant_${userId}`;

    try {
      const { error: assistantMsgError } = await supabase.from('messages').insert({
        id: assistantMessageId,
        conversation_id: newConversationId,
        role: 'assistant',
        content: formatted.formattedContent || generationResult.response,
        user_id: userId,
        metadata: {
          model: body.options?.model || 'default',
          citations: formatted.citations,
          processingTime: Date.now() - startTime,
          tokensUsed: generationResult.tokensUsed,
          source: 'rag-pipeline',
        },
      });

      if (assistantMsgError) {
        logger.error('Échec du stockage du message assistant', {
          error: assistantMsgError.message,
          userId,
          conversationId: newConversationId,
        });
      } else {
        logger.info('Message assistant stocké', {
          messageId: assistantMessageId,
          conversationId: newConversationId,
          citationCount: formatted.citationCount,
          userId,
        });
      }
    } catch (storeAssistantError) {
      logger.error('Échec du stockage du message assistant', {
        error: (storeAssistantError as Error).message,
        userId,
        conversationId: newConversationId,
      });
    }

    // Mettre à jour la conversation (upsert pour créer ou mettre à jour)
    try {
      const { error: convError } = await supabase
        .from('conversations')
        .upsert({
          id: newConversationId,
          user_id: userId,
          title: body.message.substring(0, 100),
          updated_at: new Date().toISOString(),
        });

      if (convError) {
        logger.warn('Échec de la mise à jour de la conversation', {
          error: convError.message,
          conversationId: newConversationId,
        });
      }
    } catch (convUpdateError) {
      logger.warn('Échec de la mise à jour de la conversation', {
        error: (convUpdateError as Error).message,
        conversationId: newConversationId,
      });
    }

    // 8. Retour de la réponse
    const processingTime = Date.now() - startTime;

    const response: ChatMessageResponse = {
      id: assistantMessageId,
      conversationId: newConversationId,
      role: 'assistant',
      content: generationResult.response,
      formattedContent: formatted.formattedContent,
      citations: formatted.citations,
      metadata: {
        model: body.options?.model || 'default',
        tokensUsed: generationResult.tokensUsed,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    logger.info('Requête chat traitée avec succès', {
      conversationId: newConversationId,
      userId,
      processingTime: `${processingTime}ms`,
      tokensUsed: generationResult.tokensUsed,
      citationCount: formatted.citationCount,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    logger.error('Échec du traitement de la requête chat', {
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

// Fonction utilitaire pour appeler l'endpoint
export async function sendChatMessage(
  message: string,
  conversationId?: string,
  options?: ChatMessageRequest['options']
): Promise<ChatMessageResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId, options }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur ${response.status}: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

