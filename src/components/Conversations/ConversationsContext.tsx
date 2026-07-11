'use client'

/**
 * Contexte pour gérer l'état des conversations
 * Permet de partager l'état entre les différentes pages /chat/*
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { createContext, useContext } from 'react'
import type { Conversation, ConversationUIState } from '@/types/conversations'
import type { FilterState } from '@/types/filters'
import type { ChatMessageData } from '@/components/Chat'

export interface ConversationsContextType {
  conversations: Conversation[]
  currentConversationId: string | null
  currentMessages: ChatMessageData[]
  conversationStates: Record<string, ConversationUIState>
  isLoading: boolean
  error: string | null
  filterOptions: {
    themes: Array<{ value: string; label: string }>;
    documentFormats: Array<{ value: string; label: string }>;
  }
  filtersLoading: boolean
  filtersError: string | null
  setError: (error: string | null) => void
  onSelectConversation: (conversationId: string) => Promise<void>
  onCreateNewConversation: () => Promise<string | null>
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<void>
  onDeleteConversation: (conversationId: string) => Promise<void>
  onSendMessage: (conversationId: string | null, content: string, filters: Partial<FilterState>) => Promise<void>
  onFilterChange: (filterType: keyof FilterState, value: string) => void
  onResetFilters: () => void
  getFiltersForConversation: (conversationId: string) => FilterState
}

const ConversationsContext = createContext<ConversationsContextType | null>(null)

export function useConversations() {
  const context = useContext(ConversationsContext)
  if (!context) {
    throw new Error('useConversations doit être utilisé dans un ConversationsProvider')
  }
  return context
}

export { ConversationsContext }
