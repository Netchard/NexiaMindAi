/**
 * Tests unitaires pour le composant Footer
 * 
 * Fait partie de ST-301 - Créer le Layout Principal
 * 
 * Note: Ces tests utilisent Vitest qui est déjà configuré dans le projet
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import { Footer } from '../Footer';

describe('Footer Component', () => {
  it('devrait afficher les informations légales', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    expect(screen.getByText('NexiaMind AI')).toBeInTheDocument();
  });

  it('devrait avoir les liens utiles', () => {
    render(<Footer />);
    expect(screen.getByText('Politique de Confidentialité')).toBeInTheDocument();
    expect(screen.getByText('Conditions d\'Utilisation')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });

  it('devrait afficher l\'année courante', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('devrait être responsive', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('grid grid-cols-1 md:grid-cols-4');
  });

  it('devrait être accessible', () => {
    render(<Footer />);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  it('devrait supporter le thème sombre', () => {
    render(<Footer />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveClass('dark:bg-gray-900');
  });

  it('devrait avoir un contraste suffisant', () => {
    render(<Footer />);
    const textElements = screen.getAllByText(/NexiaMind AI|Légal|Liens Utiles|Ressources/);
    textElements.forEach(element => {
      expect(element).toHaveClass(expect.stringMatching(/text-gray-(900|600)/));
    });
  });

  it('devrait gérer les erreurs gracieusement', () => {
    // Test de rendu sans crash
    expect(() => render(<Footer />)).not.toThrow();
  });
});
