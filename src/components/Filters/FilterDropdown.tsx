'use client';

/**
 * Composant FilterDropdown - Dropdown générique réutilisable
 * Respecte WCAG 2.1 AA et utilise le design system existant
 */

import React, { useId, forwardRef } from 'react';
import { FilterDropdownProps } from './types';

// Couleurs du design system sombre (docs/Maquette-ux-NexiaMind AI.html)
// voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md
const colors = {
  primary: '#F4693F', // Corail
  primaryHover: '#FF845E',
  secondary: '#F2F5FA', // Encre claire
  text: '#EEF2F8',
  textLight: '#8D9CB5',
  border: '#2A3B58',
  background: '#0A1524',
  focusRing: '#F4693F',
};

/**
 * Texte des tooltips pour chaque type de filtre
 */
const TOOLTIPS = {
  'Client': 'Filtrez les résultats par client spécifique. Sélectionnez "Tous les clients" pour voir tous les documents.',
  'Type de document': 'Filtrez par type de fichier (PDF, texte, markdown, code, etc.).',
  'Langage': 'Filtrez par langage de programmation. Réservé aux développeurs.',
} as const;

/**
 * Obtenir le texte du tooltip basé sur le label
 */
function getTooltipText(label: string): string {
  return TOOLTIPS[label as keyof typeof TOOLTIPS] || `Filtre par ${label}`;
}

const FilterDropdown = forwardRef<HTMLSelectElement, FilterDropdownProps>(
  (
    {
      name,
      label,
      placeholder,
      options,
      value,
      onChange,
      disabled = false,
      className = '',
    },
    ref
  ) => {
    const id = useId();
    const dropdownId = `filter-dropdown-${id}`;

    // Gestion du changement de valeur
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      if (disabled) return;
      onChange(e.target.value);
    };

    return (
      <div className={`filter-dropdown-container ${className}`}>
        {/* Label visible pour l'accessibilité WCAG 2.1 AA */}
        <label 
          htmlFor={dropdownId}
          className="filter-dropdown-label"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '4px',
            fontSize: '14px',
            fontWeight: 500,
            color: colors.secondary,
            cursor: 'help',
          }}
          title={getTooltipText(label)}
        >
          {label}
          <span 
            className="filter-tooltip-icon"
            aria-hidden="true"
            style={{
              fontSize: '12px',
              opacity: 0.6,
            }}
          >
            ⓘ
          </span>
        </label>
        
        <div className="filter-dropdown-wrapper" style={{ position: 'relative' }}>
          <select
            id={dropdownId}
            ref={ref}
            name={name}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className="filter-dropdown-select"
            style={{
              width: '100%',
              padding: '8px 12px',
              paddingRight: '36px', // Espace pour la flèche
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              backgroundColor: colors.background,
              color: colors.text,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(colors.primary)}' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '12px',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            // Accessibilité
            aria-label={label}
            aria-disabled={disabled}
            // Indiquer si le dropdown est requis (pour les validations)
            aria-required={false}
          >
            {/* Option par défaut (placeholder) */}
            <option value="" disabled={!value}>
              {placeholder}
            </option>
            
            {/* Options du dropdown */}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                style={{
                  color: colors.text,
                  backgroundColor: colors.background,
                }}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Focus ring pour l'accessibilité - visible seulement au focus clavier */}
          <style jsx>{`
            .filter-dropdown-select:focus {
              outline: none;
              border-color: ${colors.primary};
              box-shadow: 0 0 0 3px rgba(239, 108, 77, 0.2);
            }

            .filter-dropdown-select:focus-visible {
              outline: 2px solid ${colors.focusRing};
              outline-offset: 1px;
            }

            .filter-dropdown-select:hover:not(:disabled) {
              border-color: ${colors.primaryHover};
            }

            .filter-dropdown-select:disabled {
              cursor: not-allowed;
              opacity: 0.6;
            }

            /* Mobile adjustments */
            @media (max-width: 768px) {
              .filter-dropdown-container {
                margin-bottom: 12px;
              }
            }
          `}</style>
        </div>
      </div>
    );
  }
);

// Nom du composant pour le débogage
FilterDropdown.displayName = 'FilterDropdown';

export { FilterDropdown };
