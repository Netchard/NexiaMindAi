'use client'

/**
 * Composant CopyConversationButton
 * Permet de copier l'intégralité d'une conversation dans le presse-papiers
 * Fait partie de ST-308: Implémenter l'Export des Réponses
 */

import { useState } from 'react'
import { useConversations } from '@/components/Conversations'
import type { ChatMessageData } from '@/components/Chat'

// Export de l'interface pour réutilisation (MD-004)
export interface CopyConversationButtonProps {
  conversationId: string
  disabled?: boolean
}

/**
 * Formatage d'un message en Markdown pour la copie
 */
function formatMessageToMarkdown(message: ChatMessageData): string {
  const roleLabel = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**'
  const timestamp = message.id ? new Date(message.id).toLocaleString('fr-FR') : ''
  
  let content = message.content
  
  // Ajouter les citations si elles existent
  if (message.citations && message.citations.length > 0) {
    const citationsMarkdown = message.citations
      .map((citation, index) => {
        // Format basé sur le type SourceCitation
        const sourceInfo = citation.source
          ? `[$${citation.source}]`
          : citation.filePath
            ? `\`${citation.filePath}\``
            : `[Source ${index + 1}]`
        const contentPreview = citation.contentPreview
          ? ` \"${citation.contentPreview}\"`
          : ''
        const pageInfo = citation.pageNumber ? ` (p.${citation.pageNumber})` : ''
        
        return `\n\n> **Source ${index + 1}** : ${sourceInfo}${pageInfo}${contentPreview}`
      })
      .join('\n')
    
    content = `${content}\n\n---${citationsMarkdown}`
  }
  
  return `${roleLabel}\n\n${content}\n`
}

/**
 * Génère le Markdown complet d'une conversation
 * Optimisé avec Array.join() pour les grandes conversations (CR-003)
 */
function generateConversationMarkdown(
  messages: ChatMessageData[],
  conversationTitle: string = 'Conversation'
): string {
  // Utiliser Intl pour i18n (HI-004)
  const date = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date())
  
  // Construction avec Array pour performance O(n) au lieu de O(n²)
  const parts = [
    `# ${conversationTitle}`,
    '',
    `*Exporté le : ${date}*`,
    '',
    '---',
    '',
    ...messages.map((msg, index) => {
      const separator = index > 0 ? '\n---\n\n' : ''
      return separator + formatMessageToMarkdown(msg)
    })
  ]
  
  return parts.join('\n')
}

/**
 * Bouton pour copier une conversation entière dans le presse-papiers
 */
export function CopyConversationButton({
  conversationId,
  disabled = false,
}: CopyConversationButtonProps) {
  const { conversationStates } = useConversations()
  const [isCopying, setIsCopying] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)

  const conversationState = conversationStates[conversationId]
  const conversationTitle = conversationState?.conversation?.title || 'Conversation sans titre'
  // Utiliser les messages de l'état de la conversation spécifique
  // ConversationMessage a déjà la structure compatible avec ChatMessageData
  const messages: ChatMessageData[] = conversationState?.messages?.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    citations: msg.sources, // sources est déjà de type SourceCitation[]
  })) || []

  /**
   * Copie la conversation dans le presse-papiers
   * avec feature detection et fallback (CR-001, EC-003)
   */
  const handleCopy = async () => {
    // EC-001: Ne pas lancer la copie si aucun message
    if (messages.length === 0) {
      setCopyError('Aucun message à copier')
      return // Ne pas setIsCopying si rien à faire
    }

    // CR-001: Feature detection pour Clipboard API
    if (!navigator.clipboard) {
      setCopyError('Clipboard API non disponible')
      return
    }

    try {
      setIsCopying(true)
      setCopyError(null)
      setCopySuccess(false)

      // Générer le Markdown de la conversation
      const markdown = generateConversationMarkdown(messages, conversationTitle)
      
      // Utiliser l'API Clipboard
      await navigator.clipboard.writeText(markdown)
      
      setCopySuccess(true)
      
      // Réinitialiser le succès après 3 secondes
      const timer = setTimeout(() => {
        setCopySuccess(false)
      }, 3000)
      
      // Nettoyer le timer si le composant est unmounted
      // (à gérer via useEffect cleanup si nécessaire)
      
    } catch (error) {
      setCopyError('Échec de la copie dans le presse-papiers')
      setCopySuccess(false)
      
      // EC-003: Fallback clipboard avec feature detection
      try {
        // Vérifier que execCommand est disponible
        if (document.execCommand) {
          const markdown = generateConversationMarkdown(messages, conversationTitle)
          const textArea = document.createElement('textarea')
          textArea.value = markdown
          textArea.style.position = 'fixed'
          textArea.style.opacity = '0'
          textArea.style.pointerEvents = 'none'
          document.body.appendChild(textArea)
          textArea.select()
          
          // execCommand peut échouer, vérifier le résultat
          const success = document.execCommand('copy')
          document.body.removeChild(textArea)
          
          if (success) {
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 3000)
          } else {
            setCopyError('Impossible de copier. Veuillez réessayer.')
          }
        } else {
          setCopyError('Impossible de copier. Veuillez réessayer.')
        }
      } catch (fallbackError) {
        setCopyError('Impossible de copier. Veuillez réessayer.')
      }
    } finally {
      setIsCopying(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        disabled={disabled || isCopying || messages.length === 0}
        aria-label="Copier la conversation dans le presse-papiers"
        aria-busy={isCopying}
        aria-live="polite"
        title="Copier la conversation"
        className={`
          flex items-center gap-1.5 px-3 py-1.5
          ${copySuccess ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-chat-surface-card hover:bg-chat-surface-hover'}
          border border-chat-border rounded-chat-md text-sm font-medium
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        `}
        data-testid="copy-conversation-button"
        title="Copier la conversation"
      >
        {isCopying ? (
          <>
            <svg 
              className="w-4 h-4 animate-spin" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Copie...</span>
          </>
        ) : copySuccess ? (
          <>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Copié !</span>
          </>
        ) : (
          <>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
            <span>Copier</span>
          </>
        )}
      </button>
      
      {copyError && (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
          className="absolute -bottom-8 left-0 right-0 text-sm text-chat-error-soft text-center"
          data-testid="copy-error"
        >
          {copyError}
        </div>
      )}
    </div>
  )
}
