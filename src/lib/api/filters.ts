/**
 * Filters API client (frontend-only, no server-side deps).
 * Fournit les fonctions pour récupérer et gérer les valeurs de filtre.
 * Ne pas importer depuis les route handlers directement (voir Dev Notes ST-303).
 */

import { FiltersResponse } from '@/types/filters';

/**
 * Réponse typée pour l'endpoint GET /api/chat/filters
 */
export interface GetFiltersResponse extends FiltersResponse {}

/**
 * Cache des valeurs de filtre avec TTL de 1 heure (3600000 ms)
 * Conforme à la spécification de performance de ST-304
 */
let filtersCache: {
  data: GetFiltersResponse | null;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 3600000, // 1 heure en millisecondes
};

/**
 * Erreur personnalisée pour les filtres
 */
export class FiltersError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'FiltersError';
  }
}

/**
 * Analyser le message d'erreur de la réponse
 */
async function parseErrorMessage(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({}));
  return errorData.error || errorData.message || response.statusText || 'Erreur inconnue';
}

/**
 * Vérifier si le cache est toujours valide
 */
function isCacheValid(): boolean {
  if (!filtersCache.data) return false;
  const now = Date.now();
  return now - filtersCache.timestamp < filtersCache.ttl;
}

/**
 * Récupérer les valeurs possibles pour les filtres depuis le cache ou l'API
 * Implémente le cache avec 1h TTL comme spécifié dans ST-304
 * 
 * @returns Promise<GetFiltersResponse> - Les valeurs de filtre
 * @throws FiltersError - Si la récupération échoue
 */
export async function getFilterValues(): Promise<GetFiltersResponse> {
  // Vérifier si on a des données valides en cache
  if (isCacheValid() && filtersCache.data) {
    return filtersCache.data;
  }

  try {
    const response = await fetch('/api/chat/filters', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // L'auth passe par le cookie de session (voir src/proxy.ts) — 'omit' ferait
      // échouer systématiquement cette requête en 401 (revue de code ST-304).
      credentials: 'same-origin',
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      // 401/erreur : propager une FiltersError réelle plutôt que de servir des
      // valeurs fictives comme si elles venaient du serveur — l'appelant (page
      // /chat) affiche déjà une bannière d'erreur (AC #10) pour ce cas.
      throw new FiltersError(
        await parseErrorMessage(response),
        response.status
      );
    }

    const data: GetFiltersResponse = await response.json();
    
    // Mettre en cache les données
    filtersCache = {
      data,
      timestamp: Date.now(),
      ttl: 3600000, // 1 heure
    };

    return data;
  } catch (error) {
    // Si le cache existe mais est expiré, on peut le retourner en fallback
    if (filtersCache.data) {
      console.warn('Échec de la récupération des filtres, retour des données en cache', {
        error: error instanceof Error ? error.message : String(error),
      });
      return filtersCache.data;
    }
    
    // Sinon, propager l'erreur
    if (error instanceof FiltersError) {
      throw error;
    }
    
    throw new FiltersError(
      error instanceof Error ? error.message : 'Erreur inconnue lors de la récupération des filtres',
      0
    );
  }
}

/**
 * Invalider le cache des filtres (utile pour forcer un rechargement)
 */
export function invalidateFiltersCache(): void {
  filtersCache = {
    data: null,
    timestamp: 0,
    ttl: 3600000,
  };
}

/**
 * Réinitialiser le cache des filtres
 */
export function resetFiltersCache(): void {
  filtersCache = {
    data: null,
    timestamp: 0,
    ttl: 3600000,
  };
}

/**
 * Récupérer l'état du cache des filtres
 */
export function getFiltersCacheState(): {
  hasData: boolean;
  isValid: boolean;
  timestamp: number;
} {
  return {
    hasData: filtersCache.data !== null,
    isValid: isCacheValid(),
    timestamp: filtersCache.timestamp,
  };
}

/**
 * Précharger les valeurs de filtre (pour l'optimisation)
 * Peut être appelé au chargement de la page pour éviter le loading state
 */
export async function prefetchFilterValues(): Promise<void> {
  try {
    // Ne pas attendre le résultat, juste déclencher la requête
    getFilterValues().catch(() => {
      // Ignorer les erreurs en préfetch
      console.warn('Préfetch des filtres échoué, les données seront chargées à la demande');
    });
  } catch {
    // Ignorer les erreurs
  }
}

/**
 * Convertir les valeurs de filtre brute en options pour les dropdowns
 * Utilisé par les composants FilterBar et FilterDropdown
 */
export function convertToFilterOptions(filters: GetFiltersResponse): {
  themes: Array<{ value: string; label: string }>;
  documentFormats: Array<{ value: string; label: string }>;
} {
  return {
    themes: filters.themes.map(theme => ({
      value: theme,
      label: theme,
    })),
    documentFormats: filters.documentFormats.map(format => ({
      value: format,
      label: format,
    })),
  };
}

export default {
  getFilterValues,
  invalidateFiltersCache,
  resetFiltersCache,
  getFiltersCacheState,
  prefetchFilterValues,
  convertToFilterOptions,
};
