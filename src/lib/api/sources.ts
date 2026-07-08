/**
 * Sources API client (frontend-only, no server-side deps).
 * Fournit les fonctions pour générer les URLs de source.
 * Ne pas importer depuis les route handlers directement.
 */

import { SourceCitation, RawSource, SourceType, DEFAULT_SOURCE_URL_CONFIG, SourceUrlConfig } from '@/types/citations';

/**
 * Génère une URL pour accéder à une source
 * @param source - La source avec path et type
 * @param config - Configuration optionnelle des URLs de base
 * @returns L'URL complète ou null si le type n'est pas supporté ou source invalide
 */
export function getSourceUrl(
  source: { path: string; type: SourceType },
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): string | null {
  // Vérifier que source existe
  if (!source) {
    console.warn('getSourceUrl: source est null ou undefined');
    return null;
  }
  
  // Vérifier que type existe et est valide
  const type = source.type;
  if (!type) {
    console.warn('getSourceUrl: source.type est null ou undefined');
    return null;
  }
  
  // Récupérer l'URL de base pour ce type (validation explicite)
  const validTypes: SourceType[] = ['supabase', 'gitlab', 'nexia', 'upload'];
  if (!validTypes.includes(type)) {
    console.warn(`Type de source inconnu: ${type}`);
    return null;
  }
  
  const baseUrl = config[type];
  
  // Vérifier que baseUrl existe et n'est pas null/undefined
  if (baseUrl == null || baseUrl === '') {
    console.warn(`URL de base vide pour le type: ${type}`);
    return null;
  }
  
  // Valider que path existe et est un string
  if (!source.path || typeof source.path !== 'string') {
    console.warn('getSourceUrl: source.path doit être un string non vide');
    return null;
  }
  
  // Nettoyer le path (enlever TOUS les / de début)
  const cleanPath = source.path.replace(/^\/+/, '');
  
  // Si path est vide après nettoyage, retourner null
  if (cleanPath === '') {
    console.warn('getSourceUrl: path vide après nettoyage');
    return null;
  }
  
  // Encoder les caractères spéciaux dans le path
  const encodedPath = encodeURIComponent(cleanPath);
  
  // Construire l'URL complète
  return `${baseUrl}/${encodedPath}`;
}

/**
 * Convertit une source brute de l'API en SourceCitation
 * @param rawSource - La source telle que retournée par l'API
 * @param index - L'index de numérotation (1, 2, 3, ...)
 * @param config - Configuration optionnelle des URLs de base
 * @returns SourceCitation prête à afficher, ou null si source invalide
 */
export function convertToSourceCitation(
  rawSource: RawSource,
  index: number,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation | null {
  const url = getSourceUrl(rawSource, config);
  
  // Si URL ne peut pas être générée, ne pas créer de citation
  if (url == null) {
    console.warn(`Impossible de générer URL pour la source: ${rawSource.type} - ${rawSource.path}`);
    return null;
  }
  
  // Sanitizer l'ID pour éviter les caractères spéciaux qui cassent CSS/HTML
  const sanitizedType = rawSource.type.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedPath = rawSource.path.replace(/[^a-zA-Z0-9_-]/g, '_');
  const sanitizedIndex = Math.max(1, index);
  
  return {
    id: `${sanitizedType}-${sanitizedPath}-${sanitizedIndex}`,
    path: rawSource.path,
    type: rawSource.type,
    relevance: rawSource.relevance,
    url: url,
    index: sanitizedIndex,
  };
}

/**
 * Convertit un tableau de sources brutes en SourceCitation[]
 * @param rawSources - Les sources telles que retournées par l'API
 * @param config - Configuration optionnelle des URLs de base
 * @returns Tableau de SourceCitation prêtes à afficher
 */
export function convertToSourceCitations(
  rawSources: RawSource[] | undefined | null,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation[] {
  if (!rawSources || rawSources.length === 0) {
    return [];
  }
  
  const citations: SourceCitation[] = [];
  rawSources.forEach((source, index) => {
    const citation = convertToSourceCitation(source, index + 1, config);
    if (citation) {
      citations.push(citation);
    }
  });
  
  return citations;
}

/**
 * Vérifie si une source est valide (a un type supporté et un path non vide)
 * @param source - La source à vérifier
 * @returns true si la source est valide
 */
export function isValidSource(source: RawSource | null | undefined): boolean {
  // Vérifier que source existe et est un objet
  if (!source || typeof source !== 'object') {
    return false;
  }
  
  // Vérifier que source.type existe et est un string valide
  const validTypes: SourceType[] = ['supabase', 'gitlab', 'nexia', 'upload'];
  if (!source.type || typeof source.type !== 'string' || !validTypes.includes(source.type as SourceType)) {
    return false;
  }
  
  // Vérifier que path existe, est un string, et n'est pas vide
  if (!source.path || typeof source.path !== 'string' || source.path.trim() === '') {
    return false;
  }
  
  // Optionnel : valider que relevance est dans [0, 1] si présent
  if (source.relevance !== undefined && (source.relevance < 0 || source.relevance > 1)) {
    return false;
  }
  
  return true;
}

/**
 * Filtre et convertit les sources en citant celles qui sont valides
 * @param rawSources - Les sources brutes de l'API
 * @param config - Configuration optionnelle des URLs de base
 * @returns Tableau de SourceCitation filtré et converti
 */
export function filterAndConvertSources(
  rawSources: RawSource[] | undefined | null,
  config: SourceUrlConfig = DEFAULT_SOURCE_URL_CONFIG
): SourceCitation[] {
  // Normaliser null en undefined
  if (rawSources == null) {
    return [];
  }
  
  if (rawSources.length === 0) {
    return [];
  }
  
  // Filtrer les éléments null/undefined, puis les sources invalides
  const validSources = rawSources.filter(Boolean).filter(isValidSource);
  
  // Convertir en SourceCitation avec numérotation, filtrer les nulls
  const citations: SourceCitation[] = [];
  validSources.forEach((source, index) => {
    const citation = convertToSourceCitation(source, index + 1, config);
    if (citation) {
      citations.push(citation);
    }
  });
  
  return citations;
}

/**
 * Récupère la configuration par défaut des URLs de source
 * @returns La configuration par défaut
 */
export function getDefaultSourceUrlConfig(): SourceUrlConfig {
  return { ...DEFAULT_SOURCE_URL_CONFIG };
}

/**
 * Met à jour la configuration des URLs de source
 * @param partialConfig - Configuration partielle à fusionner
 * @returns Nouvelle configuration complète
 */
export function updateSourceUrlConfig(
  partialConfig: Partial<SourceUrlConfig>
): SourceUrlConfig {
  return { ...DEFAULT_SOURCE_URL_CONFIG, ...partialConfig };
}

export default {
  getSourceUrl,
  convertToSourceCitation,
  convertToSourceCitations,
  isValidSource,
  filterAndConvertSources,
  getDefaultSourceUrlConfig,
  updateSourceUrlConfig,
};
