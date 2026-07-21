/**
 * Client Supabase Storage
 * Service pour interagir avec Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { supabase } from '../server';
import { logger } from '../../logger';
import { StorageFileInfo, DownloadResult } from './types';

/**
 * Client pour interagir avec Supabase Storage
 * Gère la liste, le téléchargement et les métadonnées des fichiers
 */
export class SupabaseStorageClient {
  /** Nom du bucket par défaut */
  private bucketName: string;

  /**
   * Créer une nouvelle instance du client
   * @param bucketName Nom du bucket (par défaut: 'documents')
   */
  constructor(bucketName: string = 'documents') {
    this.bucketName = bucketName;
    logger.info(`SupabaseStorageClient initialisé pour le bucket: ${bucketName}`);
  }

  /**
   * Liste tous les fichiers du bucket
   * @param prefix Prefix optionnel pour filtrer les fichiers
   * @param limit Limite de résultats (par défaut: 1000)
   * @returns Promise avec la liste des fichiers
   */
  async listFiles(prefix?: string, limit: number = 1000): Promise<StorageFileInfo[]> {
    const startTime = Date.now();
    const supabaseClient = supabase;

    try {
      logger.info(`Liste des fichiers du bucket ${this.bucketName}`, {
        prefix,
        limit,
      });

      const { data, error } = await supabaseClient
        .storage
        .from(this.bucketName)
        .list(prefix || '', { limit });

      if (error) {
        logger.error('Échec de la liste des fichiers Supabase Storage', {
          error: error.message,
          bucket: this.bucketName,
          prefix,
        });
        throw new Error(`Échec de la liste des fichiers: ${error.message}`);
      }

      // Transformer les données de Supabase en StorageFileInfo
      // NOTE: l'API Storage de Supabase ne renvoie jamais `metadata.full_path`
      // (ce champ n'existe pas dans sa réponse) — `file.name` est le nom
      // RELATIF au dossier listé (`prefix`), pas le chemin complet dans le
      // bucket. Il faut donc reconstruire le chemin complet nous-mêmes,
      // sans quoi tout appel avec un `prefix` non-racine (ex. indexation
      // d'un sous-dossier d'upload) produit des chemins invalides et fait
      // échouer le téléchargement ultérieur ("Object not found").
      const normalizedPrefix = prefix ? prefix.replace(/\/+$/, '') : '';
      const files: StorageFileInfo[] = data.map((file: any) => ({
        name: file.name,
        path: normalizedPrefix ? `${normalizedPrefix}/${file.name}` : file.name,
        contentType: file.metadata?.mimetype || '',
        size: file.metadata?.size || 0,
        updatedAt: file.metadata?.last_modified || file.updated_at || '',
        metadata: file.metadata || {},
      }));

      logger.info(`Fichiers listés avec succès`, {
        count: files.length,
        bucket: this.bucketName,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return files;

    } catch (error: any) {
      logger.error('Échec du traitement de la liste des fichiers', {
        error: error.message,
        stack: error.stack,
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  /**
   * Télécharge un fichier depuis Supabase Storage
   * @param path Chemin du fichier dans le bucket
   * @returns Promise avec le contenu et les métadonnées du fichier
   */
  async downloadFile(path: string): Promise<DownloadResult> {
    const startTime = Date.now();
    const supabaseClient = supabase;

    try {
      logger.info(`Téléchargement du fichier: ${path}`, {
        bucket: this.bucketName,
      });

      const { data: blobData, error } = await supabaseClient
        .storage
        .from(this.bucketName)
        .download(path);

      if (error) {
        logger.error('Échec du téléchargement du fichier', {
          error: error.message,
          path,
          bucket: this.bucketName,
        });
        throw new Error(`Échec du téléchargement: ${error.message}`);
      }

      // Convertir Blob en Buffer
      const buffer = Buffer.from(await blobData.arrayBuffer());

      // Récupérer les métadonnées
      const fileInfo = await this.getFileInfo(path);

      logger.info('Fichier téléchargé avec succès', {
        path,
        size: buffer.length,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return {
        data: buffer,
        fileInfo,
      };

    } catch (error: any) {
      logger.error('Échec du téléchargement du fichier', {
        error: error.message,
        stack: error.stack,
        path,
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  /**
   * Télécharge (upload) un fichier vers Supabase Storage
   * @param path Chemin cible du fichier dans le bucket (ex: "uploads/{slug}/{filename}")
   * @param buffer Contenu binaire du fichier
   * @param contentType Type MIME du fichier
   * @returns Promise avec les informations du fichier uploadé
   */
  async uploadFile(path: string, buffer: Buffer, contentType: string): Promise<StorageFileInfo> {
    const startTime = Date.now();
    const supabaseClient = supabase;

    try {
      logger.info(`Upload du fichier: ${path}`, {
        bucket: this.bucketName,
        contentType,
        size: buffer.length,
      });

      const { data, error } = await supabaseClient
        .storage
        .from(this.bucketName)
        .upload(path, buffer, { contentType, upsert: true });

      if (error) {
        logger.error('Échec de l\'upload du fichier', {
          error: error.message,
          path,
          bucket: this.bucketName,
        });
        throw new Error(`Échec de l'upload: ${error.message}`);
      }

      logger.info('Fichier uploadé avec succès', {
        path,
        size: buffer.length,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return {
        name: path.split('/').pop() || path,
        path: data?.path || path,
        contentType,
        size: buffer.length,
        updatedAt: new Date().toISOString(),
        metadata: {},
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Échec du traitement de l\'upload du fichier', {
        error: errorMessage,
        stack: errorStack,
        path,
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  /**
   * Récupère les métadonnées d'un fichier spécifique
   * @param path Chemin du fichier dans le bucket
   * @returns Promise avec les informations du fichier
   */
  async getFileInfo(path: string): Promise<StorageFileInfo> {
    const supabaseClient = supabase;

    try {
      // Récupérer le dossier parent pour trouver le fichier
      const pathParts = path.split('/');
      const folderPath = pathParts.slice(0, -1).join('/');
      const fileName = pathParts[pathParts.length - 1];

      const { data: files, error } = await supabaseClient
        .storage
        .from(this.bucketName)
        .list(folderPath || '', { limit: 1000 });

      if (error) {
        throw new Error(`Échec de la récupération des métadonnées: ${error.message}`);
      }

      const file = files.find((f: any) => f.name === fileName);

      if (!file) {
        throw new Error(`Fichier non trouvé: ${path}`);
      }

      return {
        name: file.name,
        path: file.metadata?.full_path || file.name,
        contentType: file.metadata?.mimetype || '',
        size: file.metadata?.size || 0,
        updatedAt: file.metadata?.last_modified || file.updated_at || '',
        metadata: file.metadata || {},
      };

    } catch (error: any) {
      logger.error('Échec de la récupération des métadonnées du fichier', {
        error: error.message,
        path,
        bucket: this.bucketName,
      });
      throw error;
    }
  }

  /**
   * Vérifie si un fichier existe
   * @param path Chemin du fichier à vérifier
   * @returns Promise avec un booléen indiquant l'existence
   */
  async fileExists(path: string): Promise<boolean> {
    try {
      await this.getFileInfo(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Récupère le client Supabase sous-jacent
   * @returns Client Supabase
   */
  getSupabaseClient() {
    return supabase;
  }

  /**
   * Récupère le nom du bucket
   * @returns Nom du bucket
   */
  getBucketName(): string {
    return this.bucketName;
  }
}

// Instance singleton par défaut avec le bucket 'documents'
export const storageClient = new SupabaseStorageClient();
