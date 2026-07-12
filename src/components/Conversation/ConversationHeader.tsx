'use client'

/**
 * Composant ConversationHeader
 * Affiche le titre et les actions de la conversation active
 * Fait partie de ST-306: Implémenter le Mode Conversation
 * Optimisé avec lazy loading pour ST-309
 */

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useConversations } from '@/components/Conversations'
import { HistoryMenu } from '@/components/Chat'
import { CONVERSATION_ACTION_LABELS, CONVERSATION_CONFIRMATIONS } from '@/types/conversations'

// Lazy loading du bouton lourd pour ST-309
const CopyConversationButton = dynamic(
  () => import('./').then((mod) => mod.CopyConversationButton),
  {
    loading: () => null, // Pas de spinner pour le bouton
    ssr: false,
  }
)

interface ConversationHeaderProps {
  conversationId: string | null
  title: string
  onRename?: (newTitle: string) => Promise<void>
  onDelete?: () => Promise<void>
  isLoading?: boolean
  conversations?: Array<{id: string; title: string; updatedAt: string}>
}

/**
 * Header de la conversation active
 * Affiche le titre (editable), bouton nouvelle conversation, actions
 */
export default function ConversationHeader({
  conversationId,
  title,
  onRename,
  onDelete,
  isLoading = false,
  conversations = [],
}: ConversationHeaderProps) {
  const { onCreateNewConversation, conversations: allConversations, onSelectConversation } = useConversations()
  
  // Utiliser les conversations passées en props ou celles du contexte
  const displayConversations = conversations.length > 0 ? conversations : allConversations
  
  // Handler pour la sélection depuis l'historique
  const handleHistorySelect = async (conversationId: string) => {
    if (onSelectConversation) {
      await onSelectConversation(conversationId)
    }
  }
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionsOpen, setActionsOpen] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Gérer le clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsOpen(false)
      }
    }

    if (actionsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [actionsOpen])

  // Gérer le focus sur l'input lors de l'édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  // Gérer le renommage
  const handleRename = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!editTitle.trim() || !conversationId || !onRename) {
      setIsEditing(false)
      return
    }

    if (editTitle === title) {
      setIsEditing(false)
      return
    }

    try {
      await onRename(editTitle.trim())
      setIsEditing(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Échec du renommage')
    }
  }

  // Gérer la suppression
  const handleDelete = async () => {
    if (!conversationId || !onDelete) return

    try {
      await onDelete()
      setShowDeleteConfirm(false)
      setActionsOpen(false)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Échec de la suppression')
    }
  }

  // Gérer la création de nouvelle conversation
  const handleNewConversation = async () => {
    await onCreateNewConversation()
    setActionsOpen(false)
  }

  // Gérer le changement de titre
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value)
  }

  // Toggle menu actions
  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActionsOpen(!actionsOpen)
  }

  // Démarrer l'édition du titre
  const startEditing = () => {
    setEditTitle(title)
    setIsEditing(true)
    setActionsOpen(false)
  }

  // Arrêter l'édition
  const stopEditing = () => {
    setIsEditing(false)
    setEditTitle(title)
  }

  return (
    <div className="flex-none border-b border-chat-border-header h-[60px] px-5 bg-chat-surface-panel" data-testid="conversation-header">
      <div className="flex items-center justify-between max-w-full h-full">
        {/* Titre de la conversation et bouton Historique */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isEditing ? (
            <form onSubmit={handleRename} className="flex-1 min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={editTitle}
                onChange={handleTitleChange}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    stopEditing()
                  }
                }}
                maxLength={200}
                disabled={isLoading}
                className="flex-1 min-w-0 text-[15px] font-semibold text-chat-ink-strong bg-transparent border-none outline-none focus:ring-2 focus:ring-chat-primary"
                aria-label="Renommer la conversation"
                data-testid="conversation-title-input"
              />
            </form>
          ) : (
            <button
              onClick={startEditing}
              disabled={!conversationId || !onRename}
              className="flex-1 min-w-0 text-left"
              aria-label="Cliquez pour renommer la conversation"
              data-testid="conversation-title"
            >
              <h1 className="text-[15px] font-semibold text-chat-ink-strong truncate">
                {title}
              </h1>
            </button>
          )}
          
          {/* Bouton Historique - selon DESIGN.md */}
          {conversationId && (
            <HistoryMenu 
              conversations={displayConversations.map(c => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
              onSelect={handleHistorySelect}
            />
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center gap-2" ref={actionsRef}>
          {/* Bouton Copier la conversation - ST-308 */}
          {conversationId && (
            <CopyConversationButton conversationId={conversationId} disabled={isLoading} />
          )}

          {/* Bouton Nouvelle conversation */}
          <button
            onClick={handleNewConversation}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-chat-surface-card hover:bg-chat-surface-hover border border-chat-border rounded-chat-md text-sm font-medium text-chat-ink-muted transition-colors disabled:opacity-50"
            aria-label="Nouvelle conversation"
            data-testid="new-conversation-header-button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="hidden sm:inline">{CONVERSATION_ACTION_LABELS.new}</span>
          </button>

          {/* Bouton Menu actions */}
          <button
            onClick={toggleActions}
            disabled={!conversationId || isLoading}
            aria-label="Actions de la conversation"
            aria-haspopup="true"
            aria-expanded={actionsOpen}
            className="p-1.5 rounded-chat-md hover:bg-chat-surface-hover text-chat-ink-muted transition-colors disabled:opacity-50"
            data-testid="conversation-header-actions-toggle"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>

          {/* Menu actions dropdown */}
          {actionsOpen && conversationId && (
            <div className="absolute top-full right-5 mt-1 z-10 bg-chat-surface-panel border border-chat-border-panel rounded-chat-md shadow-lg min-w-[160px] p-2" data-testid="conversation-header-actions-menu">
              {onRename && (
                <button
                  onClick={() => {
                    startEditing()
                    setActionsOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors text-left"
                  data-testid="rename-conversation-header"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                  </svg>
                  {CONVERSATION_ACTION_LABELS.rename}
                </button>
              )}
              
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-chat-error-soft hover:bg-chat-error-surface rounded-chat-sm transition-colors text-left"
                  data-testid="delete-conversation-header"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {CONVERSATION_ACTION_LABELS.delete}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modale de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4" data-testid="delete-confirm-modal">
          <div className="bg-chat-surface-panel border border-chat-border-panel rounded-chat-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-chat-ink-strong mb-3">
              Supprimer la conversation
            </h3>
            <p className="text-chat-ink-muted mb-6">
              {CONVERSATION_CONFIRMATIONS.delete}
            </p>
            {actionError && (
              <p role="alert" className="text-sm text-chat-error-soft mb-4">
                {actionError}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-md transition-colors disabled:opacity-50"
                data-testid="cancel-delete-confirm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-chat-error-border hover:bg-chat-error-soft rounded-chat-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="confirm-delete-confirm"
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
