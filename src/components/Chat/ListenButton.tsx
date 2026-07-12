'use client'

/**
 * Composant ListenButton
 * Lit une réponse assistant à voix haute (Web Speech API, synthèse) —
 * complète ExportButton dans la barre d'actions de la bulle assistant.
 */

import { useEffect, useRef, useState } from 'react'

export interface ListenButtonProps {
  text: string
  disabled?: boolean
}

function SpeakerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5L6 9H2v6h4l5 4V5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" strokeWidth={2} />
    </svg>
  )
}

export function ListenButton({ text, disabled = false }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  // Lazy init : ce composant est chargé en dynamic(..., { ssr: false }), donc
  // window existe déjà dès le premier rendu — pas besoin d'un effect pour ça.
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      // Ne coupe que si CETTE instance parlait encore — pas la lecture d'une autre bulle.
      if (utteranceRef.current && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleToggle = () => {
    if (!isSupported) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      return
    }

    // Un seul message lu à la fois — coupe toute lecture en cours ailleurs.
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'fr-FR'
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled || !isSupported}
      aria-label={isSpeaking ? 'Arrêter la lecture' : 'Écouter la réponse à voix haute'}
      aria-pressed={isSpeaking}
      title={isSupported ? undefined : 'Lecture à voix haute non disponible sur ce navigateur'}
      className="flex items-center gap-1 px-4 py-2 bg-chat-surface-card hover:bg-chat-surface-hover border border-chat-border rounded-chat-sm text-xs font-medium text-chat-ink-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      data-testid="listen-button"
    >
      {isSpeaking ? <StopIcon /> : <SpeakerIcon />}
    </button>
  )
}

export default ListenButton
