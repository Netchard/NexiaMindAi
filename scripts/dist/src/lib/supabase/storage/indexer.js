"use strict";
/**
 * Service d'indexation Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.storageIndexer = exports.SupabaseStorageIndexer = void 0;
const logger_1 = require("../../logger");
const client_1 = require("./client");
const ocr_1 = require("./ocr");
const chunker_1 = require("../../rag/chunker");
const embeddings_1 = require("../../rag/embeddings");
const retriever_1 = require("../../rag/retriever");
const server_1 = require("../server");
/**
 * Service principal pour l'indexation des fichiers depuis Supabase Storage
 * Gère le flux complet : téléchargement → OCR → Chunking → Embeddings → Sauvegarde
 */
class SupabaseStorageIndexer {
    /**
     * Créer une nouvelle instance de l'indexeur
     * @param bucketName Nom du bucket (par défaut: 'documents')
     */
    constructor(bucketName = 'documents') {
        this.bucketName = bucketName;
        logger_1.logger.info(`SupabaseStorageIndexer initialisé pour le bucket: ${bucketName}`);
    }
    /**
     * Indexe tous les fichiers du bucket selon les options fournies
     * @param options Options d'indexation
     * @returns Promise avec le résultat de l'indexation
     */
    async indexAll(options = {}) {
        const startTime = Date.now();
        const result = {
            processed: 0,
            succeeded: 0,
            failed: 0,
            errors: [],
            chunksCreated: 0,
            embeddingsGenerated: 0,
        };
        logger_1.logger.info('Début de l\'indexation Supabase Storage', {
            bucket: this.bucketName,
            prefix: options.prefix,
            client: options.client,
            documentType: options.documentType,
            dryRun: options.dryRun,
            limit: options.limit,
        });
        try {
            // 1. Récupérer la liste des fichiers
            const files = await client_1.storageClient.listFiles(options.prefix, options.limit);
            logger_1.logger.info(`Fichiers à indexer: ${files.length}`, {
                bucket: this.bucketName,
            });
            if (files.length === 0) {
                logger_1.logger.info('Aucun fichier à indexer');
                return result;
            }
            // 2. Traiter chaque fichier
            for (const file of files) {
                result.processed++;
                try {
                    const fileResult = await this.indexFile(file, options);
                    result.succeeded++;
                    result.chunksCreated += fileResult.chunksCreated;
                    result.embeddingsGenerated += fileResult.embeddingsGenerated;
                    if (options.dryRun) {
                        logger_1.logger.info(`[DRY RUN] Fichier traité: ${file.path}`, {
                            chunksCreated: fileResult.chunksCreated,
                        });
                    }
                }
                catch (error) {
                    result.failed++;
                    result.errors.push({
                        file: file.path,
                        error: error.message,
                    });
                    logger_1.logger.error(`Échec de l'indexation du fichier: ${file.path}`, {
                        error: error.message,
                        stack: error.stack,
                    });
                }
            }
            const processingTime = Date.now() - startTime;
            logger_1.logger.info('Indexation terminée', {
                result,
                processingTime: `${processingTime}ms`,
                avgTimePerFile: `${processingTime / result.processed}ms`,
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Échec global de l\'indexation Supabase Storage', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Indexe un fichier spécifique
     * @param fileInfo Informations sur le fichier à indexer
     * @param options Options d'indexation
     * @returns Promise avec le résultat pour ce fichier
     */
    async indexFile(fileInfo, options) {
        const startTime = Date.now();
        let chunksCreated = 0;
        let embeddingsGenerated = 0;
        logger_1.logger.info(`Indexation du fichier: ${fileInfo.path}`, {
            size: fileInfo.size,
            contentType: fileInfo.contentType,
            fileName: fileInfo.name,
        });
        try {
            // 1. Télécharger le fichier
            const { data: fileBuffer, fileInfo: actualFileInfo } = await client_1.storageClient.downloadFile(fileInfo.path);
            // 2. Extraire le texte
            const extractedText = await ocr_1.ocrService.extractText(fileBuffer, actualFileInfo.name);
            if (!extractedText.text || extractedText.text.trim().length === 0) {
                logger_1.logger.warn(`Aucun texte extrait pour: ${fileInfo.path}`, {
                    contentType: extractedText.contentType,
                });
                return { chunksCreated: 0, embeddingsGenerated: 0 };
            }
            // 3. Chunking du document
            const chunkResult = await (0, chunker_1.chunkDocument)({
                content: extractedText.text,
                metadata: {
                    source: fileInfo.path,
                    sourceType: 'supabase_storage',
                    sourceBucket: this.bucketName,
                    client: options.client || 'default',
                    documentType: options.documentType || extractedText.contentType,
                    fileName: fileInfo.name,
                    fileSize: fileInfo.size,
                    fileContentType: fileInfo.contentType,
                    extractionMethod: extractedText.contentType,
                },
            });
            const chunks = chunkResult.chunks;
            chunksCreated = chunks.length;
            if (!options.dryRun) {
                // 4. Sauvegarder les chunks et générer les embeddings
                const supabaseClient = server_1.supabase;
                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    try {
                        // Sauvegarder le chunk dans la base
                        const { data: savedChunk, error: saveError } = await supabaseClient
                            .from('chunks')
                            .insert({
                            content: chunk.content,
                            metadata: {
                                ...chunk.metadata,
                                chunk_index: chunk.metadata.chunkIndex,
                                total_chunks: chunks.length,
                                source: fileInfo.path,
                                source_type: 'supabase_storage',
                            },
                        })
                            .select('id')
                            .single();
                        if (saveError) {
                            throw saveError;
                        }
                        // 5. Générer l'embedding pour ce chunk
                        const embeddingsResult = await (0, embeddings_1.generateEmbeddings)([chunk.content]);
                        const embedding = embeddingsResult.embeddings[0];
                        embeddingsGenerated++;
                        // 6. Sauvegarder l'embedding
                        const { error: embedError } = await supabaseClient
                            .from('embeddings')
                            .insert({
                            chunk_id: savedChunk?.id,
                            embedding: embedding.embedding,
                            dimensions: embedding.embedding.length,
                            model: 'mistral-embed',
                            token_count: embedding.tokenCount,
                        });
                        if (embedError) {
                            logger_1.logger.error(`Échec de la sauvegarde de l'embedding pour le chunk ${i}`, {
                                error: embedError.message,
                                chunkId: savedChunk?.id,
                            });
                            // Ne pas arrêter le traitement, continuer avec les autres chunks
                        }
                    }
                    catch (error) {
                        logger_1.logger.error(`Échec du traitement du chunk ${i}`, {
                            error: error.message,
                            stack: error.stack,
                            file: fileInfo.path,
                        });
                        // Continuer avec les autres chunks
                    }
                }
                // 7. Appeler reindexSource pour mettre à jour l'index vectoriel
                try {
                    await (0, retriever_1.reindexSource)(fileInfo.path, {
                        client: options.client,
                        documentType: options.documentType,
                        userId: 'system',
                    });
                    logger_1.logger.info(`Re-indexation appelée pour: ${fileInfo.path}`);
                }
                catch (reindexError) {
                    logger_1.logger.error(`Échec de la re-indexation pour: ${fileInfo.path}`, {
                        error: reindexError.message,
                    });
                    // Ne pas arrêter le traitement
                }
            }
            const processingTime = Date.now() - startTime;
            logger_1.logger.info(`Fichier indexé avec succès: ${fileInfo.path}`, {
                chunks: chunksCreated,
                embeddings: embeddingsGenerated,
                processingTime: `${processingTime}ms`,
            });
            return { chunksCreated, embeddingsGenerated };
        }
        catch (error) {
            logger_1.logger.error(`Échec du traitement du fichier: ${fileInfo.path}`, {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Récupère le nom du bucket
     * @returns Nom du bucket
     */
    getBucketName() {
        return this.bucketName;
    }
}
exports.SupabaseStorageIndexer = SupabaseStorageIndexer;
// Instance singleton par défaut avec le bucket 'documents'
exports.storageIndexer = new SupabaseStorageIndexer();
