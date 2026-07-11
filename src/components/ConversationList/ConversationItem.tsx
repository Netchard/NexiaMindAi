'use client'

/**
 * Composant ConversationItem
 * Item individuel dans la liste des conversations
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { useState, useRef, useEffect } from 'react'
import type { Conversation } from '@/types/conversations'
import ConversationActions from './ConversationActions'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: (conversationId: string) => Promise<void>
  onRename: (conversationId: string, newTitle: string) => Promise<void>
  onDelete: (conversationId: string) => Promise<void>
}

/**
 * Item de conversation dans la liste
 * Affiche le titre, la date, le nombre de messages et les actions
 */
export default function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  // Gérer le clic sur l'item
  const handleClick = async (e: React.MouseEvent) => {
    // Si on clique sur un bouton d'action, ne pas sélectionner
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    await onSelect(conversation.id)
  }

  // Gérer le hover pour mobile
  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  // Gérer le clic en dehors des actions (pour fermer le menu actions)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (itemRef.current && !itemRef.current.contains(event.target as Node)) {
        setShowActions(false)
      }
    }

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActions])

  // Toggle menu actions
  const toggleActions = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowActions(!showActions)
  }

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  return (
    <div
      ref={itemRef}
      role="listitem"
      aria-label={`Conversation: ${conversation.title}`}
      aria-current={isActive ? 'true' : 'false'}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative flex items-center justify-between p-3 rounded-chat-md cursor-pointer
        transition-colors duration-150
        ${isActive 
          ? 'bg-chat-surface-panel border border-chat-border-panel' 
          : 'hover:bg-chat-surface-hover text-chat-ink-muted'
        }
        ${isHovered && !isActive ? 'bg-chat-surface-hover' : ''}
      `}
      data-testid={`conversation-item-${conversation.id}`}
    >
      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          {/* Indicateur de conversation active */}
          {isActive && (
            <div className="w-2 h-8 rounded-r-chat-md bg-chat-primary" />
          )}
          
          {/* Info de la conversation */}
          <div className={`min-w-0 ${isActive ? 'ml-2' : ''}`}>
            <h3 className="text-sm font-medium text-chat-ink-strong break-words">
              {conversation.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-chat-ink-muted mt-1">
              <span>{formatDate(conversation.updatedAt)}</span>
              <span className="text-chat-ink-subtle">
                {conversation.messageCount} message{conversation.messageCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggleActions}
          aria-label={`Actions pour ${conversation.title}`}
          aria-haspopup="true"
          aria-expanded={showActions}
          className="p-1 rounded-chat-sm hover:bg-chat-surface-hover text-chat-ink-muted transition-colors"
          data-testid={`conversation-actions-toggle-${conversation.id}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {/* Menu actions */}
        {showActions && (
          <div className="absolute top-full right-0 mt-1 z-10">
            <ConversationActions
              conversationId={conversation.id}
              conversationTitle={conversation.title}
              onRename={onRename}
              onDelete={onDelete}
              onClose={() => setShowActions(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
