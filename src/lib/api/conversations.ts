/**
 * Conversations API client (frontend-only)
 * Gère les opérations spécifiques aux conversations
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import type {
  Conversation,
  ConversationMessage,
  MessagesResponse,
  HistoryResponse,
  RenameConversationResponse,
  DeleteConversationResponse,
  Filters,
} from '@/types/conversations';

// Cache simple pour les conversations (1 minute TTL)
// Utilisation d'un objet mutable pour permettre l'accès depuis les tests
const cacheContainer = {
  conversationsCache: null as {
    data: Conversation[];
    timestamp: number;
    ttl: number;
  } | null,
};

// Exporté pour les tests - @internal
export function getConversationsCache() {
  return cacheContainer.conversationsCache;
}

// Exporté pour les tests - @internal  
export function setConversationsCache(cache: typeof cacheContainer.conversationsCache) {
  cacheContainer.conversationsCache = cache;
}

const CACHE_TTL = 60 * 1000; // 1 minute
const API_TIMEOUT = 10 * 1000; // 10 secondes

/**
 * Invalide le cache des conversations
 * À appeler après toute modification (nouvelle conversation, renommage, suppression)
 */
export function invalidateConversationsCache(): void {
  cacheContainer.conversationsCache = null;
}

/**
 * Récupère la liste des conversations de l'utilisateur
 * Appelle GET /api/chat/history
 * Utilise un cache simple pour éviter les recharges inutiles
 */
export async function getConversations(
  limit = 50,
  offset = 0,
  forceRefresh = false
): Promise<HistoryResponse> {
  // Retourner les données en cache si disponibles et non expirées
  if (!forceRefresh && cacheContainer.conversationsCache) {
    const now = Date.now();
    if (now - cacheContainer.conversationsCache.timestamp < cacheContainer.conversationsCache.ttl) {
      return {
        conversations: cacheContainer.conversationsCache.data,
        total: cacheContainer.conversationsCache.data.length,
        offset: 0,
        limit: cacheContainer.conversationsCache.data.length,
      };
    }
  }

  const url = `/api/chat/history?limit=${limit}&offset=${offset}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();

    // Mettre à jour le cache
    cacheContainer.conversationsCache = {
      data: result.conversations,
      timestamp: Date.now(),
      ttl: CACHE_TTL,
    };

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    // Si le cache existe, le retourner même s'il est expiré
    if (cacheContainer.conversationsCache) {
      console.warn('Utilisation du cache après échec de la requête', {
        error: (error as Error)?.message,
      });
      return {
        conversations: cacheContainer.conversationsCache.data,
        total: cacheContainer.conversationsCache.data.length,
        offset: 0,
        limit: cacheContainer.conversationsCache.data.length,
      };
    }
    throw error;
  }
}

/**
 * Récupère tous les messages d'une conversation spécifique
 * Appelle GET /api/chat/messages?conversationId=...
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<MessagesResponse> {
  const url = `/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}&offset=${offset}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || response.statusText);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    throw error;
  }
}

/**
 * Crée une nouvelle conversation
 * Appelle POST /api/conversations pour créer une conversation vide
 * Plus efficace que d'envoyer un message via /api/chat/message
 */
export async function createNewConversation(
  title: string = 'Nouvelle conversation',
  filters?: Filters
): Promise<{ conversationId: string; message?: ConversationMessage }> {
  const url = '/api/conversations';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.details
        ? `${errorData.error || response.statusText} (${errorData.details})`
        : errorData.error || response.statusText;
      throw new Error(message);
    }

    const result = await response.json();

    // Invalider le cache car une nouvelle conversation a été créée
    invalidateConversationsCache();

    // Retourner juste l'ID de la conversation (pas de message initial)
    return {
      conversationId: result.conversation.id,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    throw error;
  }
}

/**
 * Renomme une conversation
 * Appelle PATCH /api/conversations/{id}/rename
 */
export async function renameConversation(
  conversationId: string,
  newTitle: string
): Promise<RenameConversationResponse> {
  const url = `/api/conversations/${encodeURIComponent(conversationId)}/rename`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();

    // Invalider le cache car la conversation a été renommée
    invalidateConversationsCache();

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    throw error;
  }
}

/**
 * Supprime une conversation
 * Appelle DELETE /api/conversations/{id}
 */
export async function deleteConversation(
  conversationId: string
): Promise<DeleteConversationResponse> {
  const url = `/api/conversations/${encodeURIComponent(conversationId)}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();

    // Invalider le cache car la conversation a été supprimée
    invalidateConversationsCache();

    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    throw error;
  }
}

/**
 * Envoyer un message dans une conversation existante
 * Appelle POST /api/chat/message avec conversationId
 */
export async function sendMessageInConversation(
  conversationId: string,
  message: string,
  filters?: Filters
): Promise<ConversationMessage> {
  const url = '/api/chat/message';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        conversationId,
        filters: filters && Object.keys(filters).length > 0 ? filters : undefined,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || response.statusText);
    }

    const result = await response.json();

    return {
      id: result.id,
      conversationId: result.conversationId,
      content: result.content,
      role: result.role,
      sources: result.sources,
      createdAt: result.metadata.timestamp,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes');
    }
    throw error;
  }
}
