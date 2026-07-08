'use client';

/**
 * Composant SourceCitation - Affiche une seule citation de source
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React from 'react';
import { SourceCitationProps } from './types';

/**
 * Extrait le nom de fichier d'un chemin (décision #4)
 * @param path - Chemin complet du fichier
 * @returns Nom du fichier (avec extension)
 */
function extractFileName(path: string): string {
  if (!path) return path;
  const lastSlashIndex = Math.max(
    path.lastIndexOf('/'),
    path.lastIndexOf('\\')
  );
  return lastSlashIndex >= 0 ? path.substring(lastSlashIndex + 1) : path;
}

/**
 * Composant pour afficher une seule citation
 */
export const SourceCitation: React.FC<SourceCitationProps> = ({
  citation,
  disabled = false,
  className = '',
}) => {
  // Ne pas rendre si URL est vide (correction #2)
  if (!citation.url || citation.url === '') {
    return null;
  }

  // Générer l'ID unique pour l'aria-label
  const ariaId = `citation-${citation.id}`;
  const displayText = extractFileName(citation.path); // Décision #4: afficher le nom

  return (
    <li
      className={`source-citation-item ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 0',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      aria-label={`Source ${citation.index}: ${displayText}`}
      id={ariaId}
    >
      {/* Numéro de la citation */}
      <span
        className="source-citation-number"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          backgroundColor: 'var(--color-primary, #EF6C4D)',
          color: 'var(--color-background, #FFFFFF)',
          borderRadius: '50%',
          fontSize: '12px',
          fontWeight: 600,
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {citation.index}
      </span>

      {/* Lien vers la source */}
      <a
        href={citation.url}
        target="_blank"
        rel="noopener noreferrer"
        className="source-citation-link"
        style={{
          color: 'var(--color-primary, #EF6C4D)',
          textDecoration: 'none',
          fontSize: '14px',
          flex: 1,
          wordBreak: 'break-all',
        }}
        aria-label={`Ouvrir la source: ${displayText}`}
        tabIndex={disabled ? -1 : 0}
        onClick={(e) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        // Empêcher la navigation via right-click (correction #16)
        onContextMenu={disabled ? (e) => e.preventDefault() : undefined}
      >
        {displayText}
      </a>

      {/* Icône de lien externe */}
      <span
        className="source-citation-external-icon"
        style={{
          color: 'var(--color-text-light, #6B7280)',
          fontSize: '14px',
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        →
      </span>

      {/* Styles spécifiques */}
      <style jsx>{`
        .source-citation-item:hover:not([disabled="true"]) {
          text-decoration: underline;
        }

        .source-citation-item:focus {
          outline: 2px solid var(--color-primary, #EF6C4D);
          outline-offset: 2px;
        }

        .source-citation-item:focus-visible {
          outline: 2px solid var(--color-primary, #EF6C4D);
          outline-offset: 2px;
        }

        /* Correction WCAG 2.4.7 : Ne PAS supprimer l'outline sur focus (correction #3) */
        .source-citation-link:focus {
          outline: 2px solid var(--color-primary, #EF6C4D);
          outline-offset: 2px;
        }

        .source-citation-link:hover {
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .source-citation-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .source-citation-number {
            width: 20px;
            height: 20px;
            fontSize: 10px;
          }
          
          .source-citation-link {
            fontSize: 13px;
          }
        }
      `}</style>
    </li>
  );
};

// Nom du composant pour le débogage
SourceCitation.displayName = 'SourceCitation';

export default SourceCitation;
