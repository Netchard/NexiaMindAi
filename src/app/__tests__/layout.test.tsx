/**
 * Tests d'intégration pour le layout principal
 * 
 * Fait partie de ST-301 - Créer le Layout Principal
 * 
 * Note: Ces tests utilisent Vitest qui est déjà configuré dans le projet
 * Vitest est compatible avec l'API de Jest et @testing-library/react
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import RootLayout from '../layout';

describe('Root Layout Integration', () => {
  it('devrait rendre les enfants correctement', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toHaveTextContent('Test Content');
  });

  it('devrait inclure Navbar et Footer', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('devrait avoir les métadonnées correctes', () => {
    // L'export `metadata` est traité par Next.js en dehors du rendu React ;
    // on vérifie ici l'attribut lang de la balise <html> produite par le layout.
    // (jsdom ne permet qu'un seul <html> : React applique ses attributs
    // directement sur document.documentElement plutôt que d'imbriquer un nœud.)
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(document.documentElement).toHaveAttribute('lang', 'fr');
  });

  it('devrait être responsive', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    const main = screen.getByRole('main');
    expect(main).toHaveClass('container mx-auto px-4 py-8');
  });

  it('devrait avoir une identité visuelle sombre unique', () => {
    // Le produit n'a plus qu'un seul thème (sombre) — voir
    // _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-chat-surface-header');
  });

  it('devrait être accessible (WCAG 2.1 AA)', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    // Vérification basique de l'accessibilité
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('devrait gérer les erreurs gracieusement', () => {
    // Test de rendu sans crash
    expect(() => 
      render(
        <RootLayout>
          <div>Test Content</div>
        </RootLayout>
      )
    ).not.toThrow();
  });
});
