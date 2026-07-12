'use client'

import hljs from 'highlight.js'

/**
 * Configuration de highlight.js pour la coloration syntaxique
 * Fait partie de ST-307: Ajouter le Support du Markdown
 * 
 * Note: Avec highlight.js v11+, tous les langages sont inclus dans le package principal
 * et registerLanguage n'est plus nécessaire. On utilise directement hljs.getLanguage().
 */

// Liste des langages supportés
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
 * Configure highlight.js avec les langages supportés
 * Appelé une seule fois au chargement de l'application
 * 
 * Avec highlight.js v11+, plus besoin de registerLanguage manuellement.
 * Le package inclut déjà tous les langages.
 */
export function configureHighlighting(): typeof hljs {
  // Avec highlight.js v11+, tous les langages sont déjà enregistrés
  // On vérifie juste que hljs est prêt
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
