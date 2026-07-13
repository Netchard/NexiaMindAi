/**
 * Types pour le service de cache Redis
 */

import { EmbeddingResult } from '../rag/embeddings';

/**
 * Résultat d'une opération de cache
 */
export interface CacheResult {
  success: boolean;
  key: string;
  timestamp: Date;
  duration?: number; // en ms
}

/**
 * Statistiques du cache
 */
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  apiCalls: number;
  cacheSize: number;
  avgHitTime: number; // en ms
  avgMissTime: number; // en ms
}

/**
 * Clé de cache pour les embeddings
 */
export interface EmbeddingCacheKey {
  hash: string;
  fullKey: string;
  textPreview: string; // Préfixe du texte pour le debug
}

/**
 * Résultat stocké dans Redis
 */
export interface CachedEmbedding {
  embedding: number[];
  tokenCount: number;
  createdAt: string;
  cachedAt: number;
  textHash: string; // Hash SHA-256 du texte original
}

/**
 * Options de configuration du cache Redis pour EmbeddingService
 */
export interface EmbeddingCacheOptions {
  useRedis: boolean;
  useInMemory: boolean;
  ttlSeconds: number;
  redisPrefix: string;
}

/**
 * Résultat de génération de clé de cache
 */
export interface GenerateCacheKeyResult {
  key: string; // Clé complète avec préfixe
  hash: string; // Hash SHA-256 seul
  prefix: string; // Préfixe utilisé
}

/**
 * Événement de cache pour le monitoring
 */
export interface CacheEvent {
  type: 'hit' | 'miss' | 'set' | 'delete' | 'error';
  key: string;
  timestamp: Date;
  duration?: number; // en ms
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Callback pour les événements de cache
 */
export type CacheEventCallback = (event: CacheEvent) => void;

/**
 * Stratégie de cache
 */
export type CacheStrategy = 'redis-only' | 'in-memory-only' | 'hierarchical' | 'none';

/**
 * Options de génération d'embedding avec cache
 */
export interface EmbeddingOptionsWithCache {
  useCache?: boolean;
  cacheStrategy?: CacheStrategy;
  ttlOverride?: number; // TTL personnalisé en secondes
}
