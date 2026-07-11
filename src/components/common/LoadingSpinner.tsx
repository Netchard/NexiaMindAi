"use client"

import React from 'react'

/**
 * Composant de chargement (Spinner)
 * Fait partie de ST-309: Optimiser les Performances Frontend
 * 
 * Utilisé comme fallback pour les composants lazy-loaded
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: string
  className?: string
}

/**
 * Taille des spinners en pixels
 */
const SIZE_MAP = {
  sm: 16,
  md: 32,
  lg: 48,
  xl: 64,
}

/**
 * Couleurs disponibles (tokens du design system)
 */
const COLOR_MAP = {
  coral: '#EF6C4D',
  ink: '#1E2A3B',
  white: '#FFFFFF',
  gray: '#A0AEC0',
}

export function LoadingSpinner({
  size = 'md',
  color = 'coral',
  className = '',
}: LoadingSpinnerProps) {
  const pixelSize = SIZE_MAP[size] || SIZE_MAP.md
  const spinnerColor = COLOR_MAP[color as keyof typeof COLOR_MAP] || color

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Chargement en cours"
      data-testid="loading-spinner"
    >
      <svg
        className="animate-spin"
        width={pixelSize}
        height={pixelSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={spinnerColor}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          strokeOpacity="0.25"
          strokeWidth={3}
        />
        <path
          d="M12 6V18"
          strokeOpacity="0.75"
        />
      </svg>
      <span className="sr-only">Chargement en cours...</span>
    </div>
  )
}

/**
 * Spinner pour les composants Markdown (ST-307)
 * Plus grand avec un style adapté au contenu riche
 */
export function MarkdownLoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8"
      role="status"
      aria-live="polite"
      aria-label="Rendu Markdown en cours"
      data-testid="markdown-loading-spinner"
    >
      <LoadingSpinner size="lg" color="coral" />
      <p className="mt-4 text-sm text-gray-400">
        Rendu du contenu en cours...
      </p>
    </div>
  )
}

/**
 * Spinner pour les boutons
 * Plus petit et adapté aux actions
 */
export function ButtonLoadingSpinner() {
  return (
    <div
      className="flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="Action en cours"
      data-testid="button-loading-spinner"
    >
      <LoadingSpinner size="sm" color="white" />
    </div>
  )
}

export default LoadingSpinner
