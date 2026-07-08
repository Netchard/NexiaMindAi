'use client';

/**
 * Composant SourceCitationList - Conteneur pour afficher une liste de citations
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React from 'react';
import { SourceCitationListProps } from './types';
import { SourceCitation } from './SourceCitation';

/**
 * Composant pour afficher une liste de citations de sources
 */
export const SourceCitationList: React.FC<SourceCitationListProps> = ({
  citations,
  title = '📚 Sources :',
  disabled = false,
  className = '',
}) => {
  // Gérer citations null (correction #5)
  if (!citations?.length) {
    return null;
  }

  return (
    <div
      className={`source-citation-list ${className}`}
      style={{
        width: '100%',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--color-border, #D1D5DB)',
      }}
      role="region"
      aria-label="Liste des citations de sources"
    >
      {/* Titre de la section - Changé pour h3 (décision #3) */}
      <h3
        className="source-citation-list-title"
        style={{
          marginBottom: '12px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-secondary, #1E2A3B)',
        }}
      >
        {title}
      </h3>

      {/* Liste des citations */}
      <ul
        className="source-citation-list-items"
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {citations.map((citation) => (
          <SourceCitation
            key={citation.id}
            citation={citation}
            disabled={disabled}
          />
        ))}
      </ul>

      {/* Styles spécifiques */}
      <style jsx>{`
        /* Responsive */
        @media (max-width: 1024px) {
          .source-citation-list {
            padding-top: 12px;
          }
          
          .source-citation-list-title {
            fontSize: 13px;
          }
        }

        @media (max-width: 768px) {
          .source-citation-list {
            padding-top: 10px;
          }
        }
      `}</style>
    </div>
  );
};

// Nom du composant pour le débogage
SourceCitationList.displayName = 'SourceCitationList';

export default SourceCitationList;
