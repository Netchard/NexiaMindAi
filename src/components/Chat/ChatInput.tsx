'use client'

import { useRef, useState } from 'react'
import { Send } from './icons'

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
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
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
        className="flex-1 resize-none rounded-chat-md border border-chat-border bg-chat-surface-card px-3.5 py-2.5 text-base text-chat-ink placeholder-chat-ink-muted focus:outline-none focus:ring-2 focus:ring-chat-ring dark:border-chat-border-dark dark:bg-chat-surface-card-dark dark:text-chat-ink-dark dark:placeholder-chat-ink-muted-dark"
        style={{ minHeight: '44px', maxHeight: '140px' }}
        data-testid="chat-input-field"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        aria-label="Envoyer le message"
        className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-chat-primary text-chat-on-primary transition-colors hover:bg-chat-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chat-ring disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="chat-send-button"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
