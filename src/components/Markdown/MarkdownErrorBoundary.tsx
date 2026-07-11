'use client'

import React from 'react'

/**
 * Props du MarkdownErrorBoundary
 */
export interface MarkdownErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

/**
 * Boundary d'erreur pour le rendu Markdown
 * Capture les erreurs de rendu et affiche un fallback
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */
export class MarkdownErrorBoundary extends React.Component<
  MarkdownErrorBoundaryProps,
  { hasError: boolean; error?: Error }
> {
  constructor(props: MarkdownErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: undefined }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Logger l'erreur en developpement
    if (process.env.NODE_ENV === 'development') {
      console.error('[MarkdownErrorBoundary] Erreur de rendu Markdown:', error)
      console.error('[MarkdownErrorBoundary] Composant:', errorInfo.componentStack)
    }

    // Appeler le callback si fourni
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Afficher le fallback personnalise si fourni
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Fallback par defaut : afficher le contenu brut
      const children = React.Children.toArray(this.props.children)
      const content = children[0] as React.ReactElement<{ content?: string }>
      const rawContent = content?.props?.content || String(this.props.children)

      return (
        <div
          className="markdown-error-fallback"
          role="alert"
          aria-live="assertive"
          data-testid="markdown-error-fallback"
        >
          <div className="markdown-error-header">
            <svg
              className="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="ml-2 text-red-400">Erreur de rendu Markdown</span>
          </div>
          <div className="markdown-error-content whitespace-pre-wrap mt-2 p-3 bg-red-900/20 rounded border border-red-700">
            {rawContent}
          </div>
          {this.state.error && (
            <details className="markdown-error-details mt-2">
              <summary className="cursor-pointer text-sm text-red-300 hover:text-red-200">
                Détails techniques
              </summary>
              <pre className="text-xs mt-2 overflow-auto max-h-40 bg-gray-900 p-2 rounded">
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook pour utiliser MarkdownErrorBoundary sous forme de composant
 */
export function withMarkdownErrorBoundary(
  Component: React.ComponentType<any>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: any) {
    return (
      <MarkdownErrorBoundary fallback={fallback}>
        <Component {...props} />
      </MarkdownErrorBoundary>
    )
  }
}

export default MarkdownErrorBoundary
