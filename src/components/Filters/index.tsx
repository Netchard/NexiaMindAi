/**
 * Barrel export pour les composants Filters
 * Exporte tous les composants et types principaux
 */

// Composants
export { FilterDropdown } from './FilterDropdown';
export { FilterBar } from './FilterBar';

// Types
export type { 
  FilterDropdownProps,
  FilterBarProps,
  FiltersLoadingState,
  FilterEvents,
  FiltersIntegrationProps,
} from './types';

// Réexport des types partagés depuis @/types/filters pour commodité
export type {
  ClientName,
  Theme,
  DocumentFormat,
  UserRole,
  Filters,
  FilterState,
  FiltersResponse,
  FilterOption,
} from '@/types/filters';

export { 
  DEFAULT_FILTERS,
  FILTER_LABELS,
  FILTER_PLACEHOLDERS,
} from '@/types/filters';
