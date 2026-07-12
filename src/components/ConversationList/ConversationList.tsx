'use client'

/**
 * Composant ConversationList
 * Affiche la liste des conversations de l'utilisateur
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { useState, useRef, useEffect } from 'react'
import { useConversations } from '@/components/Conversations'
import ConversationItem from './ConversationItem'
import AvatarPanel from './AvatarPanel'
import type { Conversation } from '@/types/conversations'

interface ConversationListProps {
  onClose?: () => void
}

/**
 * Liste des conversations
 * Affiche toutes les conversations avec gestion overlay pour mobile
 */
export default function ConversationList({ onClose }: ConversationListProps) {
  const { 
    conversations, 
    currentConversationId,
    isLoading,
    error,
    onSelectConversation,
    onCreateNewConversation,
    onRenameConversation,
    onDeleteConversation,
  } = useConversations()
  
  // État pour le mobile overlay
  const [isOverlayOpen, setIsOverlayOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Gérer la création de nouvelle conversation
  const handleCreateNew = async () => {
    const newConversationId = await onCreateNewConversation()
    if (newConversationId) {
      await onSelectConversation(newConversationId)
      setIsOverlayOpen(false)
      onClose?.()
    }
  }

  // Gérer le clic sur un item de conversation
  const handleSelect = async (conversationId: string) => {
    await onSelectConversation(conversationId)
    setIsOverlayOpen(false)
    onClose?.()
  }

  // Gérer le renommage
  const handleRename = async (conversationId: string, newTitle: string) => {
    await onRenameConversation(conversationId, newTitle)
  }

  // Gérer la suppression
  const handleDelete = async (conversationId: string) => {
    await onDeleteConversation(conversationId)
  }

  // Gérer le clic en dehors de l'overlay (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setIsOverlayOpen(false)
        onClose?.()
      }
    }

    if (isOverlayOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOverlayOpen, onClose])

  // Toggle overlay pour mobile
  const toggleOverlay = () => {
    setIsOverlayOpen(!isOverlayOpen)
  }

  // Tri des conversations par date de mise à jour (les plus récentes en premier)
  const sortedConversations = [...conversations].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  return (
    <>
      {/* Bouton pour mobile - visible uniquement sur mobile */}
      <button
        onClick={toggleOverlay}
        className="lg:hidden flex items-center gap-2 px-4 py-2 text-sm font-medium text-chat-ink-muted hover:text-chat-ink-strong transition-colors"
        aria-label="Ouvrir la liste des conversations"
        aria-haspopup="true"
        aria-expanded={isOverlayOpen}
        data-testid="conversation-list-toggle"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Conversations
      </button>

      {/* Overlay pour mobile */}
      {isOverlayOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm" />
      )}

      {/* Conteneur principal de la liste — flex-col sur toute la hauteur
          disponible (mobile : plein écran via inset-0 ; desktop : hérite du
          h-full du wrapper dans layout.tsx) pour que la liste ait un flex-1
          borné qui scrolle et que AvatarPanel reste fixe en bas, hors du
          flux scrollable. lg:flex (pas lg:block) est essentiel ici : un
          conteneur non-flex rend le flex-1 de l'enfant inerte. */}
      <div
        ref={overlayRef}
        role="list"
        aria-label="Liste des conversations"
        className={`fixed inset-0 z-50 flex flex-col h-full bg-chat-surface-header p-4 lg:static lg:flex lg:h-full lg:bg-transparent lg:p-0 lg:z-auto ${
          isOverlayOpen ? 'flex' : 'hidden lg:flex'
        }`}
        data-testid="conversation-list"
      >
        {/* En-tête de la liste */}
        <div className="flex items-center justify-between mb-4 lg:mb-2">
          <h2 className="text-sm font-semibold text-chat-ink-strong">
            Conversations
          </h2>
          <button
            onClick={handleCreateNew}
            className="text-xs font-medium text-chat-primary hover:text-chat-primary-active transition-colors"
            aria-label="Nouvelle conversation"
            data-testid="new-conversation-button"
          >
            + Nouvelle
          </button>
        </div>

        {/* Liste des conversations */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-chat-ink-muted">Chargement...</div>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="text-sm text-chat-error-soft text-center py-4"
            >
              {error}
            </div>
          ) : sortedConversations.length === 0 ? (
            <div className="text-sm text-chat-ink-muted text-center py-4">
              Aucune conversation. Commencez une nouvelle discussion.
            </div>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={conversation.id === currentConversationId}
                  onSelect={handleSelect}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel Avatar : zone 3D réservée + contrôles micro (dictée) */}
        <AvatarPanel />
      </div>
    </>
  )
}
