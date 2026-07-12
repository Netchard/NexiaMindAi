/**
 * Tests unitaires pour ConversationList
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ConversationList from '../ConversationList'
import { ConversationsContext } from '@/components/Conversations/ConversationsContext'
import { DictationProvider } from '@/components/Dictation'

// Mock des composants enfants
vi.mock('../ConversationItem', () => ({
  default: ({ conversation, isActive, onSelect }: any) => (
    <div
      role="listitem"
      aria-label={`Conversation: ${conversation.title}`}
      data-testid={`mock-conversation-item-${conversation.id}`}
      onClick={() => onSelect(conversation.id)}
    >
      <span>{conversation.title}</span>
      <span className="text-xs text-chat-ink-muted mt-1">
        {conversation.messageCount} message{conversation.messageCount > 1 ? 's' : ''}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onSelect(conversation.id); }}>Select</button>
    </div>
  )
}))

describe('ConversationList', () => {
  const mockContext = {
    conversations: [
      { id: 'conv-1', title: 'Première conversation', createdAt: '2024-01-01', updatedAt: '2024-01-02', messageCount: 5 },
      { id: 'conv-2', title: 'Deuxième conversation', createdAt: '2024-01-03', updatedAt: '2024-01-04', messageCount: 3 },
    ],
    currentConversationId: 'conv-1',
    isLoading: false,
    error: null,
    onSelectConversation: vi.fn(),
    onCreateNewConversation: vi.fn().mockResolvedValue('new-conv-id'),
    filterOptions: { themes: [], documentFormats: [] },
    filtersLoading: false,
    filtersError: null,
  }

  const renderComponent = (contextValue = mockContext) => {
    return render(
      <ConversationsContext.Provider value={contextValue}>
        <DictationProvider>
          <ConversationList />
        </DictationProvider>
      </ConversationsContext.Provider>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #3 - Affichage de la liste des conversations', () => {
    it('AC #3 - devrait afficher la liste des conversations', () => {
      renderComponent()
      
      // Vérifier que la liste est affichée
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument()
      
      // Vérifier que les conversations sont affichées
      expect(screen.getByText('Première conversation')).toBeInTheDocument()
      expect(screen.getByText('Deuxième conversation')).toBeInTheDocument()
    })

    it('AC #3 - devrait trier les conversations par date de mise à jour (récentes en premier)', () => {
      const contextWithDates = {
        ...mockContext,
        conversations: [
          { id: 'conv-1', title: 'Ancienne', createdAt: '2024-01-01', updatedAt: '2024-01-01', messageCount: 1 },
          { id: 'conv-2', title: 'Récente', createdAt: '2024-01-02', updatedAt: '2024-01-05', messageCount: 1 },
        ],
      }
      
      renderComponent(contextWithDates)
      
      // La plus récente devrait être affichée en premier
      const items = screen.getAllByTestId(/mock-conversation-item-/)
      expect(items[0]).toHaveTextContent('Récente')
      expect(items[1]).toHaveTextContent('Ancienne')
    })

    it('AC #3 - devrait afficher le nombre de messages', () => {
      renderComponent()
      
      expect(screen.getByText('5 messages')).toBeInTheDocument()
      expect(screen.getByText('3 messages')).toBeInTheDocument()
    })
  })

  describe('AC #8 - Nouvelle conversation', () => {
    it('AC #8 - devrait avoir un bouton Nouvelle conversation', () => {
      renderComponent()
      
      expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument()
    })

    it('AC #8 - devrait créer une nouvelle conversation quand on clique sur le bouton', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('new-conversation-button'))
      
      await waitFor(() => {
        expect(mockContext.onCreateNewConversation).toHaveBeenCalled()
      })
    })
  })

  describe('AC #4 - Sélection de conversation', () => {
    it('AC #4 - devrait permettre de sélectionner une conversation', async () => {
      renderComponent()
      
      // Simuler le clic sur le premier item
      fireEvent.click(screen.getByText('Première conversation'))
      
      await waitFor(() => {
        expect(mockContext.onSelectConversation).toHaveBeenCalledWith('conv-1')
      })
    })
  })

  describe('AC #11 - Accessibilité', () => {
    it('AC #11 - devrait avoir role="list" sur le conteneur', () => {
      renderComponent()
      
      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(list).toHaveAttribute('aria-label', 'Liste des conversations')
    })

    it('AC #11 - devrait avoir role="listitem" sur chaque item', () => {
      renderComponent()
      
      const items = screen.getAllByRole('listitem')
      expect(items.length).toBeGreaterThan(0)
    })

    it('AC #11 - devrait avoir aria-label sur le bouton Nouvelle conversation', () => {
      renderComponent()
      
      const button = screen.getByTestId('new-conversation-button')
      expect(button).toHaveAttribute('aria-label', 'Nouvelle conversation')
    })
  })

  describe('AC #12 - Responsive design', () => {
    it('AC #12 - devrait afficher le bouton toggle sur mobile', () => {
      // Forcer le viewport mobile
      global.innerWidth = 500
      global.dispatchEvent(new Event('resize'))
      
      renderComponent()
      
      expect(screen.getByTestId('conversation-list-toggle')).toBeInTheDocument()
    })

    it('AC #12 - devrait cacher la liste par défaut sur mobile', () => {
      global.innerWidth = 500
      global.dispatchEvent(new Event('resize'))
      
      renderComponent()
      
      // La liste devrait être cachée sur mobile
      const listContainer = screen.getByTestId('conversation-list')
      expect(listContainer).toHaveClass('hidden')
    })
  })

  describe('AC #13 - Gestion d\'erreur', () => {
    it('AC #13 - devrait afficher un message d\'erreur', () => {
      const contextWithError = {
        ...mockContext,
        error: 'Échec du chargement des conversations',
        isLoading: false,
      }
      
      renderComponent(contextWithError)
      
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Échec du chargement des conversations')).toBeInTheDocument()
    })

    it('AC #13 - devrait afficher un indicateur de chargement', () => {
      const contextLoading = {
        ...mockContext,
        isLoading: true,
        conversations: [],
      }
      
      renderComponent(contextLoading)
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })
  })

  describe('AC #151 - État vide', () => {
    it('AC #151 - devrait afficher un message si aucune conversation', () => {
      const contextEmpty = {
        ...mockContext,
        conversations: [],
        isLoading: false,
      }
      
      renderComponent(contextEmpty)
      
      expect(screen.getByText('Aucune conversation. Commencez une nouvelle discussion.')).toBeInTheDocument()
    })
  })
})
