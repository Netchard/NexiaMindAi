/**
 * Tests unitaires pour ConversationHeader
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ConversationHeader from '../ConversationHeader'
import { ConversationsContext } from '@/components/Conversations/ConversationsContext'

// Mock de useConversations
const mockUseConversations = {
  onCreateNewConversation: vi.fn().mockResolvedValue('new-conv-id'),
}

vi.mock('@/components/Conversations/ConversationsContext', () => ({
  useConversations: () => mockUseConversations,
  ConversationsContext: {
    Provider: ({ children }: any) => children,
  },
}))

describe('ConversationHeader', () => {
  const mockOnRename = vi.fn()
  const mockOnDelete = vi.fn()

  const renderComponent = (
    conversationId: string | null = 'conv-123',
    title: string = 'Test Conversation',
    isLoading: boolean = false
  ) => {
    return render(
      <ConversationHeader
        conversationId={conversationId}
        title={title}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        isLoading={isLoading}
      />
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #2 - Affichage du titre', () => {
    it('AC #2 - devrait afficher le titre de la conversation', () => {
      renderComponent()
      
      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })

    it('AC #2 - devrait afficher "Chargement..." si pas de titre', () => {
      renderComponent(null, 'Chargement...')
      
      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })

    it('AC #2 - devrait afficher le titre en h1', () => {
      renderComponent()
      
      const heading = screen.getByRole('heading', { level: 1, name: 'Test Conversation' })
      expect(heading).toBeInTheDocument()
    })
  })

  describe('AC #5 - Renommage inline', () => {
    it('AC #5 - devrait permettre de cliquer sur le titre pour le renommer', async () => {
      renderComponent()
      
      // Cliquer sur le titre
      fireEvent.click(screen.getByTestId('conversation-title'))
      
      await waitFor(() => {
        expect(screen.getByTestId('conversation-title-input')).toBeInTheDocument()
      })
    })

    it('AC #5 - devrait appeler onRename quand on valide le nouveau titre', async () => {
      renderComponent()
      
      // Ouvrir l'édition
      fireEvent.click(screen.getByTestId('conversation-title'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-title-input')).toBeInTheDocument()
      })
      
      // Changer le titre
      const input = screen.getByTestId('conversation-title-input')
      fireEvent.change(input, { target: { value: 'Nouveau titre' } })
      
      // Valider (blur)
      fireEvent.blur(input)
      
      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('Nouveau titre')
      })
    })

    it('AC #5 - devrait annuler le renommage avec Escape', async () => {
      renderComponent()
      
      // Ouvrir l'édition
      fireEvent.click(screen.getByTestId('conversation-title'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-title-input')).toBeInTheDocument()
      })
      
      // Appuyer sur Escape
      const input = screen.getByTestId('conversation-title-input')
      fireEvent.keyDown(input, { key: 'Escape' })
      
      await waitFor(() => {
        expect(screen.queryByTestId('conversation-title-input')).not.toBeInTheDocument()
      })
      expect(mockOnRename).not.toHaveBeenCalled()
    })
  })

  describe('AC #8 - Nouvelle conversation', () => {
    it('AC #8 - devrait avoir un bouton Nouvelle conversation', () => {
      renderComponent()
      
      expect(screen.getByTestId('new-conversation-header-button')).toBeInTheDocument()
    })

    it('AC #8 - devrait appeler onCreateNewConversation quand on clique sur le bouton', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('new-conversation-header-button'))
      
      await waitFor(() => {
        expect(mockUseConversations.onCreateNewConversation).toHaveBeenCalled()
      })
    })

    it('AC #8 - devrait avoir le label correct sur le bouton', () => {
      renderComponent()
      
      const button = screen.getByTestId('new-conversation-header-button')
      expect(button).toHaveAttribute('aria-label', 'Nouvelle conversation')
    })
  })

  describe('AC #5/#6 - Menu actions', () => {
    it('AC #5/#6 - devrait ouvrir le menu actions quand on clique sur le bouton', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
    })

    it('AC #5 - devrait ouvrir la modale de renommage depuis le menu actions', async () => {
      renderComponent()
      
      // Ouvrir le menu actions
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
      
      // Cliquer sur Renommer
      fireEvent.click(screen.getByTestId('rename-conversation-header'))
      
      // L'input d'édition devrait s'ouvrir
      await waitFor(() => {
        expect(screen.getByTestId('conversation-title-input')).toBeInTheDocument()
      })
    })

    it('AC #6 - devrait ouvrir la modale de confirmation de suppression depuis le menu actions', async () => {
      renderComponent()
      
      // Ouvrir le menu actions
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
      
      // Cliquer sur Supprimer
      fireEvent.click(screen.getByTestId('delete-conversation-header'))
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument()
      })
    })
  })

  describe('AC #6 - Suppression', () => {
    it('AC #6 - devrait appeler onDelete quand la suppression est confirmée', async () => {
      renderComponent()
      
      // Ouvrir le menu actions
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
      
      // Ouvrir la confirmation de suppression
      fireEvent.click(screen.getByTestId('delete-conversation-header'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument()
      })
      
      // Confirmer
      fireEvent.click(screen.getByTestId('confirm-delete-confirm'))
      
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled()
      })
    })

    it('AC #6 - devrait afficher le message de confirmation', async () => {
      renderComponent()
      
      // Ouvrir le menu actions
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
      
      // Ouvrir la confirmation de suppression
      fireEvent.click(screen.getByTestId('delete-conversation-header'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument()
      })
      
      expect(screen.getByText('Supprimer la conversation')).toBeInTheDocument()
      expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer/)).toBeInTheDocument()
    })

    it('AC #6 - devrait annuler la suppression', async () => {
      renderComponent()
      
      // Ouvrir le menu actions
      fireEvent.click(screen.getByTestId('conversation-header-actions-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('conversation-header-actions-menu')).toBeInTheDocument()
      })
      
      // Ouvrir la confirmation de suppression
      fireEvent.click(screen.getByTestId('delete-conversation-header'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument()
      })
      
      // Annuler
      fireEvent.click(screen.getByTestId('cancel-delete-confirm'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirm-modal')).not.toBeInTheDocument()
      })
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('AC #11 - Accessibilité', () => {
    it('AC #11 - devrait avoir des boutons avec aria-label', () => {
      renderComponent()
      
      const newButton = screen.getByTestId('new-conversation-header-button')
      expect(newButton).toHaveAttribute('aria-label', 'Nouvelle conversation')
      
      const actionsButton = screen.getByTestId('conversation-header-actions-toggle')
      expect(actionsButton).toHaveAttribute('aria-label', 'Actions de la conversation')
      expect(actionsButton).toHaveAttribute('aria-haspopup', 'true')
      expect(actionsButton).toHaveAttribute('aria-expanded', 'false')
    })

    it('AC #11 - devrait mettre à jour aria-expanded quand le menu est ouvert', async () => {
      renderComponent()
      
      const actionsButton = screen.getByTestId('conversation-header-actions-toggle')
      
      fireEvent.click(actionsButton)
      
      await waitFor(() => {
        expect(actionsButton).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('AC #14 - État de chargement', () => {
    it('AC #14 - devrait désactiver les boutons pendant le chargement', () => {
      renderComponent('conv-123', 'Test', true)
      
      const newButton = screen.getByTestId('new-conversation-header-button')
      expect(newButton).toBeDisabled()
      
      const actionsButton = screen.getByTestId('conversation-header-actions-toggle')
      expect(actionsButton).toBeDisabled()
    })
  })

  describe('AC #9 - Intégration ST-304', () => {
    it('AC #9 - devrait désactiver le renommage si pas de conversationId', () => {
      renderComponent(null, 'Test')
      
      const titleButton = screen.getByTestId('conversation-title')
      expect(titleButton).toBeDisabled()
    })

    it('AC #9 - devrait désactiver le bouton actions si pas de conversationId', () => {
      renderComponent(null, 'Test')
      
      const actionsButton = screen.getByTestId('conversation-header-actions-toggle')
      expect(actionsButton).toBeDisabled()
    })
  })
})
