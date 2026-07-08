'use client'

/**
 * TypingIndicator Component
 * Replaces the assistant bubble while a response is in flight — three pulsing
 * dots, respects prefers-reduced-motion.
 */
export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2.5" data-testid="chat-typing-indicator">
      <div
        className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-gradient-to-br from-chat-primary to-chat-primary-active text-[11px] font-bold text-chat-on-primary"
        aria-hidden="true"
        data-testid="chat-assistant-avatar"
      >
        N
      </div>
      <div
        className="flex items-center gap-1.5 rounded-chat-lg rounded-tl-[5px] bg-chat-assistant-bg px-[18px] py-[15px]"
        role="status"
        aria-label="NexiaMind AI réfléchit"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-chat-dot-muted motion-reduce:animate-none"
            style={{ animationDelay: `${i * 180}ms` }}
          />
        ))}
      </div>
    </div>
  )
}
