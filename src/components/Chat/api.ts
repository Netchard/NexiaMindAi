/**
 * Chat API client (frontend-only, no server-side deps).
 * Mirrors the request/response contracts of src/app/api/chat/{message,history}/route.ts —
 * do not import from those route.ts files directly (see story Dev Notes: they pull in
 * next/server + server-only env vars, which would crash a client bundle on load).
 */

import type { RawSource } from '@/types/citations';
import type { ConversationMessage, MessagesResponse, RenameConversationResponse, DeleteConversationResponse } from '@/types/conversations';

export interface SendMessageResponse {
  id: string
  conversationId: string
  role: 'assistant'
  content: string
  formattedContent?: string
  /**
   * Sources citées dans la réponse, telles que retournées par le backend
   * Tableau de sources brutes à parser côté frontend (ST-305)
   */
  sources?: RawSource[]
  metadata: {
    model: string
    tokensUsed: number
    processingTime: number
    timestamp: string
  }
}

export interface ConversationHistoryItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface HistoryResponse {
  conversations: ConversationHistoryItem[]
  total: number
  offset: number
  limit: number
}

// Re-export types from conversations for convenience
export type { ConversationMessage, MessagesResponse, RenameConversationResponse, DeleteConversationResponse };

async function parseErrorMessage(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({}))
  return errorData.error || response.statusText
}

export async function sendMessage(
  message: string, 
  conversationId?: string,
  filters?: {
    theme?: string;
    documentFormat?: string;
    role?: string;
    source?: string;
  }
): Promise<SendMessageResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      conversationId,
      filters: filters && Object.keys(filters).length > 0 ? filters : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

export async function getHistory(limit = 50, offset = 0): Promise<HistoryResponse> {
  const url = `/api/chat/history?limit=${limit}&offset=${offset}`
  
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

// Timeout pour les requêtes API (10 secondes)
const API_TIMEOUT = 60000;

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
      throw new Error(await parseErrorMessage(response));
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
      throw new Error(await parseErrorMessage(response));
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
      throw new Error(await parseErrorMessage(response));
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
