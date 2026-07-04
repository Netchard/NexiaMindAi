'use client'

import Image from 'next/image'

/**
 * TypingIndicator Component
 * Replaces the assistant bubble while a response is in flight — three pulsing
 * dots, respects prefers-reduced-motion.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5" data-testid="chat-typing-indicator">
      <Image
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        width={28}
        height={28}
        className="flex-none rounded-full"
        data-testid="chat-assistant-avatar"
      />
      <div
        className="flex items-center gap-1 rounded-chat-lg border border-chat-border bg-chat-surface-card px-3.5 py-3 dark:border-chat-border-dark dark:bg-chat-surface-card-dark"
        role="status"
        aria-label="NexiaMind AI réfléchit"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-chat-ink-muted motion-reduce:animate-none"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
