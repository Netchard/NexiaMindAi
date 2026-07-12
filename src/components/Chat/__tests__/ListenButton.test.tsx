import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { ListenButton } from '../ListenButton'

class FakeUtterance {
  text: string
  lang = ''
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

describe('ListenButton', () => {
  let speak: ReturnType<typeof vi.fn>
  let cancel: ReturnType<typeof vi.fn>

  beforeEach(() => {
    speak = vi.fn((utterance: FakeUtterance) => {
      utterance.onstart?.()
    })
    cancel = vi.fn()
    ;(window as any).speechSynthesis = { speak, cancel, speaking: false }
    ;(window as any).SpeechSynthesisUtterance = FakeUtterance
  })

  afterEach(() => {
    delete (window as any).speechSynthesis
    delete (window as any).SpeechSynthesisUtterance
  })

  test('is disabled with an explanatory title when speech synthesis is unsupported', () => {
    delete (window as any).speechSynthesis
    render(<ListenButton text="Bonjour" />)
    expect(screen.getByTestId('listen-button')).toBeDisabled()
  })

  test('clicking starts speech synthesis and flips the icon/aria-pressed to speaking', () => {
    render(<ListenButton text="Voici la réponse" />)
    const button = screen.getByTestId('listen-button')

    act(() => {
      button.click()
    })

    expect(speak).toHaveBeenCalledTimes(1)
    expect(speak.mock.calls[0][0].text).toBe('Voici la réponse')
    expect(button).toHaveAttribute('aria-pressed', 'true')
    expect(button).toHaveAttribute('aria-label', 'Arrêter la lecture')
  })

  test('clicking again while speaking stops the reading', () => {
    render(<ListenButton text="Voici la réponse" />)
    const button = screen.getByTestId('listen-button')

    act(() => {
      button.click()
    })
    expect(button).toHaveAttribute('aria-pressed', 'true')

    act(() => {
      button.click()
    })
    expect(cancel).toHaveBeenCalled()
  })

  test('reaching the end of the utterance resets the button to idle', () => {
    speak = vi.fn((utterance: FakeUtterance) => {
      utterance.onstart?.()
      utterance.onend?.()
    })
    ;(window as any).speechSynthesis = { speak, cancel, speaking: false }

    render(<ListenButton text="Voici la réponse" />)
    const button = screen.getByTestId('listen-button')

    act(() => {
      button.click()
    })

    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(button).toHaveAttribute('aria-label', 'Écouter la réponse à voix haute')
  })
})
