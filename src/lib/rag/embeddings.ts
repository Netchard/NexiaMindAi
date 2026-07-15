/**
 * Service d'embeddings pour le pipeline RAG
 * Génère des vecteurs via l'API Mistral Embeddings
 * Utilise un cache hiérarchique : Redis -> In-Memory Map
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { Chunk } from './types';
import {
  RedisEmbeddingCache,
  getEmbeddingCache,
  generateEmbeddingCacheKey,
} from '../cache/embeddingCache';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack

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
  private redisEmbeddingCache: RedisEmbeddingCache;
  private useCache: boolean;
  
  // Métriques de cache
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private apiCalls: number = 0;
  
  // Cache in-memory comme fallback (optionnel)
  private inMemoryCache: Map<string, EmbeddingResult> | null = null;
  private inMemoryTTL: number; // en millisecondes

  /**
   * Créer une nouvelle instance du EmbeddingService
   * @param config Configuration de l'API Mistral
   * @param options Options supplémentaires
   *   - cacheTTL: TTL du fallback in-memory LOCAL à cette instance uniquement (en ms).
   *     N'affecte PAS le TTL du cache Redis partagé (singleton applicatif, fixé à 3600s) —
   *     voir `getEmbeddingCache()`. Décision de revue ST-403 : cache Redis global assumé.
   *   - useCache: valeur par défaut utilisée quand un appel à `generateEmbedding`/`generateEmbeddings`
   *     ne précise pas explicitement `useCache` ; un `useCache` passé explicitement à un appel
   *     individuel prend toujours le dessus sur ce réglage d'instance.
   *
   * Note: le second paramètre était auparavant un `cacheTTL: number` positionnel ; il est devenu
   * un objet d'options lors de l'intégration du cache Redis (ST-403). Aucun appelant du repo
   * n'utilisait l'ancienne forme positionnelle au moment du changement (dérogation assumée à la
   * contrainte "NE PAS modifier l'API publique").
   */
  constructor(
    config: Partial<MistralConfig> = {},
    options: {
      cacheTTL?: number;
      useCache?: boolean;
      useInMemoryFallback?: boolean;
    } = {}
  ) {
    this.config = {
      apiKey: process.env.MISTRAL_API_KEY || config.apiKey || '',
      baseUrl: config.baseUrl || process.env.MISTRAL_API_BASE_URL || 'https://api.mistral.ai/v1/',
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

    this.useCache = options.useCache ?? true;
    this.inMemoryTTL = options.cacheTTL ?? 3600000; // 1 heure par défaut
    this.redisEmbeddingCache = getEmbeddingCache();
    
    // Activer le cache in-memory comme fallback si souhaité
    if (options.useInMemoryFallback ?? true) {
      this.inMemoryCache = new Map();
    }

    // Initialiser le cache Redis (ne bloque pas si Redis n'est pas disponible)
    this.redisEmbeddingCache.initialize().catch((error) => {
      console.warn('EmbeddingService: Redis non disponible, utilisation du cache in-memory seulement', {
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // Créer le client Axios
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });

    console.info('EmbeddingService initialisé', {
      model: this.config.model,
      baseUrl: this.config.baseUrl,
      apiKeyDefined: !!this.config.apiKey,
      apiKeyLength: this.config.apiKey.length,
      cacheTTL: `${this.inMemoryTTL / 1000 / 60} minutes`,
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
    options: { useCache?: boolean } = {}
  ): Promise<EmbeddingResult> {
    const startTime = Date.now();
    // Un useCache explicite par appel prend le dessus sur le réglage d'instance.
    const useCache = options.useCache ?? this.useCache;

    if (!text || text.trim().length === 0) {
      throw new EmbeddingError('Texte vide fourni', 400, 'empty_text', false);
    }

    // Vérifier le cache (async maintenant)
    if (useCache) {
      const cached = await this.getFromCache(text);
      if (cached) {
        console.info('Embedding récupéré depuis le cache', {
          textLength: text.length,
          processingTime: `${Date.now() - startTime}ms`,
          cacheHits: this.cacheHits,
        });
        return cached;
      }
    }

    try {
      const response = await this.callMistralApi(text);
      const embedding = this.formatResponse(response, text);

      // Incrémenter le compteur d'appels API uniquement après un appel réussi
      this.apiCalls++;

      // Mettre en cache (async maintenant)
      if (useCache) {
        await this.addToCache(text, embedding);
      }

      console.info('Embedding généré avec succès', {
        textLength: text.length,
        embeddingLength: embedding.embedding.length,
        processingTime: `${Date.now() - startTime}ms`,
        apiCalls: this.apiCalls,
      });

      return embedding;
    } catch (error: unknown) {
      const embeddingError = this.handleApiError(error);
      console.error(`Échec de la génération d\'embedding ${embeddingError.message}`, {
        error: embeddingError.message,
        errorType: embeddingError.errorType,
        textLength: text.length,
        apiCalls: this.apiCalls,
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
    options: { useCache?: boolean; batchSize?: number } = {}
  ): Promise<BatchEmbeddingResult> {
    const startTime = Date.now();
    // Un useCache explicite par appel prend le dessus sur le réglage d'instance.
    const useCache = options.useCache ?? this.useCache;

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
      
      // Vérifier le cache pour chaque texte du batch (async)
      const batchFromCache: EmbeddingResult[] = [];
      const textsToProcess: string[] = [];
      const cacheIndices: number[] = [];

      // Exécuter toutes les vérifications de cache en parallèle
      const cachePromises = batch.map(async (text) => {
        return useCache ? await this.getFromCache(text) : null;
      });
      
      const cachedResults = await Promise.all(cachePromises);
      
      for (let j = 0; j < batch.length; j++) {
        const cached = cachedResults[j];
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
          }
          
          // Mettre en cache tous les nouveaux résultats en parallèle
          if (useCache) {
            await Promise.all(
              batchResults.map((result, j) => {
                return this.addToCache(textsToProcess[j], result);
              })
            );
          }
          
          // Incrémenter le compteur d'appels API (1 appel par batch)
          this.apiCalls++;
        } catch (error: unknown) {
          const embeddingError = this.handleApiError(error);
          console.error(`Échec de la génération batch d\'embeddings ${embeddingError.message}`, {
            error: embeddingError.message,
            batchIndex: i / batchSize,
            batchSize: textsToProcess.length,
          });
          throw embeddingError;
        }
      }
    }

    const processingTime = Date.now() - startTime;

    console.info('Batch d\'embeddings généré avec succès', {
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
      input: [text],
    };

    try {
      console.info(`Appel API Mistral Embeddings`);
      
      const response = await this.client.post('/embeddings', payload);
      console.info('Appel API Mistral réussi', {
        textLength: text.length,
        status: response.status,
      });
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorResponse = typeof error === 'object' && error !== null && 'response' in error
        ? (error as { response?: { status?: number; statusText?: string; data?: unknown } }).response
        : undefined;
      const errorDetails = errorResponse ? {
        status: errorResponse.status,
        statusText: errorResponse.statusText,
        data: errorResponse.data,
      } : {};

      console.error('Échec de l\'appel API Mistral Embeddings', {
        textLength: text.length,
        error: errorMessage,
        ...errorDetails,
        config: {
          baseUrl: this.config.baseUrl,
          model: this.config.model,
          apiKeyDefined: !!this.config.apiKey,
          apiKeyLength: this.config.apiKey.length,
        },
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
      console.info(`Appel API Mistral Embeddings (batch)`);
      const response = await this.client.post('/embeddings', payload);
      console.info('Appel API Mistral batch réussi', {
        batchSize: texts.length,
        status: response.status,
      });
      return response.data;
    } catch (error) {
      console.error('Échec de l\'appel API Mistral batch', {
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
   * Stocke dans Redis ET in-memory (fallback)
   * @param text Texte original
   * @param result Résultat à cache
   */
  private async addToCache(text: string, result: EmbeddingResult): Promise<void> {
    // Peupler systématiquement le fallback in-memory local, indépendamment du résultat
    // Redis : RedisEmbeddingCache avale déjà ses propres erreurs en interne et ne relance
    // jamais, donc un fallback conditionné à une exception ici ne se déclenchait jamais.
    const key = this.generateCacheKey(text);
    if (this.inMemoryCache) {
      this.inMemoryCache.set(key, {
        ...result,
        cachedAt: Date.now(),
      });
    }

    try {
      await this.redisEmbeddingCache.setEmbedding(text, result);

      console.info('Embedding mis en cache (Redis)', {
        cacheKey: key.substring(0, 20) + '...',
      });
    } catch (redisError) {
      console.warn('EmbeddingService: Échec de l\'écriture dans Redis, fallback in-memory déjà à jour', {
        error: redisError instanceof Error ? redisError.message : String(redisError),
        cacheKey: key.substring(0, 20) + '...',
      });
    }
  }

  /**
   * Récupérer un embedding depuis le cache
   * Implémente la stratégie hiérarchique : Redis -> In-Memory -> null
   * @param text Texte original
   * @returns Résultat cache ou null
   */
  private async getFromCache(text: string): Promise<EmbeddingResult | null> {
    const startTime = Date.now();
    const key = this.generateCacheKey(text);

    // Essayer Redis d'abord. Les erreurs sont interceptées ici (et uniquement ici) pour
    // ne jamais empêcher la vérification du fallback in-memory qui suit.
    try {
      const result = await this.redisEmbeddingCache.getEmbedding(text);

      if (result) {
        this.cacheHits++;
        console.info('Embedding récupéré depuis le cache (Redis)', {
          cacheKey: key.substring(0, 20) + '...',
          duration: `${Date.now() - startTime}ms`,
          cacheHits: this.cacheHits,
        });
        return result;
      }
    } catch (error) {
      console.error('EmbeddingService: Erreur lors de la lecture Redis, fallback vers in-memory', {
        error: error instanceof Error ? error.message : String(error),
        cacheKey: key.substring(0, 20) + '...',
      });
      // Ne pas retourner ici : on continue vers le fallback in-memory ci-dessous.
    }

    // Essayer in-memory si Redis n'a rien trouvé (ou a échoué)
    if (this.inMemoryCache) {
      const cached = this.inMemoryCache.get(key);

      if (cached) {
        // Vérifier si le cache a expiré
        const age = Date.now() - (cached.cachedAt || Date.now());
        if (age <= this.inMemoryTTL) {
          this.cacheHits++;
          console.info('Embedding récupéré depuis le cache (In-Memory)', {
            cacheKey: key.substring(0, 20) + '...',
            duration: `${Date.now() - startTime}ms`,
            cacheHits: this.cacheHits,
          });

          // Retourner une copie sans la date de cache
          const { cachedAt, ...result } = cached;
          return result;
        } else {
          // Cache expiré, supprimer
          this.inMemoryCache.delete(key);
        }
      }
    }

    // Rien trouvé dans le cache
    this.cacheMisses++;
    console.info('Cache miss pour embedding', {
      cacheKey: key.substring(0, 20) + '...',
      cacheMisses: this.cacheMisses,
    });

    return null;
  }

  /**
   * Générer une clé de cache avec SHA-256
   * @param text Texte à hash
   * @returns Clé de cache (hash SHA-256)
   */
  private generateCacheKey(text: string): string {
    return generateEmbeddingCacheKey(text);
  }

  /**
   * Vider le cache
   */
  async clearCache(): Promise<void> {
    await this.redisEmbeddingCache.clear();
    if (this.inMemoryCache) {
      this.inMemoryCache.clear();
    }
    
    // Réinitialiser les métriques
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.apiCalls = 0;
    
    console.info('Cache des embeddings vidé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): {
    size: number;
    ttl: number;
    hits: number;
    misses: number;
    hitRate: number;
    apiCalls: number;
  } {
    // `size` reflète uniquement le fallback in-memory local : RedisEmbeddingCache
    // n'expose pas de méthode pour dénombrer les clés Redis, donc cette instance ne
    // peut pas compter le nombre réel d'entrées côté Redis.
    const size = this.inMemoryCache ? this.inMemoryCache.size : 0;
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;

    return {
      size,
      ttl: this.inMemoryTTL,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate,
      apiCalls: this.apiCalls,
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
