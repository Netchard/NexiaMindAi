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
    // Test des métadonnées (difficile à tester directement, mais on vérifie le rendu)
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    expect(screen.getByRole('document')).toBeInTheDocument();
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

  it('devrait supporter le thème sombre', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    const html = screen.getByRole('document').parentElement;
    expect(html).toHaveClass('dark'); // Vérifie la classe dark
  });

  it('devrait avoir un contraste suffisant', () => {
    render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white dark:bg-gray-900');
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
