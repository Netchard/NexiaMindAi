/**
 * Service d'embeddings pour le pipeline RAG
 * Génère des vecteurs via l'API Mistral Embeddings
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { logger } from '../logger';
import { Chunk } from './types';

/**
 * Configuration de l'API Mistral
 */
export interface MistralConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Résultat d'une génération d'embedding
 */
export interface EmbeddingResult {
  /** Vecteur d'embedding (1536 dimensions pour mistral-embed) */
  embedding: number[];
  /** ID de l'embedding */
  id?: string;
  /** Nombre de tokens utilisés */
  tokenCount?: number;
  /** Horodatage de création */
  createdAt: string;
  /** Horodatage du cache */
  cachedAt?: number;
}

/**
 * Résultat d'une génération batch d'embeddings
 */
export interface BatchEmbeddingResult {
  /** Liste des embeddings générés */
  embeddings: EmbeddingResult[];
  /** Nombre total de tokens utilisés */
  totalTokens: number;
  /** Durée du traitement en ms */
  processingTime?: number;
}

/**
 * Erreur spécifique aux embeddings
 */
export class EmbeddingError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

/**
 * Type d'erreur API Mistral
 */
export interface MistralApiError {
  object: string;
  message: string;
  type: string;
  param?: string;
  code?: number;
}

/**
 * Service principal d'embeddings
 */
export class EmbeddingService {
  private client: AxiosInstance;
  private config: MistralConfig;
  private cache: Map<string, EmbeddingResult>;
  private cacheTTL: number; // en millisecondes

  /**
   * Créer une nouvelle instance du EmbeddingService
   * @param config Configuration de l'API Mistral
   * @param cacheTTL Durée de vie du cache en millisecondes (défaut: 1 heure)
   */
  constructor(config: Partial<MistralConfig> = {}, cacheTTL: number = 3600000) {
    this.config = {
      apiKey: process.env.MISTRAL_API_KEY || config.apiKey || '',
      baseUrl: config.baseUrl || 'https://api.mistral.ai/v1/',
      model: config.model || 'mistral-embed',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    };

    if (!this.config.apiKey) {
      throw new EmbeddingError(
        'MISTRAL_API_KEY non configuré. Impossible de générer des embeddings.',
        500,
        'api_not_configured',
        false
      );
    }

    this.cache = new Map();
    this.cacheTTL = cacheTTL;

    // Créer le client Axios
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    logger.info('EmbeddingService initialisé', {
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
  async generateEmbedding(
    text: string,
    options: { useCache?: boolean } = { useCache: true }
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();

    if (!text || text.trim().length === 0) {
      throw new EmbeddingError('Texte vide fourni', 400, 'empty_text', false);
    }

    // Vérifier le cache
    if (options.useCache) {
      const cached = this.getFromCache(text);
      if (cached) {
        logger.info('Embedding récupéré depuis le cache', {
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

      logger.info('Embedding généré avec succès', {
        textLength: text.length,
        embeddingLength: embedding.embedding.length,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return embedding;
    } catch (error: unknown) {
      const embeddingError = this.handleApiError(error);
      logger.error(`Échec de la génération d\'embedding ${embeddingError.message}`, {
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
  async generateEmbeddings(
    texts: string[],
    options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();

    if (!texts || texts.length === 0) {
      throw new EmbeddingError('Liste de textes vide', 400, 'empty_list', false);
    }

    // Filtrer les textes vides
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    if (validTexts.length === 0) {
      throw new EmbeddingError('Aucun texte valide dans la liste', 400, 'no_valid_texts', false);
    }

    const embeddings: EmbeddingResult[] = [];
    let totalTokens = 0;
    const batchSize = options.batchSize ?? 10;

    // Traiter par batches pour éviter les timeouts
    for (let i = 0; i < validTexts.length; i += batchSize) {
      const batch = validTexts.slice(i, i + batchSize);
      
      // Vérifier le cache pour chaque texte du batch
      const batchFromCache: EmbeddingResult[] = [];
      const textsToProcess: string[] = [];
      const cacheIndices: number[] = [];

      for (let j = 0; j < batch.length; j++) {
        const cached = options.useCache ? this.getFromCache(batch[j]) : null;
        if (cached) {
          batchFromCache.push(cached);
          cacheIndices.push(j + i);
        } else {
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
        } catch (error: unknown) {
          const embeddingError = this.handleApiError(error);
          logger.error(`Échec de la génération batch d\'embeddings ${embeddingError.message}`, {
            error: embeddingError.message,
            batchIndex: i / batchSize,
            batchSize: textsToProcess.length,
          });
          throw embeddingError;
        }
      }
    }

    const processingTime = Date.now() - startTime;

    logger.info('Batch d\'embeddings généré avec succès', {
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
  async embedChunks(
    chunks: Chunk[],
    options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
  ): Promise<{ chunks: (Chunk & { embedding: number[] })[]; totalTokens: number }> {
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
  private async callMistralApi(text: string): Promise<unknown> {
    const payload = {
      model: this.config.model,
      texts: [text],
    };

    try {
      logger.info('Appel 1 API Mistral');
      const response = await this.client.post('/embeddings', payload);
      logger.info('Appel API Mistral réussi', {
        textLength: text.length,
        status: response.status,
      });
      return response.data;
    } catch (error) {
      logger.error('Échec de l\'appel API Mistral', {
        textLength: text.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Appeler l'API Mistral pour plusieurs textes
   * @param texts Liste de textes
   * @returns Réponse brute de l'API
   */
  private async callMistralApiBatch(texts: string[]): Promise<unknown> {
    const payload = {
      model: this.config.model,
      input: texts,
    };

    try {
      logger.info(`Appel 2 API Mistral ${this.client.name}`);
      const response = await this.client.post('/embeddings', payload);
      logger.info('Appel API Mistral batch réussi', {
        batchSize: texts.length,
        status: response.status,
      });
      return response.data;
    } catch (error) {
      logger.error('Échec de l\'appel API Mistral batch', {
        batchSize: texts.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Formater la réponse de l'API
   * @param response Réponse brute de l'API
   * @param text Texte original
   * @returns Résultat formaté
   */
  private formatResponse(response: unknown, text: string): EmbeddingResult {
    // Vérification de type et accès sécurisé
    if (typeof response !== 'object' || response === null) {
      throw new EmbeddingError('Réponse API invalide - format inattendu', 500, 'invalid_response_format');
    }

    const apiResponse = response as { data?: Array<{ embedding: number[] }> };
    
    if (!apiResponse.data || !apiResponse.data[0]) {
      throw new EmbeddingError('Réponse API invalide', 500, 'invalid_response');
    }

    const data = apiResponse.data[0];

    // Vérification que l'embedding est un tableau de nombres
    if (!Array.isArray(data.embedding) || !data.embedding.every(item => typeof item === 'number')) {
      throw new EmbeddingError('Format d\'embedding invalide', 500, 'invalid_embedding_format');
    }

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
  private formatBatchResponse(response: unknown, texts: string[]): EmbeddingResult[] {
    // Vérification de type et accès sécurisé
    if (typeof response !== 'object' || response === null) {
      throw new EmbeddingError('Réponse batch API invalide - format inattendu', 500, 'invalid_batch_response_format');
    }

    const apiResponse = response as { data?: Array<{ embedding: number[] }> };
    
    if (!apiResponse.data || apiResponse.data.length !== texts.length) {
      throw new EmbeddingError('Réponse batch API invalide', 500, 'invalid_batch_response');
    }

    return apiResponse.data.map((item, index) => {
      // Vérification que chaque item a un embedding valide
      if (!item || !Array.isArray(item.embedding)) {
        throw new EmbeddingError(`Embedding invalide à l'index ${index}`, 500, 'invalid_embedding_item');
      }

      return {
        embedding: item.embedding,
        tokenCount: this.estimateTokenCount(texts[index]),
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Estimation du nombre de tokens (même méthode que ST-102)
   */
  private estimateTokenCount(text: string): number {
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    return Math.ceil(cleanedText.length / 4);
  }

  /**
   * Gérer les erreurs API
   * @param error Erreur Axios
   * @returns EmbeddingError formaté
   */
  private handleApiError(error: unknown): EmbeddingError {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data = error.response?.data as MistralApiError;

      switch (status) {
        case 400:
          return new EmbeddingError(
            data.message || 'Requête invalide',
            status,
            data.type || 'bad_request',
            false
          );
        case 401:
          return new EmbeddingError(
            'Clé API invalide ou expirée',
            status,
            'invalid_api_key',
            false
          );
        case 404:
          return new EmbeddingError(
            'Modèle non trouvé',
            status,
            'model_not_found',
            false
          );
        case 429:
          return new EmbeddingError(
            'Trop de requêtes - Rate limit dépassé',
            status,
            'rate_limit_exceeded',
            true // Réessayable
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new EmbeddingError(
            'Erreur serveur - Réessayez plus tard',
            status,
            'server_error',
            true // Réessayable
          );
        default:
          return new EmbeddingError(
            data.message || (error instanceof Error ? error.message : 'Erreur inconnue'),
            status || 500,
            data.type || 'unknown_error',
            (status || 500) >= 500 // Réessayable pour les erreurs serveur
          );
      }
    }

    // Gestion des erreurs non-Axios
    let errorMessage = 'Erreur inconnue';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = String(error);
      }
    }

    return new EmbeddingError(
      errorMessage,
      undefined,
      'unknown_error'
    );
  }

  /**
   * Ajouter un embedding au cache
   * @param text Texte original
   * @param result Résultat à cache
   */
  private addToCache(text: string, result: EmbeddingResult): void {
    const key = this.generateCacheKey(text);
    this.cache.set(key, {
      ...result,
      cachedAt: Date.now(),
    });

    logger.info('Embedding mis en cache', {
      cacheKey: key.substring(0, 20) + '...',
      cacheSize: this.cache.size,
    });
  }

  /**
   * Récupérer un embedding depuis le cache
   * @param text Texte original
   * @returns Résultat cache ou null
   */
  private getFromCache(text: string): EmbeddingResult | null {
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
  private generateCacheKey(text: string): string {
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
  clearCache(): void {
    this.cache.clear();
    logger.info('Cache des embeddings vidé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTTL,
    };
  }

  /**
   * Vérifier si l'API est configurée
   */
  isConfigured(): boolean {
    return !!(this.config.apiKey);
  }
}

// Instance singleton par défaut (initialisation paresseuse)
let embeddingServiceInstance: EmbeddingService | null = null;

function getEmbeddingService(): EmbeddingService {
  if (!embeddingServiceInstance) {
    embeddingServiceInstance = new EmbeddingService();
  }
  return embeddingServiceInstance;
}

/**
 * Fonction principale de génération d'embedding (wrapper)
 * @param text Texte à transformer
 * @param options Options
 * @returns Résultat avec l'embedding
 */
export async function generateEmbedding(
  text: string,
  options: { useCache?: boolean } = { useCache: true }
): Promise<EmbeddingResult> {
  return getEmbeddingService().generateEmbedding(text, options);
}

/**
 * Fonction de génération batch d'embeddings (wrapper)
 * @param texts Liste de textes
 * @param options Options
 * @returns Résultat batch
 */
export async function generateEmbeddings(
  texts: string[],
  options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
): Promise<BatchEmbeddingResult> {
  return getEmbeddingService().generateEmbeddings(texts, options);
}

// Exporter l'instance pour la compatibilité (désapprouvé - utiliser les fonctions wrappers)
export const embeddingService = getEmbeddingService();

/**
 * Fonction pour embedder des chunks (wrapper)
 * @param chunks Liste de chunks
 * @param options Options
 * @returns Chunks avec embeddings
 */
export async function embedChunks(
  chunks: Chunk[],
  options: { useCache?: boolean; batchSize?: number } = { useCache: true, batchSize: 10 }
): Promise<{ chunks: (Chunk & { embedding: number[] })[]; totalTokens: number }> {
  return embeddingService.embedChunks(chunks, options);
}
