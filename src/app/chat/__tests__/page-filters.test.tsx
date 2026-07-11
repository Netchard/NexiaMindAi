/**
 * Tests d'intégration pour les filtres dans la page /chat
 * Fait partie de ST-304 - Implémenter les Filtres de Recherche
 *
 * Contrat réel (revue de code du 2026-07-07) : 2 filtres, thème et format de
 * document. `@/components/Filters` n'est PAS mocké ici — le vrai `FilterBar`/
 * `FilterDropdown` est exercé, pour que ce test d'intégration valide
 * effectivement l'intégration réelle (l'ancienne version mockait FilterBar
 * avec un stub à 3 filtres qui ne correspondait déjà plus au composant réel).
 */

import { expect, test, describe, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChatPage from '../page'

const { sendMessage, getHistory } = vi.hoisted(() => ({
  sendMessage: vi.fn(),
  getHistory: vi.fn(),
}))

const { getFilterValues, convertToFilterOptions, FiltersError } = vi.hoisted(() => ({
  getFilterValues: vi.fn(),
  convertToFilterOptions: vi.fn(),
  FiltersError: class FiltersError extends Error {
    constructor(message: string, public readonly status: number) {
      super(message)
    }
  },
}))

// Mock des composants Chat pour éviter de tester leur implémentation
vi.mock('@/components/Chat', async () => {
  const actual = await vi.importActual('@/components/Chat')
  return {
    ...actual,
    ChatInput: ({ onSend, disabled }: { onSend: (content: string) => void; disabled: boolean }) => (
      <div data-testid="chat-input">
        <button data-testid="chat-send-button" onClick={() => onSend('test message')} disabled={disabled}>
          Envoyer
        </button>
      </div>
    ),
    ChatMessageList: ({ messages, isTyping, onSuggestionClick }: { messages: any[]; isTyping: boolean; onSuggestionClick?: (text: string) => void }) => (
      <div data-testid="chat-message-list">
        {messages.map((msg, i) => (
          <div key={i} data-testid={`message-${i}`}>{msg.content}</div>
        ))}
        {isTyping && <div data-testid="chat-typing-indicator">Typing...</div>}
        {onSuggestionClick && (
          <div data-testid="suggestions">
            <button onClick={() => onSuggestionClick('suggestion 1')}>Suggestion 1</button>
          </div>
        )}
      </div>
    ),
    HistoryMenu: ({ conversations, onSelect }: { conversations: any[]; onSelect: (id: string) => void }) => (
      <div data-testid="history-menu">
        {conversations.map((conv) => (
          <button key={conv.id} onClick={() => onSelect(conv.id)} data-testid={`conv-${conv.id}`}>
            {conv.title}
          </button>
        ))}
      </div>
    ),
  }
})

vi.mock('@/components/Chat/api', () => ({
  sendMessage,
  getHistory,
}))

vi.mock('@/lib/api/filters', () => ({
  getFilterValues,
  convertToFilterOptions,
  FiltersError,
}))

beforeEach(() => {
  vi.clearAllMocks()
  Element.prototype.scrollIntoView = vi.fn()

  getHistory.mockResolvedValue({ conversations: [], total: 0, offset: 0, limit: 50 })

  getFilterValues.mockResolvedValue({
    themes: ['Ged', 'Facture'],
    documentFormats: ['pdf', 'markdown'],
  })

  convertToFilterOptions.mockImplementation((filters: any) => ({
    themes: filters.themes.map((t: string) => ({ value: t, label: t })),
    documentFormats: filters.documentFormats.map((f: string) => ({ value: f, label: f })),
  }))

  sendMessage.mockResolvedValue({
    id: 'msg_1',
    conversationId: 'conv_1',
    role: 'assistant',
    content: 'Réponse avec filtres',
    metadata: { model: 'default', tokensUsed: 10, processingTime: 100, timestamp: new Date().toISOString() },
  })
})

describe('ChatPage - Intégration des Filtres', () => {
  test('devrait afficher la FilterBar réelle avec les dropdowns thème/format', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(getFilterValues).toHaveBeenCalled()
    })

    expect(screen.getByRole('region', { name: 'Barre de filtres' })).toBeInTheDocument()
    expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    expect(screen.getByLabelText('Format')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toBeInTheDocument()
  })

  test('devrait charger les valeurs de filtre au montage', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(getFilterValues).toHaveBeenCalledWith()
    })
    expect(getFilterValues).toHaveBeenCalledTimes(1)
  })

  test("devrait afficher l'indicateur de chargement pendant le chargement des filtres", async () => {
    getFilterValues.mockImplementationOnce(() => new Promise(resolve => {
      setTimeout(() => resolve({ themes: ['Ged'], documentFormats: ['pdf'] }), 100)
    }))

    render(<ChatPage />)

    expect(screen.getByText('Chargement des valeurs de filtre...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.queryByText('Chargement des valeurs de filtre...')).not.toBeInTheDocument()
    })
  })

  test('devrait convertir les valeurs de filtre en options pour les dropdowns', async () => {
    const mockFilters = { themes: ['Ged', 'Facture'], documentFormats: ['pdf', 'markdown'] }
    getFilterValues.mockResolvedValueOnce(mockFilters)

    render(<ChatPage />)

    await waitFor(() => {
      expect(convertToFilterOptions).toHaveBeenCalledWith(mockFilters)
    })
  })

  test('devrait permettre de sélectionner des filtres', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'Ged' } })

    expect(screen.getByLabelText('Thème')).toHaveValue('Ged')
  })

  test('devrait activer le bouton Réinitialiser quand des filtres sont sélectionnés', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Réinitialiser/ })).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'Ged' } })

    expect(screen.getByRole('button', { name: /Réinitialiser/ })).not.toBeDisabled()
  })

  test('devrait réinitialiser les filtres quand on clique sur Réinitialiser', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'Ged' } })
    expect(screen.getByLabelText('Thème')).toHaveValue('Ged')

    fireEvent.click(screen.getByRole('button', { name: /Réinitialiser/ }))

    expect(screen.getByLabelText('Thème')).toHaveValue('')
  })

  test('devrait afficher le compteur de filtres actifs', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'Ged' } })
    expect(screen.getByText('1 filtre(s) actif(s)')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'pdf' } })
    expect(screen.getByText('2 filtre(s) actif(s)')).toBeInTheDocument()
  })

  test('devrait passer les filtres actifs à sendMessage, y compris sur le premier message', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Thème'), { target: { value: 'Ged' } })
    fireEvent.change(screen.getByLabelText('Format'), { target: { value: 'pdf' } })

    fireEvent.click(screen.getByTestId('chat-send-button'))

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith(
        'test message',
        undefined, // conversationId : nouvelle conversation
        { theme: 'Ged', documentFormat: 'pdf' } // filtres appliqués dès le 1er message (revue de code)
      )
    })
  })

  test('ne devrait pas passer de filtres vides à sendMessage', async () => {
    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Thème')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('chat-send-button'))

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('test message', undefined, undefined)
    })
  })

  test("devrait gérer l'erreur de chargement des filtres avec une bannière, sans afficher FilterBar", async () => {
    getFilterValues.mockRejectedValueOnce(new Error('Échec du chargement'))

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Échec du chargement des valeurs de filtre')
    // La bannière d'erreur remplace FilterBar, elle ne s'affiche pas à côté (src/app/chat/page.tsx)
    expect(screen.queryByRole('region', { name: 'Barre de filtres' })).not.toBeInTheDocument()
  })

  test('devrait continuer à fonctionner même si le chargement des filtres échoue', async () => {
    getFilterValues.mockRejectedValueOnce(new Error('Échec du chargement'))

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    // Le ChatInput reste utilisable malgré l'échec de chargement des filtres
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('chat-send-button'))

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalled()
    })
  })
})
