"use strict";
/**
 * Service de Retrieval pour le pipeline RAG
 * Récupère les chunks pertinents via pgvector et Supabase
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrievalService = exports.RetrievalService = exports.RetrievalError = void 0;
exports.retrieveRelevantChunks = retrieveRelevantChunks;
exports.retrieveSimilarChunks = retrieveSimilarChunks;
exports.reindexSource = reindexSource;
const supabase_js_1 = require("@supabase/supabase-js");
const logger_1 = require("../logger");
const embeddings_1 = require("./embeddings");
/**
 * Erreur spécifique au retrieval
 */
class RetrievalError extends Error {
    constructor(message, statusCode, errorType, retryable = false) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.retryable = retryable;
        this.name = 'RetrievalError';
    }
}
exports.RetrievalError = RetrievalError;
/**
 * Service principal de retrieval
 */
class RetrievalService {
    /**
     * Créer une nouvelle instance du RetrievalService
     * @param supabaseClient Client Supabase
     * @param embeddingService Service d'embeddings
     */
    constructor(supabaseClient, embeddingService) {
        this.supabase = supabaseClient || (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
        this.embeddingService = embeddingService || new embeddings_1.EmbeddingService();
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            logger_1.logger.warn('SUPABASE_URL ou SUPABASE_ANON_KEY non configurés. Le retrieval ne pourra pas fonctionner.');
        }
        logger_1.logger.info('RetrievalService initialisé');
    }
    /**
     * Récupérer les chunks pertinents pour une requête
     * @param query Requête utilisateur
     * @param filters Filtres de recherche
     * @returns Résultat avec les chunks pertinents
     */
    async retrieveRelevantChunks(query, filters = {}) {
        const startTime = Date.now();
        if (!query || query.trim().length === 0) {
            throw new RetrievalError('Requête vide fournie', 400, 'empty_query', false);
        }
        if (!this.supabase) {
            throw new RetrievalError('Client Supabase non configuré', 500, 'supabase_not_configured', false);
        }
        if (!this.embeddingService.isConfigured()) {
            throw new RetrievalError('Service d\'embeddings non configuré', 500, 'embedding_service_not_configured', false);
        }
        try {
            // 1. Générer l'embedding de la requête
            const startEmbeddingTime = Date.now();
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            const embeddingTime = Date.now() - startEmbeddingTime;
            logger_1.logger.info('Embedding de la requête généré', {
                queryLength: query.length,
                embeddingTime: `${embeddingTime}ms`,
            });
            // 2. Construire la requête Supabase avec pgvector
            const limit = filters.limit || 5;
            let supabaseQuery = this.supabase
                .from('embeddings')
                .select('chunks(*), similarity')
                .order('vector <=> query_embedding', { ascending: false })
                .limit(limit);
            // 3. Appliquer les filtres
            supabaseQuery = this.applyFilters(supabaseQuery, filters);
            // 4. Exécuter la requête
            const { data, error, count } = await supabaseQuery;
            if (error) {
                logger_1.logger.error('Erreur de requête Supabase', {
                    error: error.message || 'Erreur Supabase',
                    queryLength: query.length,
                });
                throw new RetrievalError(`Erreur de recherche: ${error.message || 'Erreur Supabase'}`, error.status || 500, 'supabase_query_error', true);
            }
            // 5. Formater les résultats
            if (!data || !Array.isArray(data)) {
                return {
                    chunks: [],
                    averageSimilarity: 0,
                    searchTime: Date.now() - startTime,
                    totalChunksScanned: 0,
                };
            }
            const chunks = data.map((item, index) => {
                const chunkData = item.chunks;
                return {
                    id: chunkData.id || `${index}`,
                    content: chunkData.content,
                    metadata: {
                        documentPath: chunkData.document_path || chunkData.documentPath,
                        source: chunkData.source || 'unknown',
                        documentType: chunkData.document_type || chunkData.documentType || 'text',
                        client: chunkData.client,
                        language: chunkData.language,
                        chunkIndex: chunkData.chunk_index || chunkData.chunkIndex || index,
                        totalChunks: chunkData.total_chunks || chunkData.totalChunks,
                        createdAt: chunkData.created_at || chunkData.createdAt,
                        tokenCount: chunkData.token_count || chunkData.tokenCount,
                        similarity: item.similarity || 0,
                    },
                };
            });
            const searchTime = Date.now() - startTime;
            const averageSimilarity = chunks.reduce((sum, chunk) => {
                return sum + (chunk.metadata.similarity || 0);
            }, 0) / chunks.length;
            logger_1.logger.info('Recherche terminée avec succès', {
                queryLength: query.length,
                chunksFound: chunks.length,
                averageSimilarity,
                searchTime: `${searchTime}ms`,
            });
            return {
                chunks,
                averageSimilarity: Math.round(averageSimilarity * 100) / 100,
                searchTime,
                totalChunksScanned: count,
            };
        }
        catch (error) {
            const retrievalError = this.handleError(error);
            logger_1.logger.error('Échec de la récupération des chunks', {
                error: retrievalError.message,
                errorType: retrievalError.errorType,
                queryLength: query.length,
            });
            throw retrievalError;
        }
    }
    /**
     * Récupérer les chunks similaires à un embedding existant
     * @param embedding Embedding de référence
     * @param filters Filtres de recherche
     * @returns Résultat avec les chunks similaires
     */
    async retrieveSimilarChunks(embedding, filters = {}) {
        const startTime = Date.now();
        if (!embedding || embedding.length === 0) {
            throw new RetrievalError('Embedding vide fourni', 400, 'empty_embedding', false);
        }
        try {
            const limit = filters.limit || 5;
            let supabaseQuery = this.supabase
                .from('embeddings')
                .select('chunks(*), similarity')
                .order('vector <=> query_embedding', { ascending: false })
                .limit(limit);
            supabaseQuery = this.applyFilters(supabaseQuery, filters);
            const { data, error, count } = await supabaseQuery;
            if (error) {
                throw new RetrievalError(`Erreur de recherche: ${error.message || 'Erreur Supabase'}`, error.status || 500, 'supabase_query_error', true);
            }
            if (!data || !Array.isArray(data)) {
                return {
                    chunks: [],
                    averageSimilarity: 0,
                    searchTime: Date.now() - startTime,
                    totalChunksScanned: 0,
                };
            }
            const chunks = data.map((item, index) => {
                const chunkData = item.chunks;
                return {
                    id: chunkData.id || `${index}`,
                    content: chunkData.content,
                    metadata: {
                        documentPath: chunkData.document_path || chunkData.documentPath,
                        source: chunkData.source || 'unknown',
                        documentType: chunkData.document_type || chunkData.documentType || 'text',
                        client: chunkData.client,
                        language: chunkData.language,
                        chunkIndex: chunkData.chunk_index || chunkData.chunkIndex || index,
                        totalChunks: chunkData.total_chunks || chunkData.totalChunks,
                        createdAt: chunkData.created_at || chunkData.createdAt,
                        tokenCount: chunkData.token_count || chunkData.tokenCount,
                        similarity: item.similarity || 0,
                    },
                };
            });
            const searchTime = Date.now() - startTime;
            const averageSimilarity = chunks.reduce((sum, chunk) => {
                return sum + (chunk.metadata.similarity || 0);
            }, 0) / chunks.length;
            return {
                chunks,
                averageSimilarity: Math.round(averageSimilarity * 100) / 100,
                searchTime,
                totalChunksScanned: count,
            };
        }
        catch (error) {
            const retrievalError = this.handleError(error);
            throw retrievalError;
        }
    }
    /**
     * Appliquer les filtres à la requête Supabase
     * @param query Requête Supabase
     * @param filters Filtres à appliquer
     * @returns Requête Supabase avec filtres
     */
    applyFilters(query, filters) {
        // Filtre par client
        if (filters.client) {
            const clientValues = Array.isArray(filters.client)
                ? filters.client
                : [filters.client];
            query = query.in('chunks.metadata->>client', clientValues);
        }
        // Filtre par type de document
        if (filters.documentType) {
            const typeValues = Array.isArray(filters.documentType)
                ? filters.documentType
                : [filters.documentType];
            query = query.in('chunks.metadata->>documentType', typeValues);
        }
        // Filtre par langage
        if (filters.language) {
            const langValues = Array.isArray(filters.language)
                ? filters.language
                : [filters.language];
            query = query.in('chunks.metadata->>language', langValues);
        }
        // Filtre par rôle
        if (filters.role) {
            const roleValues = Array.isArray(filters.role)
                ? filters.role
                : [filters.role];
            query = query.in('chunks.metadata->>role', roleValues);
        }
        // Filtre par source
        if (filters.source) {
            const sourceValues = Array.isArray(filters.source)
                ? filters.source
                : [filters.source];
            query = query.in('chunks.metadata->>source', sourceValues);
        }
        return query;
    }
    /**
     * Gérer les erreurs
     * @param error Erreur
     * @returns RetrievalError formaté
     */
    handleError(error) {
        if (error instanceof RetrievalError) {
            return error;
        }
        const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
        const errorType = error?.code || error?.errorType || 'unknown_error';
        const errorStatus = error?.status || error?.statusCode;
        // Erreurs Supabase
        if (errorMessage.includes('connection') || errorMessage.includes('network')) {
            return new RetrievalError('Erreur de connexion à la base de données', 503, 'database_connection_error', true);
        }
        if (errorMessage.includes('timeout')) {
            return new RetrievalError('Requête timeout', 408, 'request_timeout', true);
        }
        // Erreurs 400-599
        const statusCode = errorStatus;
        if (statusCode >= 400 && statusCode < 500) {
            return new RetrievalError(errorMessage, statusCode, errorType, false);
        }
        if (statusCode >= 500) {
            return new RetrievalError(errorMessage, statusCode, errorType, true);
        }
        return new RetrievalError(errorMessage, undefined, errorType);
    }
    /**
     * Vérifier si le service est configuré
     */
    isConfigured() {
        return !!(process.env.SUPABASE_URL &&
            process.env.SUPABASE_ANON_KEY &&
            this.embeddingService.isConfigured());
    }
    /**
     * Vérifier la santé de la base de données
     */
    async checkDatabaseHealth() {
        try {
            const { error } = await this.supabase
                .from('embeddings')
                .select('count', { head: true, count: 'exact' });
            return !error;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Re-indexer une source spécifique
     * @param sourceId ID de la source à re-indexer
     * @param options Options de re-indexation (client, documentType)
     * @returns Nombre de documents traités
     */
    async reindexSource(sourceId, options = {}) {
        const startTime = Date.now();
        const errors = [];
        let documentsProcessed = 0;
        logger_1.logger.info(`Début de la re-indexation de la source: ${sourceId}`, {
            client: options.client,
            documentType: options.documentType,
            userId: options.userId,
        });
        try {
            // 1. Récupérer les documents de la source depuis Supabase Storage
            // TODO: Implémenter la connexion à Supabase Storage
            // Pour l'instant, simuler avec la table documents
            let query = this.supabase
                .from('documents')
                .select('id, path, name, metadata, created_at, updated_at')
                .eq('source', sourceId);
            // Filtrer par client si fourni
            if (options.client) {
                query = query.eq('metadata->>client', options.client);
            }
            // Filtrer par documentType si fourni
            if (options.documentType) {
                query = query.eq('metadata->>documentType', options.documentType);
            }
            const { data: documents, error: docError } = await query;
            if (docError) {
                throw new RetrievalError(`Échec de récupération des documents: ${docError.message}`, 500, 'document_retrieval_error', true);
            }
            if (!documents || documents.length === 0) {
                logger_1.logger.warn(`Aucun document trouvé pour la source: ${sourceId}`);
                return { documentsProcessed: 0, errors: [] };
            }
            // 2. Pour chaque document, extraire le texte, chunker, embedder, stocker
            for (const doc of documents) {
                try {
                    // TODO: Implémenter:
                    // 1. Récupérer le contenu du document depuis Storage
                    // 2. Extraire le texte (OCR si nécessaire)
                    // 3. Chunk le texte
                    // 4. Générer les embeddings
                    // 5. Stocker dans la table embeddings
                    // Simulation pour l'instant
                    logger_1.logger.info(`Traitement du document: ${doc.name}`, {
                        documentId: doc.id,
                        path: doc.path,
                    });
                    // Incrementer le compteur
                    documentsProcessed++;
                    // Simuler un petit délai
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                catch (docError) {
                    logger_1.logger.error(`Échec du traitement du document: ${doc.name}`, {
                        error: docError.message,
                        documentId: doc.id,
                    });
                    errors.push(`Document ${doc.name} (${doc.id}): ${docError.message}`);
                }
            }
            const processingTime = Date.now() - startTime;
            logger_1.logger.info(`Re-indexation terminée pour la source: ${sourceId}`, {
                documentsProcessed,
                errorsCount: errors.length,
                processingTime: `${processingTime}ms`,
            });
            return { documentsProcessed, errors };
        }
        catch (error) {
            logger_1.logger.error(`Échec global de la re-indexation pour source: ${sourceId}`, {
                error: error.message,
                stack: error.stack,
            });
            throw new RetrievalError(`Échec de la re-indexation: ${error.message}`, 500, 'reindex_failed', true);
        }
    }
}
exports.RetrievalService = RetrievalService;
// Instance singleton par défaut
exports.retrievalService = new RetrievalService();
/**
 * Fonction principale de retrieval (wrapper)
 * @param query Requête utilisateur
 * @param filters Filtres de recherche
 * @returns Résultat avec les chunks pertinents
 */
async function retrieveRelevantChunks(query, filters = {}) {
    return exports.retrievalService.retrieveRelevantChunks(query, filters);
}
/**
 * Fonction pour récupérer les chunks similaires (wrapper)
 * @param embedding Embedding de référence
 * @param filters Filtres de recherche
 * @returns Résultat avec les chunks similaires
 */
async function retrieveSimilarChunks(embedding, filters = {}) {
    return exports.retrievalService.retrieveSimilarChunks(embedding, filters);
}
/**
 * Re-indexer une source spécifique (wrapper)
 * @param sourceId ID de la source à re-indexer
 * @param options Options de re-indexation
 * @returns Résultat de la re-indexation
 */
async function reindexSource(sourceId, options = {}) {
    return exports.retrievalService.reindexSource(sourceId, options);
}
