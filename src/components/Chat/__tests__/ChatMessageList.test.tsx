import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ChatMessageList from '../ChatMessageList'
import type { ChatMessageData } from '../types'

const messages: ChatMessageData[] = [
  { id: '1', role: 'user', content: 'Bonjour' },
  { id: '2', role: 'assistant', content: 'Bonjour, comment puis-je vous aider ?' },
  { id: '3', role: 'assistant', content: 'Précision ?' },
  { id: '4', role: 'user', content: 'Une question' },
]

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ChatMessageList', () => {
  test('renders a role="log" aria-live="polite" container', () => {
    render(<ChatMessageList messages={messages} isTyping={false} onSuggestionClick={vi.fn()} />)
    const log = screen.getByRole('log')
    expect(log).toHaveAttribute('aria-live', 'polite')
  })

  test('empty state shows a title and suggestion chips; clicking one calls onSuggestionClick', () => {
    const onSuggestionClick = vi.fn()
    render(<ChatMessageList messages={[]} isTyping={false} onSuggestionClick={onSuggestionClick} />)
    expect(screen.getByText(/Posez votre première question/i)).toBeInTheDocument()
    const chips = screen.getAllByTestId('chat-suggestion-chip')
    expect(chips.length).toBeGreaterThan(0)
    fireEvent.click(chips[0])
    expect(onSuggestionClick).toHaveBeenCalledWith(chips[0].textContent)
  })

  test('groups consecutive assistant messages under a single avatar', () => {
    render(<ChatMessageList messages={messages} isTyping={false} onSuggestionClick={vi.fn()} />)
    // 2 assistant messages in a row -> only 1 avatar rendered for that group
    expect(screen.getAllByTestId('chat-assistant-avatar')).toHaveLength(1)
    expect(screen.getAllByTestId('chat-bubble-assistant')).toHaveLength(2)
  })

  test('shows the typing indicator when isTyping is true', () => {
    render(<ChatMessageList messages={messages} isTyping={true} onSuggestionClick={vi.fn()} />)
    expect(screen.getByTestId('chat-typing-indicator')).toBeInTheDocument()
  })

  test('does not show suggestions once there are messages', () => {
    render(<ChatMessageList messages={messages} isTyping={false} onSuggestionClick={vi.fn()} />)
    expect(screen.queryByTestId('chat-suggestion-chip')).not.toBeInTheDocument()
  })
})
