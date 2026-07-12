'use client';

/**
 * Composant FilterBar - Conteneur principal avec les 3 dropdowns + bouton Réinitialiser
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React from 'react';
import { FilterBarProps } from './types';
import { FilterDropdown } from './FilterDropdown';
import { FILTER_LABELS, FILTER_PLACEHOLDERS, DEFAULT_FILTERS, FilterState } from '@/types/filters';

// Couleurs du design system sombre (docs/Maquette-ux-NexiaMind AI.html)
// voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md
const colors = {
  primary: '#F4693F', // Corail
  primaryHover: '#FF845E',
  secondary: '#F2F5FA', // Encre claire
  text: '#EEF2F8',
  textLight: '#8D9CB5',
  border: '#2A3B58',
  background: '#0E1B2E',
};

/**
 * Composant FilterBar - Conteneur principal pour les filtres
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  filterOptions,
  onFilterChange,
  onReset,
  isLoading = false,
  className = '',
}) => {
  // Vérifier si au moins un filtre est actif
  const hasActiveFilters = Object.values(filterState).some(value => value !== '');

  // Gestion du reset
  const handleReset = () => {
    onReset();
  };

  // Note : l'état d'erreur de chargement est géré par le parent (src/app/chat/page.tsx),
  // qui n'affiche pas FilterBar quand une erreur est active (revue de code ST-304) —
  // ce composant part donc toujours d'un état sans erreur.

  return (
    <div 
      className={`filter-bar-container ${className}`}
      style={{
        width: '100%',
        backgroundColor: colors.background,
        borderRadius: '12px',
        padding: '16px',
        border: `1px solid ${colors.border}`,
      }}
      role="region"
      aria-label="Barre de filtres"
    >
      {/* Titre de la barre de filtres */}
      <div 
        style={{
          marginBottom: '16px',
          fontSize: '14px',
          fontWeight: 600,
          color: colors.secondary,
        }}
      >
        Filtres de recherche
      </div>

      <div 
        className="filter-bar-content"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-end',
        }}
      >
        {/* Filtre Thème */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <FilterDropdown
            name="theme-filter"
            label={FILTER_LABELS.theme}
            placeholder={FILTER_PLACEHOLDERS.theme}
            options={filterOptions.themes}
            value={filterState.theme}
            onChange={(value) => onFilterChange('theme', value)}
            disabled={isLoading}
          />
        </div>

        {/* Filtre Format */}
        <div style={{ flex: 1, minWidth: '180px' }}>
          <FilterDropdown
            name="document-format-filter"
            label={FILTER_LABELS.documentFormat}
            placeholder={FILTER_PLACEHOLDERS.documentFormat}
            options={filterOptions.documentFormats}
            value={filterState.documentFormat}
            onChange={(value) => onFilterChange('documentFormat', value)}
            disabled={isLoading}
          />
        </div>

        {/* Bouton Réinitialiser */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end',
          height: '48px', // Même hauteur que les dropdowns
        }}>
          <button
            onClick={handleReset}
            disabled={!hasActiveFilters || isLoading}
            className="filter-reset-button"
            style={{
              padding: '8px 16px',
              backgroundColor: hasActiveFilters ? colors.primary : colors.border,
              color: hasActiveFilters ? '#FFFFFF' : colors.textLight,
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: hasActiveFilters && !isLoading ? 'pointer' : 'not-allowed',
              opacity: hasActiveFilters && !isLoading ? 1 : 0.6,
              transition: 'background-color 0.2s, color 0.2s',
              whiteSpace: 'nowrap',
            }}
            // Accessibilité
            aria-label="Réinitialiser tous les filtres"
            aria-disabled={!hasActiveFilters || isLoading}
            title={!hasActiveFilters ? 'Aucun filtre actif à réinitialiser' : 'Réinitialiser les filtres'}
          >
            {FILTER_LABELS.reset}
          </button>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {isLoading && (
        <div 
          className="filter-loading-indicator"
          role="status"
          aria-live="polite"
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: colors.textLight,
            fontStyle: 'italic',
          }}
        >
          Chargement des valeurs de filtre...
        </div>
      )}

      {/* Indicateur de filtres actifs */}
      {hasActiveFilters && !isLoading && (
        <div 
          className="filter-active-indicator"
          role="status"
          aria-live="polite"
          style={{
            marginTop: '12px',
            fontSize: '14px',
            color: colors.primary,
          }}
        >
          {Object.values(filterState).filter(value => value !== '').length} filtre(s) actif(s)
        </div>
      )}

      {/* Styles spécifiques */}
      <style jsx>{`
        .filter-bar-container {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .filter-reset-button:hover:not(:disabled) {
          background-color: ${colors.primaryHover};
        }

        .filter-reset-button:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

        .filter-reset-button:focus-visible {
          outline: 2px solid #3B82F6;
          outline-offset: 2px;
        }

        /* Responsive design — !important nécessaire : ces règles doivent
           surpasser les styles inline (flexDirection/padding/gap/minWidth)
           posés plus haut, qu'une media query seule ne peut jamais battre
           en spécificité CSS (revue de code ST-304 : la version précédente
           utilisait des propriétés camelCase et des valeurs entre guillemets,
           syntaxe CSS invalide, ignorée silencieusement par le navigateur). */
        @media (max-width: 1024px) {
          .filter-bar-content {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .filter-bar-container {
            padding: 12px !important;
          }
        }

        @media (max-width: 768px) {
          .filter-bar-content {
            gap: 12px !important;
          }

          .filter-bar-content > div {
            min-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

// Nom du composant pour le débogage
FilterBar.displayName = 'FilterBar';

export default FilterBar;
