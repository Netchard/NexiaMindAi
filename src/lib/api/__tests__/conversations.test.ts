/**
 * Tests unitaires pour lib/api/conversations.ts
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { vi } from 'vitest'
import {
  getConversations,
  getConversationMessages,
  createNewConversation,
  renameConversation,
  deleteConversation,
  sendMessageInConversation,
  invalidateConversationsCache,
  getConversationsCache,
  setConversationsCache,
} from '../conversations'

// Mock de fetch
global.fetch = vi.fn()

// Mock de supabase pour createNewConversation qui utilise POST /api/chat/message
const mockFetchResponse = (data: any, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  })
}

describe('lib/api/conversations.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConversations', () => {
    it('AC #3 - devrait retourner la liste des conversations', async () => {
      const mockConversations = {
        conversations: [
          { id: 'conv-1', title: 'Test 1', createdAt: '2024-01-01', updatedAt: '2024-01-02', messageCount: 5 },
          { id: 'conv-2', title: 'Test 2', createdAt: '2024-01-03', updatedAt: '2024-01-04', messageCount: 3 },
        ],
        total: 2,
        offset: 0,
        limit: 50,
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockConversations))

      const result = await getConversations()

      expect(global.fetch).toHaveBeenCalledWith('/api/chat/history?limit=50&offset=0', expect.anything())
      expect(result.conversations.length).toBe(2)
      expect(result.total).toBe(2)
    })

    it('AC #3 - devrait utiliser le cache si disponible', async () => {
      const mockConversations = {
        conversations: [],
        total: 0,
        offset: 0,
        limit: 50,
      }

      // Premièrement, remplir le cache
      invalidateConversationsCache() // Invalider le cache avant le test
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse({
        conversations: [{ id: 'conv-1', title: 'Cached', createdAt: '2024-01-01', updatedAt: '2024-01-01', messageCount: 1 }],
        total: 1,
        offset: 0,
        limit: 50,
      }))

      await getConversations()

      // Deuxièmement, appeler à nouveau - devrait utiliser le cache
      global.fetch.mockClear()

      const result = await getConversations()

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.conversations.length).toBe(1)
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache() // Invalider le cache pour s'assurer que fetch est appelé
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Erreur serveur' },
        500
      ))

      await expect(getConversations()).rejects.toThrow()
    })
  })

  describe('getConversationMessages', () => {
    it('AC #2 - devrait retourner les messages d\'une conversation', async () => {
      const mockMessages = {
        messages: [
          { id: 'msg-1', conversationId: 'conv-1', content: 'Hello', role: 'user' as const, createdAt: '2024-01-01' },
          { id: 'msg-2', conversationId: 'conv-1', content: 'Hi', role: 'assistant' as const, createdAt: '2024-01-02' },
        ],
        total: 2,
        offset: 0,
        limit: 50,
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockMessages))

      const result = await getConversationMessages('conv-1')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/messages?conversationId=conv-1&limit=50&offset=0',
        expect.anything()
      )
      expect(result.messages.length).toBe(2)
    })

    it('AC #2 - devrait encoder le conversationId', async () => {
      const mockMessages = { messages: [], total: 0, offset: 0, limit: 50 }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockMessages))

      await getConversationMessages('conv with spaces')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/messages?conversationId=conv%20with%20spaces&limit=50&offset=0',
        expect.anything()
      )
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache()
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Conversation non trouvée' },
        404
      ))

      await expect(getConversationMessages('invalid-id')).rejects.toThrow()
    })
  })

  describe('createNewConversation', () => {
    it('AC #1 - devrait créer une nouvelle conversation vide via POST /api/conversations', async () => {
      const mockResponse = {
        conversation: {
          id: 'new-conv-123',
          title: 'Premier message',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await createNewConversation('Premier message')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Premier message' }),
        })
      )
      expect(result.conversationId).toBe('new-conv-123')
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache()
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Message vide' },
        400
      ))

      await expect(createNewConversation('')).rejects.toThrow()
    })
  })

  describe('renameConversation', () => {
    it('AC #5 - devrait renommer une conversation', async () => {
      const mockResponse = {
        conversation: {
          id: 'conv-123',
          title: 'Nouveau titre',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await renameConversation('conv-123', 'Nouveau titre')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-123/rename',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Nouveau titre' }),
        })
      )
      expect(result.conversation.title).toBe('Nouveau titre')
    })

    it('AC #5 - devrait encoder le conversationId', async () => {
      const mockResponse = {
        conversation: {
          id: 'conv-123',
          title: 'Nouveau titre',
          updatedAt: '2024-01-01T10:00:00Z',
        },
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      await renameConversation('conv with spaces', 'Nouveau titre')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv%20with%20spaces/rename',
        expect.anything()
      )
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache()
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Titre trop long' },
        400
      ))

      await expect(renameConversation('conv-123', 'a'.repeat(201))).rejects.toThrow()
    })
  })

  describe('deleteConversation', () => {
    it('AC #6 - devrait supprimer une conversation', async () => {
      const mockResponse = {
        message: 'Conversation deleted successfully',
        conversationId: 'conv-123',
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await deleteConversation('conv-123')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
      expect(result.message).toContain('deleted successfully')
    })

    it('AC #6 - devrait encoder le conversationId', async () => {
      const mockResponse = {
        message: 'Conversation deleted successfully',
        conversationId: 'conv-123',
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      await deleteConversation('conv with spaces')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/conversations/conv%20with%20spaces',
        expect.anything()
      )
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache()
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Conversation non trouvée' },
        404
      ))

      await expect(deleteConversation('invalid-id')).rejects.toThrow()
    })
  })

  describe('sendMessageInConversation', () => {
    it('AC #1 - devrait envoyer un message dans une conversation existante', async () => {
      const mockResponse = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'assistant' as const,
        content: 'Réponse',
        sources: [],
        metadata: {
          model: 'default',
          tokensUsed: 100,
          processingTime: 500,
          timestamp: '2024-01-01T10:00:00Z',
        },
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      const result = await sendMessageInConversation('conv-123', 'Nouveau message')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/message',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Nouveau message',
            conversationId: 'conv-123',
            filters: undefined,
          }),
        })
      )
      expect(result.id).toBe('msg-123')
      expect(result.conversationId).toBe('conv-123')
    })

    it('AC #1 - devrait envoyer les filtres si fournis', async () => {
      const mockResponse = {
        id: 'msg-123',
        conversationId: 'conv-123',
        role: 'assistant' as const,
        content: 'Réponse',
        sources: [],
        metadata: {
          model: 'default',
          tokensUsed: 100,
          processingTime: 500,
          timestamp: '2024-01-01T10:00:00Z',
        },
      }

      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(mockResponse))

      const filters = { theme: 'technique' }
      await sendMessageInConversation('conv-123', 'Nouveau message', filters)

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/chat/message',
        expect.objectContaining({
          body: JSON.stringify({
            message: 'Nouveau message',
            conversationId: 'conv-123',
            filters: { theme: 'technique' },
          }),
        })
      )
    })

    it('AC #13 - devrait gérer les erreurs', async () => {
      invalidateConversationsCache()
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse(
        { error: 'Erreur serveur' },
        500
      ))

      await expect(sendMessageInConversation('conv-123', 'Nouveau message')).rejects.toThrow()
    })
  })

  describe('invalidateConversationsCache', () => {
    it('devrait invalider le cache des conversations', () => {
      // Remplir le cache
      const initialCache = {
        data: [{ id: 'conv-1', title: 'Test', createdAt: '2024-01-01', updatedAt: '2024-01-01', messageCount: 1 }],
        timestamp: Date.now(),
        ttl: 60000,
      }

      // Remplir le cache directement
      setConversationsCache(initialCache)

      expect(getConversationsCache()).not.toBeNull()

      invalidateConversationsCache()

      expect(getConversationsCache()).toBeNull()
    })
  })
})
