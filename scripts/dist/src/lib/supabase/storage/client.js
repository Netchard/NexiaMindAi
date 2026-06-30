"use strict";
/**
 * Client Supabase Storage
 * Service pour interagir avec Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageClient = exports.SupabaseStorageClient = void 0;
const server_1 = require("../server");
const logger_1 = require("../../logger");
/**
 * Client pour interagir avec Supabase Storage
 * Gère la liste, le téléchargement et les métadonnées des fichiers
 */
class SupabaseStorageClient {
    /**
     * Créer une nouvelle instance du client
     * @param bucketName Nom du bucket (par défaut: 'documents')
     */
    constructor(bucketName = 'documents') {
        this.bucketName = bucketName;
        logger_1.logger.info(`SupabaseStorageClient initialisé pour le bucket: ${bucketName}`);
    }
    /**
     * Liste tous les fichiers du bucket
     * @param prefix Prefix optionnel pour filtrer les fichiers
     * @param limit Limite de résultats (par défaut: 1000)
     * @returns Promise avec la liste des fichiers
     */
    async listFiles(prefix, limit = 1000) {
        const startTime = Date.now();
        const supabaseClient = server_1.supabase;
        try {
            logger_1.logger.info(`Liste des fichiers du bucket ${this.bucketName}`, {
                prefix,
                limit,
            });
            const { data, error } = await supabaseClient
                .storage
                .from(this.bucketName)
                .list(prefix || '', { limit });
            if (error) {
                logger_1.logger.error('Échec de la liste des fichiers Supabase Storage', {
                    error: error.message,
                    bucket: this.bucketName,
                    prefix,
                });
                throw new Error(`Échec de la liste des fichiers: ${error.message}`);
            }
            // Transformer les données de Supabase en StorageFileInfo
            const files = data.map((file) => ({
                name: file.name,
                path: file.metadata?.full_path || file.name,
                contentType: file.metadata?.mimetype || '',
                size: file.metadata?.size || 0,
                updatedAt: file.metadata?.last_modified || file.updated_at || '',
                metadata: file.metadata || {},
            }));
            logger_1.logger.info(`Fichiers listés avec succès`, {
                count: files.length,
                bucket: this.bucketName,
                processingTime: `${Date.now() - startTime}ms`,
            });
            return files;
        }
        catch (error) {
            logger_1.logger.error('Échec du traitement de la liste des fichiers', {
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
    async downloadFile(path) {
        const startTime = Date.now();
        const supabaseClient = server_1.supabase;
        try {
            logger_1.logger.info(`Téléchargement du fichier: ${path}`, {
                bucket: this.bucketName,
            });
            const { data: blobData, error } = await supabaseClient
                .storage
                .from(this.bucketName)
                .download(path);
            if (error) {
                logger_1.logger.error('Échec du téléchargement du fichier', {
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
            logger_1.logger.info('Fichier téléchargé avec succès', {
                path,
                size: buffer.length,
                processingTime: `${Date.now() - startTime}ms`,
            });
            return {
                data: buffer,
                fileInfo,
            };
        }
        catch (error) {
            logger_1.logger.error('Échec du téléchargement du fichier', {
                error: error.message,
                stack: error.stack,
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
    async getFileInfo(path) {
        const supabaseClient = server_1.supabase;
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
            const file = files.find((f) => f.name === fileName);
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
        }
        catch (error) {
            logger_1.logger.error('Échec de la récupération des métadonnées du fichier', {
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
    async fileExists(path) {
        try {
            await this.getFileInfo(path);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Récupère le client Supabase sous-jacent
     * @returns Client Supabase
     */
    getSupabaseClient() {
        return server_1.supabase;
    }
    /**
     * Récupère le nom du bucket
     * @returns Nom du bucket
     */
    getBucketName() {
        return this.bucketName;
    }
}
exports.SupabaseStorageClient = SupabaseStorageClient;
// Instance singleton par défaut avec le bucket 'documents'
exports.storageClient = new SupabaseStorageClient();
