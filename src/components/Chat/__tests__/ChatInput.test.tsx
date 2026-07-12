import { expect, test, describe, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatInput from '../ChatInput'
import { DictationProvider } from '@/components/Dictation'

const renderChatInput = (props: React.ComponentProps<typeof ChatInput>) =>
  render(
    <DictationProvider>
      <ChatInput {...props} />
    </DictationProvider>
  )

describe('ChatInput', () => {
  test('submit button is disabled when the field is empty', () => {
    renderChatInput({ onSend: vi.fn(), disabled: false })
    expect(screen.getByTestId('chat-send-button')).toBeDisabled()
  })

  test('typing text enables the submit button', () => {
    renderChatInput({ onSend: vi.fn(), disabled: false })
    fireEvent.change(screen.getByTestId('chat-input-field'), { target: { value: 'Bonjour' } })
    expect(screen.getByTestId('chat-send-button')).not.toBeDisabled()
  })

  test('submitting calls onSend with the typed content and clears the field', () => {
    const onSend = vi.fn()
    renderChatInput({ onSend, disabled: false })
    const field = screen.getByTestId('chat-input-field') as HTMLTextAreaElement
    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.click(screen.getByTestId('chat-send-button'))
    expect(onSend).toHaveBeenCalledWith('Bonjour')
    expect(field.value).toBe('')
  })

  test('Enter alone submits, Shift+Enter inserts a newline instead', () => {
    const onSend = vi.fn()
    renderChatInput({ onSend, disabled: false })
    const field = screen.getByTestId('chat-input-field') as HTMLTextAreaElement

    fireEvent.change(field, { target: { value: 'Bonjour' } })
    fireEvent.keyDown(field, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()

    fireEvent.keyDown(field, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('Bonjour')
  })

  test('button is disabled while a send is in progress', () => {
    renderChatInput({ onSend: vi.fn(), disabled: true })
    fireEvent.change(screen.getByTestId('chat-input-field'), { target: { value: 'Bonjour' } })
    expect(screen.getByTestId('chat-send-button')).toBeDisabled()
  })
})
