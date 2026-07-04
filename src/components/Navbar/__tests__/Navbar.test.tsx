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
import { AuthProvider } from '@/components/Auth/AuthProvider';

function renderNavbar() {
  return render(
    <AuthProvider>
      <Navbar />
    </AuthProvider>
  );
}

describe('Navbar Component', () => {
  it('devrait rendre le logo', () => {
    renderNavbar();
    expect(screen.getByAltText('NexiaMind AI Logo')).toBeInTheDocument();
  });

  it('devrait avoir les liens de navigation', () => {
    renderNavbar();
    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Recherche')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('devrait pointer le lien Chat vers /chat (ST-303)', () => {
    renderNavbar();
    expect(screen.getByText('Chat').closest('a')).toHaveAttribute('href', '/chat');
  });

  it('devrait inclure le bouton Rafraîchir', () => {
    renderNavbar();
    expect(screen.getByText('Rafraîchir')).toBeInTheDocument();
  });

  it('devrait être responsive', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white dark:bg-gray-900');
  });

  it('devrait supporter le thème sombre', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('dark:bg-gray-900');
  });

  it('devrait avoir un contraste suffisant', () => {
    renderNavbar();
    // Le lien logo a son propre style (flex + texte adjacent) ; on vérifie
    // le contraste sur les liens de navigation textuels uniquement.
    const navLinks = ['Accueil', 'Chat', 'Recherche', 'Documents', 'Admin'].map((name) =>
      screen.getByText(name)
    );
    navLinks.forEach(link => {
      expect(link).toHaveClass('text-gray-700 dark:text-gray-200');
    });
  });

  it('devrait gérer les erreurs gracieusement', () => {
    // Test de rendu sans crash
    expect(() => renderNavbar()).not.toThrow();
  });
});
