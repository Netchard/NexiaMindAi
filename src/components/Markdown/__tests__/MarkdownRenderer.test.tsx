'use client'

import { render, screen } from '@testing-library/react'
import React from 'react'
import { MarkdownRenderer } from '../MarkdownRenderer'

// Mock de highlight.js
import { vi } from 'vitest'

vi.mock('highlight.js', () => ({
  highlight: vi.fn((code: string, options: any) => ({
    value: `<pre><code class="hljs ${options?.language || 'text'}">${code}</code></pre>`,
  })),
}))

describe('MarkdownRenderer', () => {
  describe('Rendu de base', () => {
    it('rend le contenu vide', () => {
      render(<MarkdownRenderer content="" />)
      expect(screen.queryByTestId('code-block')).not.toBeInTheDocument()
    })

    it('rend le texte brut sans markdown', () => {
      render(<MarkdownRenderer content="Texte simple" />)
      expect(screen.getByText('Texte simple')).toBeInTheDocument()
    })

    it('applique la classe personnalisée', () => {
      render(<MarkdownRenderer content="test" className="custom-class" />)
      const container = screen.getByText('test').parentElement
      expect(container).toHaveClass('markdown-content')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Textes enrichis', () => {
    it('rend le texte en gras', () => {
      render(<MarkdownRenderer content="**gras**" />)
      expect(screen.getByRole('strong')).toBeInTheDocument()
      expect(screen.getByRole('strong')).toHaveTextContent('gras')
    })

    it('rend le texte en italique', () => {
      render(<MarkdownRenderer content="*italique*" />)
      expect(screen.getByRole('emphasis')).toBeInTheDocument()
      expect(screen.getByRole('emphasis')).toHaveTextContent('italique')
    })

    it('rend le texte barré', () => {
      render(<MarkdownRenderer content="~~barré~~" />)
      expect(screen.getByText('barré')).toHaveClass('markdown-code-inline')
    })

    it('rend les citations', () => {
      render(<MarkdownRenderer content="> citation" />)
      expect(screen.getByText('citation')).toBeInTheDocument()
    })
  })

  describe('Listes', () => {
    it('rend les listes non ordonnées', () => {
      render(<MarkdownRenderer content="- item 1\n- item 2" />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(2)
      expect(listItems[0]).toHaveTextContent('item 1')
      expect(listItems[1]).toHaveTextContent('item 2')
    })

    it('rend les listes ordonnées', () => {
      render(<MarkdownRenderer content="1. premier\n2. deuxième" />)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems).toHaveLength(2)
      expect(listItems[0]).toHaveTextContent('premier')
      expect(listItems[1]).toHaveTextContent('deuxième')
    })
  })

  describe('Blocs de code', () => {
    it('rend le code inline', () => {
      render(<MarkdownRenderer content="`code inline`" />)
      expect(screen.getByText('code inline')).toHaveClass('markdown-code-inline')
    })

    it('rend les blocs de code avec langage', () => {
      render(<MarkdownRenderer content="```javascript\nconst x = 1;\n```" />)
      expect(screen.getByTestId('code-block')).toBeInTheDocument()
      expect(screen.getByText(/Bloc de code javascript/i)).toBeInTheDocument()
    })

    it('rend les blocs de code sans langage', () => {
      render(<MarkdownRenderer content="```\nconst x = 1;\n```" />)
      expect(screen.getByTestId('code-block')).toBeInTheDocument()
      expect(screen.getByText(/Bloc de code text/i)).toBeInTheDocument()
    })

    it('affiche le bouton Copier', () => {
      render(<MarkdownRenderer content="```javascript\ncode\n```" />)
      expect(screen.getByTestId('code-copy-button')).toBeInTheDocument()
    })
  })

  describe('Tableaux', () => {
    it('rend les tableaux', () => {
      const content = `| A | B |\n|---|---|\n| 1 | 2 |`
      render(<MarkdownRenderer content={content} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('columnheader')).toHaveLength(2)
      expect(screen.getAllByRole('cell')).toHaveLength(2)
    })

    it('les en-têtes de tableau ont scope="col"', () => {
      const content = `| A | B |\n|---|---|\n| 1 | 2 |`
      render(<MarkdownRenderer content={content} />)
      const headers = screen.getAllByRole('columnheader')
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })
  })

  describe('Liens', () => {
    it('rend les liens', () => {
      render(<MarkdownRenderer content="[link](https://example.com)" />)
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://example.com')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('les liens ont la classe markdown-link', () => {
      render(<MarkdownRenderer content="[link](https://example.com)" />)
      expect(screen.getByRole('link')).toHaveClass('markdown-link')
    })
  })

  describe('Titres', () => {
    it('rend les titres h1', () => {
      render(<MarkdownRenderer content="# Titre 1" />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('rend les titres h2', () => {
      render(<MarkdownRenderer content="## Titre 2" />)
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('rend les titres h3', () => {
      render(<MarkdownRenderer content="### Titre 3" />)
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })
  })

  describe('Séparateurs', () => {
    it('rend les séparateurs horizontaux', () => {
      render(<MarkdownRenderer content="---" />)
      expect(screen.getByRole('separator')).toBeInTheDocument()
    })
  })

  describe('Accessibilité', () => {
    it('les blocs de code ont aria-label avec le langage', () => {
      render(<MarkdownRenderer content="```javascript\ncode\n```" />)
      const codeBlock = screen.getByTestId('code-block')
      expect(codeBlock).toHaveAttribute('aria-label', 'Bloc de code javascript')
    })

    it('les tableaux ont des en-têtes avec scope', () => {
      const content = `| A | B |\n|---|---|\n| 1 | 2 |`
      render(<MarkdownRenderer content={content} />)
      const headers = screen.getAllByRole('columnheader')
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })
  })
})
