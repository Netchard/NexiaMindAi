'use client'

/**
 * Page par défaut /chat
 * Affiche la conversation active ou redirige vers la plus récente
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useConversations } from '@/components/Conversations'
import { ChatInput, ChatMessageList } from '@/components/Chat'
import { HistoryMenu } from '@/components/Chat'
import type { ChatMessageData } from '@/components/Chat'

/**
 * Page de chat par défaut
 * Si aucune conversation n'est active, crée une nouvelle conversation
 * Sinon, redirige vers la conversation active
 */
export default function ChatPage() {
  const router = useRouter()
  const {
    currentConversationId,
    conversations,
    currentMessages,
    conversationStates,
    isLoading,
    error,
    onSendMessage,
    onSelectConversation,
  } = useConversations()

  // Si une conversation est déjà sélectionnée et que nous sommes sur /chat, rediriger
  // Cela évite la duplication entre /chat et /chat/{id}
  useEffect(() => {
    if (currentConversationId && conversations.length > 0) {
      router.replace(`/chat/${currentConversationId}`)
    }
  }, [currentConversationId, conversations, router])

  // Gérer l'envoi de message — onSendMessage(null, ...) crée la conversation,
  // y navigue et envoie le message lui-même (voir layout.tsx). L'ancienne
  // version appelait onCreateNewConversation() directement puis naviguait
  // sans jamais transmettre `content` : le message tapé était perdu en
  // silence pour toute première question depuis l'état vide/chargement.
  const handleSend = async (content: string) => {
    await onSendMessage(null, content, {})
  }

  // Obtenir l'état de la conversation active (si elle existe)
  const conversationState = currentConversationId 
    ? conversationStates[currentConversationId]
    : null

  const messages: ChatMessageData[] = currentMessages

  // Si on est en train de charger et qu'il n'y a pas encore de conversation
  if (isLoading && conversations.length === 0 && currentConversationId === null) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-none border-b border-chat-border-header h-[60px] px-5 bg-chat-surface-panel">
          <div className="flex items-center justify-between max-w-full h-full">
            <span className="text-[15px] font-semibold text-chat-ink-strong">NexiaMind AI</span>
            {conversations.length > 0 && (
              <HistoryMenu 
                conversations={conversations.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
                onSelect={onSelectConversation}
              />
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-y-auto">
          <div className="text-chat-ink-muted">Chargement des conversations...</div>
        </div>
        <div className="flex-none border-t border-chat-border-header p-4 bg-chat-surface-panel">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </div>
    )
  }

  // Si aucune conversation n'existe, afficher un état vide
  if (!isLoading && conversations.length === 0 && currentConversationId === null) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-none border-b border-chat-border-header h-[60px] px-5 bg-chat-surface-panel">
          <div className="flex items-center justify-between max-w-full h-full">
            <span className="text-[15px] font-semibold text-chat-ink-strong">NexiaMind AI</span>
            {conversations.length > 0 && (
              <HistoryMenu 
                conversations={conversations.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
                onSelect={onSelectConversation}
              />
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-6 text-center overflow-y-auto">
          <h1 className="font-display text-[30px] font-semibold tracking-tight text-chat-ink-strong">
            Aucune conversation
          </h1>
          <p className="max-w-md text-chat-ink-subtle">
            Commencez une nouvelle discussion avec NexiaMind AI
          </p>
        </div>
        <div className="flex-none border-t border-chat-border-header p-4 bg-chat-surface-panel">
          <ChatInput onSend={handleSend} disabled={false} />
        </div>
      </div>
    )
  }

  // Si nous avons une conversation active, c'est que le layout a déjà chargé les messages
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-none border-b border-chat-border-header h-[60px] px-5 bg-chat-surface-panel">
        <div className="flex items-center justify-between max-w-full h-full">
          <span className="text-[15px] font-semibold text-chat-ink-strong">NexiaMind AI</span>
          <HistoryMenu
            conversations={conversations.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
            onSelect={onSelectConversation}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {error ? (
          <div
            role="alert"
            className="flex flex-1 items-center justify-center text-chat-error-soft"
          >
            {error}
          </div>
        ) : (
          <ChatMessageList
            messages={messages}
            isTyping={conversationState?.isLoading ?? false}
            onSuggestionClick={handleSend}
          />
        )}
      </div>

      <div className="flex-none border-t border-chat-border-header p-4 bg-chat-surface-panel">
        {conversationState?.error && (
          <div
            role="alert"
            className="mb-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft"
          >
            {conversationState.error}
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
        />
      </div>
    </div>
  )
}
