/**
 * Types partagés pour les filtres de recherche
 * Utilisés par les composants frontend et les endpoints API
 */

/**
 * Valeurs possibles pour le filtre par client
 */
export type ClientName = string;

/**
 * Thèmes supportés
 */
export type Theme = 
  | 'Ged'
  | 'Facture'
  | 'Fournisseur'
  | 'Locataire'
  | 'Contrat'
  | 'Patrimoine';

/**
 * Formats de documents supportés
 */
export type DocumentFormat = 
  | 'pdf'
  | 'text'
  | 'markdown'
  | 'code'
  | 'csv'
  | 'json'
  | 'other';

/**
 * Rôle de l'utilisateur pour le filtrage
 */
export type UserRole = string;

/**
 * Filtres applicables à la recherche RAG
 * Tous les champs sont optionnels - si non fournis, pas de filtrage
 */
export interface Filters {
  theme?: Theme;
  documentFormat?: DocumentFormat;
  role?: UserRole;
  source?: string;
}

/**
 * État des filtres dans l'interface utilisateur
 * Utilisé pour gérer la sélection actuelle
 */
export interface FilterState {
  theme: Theme | '';
  documentFormat: DocumentFormat | '';
}

/**
 * Réponse de l'endpoint GET /api/chat/filters
 */
export interface FiltersResponse {
  themes: Theme[];
  documentFormats: DocumentFormat[];
}

/**
 * Option de filtre pour les dropdowns
 */
export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Options par défaut pour les filtres
 */
export const DEFAULT_FILTERS: FilterState = {
  theme: '',
  documentFormat: '',
};

/**
 * Libellés pour les filtres
 */
export const FILTER_LABELS = {
  theme: 'Thème',
  documentFormat: 'Format',
  reset: 'Réinitialiser',
} as const;

/**
 * Placeholders pour les dropdowns
 */
export const FILTER_PLACEHOLDERS = {
  theme: 'Tous les thèmes',
  documentFormat: 'Tous les formats',
} as const;
