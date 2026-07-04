'use client'

import Image from 'next/image'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  showAvatar: boolean
}

/**
 * ChatMessage Component
 * Renders a single message bubble. User bubbles are coral-filled, right-aligned;
 * assistant bubbles are neutral, left-aligned with an avatar shown once per group.
 */
export default function ChatMessage({ role, content, showAvatar }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[70%] whitespace-pre-wrap rounded-chat-lg bg-chat-primary px-3.5 py-3 text-base text-chat-on-primary"
          data-testid="chat-bubble-user"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5">
      {showAvatar ? (
        <Image
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          className="flex-none rounded-full"
          data-testid="chat-assistant-avatar"
        />
      ) : (
        <div className="w-[28px] flex-none" aria-hidden="true" />
      )}
      <div className="flex max-w-[70%] flex-col gap-1">
        <div
          className="whitespace-pre-wrap rounded-chat-lg border border-chat-border bg-chat-surface-card px-3.5 py-3 text-base text-chat-ink dark:border-chat-border-dark dark:bg-chat-surface-card-dark dark:text-chat-ink-dark"
          data-testid="chat-bubble-assistant"
        >
          {content}
        </div>
        <div
          className="rounded-chat-sm border border-dashed border-chat-border px-2.5 py-1.5 text-xs text-chat-ink-muted dark:border-chat-border-dark dark:text-chat-ink-muted-dark"
          data-testid="chat-sources-placeholder"
        />
      </div>
    </div>
  )
}
