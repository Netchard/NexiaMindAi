/**
 * Types pour le service Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

/**
 * Informations sur un fichier dans Supabase Storage
 */
export interface StorageFileInfo {
  /** Nom du fichier */
  name: string;
  /** Chemin complet dans le bucket */
  path: string;
  /** Type MIME du fichier */
  contentType: string;
  /** Taille en octets */
  size: number;
  /** Date de dernière modification (ISO string) */
  updatedAt: string;
  /** Métadonnées personnalisées */
  metadata?: Record<string, string>;
}

/**
 * Résultat du téléchargement d'un fichier
 */
export interface DownloadResult {
  /** Contenu binaire du fichier */
  data: Buffer;
  /** Informations sur le fichier */
  fileInfo: StorageFileInfo;
}

/**
 * Texte extrait d'un fichier
 */
export interface ExtractedText {
  /** Texte extrait */
  text: string;
  /** Type de contenu détecté */
  contentType: 'text' | 'pdf' | 'image' | 'other';
  /** Langue détectée (optionnelle) */
  language?: string;
  /** Nombre de pages (pour PDF, optionnel) */
  pageCount?: number;
}

/**
 * Options pour l'indexation des fichiers
 */
export interface IndexationOptions {
  /** Prefix du bucket à indexer (optionnel) */
  prefix?: string;
  /** Client spécifique (optionnel) */
  client?: string;
  /** Type de document (optionnel) */
  documentType?: string;
  /** Mode test - ne pas sauvegarder en base (optionnel, default: false) */
  dryRun?: boolean;
  /** Limite de fichiers à traiter (optionnel) */
  limit?: number;
}

/**
 * Résultat de l'indexation
 */
export interface IndexationResult {
  /** Nombre total de fichiers traités */
  processed: number;
  /** Nombre de fichiers indexés avec succès */
  succeeded: number;
  /** Nombre de fichiers échoués */
  failed: number;
  /** Liste des erreurs par fichier */
  errors: Array<{ file: string; error: string }>;
  /** Nombre de chunks créés */
  chunksCreated: number;
  /** Nombre d'embeddings générés */
  embeddingsGenerated: number;
}

/**
 * Options pour la synchronisation via API
 */
export interface SyncRequest {
  /** Prefix du bucket à synchroniser */
  prefix?: string;
  /** Client spécifique */
  client?: string;
  /** Type de document */
  documentType?: string;
  /** Mode test */
  dryRun?: boolean;
  /** Limite de fichiers */
  limit?: number;
}

/**
 * Réponse de l'API de synchronisation
 */
export interface SyncResponse extends IndexationResult {
  /** Statut de l'opération */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  /** ID de la tâche de synchronisation */
  taskId: string;
  /** Message de statut */
  message: string;
}
