/**
 * Tests unitaires pour le composant RefreshButton
 * Fait partie de ST-205 - Implémenter le Bouton "Rafraîchir" dans l'UI
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RefreshButton } from '../RefreshButton';

// Mock de l'API fetch
global.fetch = jest.fn() as jest.Mock;

describe('RefreshButton Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('devrait rendre correctement le bouton et le sélecteur', () => {
      render(<RefreshButton />);

      expect(screen.getByText('Rafraîchir')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Toutes les sources')).toBeInTheDocument();
    });

    it('devrait avoir les options de source correctes', () => {
      render(<RefreshButton />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('all');

      // Vérifier toutes les options
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
      expect(options[0]).toHaveValue('all');
      expect(options[1]).toHaveValue('supabase');
      expect(options[2]).toHaveValue('gitlab');
      expect(options[3]).toHaveValue('nexia');
    });
  });

  describe('States', () => {
    it('devrait être désactivé pendant le chargement', async () => {
      // Mock une réponse réussie
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<RefreshButton />);

      const button = screen.getByText('Rafraîchir');
      fireEvent.click(button);

      // Vérifier que le bouton est désactivé
      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(screen.getByText('Synchronisation...')).toBeInTheDocument();
      });
    });

    it('devrait afficher les messages de succès', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Synchronisation terminée' }),
      });

      render(<RefreshButton />);

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(screen.getByText('✅ Synchronisation terminée')).toBeInTheDocument();
      });
    });

    it('devrait afficher les messages d\'erreur', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Échec de la synchronisation' }),
      });

      render(<RefreshButton />);

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(screen.getByText('❌ Échec de la synchronisation')).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    it('devrait changer la source sélectionnée', () => {
      render(<RefreshButton />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'gitlab' } });

      expect(select).toHaveValue('gitlab');
      expect(screen.getByText('GitLab')).toBeInTheDocument();
    });

    it('devrait appeler onRefresh avec la source sélectionnée', async () => {
      const mockOnRefresh = jest.fn();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<RefreshButton onRefresh={mockOnRefresh} />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'supabase' } });

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(mockOnRefresh).toHaveBeenCalledWith('supabase');
      });
    });

    it('devrait appeler l\'API avec les bons paramètres', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Success' }),
      });

      render(<RefreshButton />);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'gitlab' } });

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/chat/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: 'gitlab' }),
          credentials: 'include',
        });
      });
    });
  });

  describe('Accessibilité', () => {
    it('devrait être accessible aux lecteurs d\'écran', () => {
      render(<RefreshButton />);

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label');
      expect(screen.getByText('Rafraîchir')).toBeEnabled();
    });

    it('devrait avoir un contraste suffisant', () => {
      render(<RefreshButton />);

      const button = screen.getByText('Rafraîchir');
      // Vérifier les classes de couleur (test visuel serait mieux, mais on vérifie la présence)
      expect(button).toHaveClass('bg-blue-600');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de réseau', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<RefreshButton />);

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(screen.getByText('❌ La synchronisation a échoué. Veuillez réessayer.')).toBeInTheDocument();
      });
    });

    it('devrait gérer les réponses API invalides', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      render(<RefreshButton />);

      fireEvent.click(screen.getByText('Rafraîchir'));

      await waitFor(() => {
        expect(screen.getByText('❌ La synchronisation a échoué. Veuillez réessayer.')).toBeInTheDocument();
      });
    });
  });

  describe('Classes CSS personnalisées', () => {
    it('devrait accepter les classes CSS personnalisées', () => {
      render(<RefreshButton className="custom-class" />);

      const container = screen.getByText('Rafraîchir').closest('div');
      expect(container).toHaveClass('custom-class');
    });
  });
});

// Tests d'intégration supplémentaires
describe('RefreshButton Integration', () => {
  it('devrait fonctionner avec différents callbacks', async () => {
    const customCallback = jest.fn(() => Promise.resolve());

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Custom success' }),
    });

    render(<RefreshButton onRefresh={customCallback} />);

    fireEvent.click(screen.getByText('Rafraîchir'));

    await waitFor(() => {
      expect(customCallback).toHaveBeenCalled();
      expect(screen.getByText('✅ Custom success')).toBeInTheDocument();
    });
  });
});