/**
 * Types spécifiques aux composants Filters
 * Complémentaires aux types partagés dans src/types/filters.ts
 */

import { FilterOption, FilterState, FiltersResponse } from '@/types/filters';

/**
 * Props pour le composant FilterDropdown
 */
export interface FilterDropdownProps {
  /** Nom du filtre (utilisé pour l'ID et l'accessibilité) */
  name: string;
  /** Libellé visible du dropdown */
  label: string;
  /** Placeholder quand aucune option n'est sélectionnée */
  placeholder: string;
  /** Liste des options disponibles */
  options: FilterOption[];
  /** Valeur actuellement sélectionnée */
  value: string;
  /** Callback appelé quand la valeur change */
  onChange: (value: string) => void;
  /** Si le dropdown est désactivé */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Props pour le composant FilterBar
 */
export interface FilterBarProps {
  /** État actuel des filtres */
  filterState: FilterState;
  /** Liste des valeurs possibles pour chaque filtre */
  filterOptions: {
    themes: FilterOption[];
    documentFormats: FilterOption[];
  };
  /** Callback appelé quand un filtre change */
  onFilterChange: (filterType: keyof FilterState, value: string) => void;
  /** Callback appelé pour réinitialiser tous les filtres */
  onReset: () => void;
  /** Si les filtres sont en cours de chargement */
  isLoading?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * État de chargement des filtres
 */
export interface FiltersLoadingState {
  isLoading: boolean;
  error: string | null;
  data: FiltersResponse | null;
}

/**
 * Événements pour les filtres
 */
export interface FilterEvents {
  onThemeChange: (theme: string) => void;
  onDocumentFormatChange: (documentFormat: string) => void;
  onReset: () => void;
}

/**
 * Props pour l'intégration des filtres dans une page
 */
export interface FiltersIntegrationProps {
  /** Callback appelé avec les filtres actuels pour les envoyer à l'API */
  onFiltersApply: (filters: FilterState) => void;
  /** Si les filtres sont actifs (au moins un filtre sélectionné) */
  hasActiveFilters?: boolean;
}
