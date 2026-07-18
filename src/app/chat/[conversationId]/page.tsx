'use client'

/**
 * Page pour une conversation spécifique
 * Affiche les messages d'une conversation donnée
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { use, useEffect } from 'react'
import { useConversations } from '@/components/Conversations'
import { ChatInput, ChatMessageList } from '@/components/Chat'
import { ConversationHeader } from '@/components/Conversation'
import type { ChatMessageData } from '@/components/Chat'
import { readAndClearPendingMessage } from '@/lib/utils/pendingMessage'

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
    conversations,
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

  // Consomme un message laissé en attente par l'accueil (`/`, puces de
  // suggestion — voir src/app/page.tsx) : createNewConversation() y crée la
  // conversation puis stocke le texte en sessionStorage avant de naviguer ici,
  // faute d'accès au contexte ConversationsProvider depuis une route hors
  // /chat/*. On réutilise l'UI optimiste/erreur déjà correcte du contexte
  // (onSendMessage) plutôt que de la dupliquer sur l'accueil — voir I/O matrix
  // du spec : onSendMessage(id, texte, {}) une fois au montage, entrée supprimée.
  //
  // Attend `!isLoading` avant d'envoyer : loadInitialData (chat/layout.tsx)
  // appelle loadConversationMessages() en parallèle au montage, qui ÉCRASE
  // entièrement conversationStates[conversationId] avec la réponse serveur
  // (liste encore vide pour une conversation tout juste créée). Envoyer avant
  // que ce chargement initial soit réglé ferait disparaître le message
  // optimiste sous l'écrasement — isLoading ne repasse à false qu'une fois ce
  // chargement terminé (voir finally de loadInitialData).
  useEffect(() => {
    if (isLoading) return
    const pendingMessage = readAndClearPendingMessage(conversationId)
    if (!pendingMessage) return
    onSendMessage(conversationId, pendingMessage, {})
    // Ne doit s'exécuter qu'une fois par arrivée sur cette conversation — pas
    // à chaque changement de onSendMessage (identité stable côté contexte, mais
    // volontairement omis pour éviter tout risque de second envoi ; la clé
    // sessionStorage est de toute façon retirée dès la première exécution).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isLoading])

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
    <div className="flex flex-col h-full min-h-0">
      {/* Header de la conversation */}
      <ConversationHeader
        conversationId={conversationId}
        title={conversationState?.conversation?.title || 'Chargement...'}
        onRename={handleRename}
        onDelete={handleDelete}
        isLoading={conversationState?.isLoading}
        conversations={conversations}
      />

      {/* Liste des messages — conteneur entre le header et le footer ; ne
          scrolle pas lui-même, ChatMessageList (data-testid=chat-message-list)
          est l'unique div qui défile ici. */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
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
      </div>
    </div>
  )
}
