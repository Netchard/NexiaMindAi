'use client'

import { useEffect, useRef, useState } from 'react'
import { History } from './icons'
import type { ConversationSummary } from './types'

interface HistoryMenuProps {
  conversations: ConversationSummary[]
  onSelect: (conversationId: string) => void
}

/**
 * HistoryMenu Component
 * Overlay dropdown listing past conversations — same open/close pattern
 * (outside click, Escape) as src/components/Auth/UserMenu.tsx.
 */
export default function HistoryMenu({ conversations, onSelect }: HistoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-chat-md border border-chat-border px-3 py-1.5 text-sm text-chat-ink-muted hover:text-chat-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-ring dark:border-chat-border-dark dark:text-chat-ink-muted-dark dark:hover:text-chat-ink-dark"
        aria-label="Historique des conversations"
        aria-expanded={isOpen}
        data-testid="chat-history-trigger"
      >
        <History size={16} />
        Historique
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-64 rounded-chat-md border border-chat-border bg-chat-surface-card py-1 shadow-lg dark:border-chat-border-dark dark:bg-chat-surface-card-dark"
          data-testid="chat-history-panel"
        >
          {conversations.length === 0 ? (
            <p className="px-4 py-3 text-sm text-chat-ink-muted dark:text-chat-ink-muted-dark">
              Aucune conversation pour l&apos;instant
            </p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  onSelect(conversation.id)
                  setIsOpen(false)
                }}
                className="block w-full truncate px-4 py-2 text-left text-sm text-chat-ink hover:bg-chat-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-chat-ring dark:text-chat-ink-dark dark:hover:bg-chat-border-dark"
              >
                {conversation.title}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
