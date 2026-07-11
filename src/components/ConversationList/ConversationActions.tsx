'use client'

/**
 * Composant ConversationActions
 * Menu contextuel avec actions Renommer et Supprimer
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { useState, useRef, useEffect } from 'react'
import { CONVERSATION_ACTION_LABELS, CONVERSATION_CONFIRMATIONS } from '@/types/conversations'

interface ConversationActionsProps {
  conversationId: string
  conversationTitle: string
  onRename: (conversationId: string, newTitle: string) => Promise<void>
  onDelete: (conversationId: string) => Promise<void>
  onClose: () => void
}

/**
 * Menu d'actions pour une conversation
 * Permet de renommer ou supprimer une conversation
 */
export default function ConversationActions({
  conversationId,
  conversationTitle,
  onRename,
  onDelete,
  onClose,
}: ConversationActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [newTitle, setNewTitle] = useState(conversationTitle)
  const [isLoading, setIsLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Gérer le clic en dehors du menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  // Gérer le renommage
  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newTitle.trim()) {
      setActionError('Le titre ne peut pas être vide')
      return
    }

    if (newTitle === conversationTitle) {
      onClose()
      return
    }

    setIsLoading(true)
    setActionError(null)

    try {
      await onRename(conversationId, newTitle.trim())
      onClose()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Échec du renommage')
    } finally {
      setIsLoading(false)
    }
  }

  // Gérer la suppression
  const handleDelete = async () => {
    setIsLoading(true)
    setActionError(null)

    try {
      await onDelete(conversationId)
      onClose()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Échec de la suppression')
      setShowDeleteConfirm(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Gérer le changement de titre
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTitle(e.target.value)
  }

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Actions de la conversation"
      className="bg-chat-surface-panel border border-chat-border-panel rounded-chat-md shadow-lg min-w-[180px] p-2"
      data-testid={`conversation-actions-${conversationId}`}
    >
      {/* Menu principal */}
      {!showDeleteConfirm && !showRenameModal ? (
        <>
          <button
            onClick={() => setShowRenameModal(true)}
            role="menuitem"
            aria-label={`Renommer ${conversationTitle}`}
            aria-haspopup="true"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors text-left"
            data-testid={`rename-conversation-${conversationId}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
            </svg>
            {CONVERSATION_ACTION_LABELS.rename}
          </button>
          
          <button
            onClick={() => setShowDeleteConfirm(true)}
            role="menuitem"
            aria-label={`Supprimer ${conversationTitle}`}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-chat-error-soft hover:bg-chat-error-surface rounded-chat-sm transition-colors text-left"
            data-testid={`delete-conversation-${conversationId}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {CONVERSATION_ACTION_LABELS.delete}
          </button>
        </>
      ) : null}

      {/* Modale de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="p-3" data-testid={`delete-confirm-${conversationId}`}>
          <p className="text-sm text-chat-ink-muted mb-3">
            {CONVERSATION_CONFIRMATIONS.delete}
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors disabled:opacity-50"
              data-testid={`cancel-delete-${conversationId}`}
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-white bg-chat-error-border hover:bg-chat-error-soft rounded-chat-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`confirm-delete-${conversationId}`}
            >
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      )}

      {/* Modale de renommage */}
      {showRenameModal && (
        <form onSubmit={handleRename} className="p-3" data-testid={`rename-modal-${conversationId}`}>
          <label htmlFor={`rename-input-${conversationId}`} className="block text-sm font-medium text-chat-ink-strong mb-2">
            Nouveau titre
          </label>
          <input
            id={`rename-input-${conversationId}`}
            type="text"
            value={newTitle}
            onChange={handleTitleChange}
            maxLength={200}
            disabled={isLoading}
            className="w-full px-3 py-2 bg-chat-surface-card border border-chat-border rounded-chat-md text-chat-ink-strong text-sm focus:outline-none focus:ring-2 focus:ring-chat-primary disabled:opacity-50"
            aria-label="Nouveau titre de la conversation"
            autoFocus
            data-testid={`rename-input-${conversationId}`}
          />
          <p className="text-xs text-chat-ink-muted mt-1">
            Max 200 caractères
          </p>
          {actionError && (
            <p role="alert" className="text-xs text-chat-error-soft mt-2">
              {actionError}
            </p>
          )}
          <div className="flex gap-2 justify-end mt-3">
            <button
              type="button"
              onClick={() => { setShowRenameModal(false); onClose(); }}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors disabled:opacity-50"
              data-testid={`cancel-rename-${conversationId}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 text-sm text-white bg-chat-primary hover:bg-chat-primary-active rounded-chat-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid={`confirm-rename-${conversationId}`}
            >
              {isLoading ? 'Renommage...' : 'Renommer'}
            </button>
          </div>
        </form>
      )}

      {/* Erreur générale */}
      {actionError && !showRenameModal && !showDeleteConfirm && (
        <p role="alert" className="px-3 py-2 text-xs text-chat-error-soft">
          {actionError}
        </p>
      )}
    </div>
  )
}
