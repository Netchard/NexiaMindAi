import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import TypingIndicator from '../TypingIndicator'

describe('TypingIndicator', () => {
  test('renders three animated dots inside an assistant-styled bubble with an avatar', () => {
    render(<TypingIndicator />)
    expect(screen.getByTestId('chat-typing-indicator')).toBeInTheDocument()
    expect(screen.getByTestId('chat-assistant-avatar')).toBeInTheDocument()
    expect(screen.getByLabelText('NexiaMind AI réfléchit')).toBeInTheDocument()
  })
})
