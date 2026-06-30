"use strict";
/**
 * Service d'embeddings pour le pipeline RAG
 * Génère des vecteurs via l'API Mistral Embeddings
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.embeddingService = exports.EmbeddingService = exports.EmbeddingError = void 0;
exports.generateEmbedding = generateEmbedding;
exports.generateEmbeddings = generateEmbeddings;
exports.embedChunks = embedChunks;
const axios_1 = require("axios");
const logger_1 = require("../logger");
/**
 * Erreur spécifique aux embeddings
 */
class EmbeddingError extends Error {
    constructor(message, statusCode, errorType, retryable = false) {
        super(message);
        this.statusCode = statusCode;
        this.errorType = errorType;
        this.retryable = retryable;
        this.name = 'EmbeddingError';
    }
}
exports.EmbeddingError = EmbeddingError;
/**
 * Service principal d'embeddings
 */
class EmbeddingService {
    /**
     * Créer une nouvelle instance du EmbeddingService
     * @param config Configuration de l'API Mistral
     * @param cacheTTL Durée de vie du cache en millisecondes (défaut: 1 heure)
     */
    constructor(config = {}, cacheTTL = 3600000) {
        this.config = {
            apiKey: process.env.MISTRAL_API_KEY || config.apiKey || '',
            baseUrl: config.baseUrl || 'https://api.mistral.ai/v1',
            model: config.model || 'mistral-embed',
            timeout: config.timeout || 30000,
            maxRetries: config.maxRetries || 3,
        };
        if (!this.config.apiKey) {
            logger_1.logger.warn('MISTRAL_API_KEY non configuré. Les embeddings ne pourront pas être générés.');
        }
        this.cache = new Map();
        this.cacheTTL = cacheTTL;
        // Créer le client Axios
        this.client = axios_1.default.create({
            baseURL: this.config.baseUrl,
            timeout: this.config.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`,
            },
        });
        logger_1.logger.info('EmbeddingService initialisé', {
            model: this.config.model,
            cacheTTL: `${this.cacheTTL / 1000 / 60} minutes`,
        });
    }
    /**
     * Générer un embedding pour un texte
     * @param text Texte à transformer en embedding
     * @param options Options supplémentaires
     * @returns Résultat avec l'embedding
     */
    async generateEmbedding(text, options = { useCache: true }) {
        const startTime = Date.now();
        if (!text || text.trim().length === 0) {
            throw new EmbeddingError('Texte vide fourni', 400, 'empty_text', false);
        }
        // Vérifier le cache
        if (options.useCache) {
            const cached = this.getFromCache(text);
            if (cached) {
                logger_1.logger.info('Embedding récupéré depuis le cache', {
                    textLength: text.length,
                    processingTime: `${Date.now() - startTime}ms`,
                });
                return cached;
            }
        }
        try {
            const response = await this.callMistralApi(text);
            const embedding = this.formatResponse(response, text);
            // Mettre en cache
            if (options.useCache) {
                this.addToCache(text, embedding);
            }
            logger_1.logger.info('Embedding généré avec succès', {
                textLength: text.length,
                embeddingLength: embedding.embedding.length,
                processingTime: `${Date.now() - startTime}ms`,
            });
            return embedding;
        }
        catch (error) {
            const embeddingError = this.handleApiError(error);
            logger_1.logger.error('Échec de la génération d\'embedding', {
                error: embeddingError.message,
                errorType: embeddingError.errorType,
                textLength: text.length,
            });
            throw embeddingError;
        }
    }
    /**
     * Générer des embeddings pour plusieurs textes (batch)
     * @param texts Liste de textes à transformer
     * @param options Options supplémentaires
     * @returns Résultat batch avec tous les embeddings
     */
    async generateEmbeddings(texts, options = { useCache: true, batchSize: 10 }) {
        const startTime = Date.now();
        if (!texts || texts.length === 0) {
            throw new EmbeddingError('Liste de textes vide', 400, 'empty_list', false);
        }
        // Filtrer les textes vides
        const validTexts = texts.filter(t => t && t.trim().length > 0);
        if (validTexts.length === 0) {
            throw new EmbeddingError('Aucun texte valide dans la liste', 400, 'no_valid_texts', false);
        }
        const embeddings = [];
        let totalTokens = 0;
        const batchSize = options.batchSize ?? 10;
        // Traiter par batches pour éviter les timeouts
        for (let i = 0; i < validTexts.length; i += batchSize) {
            const batch = validTexts.slice(i, i + batchSize);
            // Vérifier le cache pour chaque texte du batch
            const batchFromCache = [];
            const textsToProcess = [];
            const cacheIndices = [];
            for (let j = 0; j < batch.length; j++) {
                const cached = options.useCache ? this.getFromCache(batch[j]) : null;
                if (cached) {
                    batchFromCache.push(cached);
                    cacheIndices.push(j + i);
                }
                else {
                    textsToProcess.push(batch[j]);
                }
            }
            // Ajouter les résultats du cache
            for (let k = 0; k < batchFromCache.length; k++) {
                embeddings[cacheIndices[k]] = batchFromCache[k];
                totalTokens += batchFromCache[k].tokenCount || 0;
            }
            // Traiter les textes non cacheés
            if (textsToProcess.length > 0) {
                try {
                    const response = await this.callMistralApiBatch(textsToProcess);
                    const batchResults = this.formatBatchResponse(response, textsToProcess);
                    for (let j = 0; j < batchResults.length; j++) {
                        const index = i + textsToProcess.indexOf(textsToProcess[j]);
                        embeddings[index] = batchResults[j];
                        totalTokens += batchResults[j].tokenCount || 0;
                        // Mettre en cache
                        if (options.useCache) {
                            this.addToCache(textsToProcess[j], batchResults[j]);
                        }
                    }
                }
                catch (error) {
                    const embeddingError = this.handleApiError(error);
                    logger_1.logger.error('Échec de la génération batch d\'embeddings', {
                        error: embeddingError.message,
                        batchIndex: i / batchSize,
                        batchSize: textsToProcess.length,
                    });
                    throw embeddingError;
                }
            }
        }
        const processingTime = Date.now() - startTime;
        logger_1.logger.info('Batch d\'embeddings généré avec succès', {
            totalTexts: validTexts.length,
            totalTokens,
            processingTime: `${processingTime}ms`,
            avgTimePerText: `${processingTime / validTexts.length}ms`,
        });
        return {
            embeddings,
            totalTokens,
            processingTime,
        };
    }
    /**
     * Générer des embeddings pour des chunks
     * @param chunks Liste de chunks à transformer
     * @param options Options supplémentaires
     * @returns Résultat batch avec les embeddings et les chunks associés
     */
    async embedChunks(chunks, options = { useCache: true, batchSize: 10 }) {
        const texts = chunks.map(c => c.content);
        const batchResult = await this.generateEmbeddings(texts, options);
        const chunksWithEmbeddings = chunks.map((chunk, index) => {
            const embedding = batchResult.embeddings[index];
            if (!embedding) {
                throw new EmbeddingError(`Aucun embedding généré pour le chunk ${chunk.metadata.chunkIndex}`, 500, 'missing_embedding');
            }
            return {
                ...chunk,
                embedding: embedding.embedding,
            };
        });
        return {
            chunks: chunksWithEmbeddings,
            totalTokens: batchResult.totalTokens,
        };
    }
    /**
     * Appeler l'API Mistral pour un texte
     * @param text Texte à transformer
     * @returns Réponse brute de l'API
     */
    async callMistralApi(text) {
        const payload = {
            model: this.config.model,
            texts: [text],
        };
        const response = await this.client.post('/embeddings', payload);
        return response.data;
    }
    /**
     * Appeler l'API Mistral pour plusieurs textes
     * @param texts Liste de textes
     * @returns Réponse brute de l'API
     */
    async callMistralApiBatch(texts) {
        const payload = {
            model: this.config.model,
            texts: texts,
        };
        const response = await this.client.post('/embeddings', payload);
        return response.data;
    }
    /**
     * Formater la réponse de l'API
     * @param response Réponse brute de l'API
     * @param text Texte original
     * @returns Résultat formaté
     */
    formatResponse(response, text) {
        if (!response.data || !response.data[0]) {
            throw new EmbeddingError('Réponse API invalide', 500, 'invalid_response');
        }
        const data = response.data[0];
        return {
            embedding: data.embedding,
            tokenCount: this.estimateTokenCount(text),
            createdAt: new Date().toISOString(),
        };
    }
    /**
     * Formater la réponse batch de l'API
     * @param response Réponse brute de l'API
     * @param texts Textes originaux
     * @returns Liste de résultats formatés
     */
    formatBatchResponse(response, texts) {
        if (!response.data || response.data.length !== texts.length) {
            throw new EmbeddingError('Réponse batch API invalide', 500, 'invalid_batch_response');
        }
        return response.data.map((item, index) => ({
            embedding: item.embedding,
            tokenCount: this.estimateTokenCount(texts[index]),
            createdAt: new Date().toISOString(),
        }));
    }
    /**
     * Estimation du nombre de tokens (même méthode que ST-102)
     */
    estimateTokenCount(text) {
        const cleanedText = text.replace(/\s+/g, ' ').trim();
        return Math.ceil(cleanedText.length / 4);
    }
    /**
     * Gérer les erreurs API
     * @param error Erreur Axios
     * @returns EmbeddingError formaté
     */
    handleApiError(error) {
        if (error instanceof axios_1.AxiosError) {
            const status = error.response?.status;
            const data = error.response?.data;
            switch (status) {
                case 400:
                    return new EmbeddingError(data.message || 'Requête invalide', status, data.type || 'bad_request', false);
                case 401:
                    return new EmbeddingError('Clé API invalide ou expirée', status, 'invalid_api_key', false);
                case 404:
                    return new EmbeddingError('Modèle non trouvé', status, 'model_not_found', false);
                case 429:
                    return new EmbeddingError('Trop de requêtes - Rate limit dépassé', status, 'rate_limit_exceeded', true // Réessayable
                    );
                case 500:
                case 502:
                case 503:
                case 504:
                    return new EmbeddingError('Erreur serveur - Réessayez plus tard', status, 'server_error', true // Réessayable
                    );
                default:
                    return new EmbeddingError(data.message || error.message || 'Erreur inconnue', status, data.type || 'unknown_error', status >= 500 // Réessayable pour les erreurs serveur
                    );
            }
        }
        return new EmbeddingError(error.message || 'Erreur inconnue', undefined, 'unknown_error');
    }
    /**
     * Ajouter un embedding au cache
     * @param text Texte original
     * @param result Résultat à cache
     */
    addToCache(text, result) {
        const key = this.generateCacheKey(text);
        this.cache.set(key, {
            ...result,
            cachedAt: Date.now(),
        });
        logger_1.logger.info('Embedding mis en cache', {
            cacheKey: key.substring(0, 20) + '...',
            cacheSize: this.cache.size,
        });
    }
    /**
     * Récupérer un embedding depuis le cache
     * @param text Texte original
     * @returns Résultat cache ou null
     */
    getFromCache(text) {
        const key = this.generateCacheKey(text);
        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }
        // Vérifier si le cache a expiré
        const age = Date.now() - (cached.cachedAt || Date.now());
        if (age > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        // Retourner une copie sans la date de cache
        const { cachedAt, ...result } = cached;
        return result;
    }
    /**
     * Générer une clé de cache
     * @param text Texte à hash
     * @returns Clé de cache
     */
    generateCacheKey(text) {
        // Simple hash pour la démonstration
        // En production, utiliser un vrai hash comme SHA-256
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convertir en 32 bits
        }
        return `embed-${hash}`;
    }
    /**
     * Vider le cache
     */
    clearCache() {
        this.cache.clear();
        logger_1.logger.info('Cache des embeddings vidé');
    }
    /**
     * Obtenir les statistiques du cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            ttl: this.cacheTTL,
        };
    }
    /**
     * Vérifier si l'API est configurée
     */
    isConfigured() {
        return !!(this.config.apiKey);
    }
}
exports.EmbeddingService = EmbeddingService;
// Instance singleton par défaut
exports.embeddingService = new EmbeddingService();
/**
 * Fonction principale de génération d'embedding (wrapper)
 * @param text Texte à transformer
 * @param options Options
 * @returns Résultat avec l'embedding
 */
async function generateEmbedding(text, options = { useCache: true }) {
    return exports.embeddingService.generateEmbedding(text, options);
}
/**
 * Fonction de génération batch d'embeddings (wrapper)
 * @param texts Liste de textes
 * @param options Options
 * @returns Résultat batch
 */
async function generateEmbeddings(texts, options = { useCache: true, batchSize: 10 }) {
    return exports.embeddingService.generateEmbeddings(texts, options);
}
/**
 * Fonction pour embedder des chunks (wrapper)
 * @param chunks Liste de chunks
 * @param options Options
 * @returns Chunks avec embeddings
 */
async function embedChunks(chunks, options = { useCache: true, batchSize: 10 }) {
    return exports.embeddingService.embedChunks(chunks, options);
}
