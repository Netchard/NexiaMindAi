'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChatInput, ChatMessageList, HistoryMenu } from '@/components/Chat'
import type { ChatMessageData, ConversationSummary } from '@/components/Chat'
import { sendMessage, getHistory } from '@/components/Chat/api'
import { FilterBar } from '@/components/Filters'
import { getFilterValues, convertToFilterOptions, FiltersError } from '@/lib/api/filters'
import { FilterState, DEFAULT_FILTERS } from '@/types/filters'
import { filterAndConvertSources } from '@/lib/api/sources'
import type { RawSource } from '@/types/citations'

/**
 * Chat Page (ST-303)
 * Access already protected by src/proxy.ts — no guard logic needed here.
 */
export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageData[]>([])
  const [conversationId, setConversationId] = useState<string | undefined>(undefined)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // État des filtres - persistant par conversation
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS)
  
  // État de chargement des valeurs de filtre
  const [filtersLoading, setFiltersLoading] = useState<boolean>(true)
  const [filtersError, setFiltersError] = useState<string | null>(null)
  
  // Valeurs possibles pour les filtres
  const [filterOptions, setFilterOptions] = useState<ReturnType<typeof convertToFilterOptions>>({
    themes: [],
    documentFormats: [],
  })

  // Charger les valeurs possibles des filtres et l'historique au montage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Charger les valeurs de filtre
        setFiltersLoading(true)
        setFiltersError(null)
        
        const filters = await getFilterValues()
        setFilterOptions(convertToFilterOptions(filters))
      } catch (error) {
        const message = error instanceof FiltersError 
          ? error.message 
          : 'Échec du chargement des valeurs de filtre'
        setFiltersError(message)
        // Continuer avec des options vides pour ne pas bloquer l'interface
        setFilterOptions({
          themes: [],
          documentFormats: [],
        })
      } finally {
        setFiltersLoading(false)
      }
      
      // Charger l'historique des conversations
      try {
        const history = await getHistory()
        setConversations(
          history.conversations.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))
        )
      } catch (e) {
        // L'historique reste vide dans le menu ; la conversation en cours n'est pas affectée.
        console.error('Échec du chargement de l\'historique des conversations:', e)
      }
    }
    
    loadInitialData()
  }, [])

  // Gestion du changement de filtre
  const handleFilterChange = useCallback((filterType: keyof FilterState, value: string) => {
    setFilterState(prev => ({
      ...prev,
      [filterType]: value,
    }))
  }, [])

  // Gestion de la réinitialisation des filtres
  const handleResetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTERS)
  }, [])

  const handleSend = async (content: string) => {
    setError(null)
    const userMessage: ChatMessageData = { id: `local_${Date.now()}`, role: 'user', content }
    setMessages((prev) => [...prev, userMessage])
    setIsSending(true)

    try {
      // Les filtres actifs s'appliquent à chaque envoi, y compris le tout premier
      // message d'une nouvelle conversation (revue de code ST-304, décision 2) —
      // ils ne sont jamais jetés silencieusement.
      const activeFilters: Partial<FilterState> = Object.fromEntries(
        Object.entries(filterState).filter(([, value]) => value !== '')
      )
      const filtersToUse = Object.keys(activeFilters).length > 0 ? activeFilters : undefined

      const response = await sendMessage(content, conversationId, filtersToUse)

      // Mettre à jour la conversation
      setConversationId(response.conversationId)

      // Parser les citations depuis la réponse API (ST-305)
      // Normaliser null en undefined pour éviter les erreurs
      const citations = filterAndConvertSources(response.sources ?? undefined)

      setMessages((prev) => [
        ...prev,
        { 
          id: response.id, 
          role: 'assistant', 
          content: response.content,
          citations: citations.length > 0 ? citations : undefined,
        },
      ])

      // Les filtres sont conservés après l'envoi, nouvelle conversation ou non (AC #6)

    } catch (e) {
      setMessages((prev) =>
        prev.map((m) => (m.id === userMessage.id ? { ...m, failed: true } : m))
      )
      setError(e instanceof Error ? e.message : "Échec de l'envoi du message. Réessayez.")
    } finally {
      setIsSending(false)
    }
  }

  const handleSelectConversation = (selectedId: string) => {
    // Aucun endpoint n'expose le contenu des messages d'une conversation passée
    // (GET /api/chat/history ne renvoie que des résumés) — on reprend la
    // conversation (les nouveaux messages s'y rattachent) sans pouvoir réafficher
    // son historique de messages.
    
    // Conserver les filtres quand on change de conversation existante
    // (ne pas réinitialiser comme spécifié dans Task 3)
    setConversationId(selectedId)
    setMessages([])
    setError(null)
    // Les filtres restent inchangés
  }

  return (
    <div className="flex justify-center py-1">
      <div className="flex h-[calc(100vh-9.5rem)] w-full max-w-[880px] flex-col overflow-hidden rounded-chat-xl border border-chat-border-panel bg-chat-surface-panel shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)]">
        <div className="flex h-[60px] flex-none items-center justify-between border-b border-chat-border-header px-5">
          <span className="text-[15px] font-semibold text-chat-ink-strong">NexiaMind AI</span>
          <HistoryMenu conversations={conversations} onSelect={handleSelectConversation} />
        </div>

        <ChatMessageList messages={messages} isTyping={isSending} onSuggestionClick={handleSend} />

        {/* Filtres de recherche - au-dessus de ChatInput comme spécifié dans ST-304 */}
        <div className="flex-none border-t border-chat-border-header p-4">
          {/* Filtres */}
          {filtersError ? (
            <div
              role="alert"
              className="mb-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft"
            >
              {filtersError}
            </div>
          ) : (
            <FilterBar
              filterState={filterState}
              filterOptions={filterOptions}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              isLoading={filtersLoading}
            />
          )}

          {/* Espacement entre filtres et input */}
          <div className="mt-4" />

          {error && (
            <div
              role="alert"
              className="mb-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft"
            >
              {error}
            </div>
          )}
          <ChatInput onSend={handleSend} disabled={isSending} />
          <p className="mt-3 text-center text-[11.5px] text-chat-ink-faint">
            NexiaMind peut faire des erreurs. Vérifiez les sources citées.
          </p>
        </div>
      </div>
    </div>
  )
}
