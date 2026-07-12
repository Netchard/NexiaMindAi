import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AvatarPanel from '@/components/ConversationList/AvatarPanel'
import ChatInput from '@/components/Chat/ChatInput'
import { DictationProvider } from '@/components/Dictation'

/**
 * Smoke test verifying the real AvatarPanel <-> DictationContext <-> ChatInput
 * wiring (panneau Avatar sous la sidebar, zone de saisie rendue par les pages
 * — voir EXPERIENCE.md > Component Patterns, mise à jour 2026-07-11).
 */

class FakeSpeechRecognition {
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null
  onend: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn(() => {
    this.onend?.()
  })
  abort = vi.fn()

  emitFinalResult(transcript: string) {
    this.onresult?.({
      resultIndex: 0,
      results: [[{ transcript }]].map((r) =>
        Object.assign(r, { isFinal: true, 0: r[0] })
      ),
    })
  }
}

let recognitionInstance: FakeSpeechRecognition

beforeEach(() => {
  recognitionInstance = new FakeSpeechRecognition()
  ;(window as any).SpeechRecognition = vi.fn(() => recognitionInstance)
})

afterEach(() => {
  delete (window as any).SpeechRecognition
  delete (window as any).webkitSpeechRecognition
})

const renderChat = () =>
  render(
    <DictationProvider>
      <AvatarPanel />
      <ChatInput onSend={vi.fn()} disabled={false} />
    </DictationProvider>
  )

describe('Dictation integration (AvatarPanel -> ChatInput)', () => {
  test('toggle mic button starts listening and dictated text lands in the composer', () => {
    renderChat()
    const toggleButton = screen.getByTestId('avatar-panel-mic-toggle')
    const field = screen.getByTestId('chat-input-field') as HTMLTextAreaElement

    fireEvent.click(toggleButton)
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true')
    expect(recognitionInstance.start).toHaveBeenCalledTimes(1)

    act(() => {
      recognitionInstance.emitFinalResult('Bonjour NexiaMind')
    })
    expect(field.value).toBe('Bonjour NexiaMind')

    fireEvent.click(toggleButton)
    expect(recognitionInstance.stop).toHaveBeenCalledTimes(1)
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('holding the F8 key starts push-to-talk and releasing stops it', () => {
    renderChat()
    const pttButton = screen.getByTestId('avatar-panel-mic-ptt')

    fireEvent.keyDown(window, { key: 'F8' })
    expect(pttButton).toHaveAttribute('aria-pressed', 'true')
    expect(recognitionInstance.start).toHaveBeenCalledTimes(1)

    fireEvent.keyUp(window, { key: 'F8' })
    expect(recognitionInstance.stop).toHaveBeenCalledTimes(1)
    expect(pttButton).toHaveAttribute('aria-pressed', 'false')
  })

  test('F8 has no effect while the toggle session already owns the microphone', () => {
    renderChat()
    const toggleButton = screen.getByTestId('avatar-panel-mic-toggle')
    const pttButton = screen.getByTestId('avatar-panel-mic-ptt')

    fireEvent.click(toggleButton)
    expect(recognitionInstance.start).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, { key: 'F8' })
    expect(recognitionInstance.start).toHaveBeenCalledTimes(1) // no second start
    expect(pttButton).toHaveAttribute('aria-pressed', 'false')
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true')
  })

  test('both mic buttons are disabled when the browser has no SpeechRecognition support', () => {
    delete (window as any).SpeechRecognition
    renderChat()
    expect(screen.getByTestId('avatar-panel-mic-toggle')).toBeDisabled()
    expect(screen.getByTestId('avatar-panel-mic-ptt')).toBeDisabled()
    expect(screen.getByText('Dictée vocale non disponible sur ce navigateur.')).toBeInTheDocument()
  })
})
