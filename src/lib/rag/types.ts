/**
 * Types pour le service de chunking
 * Fait partie du pipeline RAG de NexiaMind AI
 */

/**
 * Type de contenu du document
 */
export type ContentType = 'text' | 'markdown' | 'code' | 'html' | 'unknown';

/**
 * Langage du code (pour le chunking de code)
 */
export type CodeLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'go'
  | 'rust'
  | 'sql'
  | 'bash'
  | 'unknown';

/**
 * Métadonnées d'un chunk
 */
export interface ChunkMetadata {
  /** Index du chunk dans le document */
  chunkIndex: number;
  /** Nombre total de chunks pour ce document */
  totalChunks: number;
  /** Type de contenu */
  contentType: ContentType;
  /** Langage (si code) */
  language?: CodeLanguage;
  /** Chemin du document source */
  documentPath?: string;
  /** ID du document source */
  documentId?: string;
  /** Source du document (supabase, gitlab, nexia) */
  source?: string;
  /** Nombre de tokens dans ce chunk */
  tokenCount: number;
  /** Horodatage de création */
  createdAt?: string;
  /** Métadonnées supplémentaires */
  [key: string]: any;
}

/**
 * Résultat du chunking
 */
export interface Chunk {
  /** ID unique du chunk */
  id?: string;
  /** Contenu textuel du chunk */
  content: string;
  /** Métadonnées */
  metadata: ChunkMetadata;
}

/**
 * Options de chunking
 */
export interface ChunkingOptions {
  /** Taille maximale du chunk en tokens (défaut: 512) */
  chunkSize?: number;
  /** Nombre de tokens de chevauchement (défaut: 50) */
  chunkOverlap?: number;
  /** Séparateurs pour le chunking (par ordre de priorité) */
  separators?: string[];
}

/**
 * Résultat du chunking d'un document
 */
export interface ChunkingResult {
  /** Liste des chunks générés */
  chunks: Chunk[];
  /** Nombre total de chunks */
  totalChunks: number;
  /** Taille totale en tokens */
  totalTokens: number;
  /** Taille moyenne des chunks en tokens */
  avgChunkSize: number;
  /** Durée du traitement en ms */
  processingTime?: number;
}
