/**
 * Chat API client pour lib/api
 * Mirror de src/components/Chat/api.ts pour une meilleure organisation
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import type { RawSource } from '@/types/citations'
import type { 
  ConversationMessage, 
  MessagesResponse, 
  RenameConversationResponse, 
  DeleteConversationResponse,
  HistoryResponse 
} from '@/types/conversations'
import type { Filters } from '@/types/filters'

export interface SendMessageResponse {
  id: string
  conversationId: string
  role: 'assistant'
  content: string
  formattedContent?: string
  sources?: RawSource[]
  metadata: {
    model: string
    tokensUsed: number
    processingTime: number
    timestamp: string
  }
}

// Timeout pour les requêtes API (10 secondes)
const API_TIMEOUT = 10000

async function parseErrorMessage(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({}))
  return errorData.error || response.statusText
}

/**
 * Envoyer un message
 * Appelle POST /api/chat/message
 */
export async function sendMessage(
  message: string,
  conversationId?: string,
  filters?: Filters
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

/**
 * Récupérer l'historique des conversations
 * Appelle GET /api/chat/history
 */
export async function getHistory(limit = 50, offset = 0): Promise<HistoryResponse> {
  const url = `/api/chat/history?limit=${limit}&offset=${offset}`
  
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

/**
 * Récupérer tous les messages d'une conversation spécifique
 * Appelle GET /api/chat/messages?conversationId=...
 */
export async function getConversationMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<MessagesResponse> {
  const url = `/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}&limit=${limit}&offset=${offset}`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes')
    }
    throw error
  }
}

/**
 * Renommer une conversation
 * Appelle PATCH /api/conversations/{id}/rename
 */
export async function renameConversation(
  conversationId: string,
  newTitle: string
): Promise<RenameConversationResponse> {
  const url = `/api/conversations/${encodeURIComponent(conversationId)}/rename`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes')
    }
    throw error
  }
}

/**
 * Supprimer une conversation
 * Appelle DELETE /api/conversations/{id}
 */
export async function deleteConversation(
  conversationId: string
): Promise<DeleteConversationResponse> {
  const url = `/api/conversations/${encodeURIComponent(conversationId)}`
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT)

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response))
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Requête timeout après 10 secondes')
    }
    throw error
  }
}

// Re-export des types
export type { 
  ConversationMessage, 
  MessagesResponse, 
  RenameConversationResponse, 
  DeleteConversationResponse,
  HistoryResponse 
}
