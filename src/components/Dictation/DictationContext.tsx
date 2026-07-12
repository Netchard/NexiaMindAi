'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

/**
 * Dictation (micro) context — panneau Avatar (déclencheur) et ChatInput (récepteur)
 * sont frères sous ChatLayout ; voir EXPERIENCE.md > Component Patterns (2026-07-11)
 * pour le comportement bascule/maintien-F8 et DESIGN.md > mic-toggle-button/mic-ptt-button
 * pour les styles.
 */

type DictationMode = 'toggle' | 'ptt' | null

interface DictationContextType {
  isListening: boolean
  mode: DictationMode
  isSupported: boolean
  permissionDenied: boolean
  transcript: string
  clearTranscript: () => void
  startToggle: () => void
  stopToggle: () => void
  startPTT: () => void
  stopPTT: () => void
}

const DictationContext = createContext<DictationContextType | undefined>(undefined)

export function useDictation() {
  const context = useContext(DictationContext)
  if (!context) {
    throw new Error('useDictation must be used within a DictationProvider')
  }
  return context
}

export function DictationProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false)
  const [mode, setMode] = useState<DictationMode>(null)
  const [transcript, setTranscript] = useState('')
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const modeRef = useRef<DictationMode>(null)
  const finalTranscriptRef = useRef('')

  const isSupported =
    typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const ensureRecognition = useCallback(() => {
    if (recognitionRef.current || !isSupported) return recognitionRef.current

    const RecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!RecognitionCtor) return null

    const recognition = new RecognitionCtor()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interim)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setPermissionDenied(true)
      }
      setIsListening(false)
      setMode(null)
      modeRef.current = null
    }

    recognition.onend = () => {
      setIsListening(false)
      setMode(null)
      modeRef.current = null
    }

    recognitionRef.current = recognition
    return recognition
  }, [isSupported])

  const start = useCallback(
    (requestedMode: 'toggle' | 'ptt') => {
      // Un seul micro actif à la fois — la bascule reste seule maîtresse
      // si elle a démarré la session (voir EXPERIENCE.md > Component Patterns).
      if (!isSupported || modeRef.current) return
      const recognition = ensureRecognition()
      if (!recognition) return

      setPermissionDenied(false)
      finalTranscriptRef.current = ''
      setTranscript('')
      try {
        recognition.start()
        setIsListening(true)
        setMode(requestedMode)
        modeRef.current = requestedMode
      } catch {
        // start() sur une instance déjà démarrée lève — double-déclenchement rapide, ignoré.
      }
    },
    [ensureRecognition, isSupported]
  )

  const stop = useCallback((requestedMode: 'toggle' | 'ptt') => {
    if (modeRef.current !== requestedMode) return
    recognitionRef.current?.stop()
  }, [])

  const startToggle = useCallback(() => start('toggle'), [start])
  const stopToggle = useCallback(() => stop('toggle'), [stop])
  const startPTT = useCallback(() => start('ptt'), [start])
  const stopPTT = useCallback(() => stop('ptt'), [stop])
  const clearTranscript = useCallback(() => setTranscript(''), [])

  // Raccourci global F8 (maintien = micro actif) — capturé quel que soit
  // l'élément focus, y compris pendant la saisie (voir Interaction Primitives).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F8' && !event.repeat) {
        event.preventDefault()
        startPTT()
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'F8') {
        event.preventDefault()
        stopPTT()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [startPTT, stopPTT])

  return (
    <DictationContext.Provider
      value={{
        isListening,
        mode,
        isSupported,
        permissionDenied,
        transcript,
        clearTranscript,
        startToggle,
        stopToggle,
        startPTT,
        stopPTT,
      }}
    >
      {children}
    </DictationContext.Provider>
  )
}
