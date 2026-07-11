import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPage from '../page'

const { sendMessage, getHistory } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  getHistory: vi.fn(),
}))

vi.mock('@/components/Chat/api', () => ({
  sendMessage,
  getHistory,
}))

// Ce fichier ne teste pas les filtres (voir page-filters.test.tsx) — mocker
// getFilterValues évite un vrai fetch (échoue en jsdom, "Failed to parse URL")
// qui affiche une bannière d'erreur permanente et casse `findByRole('alert')`
// dans les tests d'erreur d'envoi de message ci-dessous.
vi.mock('@/lib/api/filters', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/filters')>('@/lib/api/filters')
  return {
    ...actual,
    getFilterValues: vi.fn().mockResolvedValue({ themes: [], documentFormats: [] }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()
  getHistory.mockResolvedValue({ conversations: [], total: 0, offset: 0, limit: 50 })
})

describe('ChatPage', () => {
  test('loads history on mount without crashing', async () => {
    render(<ChatPage />)
    await waitFor(() => expect(getHistory).toHaveBeenCalled())
    expect(screen.getByText(/Posez votre première question/i)).toBeInTheDocument()
  })

  test('sending a message shows the user bubble, then the assistant reply', async () => {
    sendMessage.mockResolvedValue({
      id: 'msg_1',
      conversationId: 'conv_1',
      role: 'assistant',
      content: 'Voici la réponse',
      metadata: { model: 'default', tokensUsed: 10, processingTime: 100, timestamp: new Date().toISOString() },
    })

    render(<ChatPage />)
    fireEvent.change(screen.getByTestId('chat-input-field'), { target: { value: 'Bonjour' } })
    fireEvent.click(screen.getByTestId('chat-send-button'))

    expect(await screen.findByTestId('chat-bubble-user')).toHaveTextContent('Bonjour')
    expect(await screen.findByTestId('chat-bubble-assistant')).toHaveTextContent('Voici la réponse')
  })

  test('shows the typing indicator while the response is in flight', async () => {
    let resolveSend: (value: any) => void = () => {}
    sendMessage.mockReturnValue(new Promise((resolve) => { resolveSend = resolve }))

    render(<ChatPage />)
    fireEvent.change(screen.getByTestId('chat-input-field'), { target: { value: 'Bonjour' } })
    fireEvent.click(screen.getByTestId('chat-send-button'))

    expect(await screen.findByTestId('chat-typing-indicator')).toBeInTheDocument()

    resolveSend({
      id: 'msg_1',
      conversationId: 'conv_1',
      role: 'assistant',
      content: 'Réponse',
      metadata: { model: 'default', tokensUsed: 1, processingTime: 1, timestamp: new Date().toISOString() },
    })

    await waitFor(() => expect(screen.queryByTestId('chat-typing-indicator')).not.toBeInTheDocument())
  })

  test('a failed send shows an error banner and keeps the typed message marked as not sent', async () => {
    sendMessage.mockRejectedValue(new Error('Erreur 500: Erreur serveur interne'))

    render(<ChatPage />)
    fireEvent.change(screen.getByTestId('chat-input-field'), { target: { value: 'Bonjour' } })
    fireEvent.click(screen.getByTestId('chat-send-button'))

    const banner = await screen.findByRole('alert')
    expect(banner).toHaveTextContent(/Échec de l.envoi/i)
    expect(screen.getByTestId('chat-bubble-user')).toHaveTextContent('Bonjour')
    expect(screen.getByText('Non envoyé')).toBeInTheDocument()
  })

  test('clicking a suggestion sends it immediately', async () => {
    sendMessage.mockResolvedValue({
      id: 'msg_1',
      conversationId: 'conv_1',
      role: 'assistant',
      content: 'Réponse',
      metadata: { model: 'default', tokensUsed: 1, processingTime: 1, timestamp: new Date().toISOString() },
    })

    render(<ChatPage />)
    const chip = (await screen.findAllByTestId('chat-suggestion-chip'))[0]
    const suggestionText = chip.textContent
    fireEvent.click(chip)

    // 3e argument : les filtres actifs (aucun ici, ST-304) — toujours transmis, même undefined.
    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith(suggestionText, undefined, undefined))
  })
})
