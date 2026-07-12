'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from './icons'
import { useDictation } from '@/components/Dictation'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

/**
 * ChatInput Component
 * Auto-growing textarea + send button. Enter submits, Shift+Enter inserts a newline.
 */
export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isListening, transcript, clearTranscript } = useDictation()
  const dictationBaseRef = useRef('')
  const wasListeningRef = useRef(false)

  const resize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  // Dictée (micro bascule/maintien, voir EXPERIENCE.md > Component Patterns) :
  // capture le texte déjà présent au démarrage de l'écoute, puis le complète
  // en direct avec le transcript reconnu — jamais d'envoi automatique.
  useEffect(() => {
    if (isListening && !wasListeningRef.current) {
      dictationBaseRef.current = value
    }
    if (!isListening && wasListeningRef.current) {
      clearTranscript()
    }
    wasListeningRef.current = isListening
  }, [isListening, value, clearTranscript])

  useEffect(() => {
    if (!isListening) return
    const base = dictationBaseRef.current
    const needsSpace = base.length > 0 && !/\s$/.test(base)
    setValue(transcript ? `${base}${needsSpace ? ' ' : ''}${transcript}` : base)
    resize()
  }, [transcript, isListening])

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    resize()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="flex items-end gap-2.5">
      <label htmlFor="chat-input" className="sr-only">
        Votre message
      </label>
      <textarea
        ref={textareaRef}
        id="chat-input"
        rows={1}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Écrivez votre question…"
        className="flex-1 resize-none rounded-chat-md border border-chat-border bg-chat-surface-card px-3.5 py-2.5 text-base text-chat-ink placeholder-chat-ink-faint focus:outline-none focus:border-chat-primary"
        style={{ minHeight: '48px', maxHeight: '140px' }}
        data-testid="chat-input-field"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Envoyer le message"
        className="flex h-12 w-12 flex-none items-center justify-center rounded-chat-md bg-gradient-to-br from-chat-primary to-chat-primary-active text-chat-on-primary shadow-[0_8px_20px_-8px_rgba(244,105,63,.55)] transition-colors hover:from-chat-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-primary disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="chat-send-button"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
