import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
// Client admin (service role) : proxy.ts a déjà revalidé la session et injecté
// x-user-id, donc l'autorisation est appliquée en code applicatif (.eq('user_id', ...))
// plutôt que via RLS — voir src/lib/supabase/admin-client.ts.
import { supabase as supabaseServer } from '@/lib/supabase/admin-client';
import {
  retrieveRelevantChunks,
  generateResponse,
  formatResponse,
  RetrievalResult,
  GenerationResult,
  FormattedResponse,
} from '@/lib/rag';
import { Citation } from '@/lib/rag/formatter';

// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack (même dans les API routes)

// Types pour les requêtes et réponses
interface ChatMessageRequest {
  /** Message de l'utilisateur */
  message: string;
  /** ID de la conversation (optionnel pour nouvelle conversation) */
  conversationId?: string;
  /** Filtres de recherche pour le retrieval */
  filters?: {
    theme?: string;
    documentFormat?: string;
    role?: string;
    source?: string;
  };
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

// Utilise le client serveur standardisé
// La validation est déjà faite dans server.ts

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
    let body: ChatMessageRequest;

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

    if (!body.message || typeof body.message !== 'string') {
      console.warn('Message manquant ou invalide', {
        message: body?.message,
        userId,
      });

      return NextResponse.json(
        { error: 'Le champ "message" est obligatoire et doit être une chaîne de caractères' },
        { status: 400 }
      );
    }

    if (body.message.trim() === '') {
      console.warn('Message vide', { userId });

      return NextResponse.json(
        { error: 'Le message ne peut pas être vide' },
        { status: 400 }
      );
    }

    console.info(`Nouveau message de ${userId}`, {
      messageLength: body.message.length,
      conversationId: body.conversationId || 'new',
    });

    // 3. Récupération du contexte conversationnel
    const conversationId = body.conversationId;
    let conversationContext = '';

    if (conversationId) {
      // Récupérer l'historique de la conversation
      // Pas de colonne `user_id` sur `messages` (voir architecture.md:271-282) —
      // le scoping utilisateur se fait via `conversations.user_id`.
      const { data: messages, error: msgError } = await supabaseServer
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.warn('Échec de récupération de l\'historique de la conversation', {
          error: msgError.message,
          conversationId,
          userId,
        });
      } else if (messages && messages.length > 0) {
        conversationContext = messages
          .map((m: any) => `${m.role}: ${m.content}`)
          .join('\n');

        console.info('Contexte conversationnel récupéré', {
          messageCount: messages.length,
          conversationId,
        });
      }
    }

    // 4. Appel retrieveRelevantChunks()
    // N'accepter que les clés de filtre documentées (theme/documentFormat/role/source) —
    // ne jamais transmettre tel quel un body.filters non validé au service de retrieval.
    const ALLOWED_FILTER_KEYS = ['theme', 'documentFormat', 'role', 'source'] as const;
    const sanitizedFilters = body.filters
      ? Object.fromEntries(
          ALLOWED_FILTER_KEYS
            .filter((key) => body.filters![key] !== undefined)
            .map((key) => [key, body.filters![key]])
        )
      : {};

    let retrievalResult: RetrievalResult;

    try {
      retrievalResult = await retrieveRelevantChunks(body.message, {
        ...sanitizedFilters,
        limit: 8,
      });

      console.info('Chunks récupérés', {
        chunkCount: retrievalResult.chunks.length,
        totalChunksScanned: retrievalResult.totalChunksScanned,
      });
    } catch (retrieveError) {
      console.error('Échec de la récupération des chunks', {
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
      // Note: generateResponse n'accepte que userRole, conversationId, temperature, maxTokens
      // Les propriétés model, conversationContext ne sont pas dans le type
      generationResult = await generateResponse(body.message, retrievalResult.chunks, {
        userRole: 'user',
        conversationId: body.conversationId,
        temperature: body.options?.temperature,
        maxTokens: body.options?.maxTokens,
      });

      console.info('Réponse générée', {
        responseLength: generationResult.response.length,
        tokenCount: generationResult.tokenCount,
      });
    } catch (generateError) {
      console.error('Échec de la génération de la réponse', {
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

      console.info('Réponse formatée', {
        citationCount: formatted.citationCount,
        formatTime: formatted.formatTime,
      });
    } catch (formatError) {
      console.error('Échec du formatage de la réponse', {
        error: (formatError as Error).message,
        stack: (formatError as Error).stack,
        userId,
      });

      return NextResponse.json(
        { error: 'Échec du formatage de la réponse' },
        { status: 500 }
      );
    }

    // 7. Créer/mettre à jour la conversation EN PREMIER (nécessaire pour la clé étrangère)
    // `id` doit être un UUID valide (colonne `conversations.id UUID`) — voir
    // architecture.md:256-268.
    const newConversationId = conversationId || randomUUID();

    // Créer ou mettre à jour la conversation AVANT d'insérer les messages
    // `created_at` n'est fourni que pour une conversation réellement nouvelle —
    // sinon l'upsert écraserait la date de création d'origine à chaque message.
    try {
      const { error: convError } = await supabaseServer
        .from('conversations')
        .upsert({
          id: newConversationId,
          user_id: userId,
          title: body.message.substring(0, 100),
          ...(conversationId ? {} : { created_at: new Date().toISOString() }),
          updated_at: new Date().toISOString(),
        });

      if (convError) {
        console.warn('Échec de la mise à jour de la conversation', {
          error: convError.message,
          conversationId: newConversationId,
        });
      }
    } catch (convUpdateError) {
      console.warn('Échec de la mise à jour de la conversation', {
        error: (convUpdateError as Error).message,
        conversationId: newConversationId,
      });
    }

    // Stocker le message utilisateur
    const userMessageId = randomUUID();

    try {
      const { error: userMsgError } = await supabaseServer.from('messages').insert({
        id: userMessageId,
        conversation_id: newConversationId,
        role: 'user',
        content: body.message,
        created_at: new Date().toISOString(),
        metadata: {
          model: body.options?.model || 'default',
          source: 'api',
          tokens: body.message.length,
        },
      });

      if (userMsgError) {
        console.error('Échec du stockage du message utilisateur', {
          error: userMsgError.message,
          userId,
          conversationId: newConversationId,
        });
      } else {
        console.info('Message utilisateur stocké', {
          messageId: userMessageId,
          conversationId: newConversationId,
          userId,
        });
      }
    } catch (storeUserError) {
      console.error('Échec du stockage du message utilisateur', {
        error: (storeUserError as Error).message,
        userId,
        conversationId: newConversationId,
      });
    }

    // Stocker le message assistant
    const assistantMessageId = randomUUID();

    try {
      const { error: assistantMsgError } = await supabaseServer.from('messages').insert({
        id: assistantMessageId,
        conversation_id: newConversationId,
        role: 'assistant',
        content: formatted.formattedContent || generationResult.response,
        created_at: new Date().toISOString(),
        metadata: {
          model: body.options?.model || 'default',
          citations: formatted.citations,
          processingTime: Date.now() - startTime,
          tokenCount: generationResult.tokenCount,
          source: 'rag-pipeline',
        },
      });

      if (assistantMsgError) {
        console.error('Échec du stockage du message assistant', {
          error: assistantMsgError.message,
          userId,
          conversationId: newConversationId,
        });
      } else {
        console.info('Message assistant stocké', {
          messageId: assistantMessageId,
          conversationId: newConversationId,
          citationCount: formatted.citationCount,
          userId,
        });
      }
    } catch (storeAssistantError) {
      console.error('Échec du stockage du message assistant', {
        error: (storeAssistantError as Error).message,
        userId,
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
        tokensUsed: generationResult.tokenCount || 0,
        processingTime,
        timestamp: new Date().toISOString(),
      },
    };

    console.info('Requête chat traitée avec succès', {
      conversationId: newConversationId,
      userId,
      processingTime: `${processingTime}ms`,
      tokensUsed: generationResult.tokenCount || 0,
      citationCount: formatted.citationCount,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Échec du traitement de la requête chat', {
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
