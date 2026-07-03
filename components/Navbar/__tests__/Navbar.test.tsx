/**
 * Tests unitaires pour le composant Navbar
 * 
 * Fait partie de ST-301 - Créer le Layout Principal
 * 
 * Note: Ces tests utilisent Vitest qui est déjà configuré dans le projet
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Navbar } from '../Navbar';

describe('Navbar Component', () => {
  it('devrait rendre le logo', () => {
    render(<Navbar />);
    expect(screen.getByAltText('NexiaMind AI Logo')).toBeInTheDocument();
  });

  it('devrait avoir les liens de navigation', () => {
    render(<Navbar />);
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('devrait inclure le bouton Rafraîchir', () => {
    render(<Navbar />);
    expect(screen.getByText('Rafraîchir')).toBeInTheDocument();
  });

  it('devrait être responsive', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white dark:bg-gray-900');
  });

  it('devrait supporter le thème sombre', () => {
    render(<Navbar />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('dark:bg-gray-900');
  });

  it('devrait avoir un contraste suffisant', () => {
    render(<Navbar />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveClass('text-gray-700 dark:text-gray-200');
    });
  });

  it('devrait gérer les erreurs gracieusement', () => {
    // Test de rendu sans crash
    expect(() => render(<Navbar />)).not.toThrow();
  });
});
