'use client'

/**
 * Barrel export pour les composants Markdown
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */

export { MarkdownRenderer, type MarkdownRendererProps } from './MarkdownRenderer'
export { CodeBlock, type CodeBlockProps } from './CodeBlock'
export {
  MarkdownErrorBoundary,
  type MarkdownErrorBoundaryProps,
  withMarkdownErrorBoundary,
} from './MarkdownErrorBoundary'
