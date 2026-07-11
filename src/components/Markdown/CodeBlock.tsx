'use client'

import React from 'react'

/**
 * Props du composant CodeBlock
 */
export interface CodeBlockProps {
  language: string
  code: string
  highlightedHtml?: string
  lineCount?: number
  showCopyButton?: boolean
  showLineNumbers?: boolean
}

/**
 * Composant pour afficher les blocs de code avec coloration syntaxique
 * et fonctionnalite de copie
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */
export function CodeBlock({
  language,
  code,
  highlightedHtml = '',
  lineCount = 0,
  showCopyButton = true,
  showLineNumbers = true,
}: CodeBlockProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Utiliser le HTML highlighté si disponible, sinon afficher le code brut
  const shouldShowLineNumbers = showLineNumbers && lineCount > 5

  return (
    <div
      className="code-block-container"
      aria-label={`Bloc de code ${language}`}
      data-language={language}
      data-testid="code-block"
    >
      {(showCopyButton || language) && (
        <div className="code-block-header">
          {language && <span className="language-label">{language}</span>}
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="copy-button"
              aria-label={copied ? 'Code copié !' : 'Copier le code'}
              data-testid="code-copy-button"
            >
              {copied ? (
                <CheckIcon />
              ) : (
                <CopyIcon />
              )}
              <span className="copy-button-text">{copied ? 'Copié !' : 'Copier'}</span>
            </button>
          )}
        </div>
      )}

      {/* Contenu du code */}
      <div className="code-block-content-wrapper">
        {/* Numérotation des lignes (si activée) */}
        {shouldShowLineNumbers && (
          <div className="code-line-numbers" aria-hidden="true">
            {code.split('\n').map((_, index) => (
              <div key={index} className="code-line-number">
                {index + 1}
              </div>
            ))}
          </div>
        )}

        {/* Code avec coloration syntaxique */}
        <pre className="code-block-pre">
          {highlightedHtml ? (
            <code
              className="code-block-code"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <code className="code-block-code">{code}</code>
          )}
        </pre>
      </div>
    </div>
  )
}

/**
 * Icône de copie
 */
function CopyIcon() {
  return (
    <svg className="copy-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  )
}

/**
 * Icône de confirmation (check)
 */
function CheckIcon() {
  return (
    <svg className="check-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

export default CodeBlock
