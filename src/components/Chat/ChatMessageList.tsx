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
        <h1 className="font-display text-[30px] font-semibold tracking-tight text-chat-ink-strong">
          Posez votre première question
        </h1>
        <p className="max-w-md text-chat-ink-subtle">
          NexiaMind AI cherche dans vos documents, tickets GitLab et bases de connaissance internes.
        </p>
        <div className="flex max-w-xl flex-wrap justify-center gap-2.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-chat-border-soft bg-transparent px-5 py-2.5 text-sm font-medium text-chat-ink-muted transition-all hover:-translate-y-px hover:border-chat-primary hover:bg-[rgba(244,105,63,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary"
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
    // Seul conteneur de scroll de la zone d'échanges — le wrapper dans
    // page.tsx/[conversationId]/page.tsx reste overflow-hidden (borné, ne
    // scrolle pas lui-même) pour que chat-message-list soit l'unique div
    // qui défile entre conversation-header et le composer (voir DESIGN.md >
    // Layout & Spacing).
    <div
      role="log"
      aria-live="polite"
      className="nm-scroll flex-1 flex flex-col gap-1.5 px-2 py-4 overflow-y-auto min-h-0"
      data-testid="chat-message-list"
    >
      {messages.map((message, index) => {
        const next = messages[index + 1]
        const showAvatar = message.role === 'assistant' && (!next || next.role !== 'assistant')
        return (
          <div key={message.id} className="py-1">
            <ChatMessage 
              role={message.role} 
              content={message.content} 
              showAvatar={showAvatar}
              citations={message.citations}
              id={message.id}
            />
            {message.role === 'user' && message.failed && (
              <p className="mt-1 text-right text-xs font-medium text-chat-error-soft">Non envoyé</p>
            )}
          </div>
        )
      })}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}
