'use client'

import { SourceCitationList } from '@/components/SourceCitation';
import type { SourceCitation } from '@/types/citations';

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  showAvatar: boolean
  citations?: SourceCitation[]
}

/**
 * ChatMessage Component
 * Renders a single message bubble. User bubbles are coral-gradient, right-aligned;
 * assistant bubbles stay light (deliberate contrast break, DESIGN.md > Colors) and
 * are left-aligned with an avatar shown once per group.
 */
export default function ChatMessage({ role, content, showAvatar, citations }: ChatMessageProps) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] whitespace-pre-wrap rounded-chat-lg rounded-tr-[5px] bg-gradient-to-br from-chat-primary to-chat-primary-active px-[17px] py-3.5 text-[14.5px] leading-relaxed text-chat-on-primary shadow-[0_8px_22px_-12px_rgba(244,105,63,.55)]"
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
        <div
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-gradient-to-br from-chat-primary to-chat-primary-active text-[11px] font-bold text-chat-on-primary"
          aria-hidden="true"
          data-testid="chat-assistant-avatar"
        >
          N
        </div>
      ) : (
        <div className="w-[26px] flex-none" aria-hidden="true" />
      )}
      <div className="flex max-w-[78%] flex-col gap-2.5">
        <div
          className="whitespace-pre-wrap rounded-chat-lg rounded-tl-[5px] bg-chat-assistant-bg px-[17px] py-3.5 text-[14.5px] leading-relaxed text-chat-assistant-text"
          data-testid="chat-bubble-assistant"
        >
          {content}
        </div>
        {/* Affichage des citations de sources (ST-305) */}
        {citations && citations.length > 0 && (
          <SourceCitationList 
            citations={citations} 
            title="📚 Sources :" 
            data-testid="chat-sources"
          />
        )}
      </div>
    </div>
  )
}
