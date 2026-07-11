'use client'

import { render, screen } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'
import { MarkdownErrorBoundary, withMarkdownErrorBoundary } from '../MarkdownErrorBoundary'

describe('MarkdownErrorBoundary', () => {
  describe('Rendu normal', () => {
    it('affiche les enfants normalement quand il n\'y a pas d\'erreur', () => {
      render(
        <MarkdownErrorBoundary>
          <div>Contenu normal</div>
        </MarkdownErrorBoundary>
      )
      expect(screen.getByText('Contenu normal')).toBeInTheDocument()
    })

    it('affiche le fallback personnalisé en cas d\'erreur', () => {
      const errorMessage = 'Erreur personnalisée'
      
      // Créer un composant qui lève une erreur
      const ErrorComponent = () => {
        throw new Error('Test error')
      }

      render(
        <MarkdownErrorBoundary fallback={<div>{errorMessage}</div>}>
          <ErrorComponent />
        </MarkdownErrorBoundary>
      )
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Fallback par défaut', () => {
    it('affiche le fallback par défaut avec le contenu brut en cas d\'erreur', () => {
      const testContent = 'Contenu qui cause une erreur'
      
      // Créer un composant qui lève une erreur et passe du contenu
      const ErrorComponent = ({ content }: { content: string }) => {
        throw new Error('Test error')
      }

      render(
        <MarkdownErrorBoundary>
          <ErrorComponent content={testContent} />
        </MarkdownErrorBoundary>
      )
      
      expect(screen.getByTestId('markdown-error-fallback')).toBeInTheDocument()
      expect(screen.getByText(/Erreur de rendu Markdown/i)).toBeInTheDocument()
      expect(screen.getByText(testContent)).toBeInTheDocument()
    })

    it('affiche un message d\'erreur', () => {
      render(
        <MarkdownErrorBoundary>
          <ErrorComponent />
        </MarkdownErrorBoundary>
      )
      
      function ErrorComponent() {
        throw new Error('Test error')
      }
      
      expect(screen.getByText(/Erreur de rendu Markdown/i)).toBeInTheDocument()
    })
  })

  describe('Accessibilité', () => {
    it('le fallback a role="alert"', () => {
      render(
        <MarkdownErrorBoundary>
          <ErrorComponent />
        </MarkdownErrorBoundary>
      )
      
      function ErrorComponent() {
        throw new Error('Test error')
      }
      
      expect(screen.getByTestId('markdown-error-fallback')).toHaveAttribute('role', 'alert')
    })

    it('le fallback a aria-live="assertive"', () => {
      render(
        <MarkdownErrorBoundary>
          <ErrorComponent />
        </MarkdownErrorBoundary>
      )
      
      function ErrorComponent() {
        throw new Error('Test error')
      }
      
      expect(screen.getByTestId('markdown-error-fallback')).toHaveAttribute('aria-live', 'assertive')
    })
  })

  describe('Callback onError', () => {
    it('appelle le callback onError quand une erreur se produit', () => {
      const mockOnError = vi.fn()
      
      function ErrorComponent() {
        throw new Error('Test error')
      }

      // Envelopper dans un try-catch car l'erreur est capturée par le boundary
      const originalError = console.error
      console.error = vi.fn()
      
      render(
        <MarkdownErrorBoundary onError={mockOnError}>
          <ErrorComponent />
        </MarkdownErrorBoundary>
      )
      
      console.error = originalError
      
      // Le callback devrait avoir été appelé
      expect(mockOnError).toHaveBeenCalled()
    })
  })

  describe('withMarkdownErrorBoundary HOC', () => {
    it('enveloppe un composant avec MarkdownErrorBoundary', () => {
      const MyComponent = () => <div>Mon composant</div>
      const WrappedComponent = withMarkdownErrorBoundary(MyComponent)
      
      render(<WrappedComponent />)
      expect(screen.getByText('Mon composant')).toBeInTheDocument()
    })

    it('affiche le fallback du HOC en cas d\'erreur', () => {
      const MyComponent = () => {
        throw new Error('Test error')
      }
      const WrappedComponent = withMarkdownErrorBoundary(MyComponent, <div>Fallback</div>)
      
      const originalError = console.error
      console.error = vi.fn()
      
      render(<WrappedComponent />)
      
      console.error = originalError
      
      expect(screen.getByText('Fallback')).toBeInTheDocument()
    })
  })
})
