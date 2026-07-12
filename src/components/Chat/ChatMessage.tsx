'use client'

import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { SourceCitationList } from '@/components/SourceCitation';
import { MarkdownLoadingSpinner } from '@/components/common';
import type { SourceCitation } from '@/types/citations';
import type { ChatMessageData } from './types'

// Lazy loading des composants lourds pour ST-309
const MarkdownRenderer = dynamic(
  () => import('@/components/Markdown').then((mod) => mod.MarkdownRenderer),
  {
    loading: () => <MarkdownLoadingSpinner />,
    ssr: false, // Désactiver SSR pour éviter les erreurs de hydration
  }
)

const ExportButton = dynamic(
  () => import('./').then((mod) => mod.ExportButton),
  {
    loading: () => null, // Pas de spinner pour le bouton
    ssr: false,
  }
)

const ListenButton = dynamic(
  () => import('./').then((mod) => mod.ListenButton),
  {
    loading: () => null,
    ssr: false, // Web Speech API n'existe pas côté serveur
  }
)

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  showAvatar: boolean
  citations?: SourceCitation[]
  id?: string
}

/**
 * ChatMessage Component
 * Renders a single message bubble. User bubbles are coral-gradient, right-aligned;
 * assistant bubbles stay light (deliberate contrast break, DESIGN.md > Colors) and
 * are left-aligned with an avatar shown once per group.
 * 
 * ST-308: Ajout de ExportButton pour l'export des réponses
 */
export default function ChatMessage({ role, content, showAvatar, citations, id = '' }: ChatMessageProps) {
  // État pour le bouton Copier simple (fallback)
  const [copied, setCopied] = useState(false)

  // Gérer la copie du contenu (fallback si ExportButton non disponible)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Échec de la copie:', err)
    }
  }

  // Construire l'objet message pour ExportButton
  const messageData: ChatMessageData = {
    id,
    role,
    content,
    citations,
  }

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[78%] whitespace-pre-wrap rounded-chat-lg rounded-tr-[5px] bg-gradient-to-br from-chat-primary to-chat-primary-active px-[17px] py-3.5 text-[14.5px] leading-relaxed text-chat-on-primary shadow-[0_8px_22px_-12px_rgba(244,105,63,.55)]"
          data-testid="chat-bubble-user"
        >
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2.5">
      {showAvatar ? (
        <div
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-gradient-to-br from-chat-primary to-chat-primary-active text-[11px] font-bold text-chat-on-primary"
          aria-hidden="true"
          data-testid="chat-assistant-avatar"
        >
          N
        </div>
      ) : (
        <div className="w-[26px] flex-none" aria-hidden="true" />
      )}
      <div className="flex max-w-[78%] flex-col gap-2.5">
        {/* Conteneur du message avec boutons Export/Écouter - ST-308 */}
        <div className="relative">
          {/* Boutons Export + Écouter en haut à droite */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
            <ListenButton text={content} />
            <ExportButton message={messageData} />
          </div>

          {/* Message avec Markdown */}
          <div
            className="rounded-chat-lg rounded-tl-[5px] bg-chat-assistant-bg px-[17px] py-3.5 pt-8 text-[14.5px] leading-relaxed text-chat-assistant-text overflow-hidden"
            data-testid="chat-bubble-assistant"
          >
            <MarkdownRenderer content={content} />
          </div>
        </div>
        {/* Affichage des citations de sources (ST-305) */}
        {citations && citations.length > 0 && (
          <SourceCitationList 
            citations={citations} 
            title="📚 Sources :" 
            data-testid="chat-sources"
          />
        )}
      </div>
    </div>
  )
}
