import { expect, test, describe, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HistoryMenu from '../HistoryMenu'
import type { ConversationSummary } from '../types'

const conversations: ConversationSummary[] = [
  { id: 'conv_1', title: 'Livrables Axess', updatedAt: '2026-07-03T17:32:00Z' },
  { id: 'conv_2', title: 'Architecture facturation', updatedAt: '2026-07-02T09:10:00Z' },
]

describe('HistoryMenu', () => {
  test('panel is closed by default; clicking the trigger opens it', () => {
    render(<HistoryMenu conversations={conversations} onSelect={vi.fn()} />)
    expect(screen.queryByTestId('chat-history-panel')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('chat-history-trigger'))
    expect(screen.getByTestId('chat-history-panel')).toBeInTheDocument()
  })

  test('clicking a conversation calls onSelect with its id and closes the panel', () => {
    const onSelect = vi.fn()
    render(<HistoryMenu conversations={conversations} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('chat-history-trigger'))
    fireEvent.click(screen.getByText('Livrables Axess'))
    expect(onSelect).toHaveBeenCalledWith('conv_1')
    expect(screen.queryByTestId('chat-history-panel')).not.toBeInTheDocument()
  })

  test('Escape closes the panel', () => {
    render(<HistoryMenu conversations={conversations} onSelect={vi.fn()} />)
    fireEvent.click(screen.getByTestId('chat-history-trigger'))
    expect(screen.getByTestId('chat-history-panel')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByTestId('chat-history-panel')).not.toBeInTheDocument()
  })

  test('clicking outside the panel closes it', () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <HistoryMenu conversations={conversations} onSelect={vi.fn()} />
      </div>
    )
    fireEvent.click(screen.getByTestId('chat-history-trigger'))
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByTestId('chat-history-panel')).not.toBeInTheDocument()
  })
})
