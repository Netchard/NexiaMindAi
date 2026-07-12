'use client'

/**
 * Composant ExportButton
 * Permet d'exporter une réponse individuelle en Markdown ou CSV
 * Fait partie de ST-308: Implémenter l'Export des Réponses
 */

import { useState, useEffect, useRef } from 'react'
import type { ChatMessageData } from './types'

// Export de l'interface pour réutilisation (MD-003)
export interface ExportButtonProps {
  message: ChatMessageData
  disabled?: boolean
}

type ExportFormat = 'markdown' | 'csv'

/**
 * Convertit un message en Markdown
 * avec validation des types (CR-002)
 */
function messageToMarkdown(message: ChatMessageData): string {
  const roleLabel = message.role === 'user' ? 'User' : 'Assistant'
  // Utiliser Intl pour i18n (HI-004)
  const timestamp = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date())
  
  let content = `### ${roleLabel}\n\n${message.content}\n`

  // Guard contre undefined + validation (CR-002)
  if (message.citations && message.citations.length > 0) {
    content += '\n---\n\n**Sources :**\n\n'

    message.citations.forEach((citation) => {
      // Sécurité : vérifier que citation existe
      if (!citation) return

      const fileName = citation.path.split(/[/\\]/).pop() || citation.path
      content += `- Source ${citation.index} (${citation.type}) : [${fileName}](${citation.url})\n`
    })
  }

  return content
}

/**
 * Convertit un message en CSV
 * Format: role,content,sources
 * avec headers (HI-003) et validation (CR-002)
 */
function messageToCSV(message: ChatMessageData): string {
  // Headers CSV standard
  const header = 'Role,Content,Sources\n'
  
  const role = message.role
  // Escape des guillemets pour CSV
  const content = `"${message.content.replace(/"/g, '""')}"`
  
  // Formater les citations pour CSV avec guard (CR-002)
  const sources = message.citations && message.citations.length > 0
    ? message.citations
        .filter(c => c != null) // Filtrer null/undefined
        .map((c) => {
          const fileName = c.path.split(/[/\\]/).pop() || c.path
          // Double escape pour CSV
          return `"${(c.type + '|' + fileName + '|' + c.url).replace(/"/g, '""')}"`
        })
        .join(';')
    : ''
  
  return header + `${role},${content},${sources}\n`
}

/**
 * Télécharge un fichier
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Bouton pour exporter une réponse individuelle
 */
export function ExportButton({ message, disabled = false }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
  const [showDropdown, setShowDropdown] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const buttonRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  /**
   * Exporte le message dans le format sélectionné
   */
  const handleExport = async (format: ExportFormat) => {
    try {
      setExportFormat(format)
      setIsExporting(true)
      setExportError(null)
      setShowDropdown(false)

      const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_')
      
      if (format === 'markdown') {
        const markdown = messageToMarkdown(message)
        const filename = `response_${timestamp}.md`
        downloadFile(markdown, filename, 'text/markdown')
      } else {
        const csv = messageToCSV(message)
        const filename = `response_${timestamp}.csv`
        downloadFile(csv, filename, 'text/csv')
      }

      setIsExporting(false)
      
    } catch (error) {
      setExportError('Échec de l\'export')
      setIsExporting(false)
    }
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  return (
    <div className="relative" ref={buttonRef}>
      <button
        onClick={toggleDropdown}
        disabled={disabled || isExporting}
        aria-label="Exporter la réponse en Markdown ou CSV"
        aria-haspopup="true"
        aria-expanded={showDropdown}
        aria-controls="export-dropdown-menu"
        aria-live="polite"
        className={`
          flex items-center gap-1 px-4 py-2
          bg-chat-surface-card hover:bg-chat-surface-hover
          border border-chat-border rounded-chat-sm text-xs font-medium text-chat-ink-muted
          transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        `}
        data-testid="export-button"
        title="Exporter la réponse"
      >
        {isExporting ? (
          <svg 
            className="w-3 h-3 animate-spin" 
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
        ) : (
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
              d="M4 16v1a3 3 0 003 3 10 10 0 0010-10 10 10 0 00-10-10-10-10-10-10-3 3 0 00-1 10V16z" 
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 11h4v4H8z"
            />
          </svg>
        )}
      </button>
      
      {showDropdown && (
        <div 
          id="export-dropdown-menu"
          role="menu"
          aria-label="Options d'export"
          className="absolute top-full right-0 mt-1 z-10 bg-chat-surface-panel border border-chat-border-panel rounded-chat-md shadow-lg min-w-[140px] p-2"
          data-testid="export-dropdown"
        >
          <button
            onClick={() => handleExport('markdown')}
            disabled={isExporting}
            role="menuitem"
            aria-label="Exporter en Markdown"
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors disabled:opacity-50 text-left"
            data-testid="export-markdown"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <span>Markdown</span>
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            role="menuitem"
            aria-label="Exporter en CSV"
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-chat-ink-muted hover:bg-chat-surface-hover rounded-chat-sm transition-colors disabled:opacity-50 text-left"
            data-testid="export-csv"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>CSV</span>
          </button>
        </div>
      )}
      
      {exportError && (
        <div 
          role="alert" 
          aria-live="assertive"
          aria-atomic="true"
          className="absolute -bottom-8 left-0 right-0 text-xs text-chat-error-soft text-center"
          data-testid="export-error"
        >
          {exportError}
        </div>
      )}
    </div>
  )
}
