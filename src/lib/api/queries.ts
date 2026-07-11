"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Conversation, Message } from '@/types/conversations'
import type { SourceCitation } from '@/types/citations'

/**
 * Hooks React Query personnalisés pour NexiaMind AI
 * Fait partie de ST-309: Optimiser les Performances Frontend
 */

// ============================================================================
// Types pour les réponses API
// ============================================================================

interface ChatMessageResponse {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: SourceCitation[]
  createdAt?: string
}

interface ConversationResponse extends Conversation {
  messages?: ChatMessageResponse[]
}

// ============================================================================
// Hooks pour les Conversations
// ============================================================================

/**
 * Hook pour récupérer les conversations d'un utilisateur
 * Cache: 5 minutes, GC: 10 minutes
 */
export function useConversationsQuery(userId: string) {
  return useQuery<ConversationResponse[], Error>({
    queryKey: ['conversations', userId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations?userId=${userId}`)
      
      if (!response.ok) {
        throw new Error(`Échec du chargement des conversations: ${response.status}`)
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

/**
 * Hook pour récupérer une conversation spécifique
 * Cache: 1 minute, GC: 5 minutes
 */
export function useConversationQuery(conversationId: string) {
  return useQuery<ConversationResponse, Error>({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}`)
      
      if (!response.ok) {
        throw new Error(`Échec du chargement de la conversation: ${response.status}`)
      }
      
      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !!conversationId, // Ne pas exécuter si conversationId est vide
  })
}

/**
 * Hook pour créer une nouvelle conversation
 */
export function useCreateConversationMutation() {
  return useMutation<ConversationResponse, Error, { title?: string }>({
    mutationFn: async (variables) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variables),
      })
      
      if (!response.ok) {
        throw new Error(`Échec de la création de la conversation: ${response.status}`)
      }
      
      return response.json()
    },
  })
}

/**
 * Hook pour renommer une conversation
 */
export function useRenameConversationMutation() {
  return useMutation<ConversationResponse, Error, { id: string; title: string }>({
    mutationFn: async ({ id, title }) => {
      const response = await fetch(`/api/conversations/${id}/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      
      if (!response.ok) {
        throw new Error(`Échec du renommage de la conversation: ${response.status}`)
      }
      
      return response.json()
    },
  })
}

/**
 * Hook pour supprimer une conversation
 */
export function useDeleteConversationMutation() {
  return useMutation<void, Error, string>({
    mutationFn: async (conversationId) => {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Échec de la suppression de la conversation: ${response.status}`)
      }
    },
  })
}

// ============================================================================
// Hooks pour les Messages
// ============================================================================

/**
 * Hook pour envoyer un message et recevoir une réponse
 * Cache: désactivé (toujours frais)
 */
export function useSendMessageMutation() {
  const queryClient = useQueryClient()
  
  return useMutation<ChatMessageResponse, Error, { 
    conversationId: string
    message: string
  }>({
    mutationFn: async ({ conversationId, message }) => {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, message }),
      })
      
      if (!response.ok) {
        throw new Error(`Échec de l'envoi du message: ${response.status}`)
      }
      
      return response.json()
    },
    // Invalider le cache de la conversation après l'envoi
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.conversationId],
      })
      queryClient.invalidateQueries({
        queryKey: ['conversations'],
      })
    },
  })
}

/**
 * Hook pour récupérer l'historique des messages d'une conversation
 * Cache: 1 minute, GC: 5 minutes
 */
export function useMessagesQuery(conversationId: string) {
  return useQuery<ChatMessageResponse[], Error>({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`)
      
      if (!response.ok) {
        throw new Error(`Échec du chargement des messages: ${response.status}`)
      }
      
      return response.json()
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    enabled: !!conversationId,
  })
}

// ============================================================================
// Hooks pour les Sources
// ============================================================================

/**
 * Hook pour rafraîchir les sources (indexation)
 */
export function useRefreshSourcesMutation() {
  return useMutation<void, Error, { sourceId?: string }>({
    mutationFn: async ({ sourceId } = {}) => {
      const url = sourceId 
        ? `/api/sources/${sourceId}/refresh`
        : '/api/sources/supabase/sync'
      
      const response = await fetch(url, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error(`Échec du rafraîchissement des sources: ${response.status}`)
      }
    },
  })
}

// ============================================================================
// Utilitaires
// ============================================================================

/**
 * Hook pour invalider manuellement le cache
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return {
    invalidateConversations: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
    invalidateConversation: (conversationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
    },
    invalidateMessages: (conversationId: string) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
    },
    removeQueries: (queryKey: string[]) => {
      queryClient.removeQueries({ queryKey })
    },
  }
}

// ============================================================================
// Barrel Export
// ============================================================================

export {
  QueryClient,
} from '@tanstack/react-query'
