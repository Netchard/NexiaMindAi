export interface ChatMessageData {
  id: string
  role: 'user' | 'assistant'
  content: string
  failed?: boolean
}

export interface ConversationSummary {
  id: string
  title: string
  updatedAt: string
}
