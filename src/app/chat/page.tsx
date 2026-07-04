'use client'

import { useEffect, useState } from 'react'
import { ChatInput, ChatMessageList, HistoryMenu } from '@/components/Chat'
import type { ChatMessageData, ConversationSummary } from '@/components/Chat'
import { getHistory, sendMessage } from '@/components/Chat/api'

/**
 * Chat Page (ST-303)
 * Access already protected by src/proxy.ts — no guard logic needed here.
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then((history) => {
        setConversations(
          history.conversations.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
        )
      })
      .catch(() => {
        // L'historique reste vide dans le menu ; la conversation en cours n'est pas affectée.
      })
  }, [])

  const handleSend = async (content: string) => {
    setError(null)
    const userMessage: ChatMessageData = { id: `local_${Date.now()}`, role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)

    try {
      const response = await sendMessage(content, conversationId)
      setConversationId(response.conversationId)
      setMessages((prev) => [
        ...prev,
        { id: response.id, role: 'assistant', content: response.content },
      ])
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m))
      )
      setError("Échec de l'envoi du message. Réessayez.")
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectConversation = (selectedId: string) => {
    // Aucun endpoint n'expose le contenu des messages d'une conversation passée
    // (GET /api/chat/history ne renvoie que des résumés) — on reprend la
    // conversation (les nouveaux messages s'y rattachent) sans pouvoir réafficher
    // son historique de messages.
    setConversationId(selectedId)
    setMessages([])
    setError(null)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-chat-lg border border-chat-border bg-chat-surface-card dark:border-chat-border-dark dark:bg-chat-surface-card-dark">
      <div className="flex items-center justify-between border-b border-chat-border px-4 py-3 dark:border-chat-border-dark">
        <span className="font-semibold text-chat-ink dark:text-chat-ink-dark">NexiaMind AI</span>
        <HistoryMenu conversations={conversations} onSelect={handleSelectConversation} />
      </div>

      <ChatMessageList messages={messages} isTyping={isSending} onSuggestionClick={handleSend} />

      <div className="border-t border-chat-border p-4 dark:border-chat-border-dark">
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-chat-sm border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error dark:border-transparent dark:bg-chat-error-surface-dark dark:text-chat-error-dark"
          >
            {error}
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isSending} />
      </div>
    </div>
  )
}
