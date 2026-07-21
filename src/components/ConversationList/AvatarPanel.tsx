'use client'

/**
 * Composant AvatarPanel
 * Panel sous la liste de conversations : zone réservée à un avatar 3D +
 * deux contrôles micro (bascule, maintien F8) pour la dictée vers ChatInput.
 * Voir DESIGN.md > avatar-panel / mic-toggle-button / mic-ptt-button et
 * EXPERIENCE.md > Component Patterns (mise à jour 2026-07-11).
 */

import { useDictation } from '@/components/Dictation'

function MicIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}

const activeClasses = 'bg-chat-primary border-chat-primary text-white'
const idleClasses = 'bg-chat-surface border-chat-border-soft text-chat-ink-muted hover:text-chat-ink-strong'

export default function AvatarPanel() {
  const { isListening, mode, isSupported, permissionDenied, startToggle, stopToggle, startPTT, stopPTT } =
    useDictation()

  const isToggleActive = isListening && mode === 'toggle'
  const isPttActive = isListening && mode === 'ptt'

  return (
    <div className="p-4 border-t border-chat-border-panel" data-testid="avatar-panel" suppressHydrationWarning>
      <div className="flex flex-col items-center gap-4">
        {/* Zone réservée pour l'avatar 3D — voir DESIGN.md > avatar-panel-avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
          style={{
            background: 'linear-gradient(135deg, #F4693F, #E64F2B)',
            boxShadow: '0 8px 22px -12px rgba(244,105,63,.55)',
          }}
          data-testid="avatar-3d-container"
        >
          {/* <Avatar3DModel /> */}
          N
        </div>

        <div className="flex gap-3 w-full justify-center">
          <button
            type="button"
            onClick={isToggleActive ? stopToggle : startToggle}
            disabled={!isSupported}
            aria-label="Activer/désactiver le micro"
            aria-pressed={isToggleActive}
            data-testid="avatar-panel-mic-toggle"
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-chat-md border text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isToggleActive ? activeClasses : idleClasses
            }`}
          >
            <MicIcon className="w-5 h-5" />
            <span>Micro</span>
          </button>

          <button
            type="button"
            onMouseDown={startPTT}
            onMouseUp={stopPTT}
            onMouseLeave={() => isPttActive && stopPTT()}
            onTouchStart={startPTT}
            onTouchEnd={stopPTT}
            disabled={!isSupported}
            aria-label="Maintenir pour parler (F8)"
            aria-pressed={isPttActive}
            data-testid="avatar-panel-mic-ptt"
            className={`flex-1 flex flex-col items-center justify-center gap-1 px-4 py-2.5 rounded-chat-md border text-sm font-medium transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed ${
              isPttActive ? activeClasses : idleClasses
            }`}
          >
            <MicIcon className="w-5 h-5" />
            <span className={`text-[11px] ${isPttActive ? 'text-white' : 'text-chat-ink-faint'}`}>
              Maintenir (F8)
            </span>
          </button>
        </div>

        {(!isSupported || permissionDenied) && (
          <p role="status" aria-live="polite" className="text-xs text-chat-ink-faint text-center">
            {!isSupported
              ? 'Dictée vocale non disponible sur ce navigateur.'
              : "Micro refusé — autorisez l'accès dans les paramètres du navigateur."}
          </p>
        )}
      </div>
    </div>
  )
}
