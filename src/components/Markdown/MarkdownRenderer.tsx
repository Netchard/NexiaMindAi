'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js'
import { configureHighlighting } from '@/lib/markdown'
import { CodeBlock } from './CodeBlock'

// Initialiser highlight.js
configureHighlighting()

/**
 * Props du composant MarkdownRenderer
 */
export interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Composant de rendu Markdown avec support complet
 * - Gras, italique, listes, liens, citations
 * - Tableaux (via remark-gfm)
 * - Blocs de code avec coloration syntaxique (via highlight.js)
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Memoizer le contenu pour eviter les re-rendus inutiles
  const memoizedContent = useMemo(() => content, [content])

  // Configuration des composants personnalises
  const components = useMemo(() => ({
    // Blocs de code avec coloration syntaxique
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const codeContent = String(children).replace(/\n$/, '')

      // Code inline (pas de coloration syntaxique)
      if (inline) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        )
      }

      // Bloc de code avec coloration
      if (match) {
        const language = match[1]
        const highlighted = hljs.highlight(codeContent, { language }).value
        const lineCount = codeContent.split('\n').length

        return (
          <CodeBlock
            language={language}
            code={codeContent}
            highlightedHtml={highlighted}
            lineCount={lineCount}
          />
        )
      }

      // Bloc de code sans langage specifie
      return (
        <CodeBlock
          language="text"
          code={codeContent}
          highlightedHtml={hljs.highlight(codeContent, { language: 'text' }).value}
          lineCount={codeContent.split('\n').length}
        />
      )
    },

    // Tableaux
    table({ children }: any) {
      return <table className="markdown-table">{children}</table>
    },

    th({ children, ...props }: any) {
      return (
        <th scope="col" {...props}>
          {children}
        </th>
      )
    },

    td({ children, ...props }: any) {
      return <td {...props}>{children}</td>
    },

    // Liens avec securite
    a({ node, href, children, ...props }: any) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="markdown-link"
          {...props}
        >
          {children}
        </a>
      )
    },

    // Citations
    blockquote({ children }: any) {
      return <blockquote className="markdown-blockquote">{children}</blockquote>
    },

    // Images
    img({ node, src, alt, ...props }: any) {
      return <img src={src} alt={alt || ''} loading="lazy" {...props} />
    },

    // Paragraphes
    p({ children }: any) {
      return <p className="markdown-paragraph">{children}</p>
    },

    // Titres
    h1({ children }: any) {
      return <h1 className="markdown-h1">{children}</h1>
    },
    h2({ children }: any) {
      return <h2 className="markdown-h2">{children}</h2>
    },
    h3({ children }: any) {
      return <h3 className="markdown-h3">{children}</h3>
    },
    h4({ children }: any) {
      return <h4 className="markdown-h4">{children}</h4>
    },
    h5({ children }: any) {
      return <h5 className="markdown-h5">{children}</h5>
    },
    h6({ children }: any) {
      return <h6 className="markdown-h6">{children}</h6>
    },

    // Listes
    ul({ children }: any) {
      return <ul className="markdown-ul">{children}</ul>
    },
    ol({ children }: any) {
      return <ol className="markdown-ol">{children}</ol>
    },
    li({ children }: any) {
      return <li className="markdown-li">{children}</li>
    },

    // Gras et italique (utilise les balises HTML standard)
    strong({ children }: any) {
      return <strong className="markdown-strong">{children}</strong>
    },
    em({ children }: any) {
      return <em className="markdown-em">{children}</em>
    },

    // Code inline
    code({ className, children, ...props }: any) {
      return (
        <code className={`markdown-code-inline ${className || ''}`} {...props}>
          {children}
        </code>
      )
    },

    // Horizontale rule
    hr() {
      return <hr className="markdown-hr" />
    },
  }), []) // Pas de dependances pour memo

  return (
    <div className={`markdown-content ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {memoizedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer
