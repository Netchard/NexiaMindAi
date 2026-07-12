'use client'

/**
 * Layout partagé pour toutes les routes /chat/*
 * Gère l'état global des conversations et la logique commune
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { FilterBar } from '@/components/Filters'
import { ConversationList } from '@/components/ConversationList'
import { DictationProvider } from '@/components/Dictation'
import type { ChatMessageData } from '@/components/Chat'
import type { ConversationMessage, Conversation, ConversationUIState, Filters } from '@/types/conversations'
import {
  getConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
  sendMessageInConversation,
  createNewConversation,
  invalidateConversationsCache,
} from '@/lib/api/conversations'
import { getFilterValues, convertToFilterOptions, FiltersError } from '@/lib/api/filters'
import { filterAndConvertSources } from '@/lib/api/sources'
import { FilterState, DEFAULT_FILTERS, type FiltersResponse } from '@/types/filters'
import type { RawSource } from '@/types/citations'

/**
 * Contexte pour gérer l'état des conversations
 * Permet de partager l'état entre les différentes pages /chat/*
 */
import { ConversationsContext, useConversations as useConversationsBase } from '@/components/Conversations'
import type { ConversationsContextType } from '@/components/Conversations'

function ConversationsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // État des conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationStates, setConversationStates] = useState<Record<string, ConversationUIState>>({})
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // État des filtres
  const [filterState, setFilterState] = useState<FilterState>(DEFAULT_FILTERS)
  const [filtersLoading, setFiltersLoading] = useState<boolean>(true)
  const [filtersError, setFiltersError] = useState<string | null>(null)
  const [filterOptions, setFilterOptions] = useState<ReturnType<typeof convertToFilterOptions>>({
    themes: [],
    documentFormats: [],
  })

  // Charger les données initiales
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)

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
        setFilterOptions({
          themes: [],
          documentFormats: [],
        })
      } finally {
        setFiltersLoading(false)
      }

      try {
        // Charger l'historique des conversations
        const history = await getConversations()
        setConversations(history.conversations)

        // Si une conversationId est dans l'URL, la sélectionner
        const urlConversationId = extractConversationIdFromPathname(pathname)
        if (urlConversationId) {
          setCurrentConversationId(urlConversationId)
          // Charger les messages de cette conversation
          await loadConversationMessages(urlConversationId)
        } else if (history.conversations.length > 0) {
          // Sélectionner la conversation la plus récente par défaut
          const mostRecent = history.conversations[0]
          setCurrentConversationId(mostRecent.id)
          await loadConversationMessages(mostRecent.id)
        }
      } catch (e) {
        console.error('Échec du chargement de l\'historique des conversations:', e)
        setGlobalError('Échec du chargement des conversations')
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [pathname])

  // Charger les messages d'une conversation
  const loadConversationMessages = useCallback(async (conversationId: string) => {
    try {
      const messagesResponse = await getConversationMessages(conversationId)
      
      // Convertir les messages API en ChatMessageData pour ChatMessageList
      const chatMessages: ChatMessageData[] = messagesResponse.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        citations: msg.sources ? filterAndConvertSources(msg.sources) : undefined,
      }))

      // Mettre à jour l'état de la conversation
      setConversationStates(prev => ({
        ...prev,
        [conversationId]: {
          conversation: conversations.find(c => c.id === conversationId) || {
            id: conversationId,
            title: 'Nouvelle conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
          messages: messagesResponse.messages,
          // Initialiser les filtres pour cette conversation
          filters: filterState,
          isLoading: false,
          error: null,
        },
      }))
    } catch (e) {
      console.error(`Échec du chargement des messages pour la conversation ${conversationId}:`, e)
      setConversationStates(prev => ({
        ...prev,
        [conversationId]: {
          conversation: conversations.find(c => c.id === conversationId) || {
            id: conversationId,
            title: 'Nouvelle conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
          messages: [],
          filters: filterState,
          isLoading: false,
          error: e instanceof Error ? e.message : 'Échec du chargement des messages',
        },
      }))
    }
  }, [conversations, filterState])

  // Sélectionner une conversation
  const onSelectConversation = useCallback(async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    router.push(`/chat/${conversationId}`)
    await loadConversationMessages(conversationId)
  }, [router, loadConversationMessages])

  // Créer une nouvelle conversation
  const onCreateNewConversation = useCallback(async (): Promise<string | null> => {
    try {
      // Créer une nouvelle conversation vide
      const newConversation = await createNewConversation('Nouvelle conversation')
      
      // Invalider le cache et recharger les conversations
      invalidateConversationsCache()
      const history = await getConversations()
      setConversations(history.conversations)

      // Sélectionner la nouvelle conversation
      const newConversationId = newConversation.conversationId
      setCurrentConversationId(newConversationId)
      router.push(`/chat/${newConversationId}`)
      
      // Initialiser l'état de la conversation
      setConversationStates(prev => ({
        ...prev,
        [newConversationId]: {
          conversation: history.conversations.find(c => c.id === newConversationId) || {
            id: newConversationId,
            title: 'Nouvelle conversation',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messageCount: 0,
          },
          messages: [], // Pas de message initial
          filters: DEFAULT_FILTERS, // Nouvelle conversation = filtres par défaut
          isLoading: false,
          error: null,
        },
      }))

      return newConversationId
    } catch (e) {
      console.error('Échec de la création de la conversation:', e)
      setGlobalError(e instanceof Error ? e.message : 'Échec de la création de la conversation')
      return null
    }
  }, [router])

  // Renommer une conversation
  const onRenameConversation = useCallback(async (conversationId: string, newTitle: string) => {
    try {
      await renameConversation(conversationId, newTitle)
      
      // Invalider le cache et recharger
      invalidateConversationsCache()
      const history = await getConversations()
      setConversations(history.conversations)

      // Mettre à jour le titre dans l'état local
      setConversationStates(prev => {
        if (!prev[conversationId]) return prev
        return {
          ...prev,
          [conversationId]: {
            ...prev[conversationId],
            conversation: {
              ...prev[conversationId].conversation,
              title: newTitle,
            },
          },
        }
      })
    } catch (e) {
      console.error(`Échec du renommage de la conversation ${conversationId}:`, e)
      throw e
    }
  }, [])

  // Supprimer une conversation
  const onDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await deleteConversation(conversationId)
      
      // Invalider le cache et recharger
      invalidateConversationsCache()
      const history = await getConversations()
      setConversations(history.conversations)

      // Supprimer de l'état local
      setConversationStates(prev => {
        const newStates = { ...prev }
        delete newStates[conversationId]
        return newStates
      })

      // Si c'était la conversation active, sélectionner la plus récente
      if (currentConversationId === conversationId) {
        if (history.conversations.length > 0) {
          const mostRecent = history.conversations[0]
          setCurrentConversationId(mostRecent.id)
          await loadConversationMessages(mostRecent.id)
          router.push(`/chat/${mostRecent.id}`)
        } else {
          setCurrentConversationId(null)
          router.push('/chat')
        }
      }
    } catch (e) {
      console.error(`Échec de la suppression de la conversation ${conversationId}:`, e)
      throw e
    }
  }, [currentConversationId, router, loadConversationMessages])

  // Envoyer un message
  const onSendMessage = useCallback(async (
    conversationIdParam: string | null,
    content: string,
    filters: Partial<FilterState>
  ) => {
    let conversationId = conversationIdParam

    if (!conversationId) {
      // Créer une nouvelle conversation si aucun ID
      const newConvId = await onCreateNewConversation()
      if (!newConvId) {
        throw new Error('Échec de la création de la conversation')
      }
      conversationId = newConvId
    }

    // Message utilisateur affiché immédiatement (optimistic UI) — voir
    // EXPERIENCE.md > State Patterns "Envoi en cours". Sans ça, seule la
    // réponse assistant était ajoutée à l'état local plus bas : la question
    // de l'utilisateur n'apparaissait jamais avant un rechargement complet
    // de la page (qui la récupère correctement depuis le serveur).
    const optimisticId = `optimistic-${Date.now()}`
    setConversationStates(prev => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        messages: [
          ...(prev[conversationId]?.messages || []),
          {
            id: optimisticId,
            conversationId,
            role: 'user',
            content,
            createdAt: new Date().toISOString(),
          } as ConversationMessage,
        ],
        isLoading: true,
        error: null,
      },
    }))

    try {
      // Appliquer les filtres actifs — ne transmettre que les filtres réellement
      // sélectionnés (une valeur vide '' signifie "tous", donc pas un filtre actif)
      const activeFilters: Filters = {}
      if (filters.theme) activeFilters.theme = filters.theme
      if (filters.documentFormat) activeFilters.documentFormat = filters.documentFormat
      const filtersToUse = Object.keys(activeFilters).length > 0 ? activeFilters : undefined

      const response = await sendMessageInConversation(conversationId, content, filtersToUse)

      setConversationStates(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: [
            ...(prev[conversationId]?.messages || []),
            {
              id: response.id,
              conversationId: response.conversationId,
              role: response.role,
              content: response.content,
              // sources (pas citations) : ConversationMessage.sources est ce que
              // currentMessages relit plus bas pour reconstruire les citations —
              // stocker autre chose ici les rendait invisibles jusqu'au reload.
              sources: response.sources,
              createdAt: response.createdAt,
            } as ConversationMessage,
          ],
          filters: {
            ...prev[conversationId]?.filters,
            ...filters,
          },
          isLoading: false,
          error: null,
        },
      }))

      // Mettre à jour la liste des conversations (message count peut avoir changé)
      invalidateConversationsCache()
      const history = await getConversations()
      setConversations(history.conversations)

    } catch (e) {
      console.error(`Échec de l'envoi du message dans la conversation ${conversationId}:`, e)
      const message = e instanceof Error ? e.message : 'Échec de l\'envoi du message. Réessayez.'
      // Le message utilisateur reste visible (EXPERIENCE.md > State Patterns
      // "Erreur d'envoi") mais marqué en échec, plutôt que de disparaître.
      setConversationStates(prev => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          messages: (prev[conversationId]?.messages || []).map(m =>
            m.id === optimisticId ? { ...m, failed: true } : m
          ),
          isLoading: false,
          error: message,
        },
      }))
    }
  }, [onCreateNewConversation])

  // Gestion des filtres
  const onFilterChange = useCallback((filterType: keyof FilterState, value: string) => {
    setFilterState(prev => ({
      ...prev,
      [filterType]: value,
    }))
  }, [])

  const onResetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTERS)
  }, [])

  // Récupérer les filtres pour une conversation spécifique
  const getFiltersForConversation = useCallback((conversationId: string): FilterState => {
    return conversationStates[conversationId]?.filters || DEFAULT_FILTERS
  }, [conversationStates])

  // Extraire conversationId depuis pathname
  function extractConversationIdFromPathname(path: string): string | null {
    const match = path.match(/\/chat\/([^\/]+)/)
    return match ? match[1] : null
  }

  // Valeur memoisée de la conversation active
  const currentConversation = useMemo(() => {
    if (!currentConversationId) return null
    return conversations.find(c => c.id === currentConversationId) || null
  }, [currentConversationId, conversations])

  // Messages de la conversation active
  const currentMessages: ChatMessageData[] = useMemo(() => {
    if (!currentConversationId) return []
    const state = conversationStates[currentConversationId]
    if (!state?.messages) return []
    
    return state.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      citations: msg.sources ? filterAndConvertSources(msg.sources) : undefined,
      failed: msg.failed,
    }))
  }, [currentConversationId, conversationStates])

  // Valeur pour déterminer le placeholder de ChatInput
  const chatInputDisabled = useCallback(() => {
    return false // Toujours activé pour ST-306
  }, [])

  // Contexte à fournir
  const contextValue = useMemo<ConversationsContextType>(() => ({
    conversations,
    currentConversationId,
    currentMessages,
    conversationStates,
    isLoading,
    error: globalError,
    filterOptions,
    filtersLoading,
    filtersError,
    setError: setGlobalError,
    onSelectConversation,
    onCreateNewConversation,
    onRenameConversation,
    onDeleteConversation,
    onSendMessage,
    onFilterChange,
    onResetFilters,
    getFiltersForConversation,
  }), [
    conversations,
    currentConversationId,
    currentMessages,
    conversationStates,
    isLoading,
    globalError,
    filterOptions,
    filtersLoading,
    filtersError,
    onSelectConversation,
    onCreateNewConversation,
    onRenameConversation,
    onDeleteConversation,
    onSendMessage,
    onFilterChange,
    onResetFilters,
    getFiltersForConversation,
  ])

  return (
    <ConversationsContext.Provider value={contextValue}>
      {children}
    </ConversationsContext.Provider>
  )
}

/**
 * Layout principal pour toutes les pages /chat/*
 * Contient la sidebar des conversations (desktop) et la zone de chat
 */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConversationsProvider>
      {/* Sidebar (AvatarPanel) et zone de chat (ChatInput) sont frères ici —
          DictationProvider doit englober les deux pour relier déclencheur et
          récepteur de la dictée (voir DictationContext.tsx). */}
      <DictationProvider>
        {/* h-full (pas h-screen) : remplit l'espace laissé par MainContent sous
            la Navbar, au lieu de forcer 100vh en plus de celle-ci — voir
            EXPERIENCE.md > Foundation/Layout & Spacing. flex-col : la rangée
            sidebar+contenu (flex-1) partage la hauteur avec le footer global
            (flex-none), qui reste une bande fixe en bas — voir Maquette-structure. */}
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar des conversations - Desktop only pour l'instant.
                Pas de overflow-y-auto ici : ConversationList possède son propre
                conteneur de scroll interne (liste) + zone fixe (AvatarPanel) —
                un second scroll au niveau du wrapper casserait ce découpage. */}
            <div className="hidden lg:block w-[280px] border-r border-chat-border-panel bg-chat-surface-header h-full overflow-hidden">
              <ConversationList />
            </div>

            {/* Zone de chat principale - pleine largeur, plus de carte centrée
                (bordure/ombre/max-width retirées le 2026-07-11, voir
                Maquette-structure-NexiaMind-AI-Chat.html > "echanges"). */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-chat-surface-panel" data-testid="chat-panel">
              {children}
            </div>

            {/* Overlay pour mobile - sera géré par ConversationList */}
          </div>

          {/* Footer global (48px, sombre) — réintroduit le 2026-07-11 selon
              Maquette-structure-NexiaMind-AI-Chat.html > "footer" ; porte le
              disclaimer légal, déplacé ici depuis le pied du panneau de chat
              (une seule instance pour toute la surface /chat au lieu d'une
              par page/état). */}
          <footer
            className="flex-none h-12 flex items-center justify-center px-6 bg-chat-surface-header border-t border-chat-border-header"
            data-testid="chat-app-footer"
          >
            <p className="text-[11.5px] text-chat-ink-faint text-center">
              NexiaMind peut faire des erreurs. Vérifiez les sources citées.
            </p>
          </footer>
        </div>
      </DictationProvider>
    </ConversationsProvider>
  )
}

// Ré-exporter le hook et le contexte pour les composants enfants
export { useConversationsBase as useConversations }
export { ConversationsContext }
