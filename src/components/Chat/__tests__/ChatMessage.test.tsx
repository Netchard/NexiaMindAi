import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatMessage from '../ChatMessage'

describe('ChatMessage', () => {
  test('user message renders with the user bubble styling and no avatar', () => {
    render(<ChatMessage role="user" content="Bonjour" showAvatar={false} />)
    const bubble = screen.getByTestId('chat-bubble-user')
    expect(bubble).toHaveTextContent('Bonjour')
    expect(screen.queryByTestId('chat-assistant-avatar')).not.toBeInTheDocument()
  })

  test('assistant message renders with the assistant bubble styling, an avatar, and a sources placeholder', () => {
    render(<ChatMessage role="assistant" content="Voici la réponse" showAvatar={true} />)
    expect(screen.getByTestId('chat-bubble-assistant')).toHaveTextContent('Voici la réponse')
    expect(screen.getByTestId('chat-assistant-avatar')).toBeInTheDocument()
    expect(screen.getByTestId('chat-sources-placeholder')).toBeInTheDocument()
  })

  test('assistant message without showAvatar (grouped message) omits the avatar', () => {
    render(<ChatMessage role="assistant" content="Suite" showAvatar={false} />)
    expect(screen.queryByTestId('chat-assistant-avatar')).not.toBeInTheDocument()
  })

  test('preserves line breaks in content', () => {
    render(<ChatMessage role="assistant" content={'Ligne 1\nLigne 2'} showAvatar={true} />)
    expect(screen.getByTestId('chat-bubble-assistant')).toHaveClass('whitespace-pre-wrap')
  })

  test('assistant avatar is decorative (aria-hidden)', () => {
    render(<ChatMessage role="assistant" content="Bonjour" showAvatar={true} />)
    expect(screen.getByTestId('chat-assistant-avatar')).toHaveAttribute('aria-hidden', 'true')
  })
})
