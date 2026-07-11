'use client'

import hljs from 'highlight.js'

/**
 * Configuration de highlight.js pour la coloration syntaxique
 * Fait partie de ST-307: Ajouter le Support du Markdown
 */

// Liste des langages a supporter
const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'python',
  'sql',
  'bash',
  'shell',
  'json',
  'yaml',
  'xml',
  'html',
  'css',
  'scss',
  'less',
  'java',
  'c',
  'cpp',
  'csharp',
  'go',
  'rust',
  'php',
  'ruby',
  'swift',
  'kotlin',
  'dart',
  'markdown',
  'diff',
  'dockerfile',
  'nginx',
  'makefile',
  'vim',
]

/**
 * Configure highlight.js avec les langages supportes
 * Appelé une seule fois au chargement de l'application
 */
export function configureHighlighting(): typeof hljs {
  // Enregistrer tous les langages supportes
  SUPPORTED_LANGUAGES.forEach(lang => {
    try {
      // @ts-expect-error - hljs.registerLanguage a une signature flexible
      if (hljs.getLanguage(lang) === undefined) {
        // @ts-expect-error - Signature flexible
        hljs.registerLanguage(lang, require(`highlight.js/lib/languages/${lang}`))
      }
    } catch (error) {
      console.warn(`[Markdown] Impossible de charger le langage highlight.js: ${lang}`, error)
    }
  })

  return hljs
}

/**
 * Obtenir la liste des langages supportes
 */
export function getSupportedLanguages(): string[] {
  return [...SUPPORTED_LANGUAGES]
}

/**
 * Vérifier si un langage est supporté
 */
export function isLanguageSupported(language: string): boolean {
  return SUPPORTED_LANGUAGES.includes(language.toLowerCase())
}

// Initialiser highlight.js automatiquement
configureHighlighting()
