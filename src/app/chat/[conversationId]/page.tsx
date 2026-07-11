'use client'

/**
 * Page pour une conversation spécifique
 * Affiche les messages d'une conversation donnée
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { use } from 'react'
import { useConversations } from '@/components/Conversations'
import { ChatInput, ChatMessageList } from '@/components/Chat'
import { ConversationHeader } from '@/components/Conversation'
import type { ChatMessageData } from '@/components/Chat'

/**
 * Page de conversation dynamique
 * Reçoit conversationId depuis les params d'URL
 */
export default function ConversationPage({
  params
}: {
  params: Promise<{ conversationId: string }>
}) {
  // Résolu directement depuis l'URL via `use()` — disponible dès le rendu
  // serveur, contrairement à `currentConversationId` du contexte qui n'est
  // peuplé qu'après un effet côté client (usePathname dans le layout). Utiliser
  // ce dernier ici produisait un mismatch d'hydratation sur les `disabled` de
  // ConversationHeader (serveur : null → désactivé ; client déjà navigué :
  // déjà résolu → activé).
  const { conversationId } = use(params)

  const {
    currentMessages,
    conversationStates,
    isLoading,
    error,
    onSendMessage,
    onRenameConversation,
    onDeleteConversation,
    getFiltersForConversation,
  } = useConversations()

  // Obtenir les filtres pour la conversation active
  const filters = getFiltersForConversation(conversationId)

  // Gérer l'envoi de message
  const handleSend = async (content: string) => {
    await onSendMessage(conversationId, content, filters)
  }

  // Gérer le renommage
  const handleRename = async (newTitle: string) => {
    await onRenameConversation(conversationId, newTitle)
  }

  // Gérer la suppression
  const handleDelete = async () => {
    await onDeleteConversation(conversationId)
  }

  // Obtenir l'état de chargement pour cette conversation
  const conversationState = conversationStates[conversationId] ?? null

  const messages: ChatMessageData[] = currentMessages

  return (
    <div className="flex flex-col h-full">
      {/* Header de la conversation */}
      <ConversationHeader
        conversationId={conversationId}
        title={conversationState?.conversation?.title || 'Chargement...'}
        onRename={handleRename}
        onDelete={handleDelete}
        isLoading={conversationState?.isLoading}
      />

      {/* Liste des messages — conteneur entre le header et le footer */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {isLoading && currentMessages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-chat-ink-muted">Chargement des messages...</div>
          </div>
        ) : error ? (
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

      {/* Input de chat */}
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
          disabled={conversationState?.isLoading ?? false}
        />
        <p className="mt-3 text-center text-[11.5px] text-chat-ink-faint">
          NexiaMind peut faire des erreurs. Vérifiez les sources citées.
        </p>
      </div>
    </div>
  )
}
