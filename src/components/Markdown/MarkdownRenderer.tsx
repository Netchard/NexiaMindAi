'use client'

import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import hljs from 'highlight.js'
import Image from 'next/image'
import { configureHighlighting } from '@/lib/markdown'
import { CodeBlock } from './CodeBlock'
import { MermaidDiagram } from './MermaidDiagram'
import styles from './Markdown.module.css'

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
 * Traite les sauts de ligne simples pour les convertir en breaks Markdown
 * En Markdown standard, deux espaces à la fin d'une ligne = <br>
 */
function processLineBreaks(content: string): string {
  // Ajoute deux espaces avant les sauts de ligne simples (non suivis d'un autre saut)
  // Cela crée des <br> en markdown standard
  return content.replace(/([^\n])\n([^\n])/g, '$1  \n$2')
}

/**
 * Composant de rendu Markdown avec support complet
 * - Gras, italique, listes, liens, citations
 * - Tableaux (via remark-gfm)
 * - Blocs de code avec coloration syntaxique (via highlight.js)
 * - Sauts de ligne simples (via traitement personnalisé)
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */
export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Memoizer le contenu pour eviter les re-rendus inutiles
  // Appliquer le traitement des sauts de ligne simples
  const memoizedContent = useMemo(() => processLineBreaks(content), [content])

  // Configuration des composants personnalises
  const components = useMemo(() => ({
    // pre transparent : CodeBlock rend deja son propre <pre> pour les blocs
    // de code — sans ca, react-markdown enveloppe CodeBlock dans un <pre>
    // par defaut, produisant un <pre><pre>...</pre></pre> invalide.
    pre({ children }: any) {
      return children
    },

    // Blocs de code avec coloration syntaxique
    code({ node, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const codeContent = String(children).replace(/\n$/, '')

      // react-markdown v9+ ne fournit plus la prop `inline` — un span de
      // code inline (une seule ligne source) se distingue d'un bloc de code
      // clos par des balises ``` (au moins 3 lignes sources : ouverture,
      // contenu, fermeture) via node.position.
      const isInline = !node?.position || node.position.start.line === node.position.end.line

      // Code inline (pas de coloration syntaxique)
      if (isInline) {
        return (
          <code className={`${styles['markdown-code-inline']} ${className || ''}`.trim()} {...props}>
            {children}
          </code>
        )
      }

      // Bloc de code avec coloration
      if (match) {
        const language = match[1]
        const lineCount = codeContent.split('\n').length

        // Cas spécial pour Mermaid - rendu visuel du diagramme
        // Mermaid est un langage de diagramme, pas un langage de programmation
        if (language.toLowerCase() === 'mermaid') {
          return (
            <div className={styles['mermaid-container']}>
              <MermaidDiagram code={codeContent} />
            </div>
          )
        }

        // Pour les autres langages, appliquer la coloration syntaxique
        try {
          const highlighted = hljs.highlight(codeContent, { language }).value
          return (
            <CodeBlock
              language={language}
              code={codeContent}
              highlightedHtml={highlighted}
              lineCount={lineCount}
            />
          )
        } catch (error) {
          // Si hljs ne supporte pas le langage, afficher sans coloration
          console.warn(`Langage non supporté par highlight.js: ${language}`)
          return (
            <CodeBlock
              language={language}
              code={codeContent}
              lineCount={lineCount}
            />
          )
        }
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
      return <table className={styles['markdown-table']}>{children}</table>
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
          className={styles['markdown-link']}
          {...props}
        >
          {children}
        </a>
      )
    },

    // Citations
    blockquote({ children }: any) {
      return <blockquote className={styles['markdown-blockquote']}>{children}</blockquote>
    },

    // Images - Utilisation de Next.js Image pour l'optimisation (ST-309)
    img({ node, src, alt, ...props }: any) {
      // Vérifier si src est une URL valide
      if (!src || typeof src !== 'string') {
        return null;
      }
      
      // Pour les images markdown, utiliser Next.js Image avec fill
      // Le conteneur doit avoir position: relative
      return (
        <div className={styles['markdown-image-container']} style={{ position: 'relative', width: '100%', height: 'auto' }}>
          <Image
            src={src}
            alt={alt || ''}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
            {...props}
          />
        </div>
      );
    },

    // Paragraphes
    p({ children }: any) {
      return <p className={styles['markdown-paragraph']}>{children}</p>
    },

    // Titres
    h1({ children }: any) {
      return <h1 className={styles['markdown-h1']}>{children}</h1>
    },
    h2({ children }: any) {
      return <h2 className={styles['markdown-h2']}>{children}</h2>
    },
    h3({ children }: any) {
      return <h3 className={styles['markdown-h3']}>{children}</h3>
    },
    h4({ children }: any) {
      return <h4 className={styles['markdown-h4']}>{children}</h4>
    },
    h5({ children }: any) {
      return <h5 className={styles['markdown-h5']}>{children}</h5>
    },
    h6({ children }: any) {
      return <h6 className={styles['markdown-h6']}>{children}</h6>
    },

    // Listes
    ul({ children }: any) {
      return <ul className={styles['markdown-ul']}>{children}</ul>
    },
    ol({ children }: any) {
      return <ol className={styles['markdown-ol']}>{children}</ol>
    },
    li({ children }: any) {
      return <li className={styles['markdown-li']}>{children}</li>
    },

    // Gras et italique (utilise les balises HTML standard)
    strong({ children }: any) {
      return <strong className={styles['markdown-strong']}>{children}</strong>
    },
    em({ children }: any) {
      return <em className={styles['markdown-em']}>{children}</em>
    },

    // Horizontale rule
    hr() {
      return <hr className={styles['markdown-hr']} />
    },
  }), []) // Pas de dependances pour memo

  return (
    <div className={`${styles['markdown-content']} ${className}`.trim()}>
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
