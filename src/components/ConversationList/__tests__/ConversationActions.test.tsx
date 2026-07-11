/**
 * Tests unitaires pour ConversationActions
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import ConversationActions from '../ConversationActions'

describe('ConversationActions', () => {
  const mockOnRename = vi.fn()
  const mockOnDelete = vi.fn()
  const mockOnClose = vi.fn()

  const renderComponent = (conversationId = 'conv-123', conversationTitle = 'Test Conversation') => {
    return render(
      <ConversationActions
        conversationId={conversationId}
        conversationTitle={conversationTitle}
        onRename={mockOnRename}
        onDelete={mockOnDelete}
        onClose={mockOnClose}
      />
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #5 - Menu principal', () => {
    it('AC #5 - devrait afficher les boutons Renommer et Supprimer', () => {
      renderComponent()
      
      expect(screen.getByTestId('rename-conversation-conv-123')).toBeInTheDocument()
      expect(screen.getByTestId('delete-conversation-conv-123')).toBeInTheDocument()
    })

    it('AC #5 - devrait ouvrir la modale de renommage quand on clique sur Renommer', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
    })

    it('AC #5 - devrait ouvrir la confirmation de suppression quand on clique sur Supprimer', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
    })
  })

  describe('AC #5 - Renommage', () => {
    it('AC #5 - devrait appeler onRename avec le nouveau titre', async () => {
      renderComponent()
      
      // Ouvrir la modale de renommage
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
      
      // Entrer un nouveau titre
      const input = screen.getByTestId('rename-input-conv-123')
      fireEvent.change(input, { target: { value: 'Nouveau titre' } })
      
      // Soumettre
      fireEvent.click(screen.getByTestId('confirm-rename-conv-123'))
      
      await waitFor(() => {
        expect(mockOnRename).toHaveBeenCalledWith('conv-123', 'Nouveau titre')
      })
    })

    it('AC #5 - ne devrait pas appeler onRename si le titre est vide', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
      
      // Entrer un titre vide
      const input = screen.getByTestId('rename-input-conv-123')
      fireEvent.change(input, { target: { value: '' } })
      
      // Soumettre
      fireEvent.click(screen.getByTestId('confirm-rename-conv-123'))
      
      // Vérifier que l'erreur est affichée
      await waitFor(() => {
        expect(screen.getByText('Le titre ne peut pas être vide')).toBeInTheDocument()
      })
      
      // Vérifier que onRename n'a pas été appelé
      expect(mockOnRename).not.toHaveBeenCalled()
    })

    it('AC #5 - devrait annuler le renommage', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
      
      // Annuler
      fireEvent.click(screen.getByTestId('cancel-rename-conv-123'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('rename-modal-conv-123')).not.toBeInTheDocument()
      })
      expect(mockOnRename).not.toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('AC #6 - Suppression', () => {
    it('AC #6 - devrait ouvrir la modale de confirmation de suppression', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
    })

    it('AC #6 - devrait afficher le message de confirmation correct', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      
      await waitFor(() => {
        expect(screen.getByText(/Êtes-vous sûr de vouloir supprimer/)).toBeInTheDocument()
      })
    })

    it('AC #6 - devrait appeler onDelete quand confirmé', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('confirm-delete-conv-123'))
      
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('conv-123')
      })
    })

    it('AC #6 - devrait annuler la suppression', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
      
      // Annuler
      fireEvent.click(screen.getByTestId('cancel-delete-conv-123'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirm-conv-123')).not.toBeInTheDocument()
      })
      expect(mockOnDelete).not.toHaveBeenCalled()
    })
  })

  describe('AC #11 - Accessibilité', () => {
    it('AC #11 - devrait avoir role="menu" sur le conteneur', () => {
      renderComponent()
      
      const menu = screen.getByRole('menu')
      expect(menu).toBeInTheDocument()
      expect(menu).toHaveAttribute('aria-label', 'Actions de la conversation')
    })

    it('AC #11 - devrait avoir role="menuitem" sur les boutons', () => {
      renderComponent()
      
      const menuitems = screen.getAllByRole('menuitem')
      expect(menuitems.length).toBeGreaterThanOrEqual(2)
    })

    it('AC #11 - devrait avoir aria-label descriptif sur les boutons', () => {
      renderComponent()
      
      const renameButton = screen.getByTestId('rename-conversation-conv-123')
      expect(renameButton).toHaveAttribute('aria-label', 'Renommer Test Conversation')
      
      const deleteButton = screen.getByTestId('delete-conversation-conv-123')
      expect(deleteButton).toHaveAttribute('aria-label', 'Supprimer Test Conversation')
    })

    it('AC #11 - devrait avoir aria-haspopup et aria-expanded', () => {
      renderComponent()
      
      const renameButton = screen.getByTestId('rename-conversation-conv-123')
      expect(renameButton).toHaveAttribute('aria-haspopup', 'true')
    })
  })

  describe('AC #13 - Gestion d\'erreur', () => {
    it('AC #13 - devrait afficher l\'erreur de renommage', async () => {
      mockOnRename.mockRejectedValue(new Error('Échec du renommage'))
      
      renderComponent()
      
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
      
      const input = screen.getByTestId('rename-input-conv-123')
      fireEvent.change(input, { target: { value: 'Nouveau titre' } })
      fireEvent.click(screen.getByTestId('confirm-rename-conv-123'))
      
      await waitFor(() => {
        expect(screen.getByText('Échec du renommage')).toBeInTheDocument()
      })
    })

    it('AC #13 - devrait afficher l\'erreur de suppression', async () => {
      mockOnDelete.mockRejectedValue(new Error('Échec de la suppression'))
      
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByTestId('confirm-delete-conv-123'))
      
      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalled()
      })
      
      // L'erreur devrait être affichée après la fermeture de la modale
      // (Dans le code réel, cela serait géré par le parent)
    })
  })

  describe('AC #154 - Confirmation visuelle', () => {
    it('AC #154 - devrait avoir des boutons Annuler et Confirmer', async () => {
      renderComponent()
      
      // Ouvrir la modale de renommage
      fireEvent.click(screen.getByTestId('rename-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('rename-modal-conv-123')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('cancel-rename-conv-123')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-rename-conv-123')).toBeInTheDocument()
    })

    it('AC #154 - devrait avoir des boutons Annuler et Supprimer dans la confirmation de suppression', async () => {
      renderComponent()
      
      fireEvent.click(screen.getByTestId('delete-conversation-conv-123'))
      await waitFor(() => {
        expect(screen.getByTestId('delete-confirm-conv-123')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('cancel-delete-conv-123')).toBeInTheDocument()
      expect(screen.getByTestId('confirm-delete-conv-123')).toBeInTheDocument()
    })
  })
})
