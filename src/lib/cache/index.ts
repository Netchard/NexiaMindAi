/**
 * Exports pour le module de cache
 */

export { RedisCache, getRedisCache, resetRedisCache } from './redis';
export type { RedisConfig, SetOptions } from './redis';

export { RedisEmbeddingCache, getEmbeddingCache, resetEmbeddingCache } from './embeddingCache';
export { generateEmbeddingCacheKey, getFullCacheKey } from './embeddingCache';
export type { CachedEmbeddingResult, EmbeddingCacheStats } from './embeddingCache';

export type {
  CacheResult,
  CacheStats,
  EmbeddingCacheKey,
  CachedEmbedding,
  EmbeddingCacheOptions,
  GenerateCacheKeyResult,
  CacheEvent,
  CacheEventCallback,
  CacheStrategy,
  EmbeddingOptionsWithCache,
} from './types';
