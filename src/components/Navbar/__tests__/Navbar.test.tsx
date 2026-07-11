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
  it('devrait rendre le repère de marque', () => {
    renderNavbar();
    expect(screen.getByText('NexiaMind AI')).toBeInTheDocument();
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

  it('devrait porter le fond sombre de l\'app-shell (DESIGN.md chat)', () => {
    renderNavbar();
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-chat-surface-header');
  });

  it('devrait marquer la route active avec un fond distinct (usePathname mocké sur "/")', () => {
    renderNavbar();
    // usePathname() est mocké à '/' dans test/setup.ts — "Accueil" est donc l'onglet actif.
    expect(screen.getByText('Accueil')).toHaveClass('bg-chat-nav-active');
    expect(screen.getByText('Chat')).not.toHaveClass('bg-chat-nav-active');
  });

  it('devrait avoir un contraste suffisant sur les liens inactifs', () => {
    renderNavbar();
    const inactiveLinks = ['Chat', 'Recherche', 'Documents', 'Admin'].map((name) =>
      screen.getByText(name)
    );
    inactiveLinks.forEach(link => {
      expect(link).toHaveClass('text-chat-ink-subtle');
    });
  });

  it('devrait gérer les erreurs gracieusement', () => {
    // Test de rendu sans crash
    expect(() => renderNavbar()).not.toThrow();
  });
});
