import type { SourceCitation } from '@/types/citations';

export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  failed?: boolean
  /** Citations de sources pour les messages assistant */
  citations?: SourceCitation[]
}

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
}
