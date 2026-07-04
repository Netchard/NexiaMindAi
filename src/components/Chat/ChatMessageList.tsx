'use client'

import { useEffect, useRef } from 'react'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import type { ChatMessageData } from './types'

const SUGGESTIONS = [
  'Quels sont les derniers livrables pour le client Axess ?',
  "Résume l'architecture du module de facturation",
  "Où trouver la doc d'intégration GitLab ?",
]

interface ChatMessageListProps {
  messages: ChatMessageData[]
  isTyping: boolean
  onSuggestionClick: (suggestion: string) => void
}

/**
 * ChatMessageList Component
 * Renders the empty state (with suggested prompts) or the grouped message
 * list, auto-scrolling to the bottom as new messages/typing state arrive.
 */
export default function ChatMessageList({ messages, isTyping, onSuggestionClick }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, isTyping])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-chat-ink dark:text-chat-ink-dark">
          Posez votre première question
        </h1>
        <p className="max-w-md text-chat-ink-muted dark:text-chat-ink-muted-dark">
          NexiaMind AI cherche dans vos documents, tickets GitLab et bases de connaissance internes.
        </p>
        <div className="flex max-w-xl flex-wrap justify-center gap-2.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-chat-border bg-chat-surface-card px-4 py-2.5 text-sm text-chat-ink hover:border-chat-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-ring dark:border-chat-border-dark dark:bg-chat-surface-card-dark dark:text-chat-ink-dark"
              data-testid="chat-suggestion-chip"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      role="log"
      aria-live="polite"
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-2 py-4"
      data-testid="chat-message-list"
    >
      {messages.map((message, index) => {
        const next = messages[index + 1]
        const showAvatar = message.role === 'assistant' && (!next || next.role !== 'assistant')
        return (
          <div key={message.id}>
            <ChatMessage role={message.role} content={message.content} showAvatar={showAvatar} />
            {message.role === 'user' && message.failed && (
              <p className="mt-1 text-right text-xs text-chat-error dark:text-chat-error-dark">Non envoyé</p>
            )}
          </div>
        )
      })}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
