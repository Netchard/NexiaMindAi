'use client'

import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { CodeBlock, CodeBlockProps } from '../CodeBlock'
import { vi } from 'vitest'

// Mock de clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
})

describe('CodeBlock', () => {
  const defaultProps: CodeBlockProps = {
    language: 'javascript',
    code: 'const x = 1;',
  }

  describe('Rendu de base', () => {
    it('rend le conteneur avec la classe code-block-container', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByTestId('code-block')).toHaveClass('code-block-container')
    })

    it('affiche le langage dans le header', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByText('javascript')).toBeInTheDocument()
    })

    it('affiche le code dans un element pre', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByText('const x = 1;')).toBeInTheDocument()
    })

    it('affiche le bouton Copier par defaut', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByTestId('code-copy-button')).toBeInTheDocument()
    })

    it('n\'affiche pas le bouton Copier si showCopyButton=false', () => {
      render(<CodeBlock {...defaultProps} showCopyButton={false} />)
      expect(screen.queryByTestId('code-copy-button')).not.toBeInTheDocument()
    })
  })

  describe('Fonctionnalite Copier', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('copie le code dans le clipboard quand on clique sur le bouton', async () => {
      render(<CodeBlock {...defaultProps} />)
      const button = screen.getByTestId('code-copy-button')
      fireEvent.click(button)
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;')
    })

    it('affiche le feedback "Copié !" après copier', async () => {
      render(<CodeBlock {...defaultProps} />)
      const button = screen.getByTestId('code-copy-button')
      fireEvent.click(button)
      expect(screen.getByText('Copié !')).toBeInTheDocument()
    })

    it('retourne au texte "Copier" après 2 secondes', async () => {
      vi.useFakeTimers()
      render(<CodeBlock {...defaultProps} />)
      const button = screen.getByTestId('code-copy-button')
      fireEvent.click(button)
      
      expect(screen.getByText('Copié !')).toBeInTheDocument()
      
      vi.advanceTimersByTime(2000)
      
      // Le texte devrait revenir à "Copier"
      expect(screen.getByText('Copier')).toBeInTheDocument()
      vi.useRealTimers()
    })
  })

  describe('Accessibilité', () => {
    it('a un aria-label avec le langage', () => {
      render(<CodeBlock {...defaultProps} />)
      const container = screen.getByTestId('code-block')
      expect(container).toHaveAttribute('aria-label', 'Bloc de code javascript')
    })

    it('a un data-language attribute', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByTestId('code-block')).toHaveAttribute('data-language', 'javascript')
    })

    it('le bouton Copier a un aria-label', () => {
      render(<CodeBlock {...defaultProps} />)
      const button = screen.getByTestId('code-copy-button')
      expect(button).toHaveAttribute('aria-label', 'Copier le code')
    })
  })

  describe('Rendu avec highlightedHtml', () => {
    it('utilise le HTML highlighté si fourni', () => {
      const highlightedHtml = '<span class="hljs-keyword">const</span> x = 1;'
      render(<CodeBlock {...defaultProps} highlightedHtml={highlightedHtml} />)
      expect(screen.getByText(/const x = 1;/)).toBeInTheDocument()
    })

    it('affiche le code brut si highlightedHtml n\'est pas fourni', () => {
      render(<CodeBlock {...defaultProps} />)
      expect(screen.getByText('const x = 1;')).toBeInTheDocument()
    })
  })

  describe('Numérotation des lignes', () => {
    it('affiche la numérotation pour les blocs de plus de 5 lignes', () => {
      const longCode = 'line1\nline2\nline3\nline4\nline5\nline6'
      render(<CodeBlock language="javascript" code={longCode} lineCount={6} />)
      // Les lignes devraient être numérotées
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('n\'affiche pas la numérotation pour les petits blocs', () => {
      render(<CodeBlock {...defaultProps} lineCount={3} />)
      // Pas de numérotation attendue
      expect(screen.queryByText('1')).not.toBeInTheDocument()
    })
  })

  describe('Cas limites', () => {
    it('gère le code vide', () => {
      render(<CodeBlock language="javascript" code="" />)
      expect(screen.getByTestId('code-block')).toBeInTheDocument()
    })

    it('gère le langage vide', () => {
      render(<CodeBlock language="" code="test" />)
      expect(screen.getByTestId('code-block')).toBeInTheDocument()
    })

    it('gère le code avec des caractères spéciaux', () => {
      const specialCode = '<div class="test"> & </div>'
      render(<CodeBlock language="html" code={specialCode} />)
      expect(screen.getByText(/&/)).toBeInTheDocument()
    })
  })
})
