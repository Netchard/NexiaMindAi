/**
 * Types partagés pour les citations de sources
 * Utilisés par les composants frontend et les endpoints API
 */

/**
 * Types de sources supportés
 * Correspond aux valeurs de la colonne `source` dans la table `documents`
 */
export type SourceType = 
  | 'supabase'
  | 'gitlab'
  | 'nexia'
  | 'upload';

/**
 * Représente une citation de source dans une réponse IA
 * Contient les métadonnées nécessaires pour afficher et lier à la source
 */
export interface SourceCitation {
  /** Identifiant unique de la citation (pour la numérotation) */
  id: string;
  /** Chemin vers le document source */
  path: string;
  /** Type de source (définit comment générer l'URL) */
  type: SourceType;
  /** Score de pertinence (0-1) - optionnel */
  relevance?: number;
  /** URL générée pour accéder à la source */
  url: string;
  /** Index de numérotation (1, 2, 3, ...) */
  index: number;
}

/**
 * Représente une source brute telle que retournée par l'API /api/chat/message
 * Ce format vient directement du backend
 */
export interface RawSource {
  /** Chemin vers le document source */
  path: string;
  /** Type de source */
  type: SourceType;
  /** Score de pertinence (0-1) - optionnel */
  relevance?: number;
}

/**
 * Section des citations dans un message
 * Ajouté aux messages assistant qui ont des sources
 */
export interface MessageCitations {
  /** Liste des citations parsées et prêtes à afficher */
  citations: SourceCitation[];
  /** Indicateur si des citations sont présentes */
  hasCitations: boolean;
}

/**
 * Options pour la génération des URLs de source
 * Permet de personnaliser les URLs base pour chaque type
 */
export interface SourceUrlConfig {
  supabase: string;
  gitlab: string;
  nexia: string;
  upload: string;
}

/**
 * Configuration par défaut pour les URLs de source
 * Peut être écrasée si nécessaire via variables d'environnement
 */
export const DEFAULT_SOURCE_URL_CONFIG: SourceUrlConfig = {
  supabase: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://app.supabase.com/project/ref/project-storage',
  gitlab: process.env.NEXT_PUBLIC_GITLAB_URL || 'https://gitlab.com/nexiamind-ai',
  nexia: process.env.NEXT_PUBLIC_NEXIA_URL || 'https://ged.nexiamind.fr',
  upload: process.env.NEXT_PUBLIC_UPLOAD_URL || '/uploads',
};
