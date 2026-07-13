/**
 * Cache des embeddings avec Redis
 * Implémente une couche d'abstraction pour le cache des embeddings
 * Phase GREEN: Intégration avec EmbeddingService
 */

import { createHash } from 'crypto';
import { RedisCache, getRedisCache, resetRedisCache } from './redis';
import { EmbeddingResult } from '../rag/embeddings';

/**
 * Génère une clé de cache SHA-256 pour un texte
 * @param text Texte à hash
 * @returns Clé de cache hexadécimale
 */
export function generateEmbeddingCacheKey(text: string): string {
  const hash = createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
}

/**
 * Clé de cache complète avec préfixe
 */
export function getFullCacheKey(text: string): string {
  return `embedding:${generateEmbeddingCacheKey(text)}`;
}

/**
 * Résultat du cache avec métadonnées
 */
export interface CachedEmbeddingResult extends EmbeddingResult {
  cachedAt: number;
  cacheKey: string;
}

/**
 * Statistiques du cache des embeddings
 */
export interface EmbeddingCacheStats {
  hits: number;
  misses: number;
  apiCalls: number;
  hitRate: number;
  avgHitTime: number;
  avgMissTime: number;
}

/**
 * Cache des embeddings utilisant Redis
 * Implémente un cache hiérarchique : Redis -> In-Memory Map
 */
export class RedisEmbeddingCache {
  private redisCache: RedisCache;
  private inMemoryCache: Map<string, EmbeddingResult>;
  private inMemoryTTL: number; // en millisecondes
  private useRedis: boolean;
  private useInMemory: boolean;
  
  // Métriques
  private hits: number = 0;
  private misses: number = 0;
  private apiCalls: number = 0;
  private hitTimes: number[] = [];
  private missTimes: number[] = [];
  
  // Constantes
  private static readonly DEFAULT_TTL_SECONDS = 3600; // 1 heure
  private static readonly TTL_MS = RedisEmbeddingCache.DEFAULT_TTL_SECONDS * 1000;
  
  /**
   * Créer une nouvelle instance RedisEmbeddingCache
   * @param options Options de configuration
   */
  constructor(options: {
    useRedis?: boolean;
    useInMemory?: boolean;
    ttlSeconds?: number;
  } = {}) {
    this.useRedis = options.useRedis ?? true;
    this.useInMemory = options.useInMemory ?? true;
    this.inMemoryTTL = (options.ttlSeconds ?? RedisEmbeddingCache.DEFAULT_TTL_SECONDS) * 1000;
    
    this.redisCache = getRedisCache();
    this.inMemoryCache = new Map();
    
    console.info('RedisEmbeddingCache: Initialisé', {
      useRedis: this.useRedis,
      useInMemory: this.useInMemory,
      ttlSeconds: this.inMemoryTTL / 1000,
    });
  }

  /**
   * Initialiser la connexion Redis
   */
  async initialize(): Promise<void> {
    if (this.useRedis) {
      try {
        await this.redisCache.connect();
        console.info('RedisEmbeddingCache: Connexion Redis établie');
      } catch (error) {
        console.warn('RedisEmbeddingCache: Échec de la connexion Redis. Utilisation du cache in-memory seulement.', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.useRedis = false;
      }
    }
  }

  /**
   * Obtenir un embedding depuis le cache
   * Implémente la stratégie hiérarchique : Redis -> In-Memory -> null
   * @param text Texte à rechercher
   * @returns Résultat du cache ou null
   */
  async getEmbedding(text: string): Promise<EmbeddingResult | null> {
    const startTime = Date.now();
    const cacheKey = generateEmbeddingCacheKey(text);
    const fullKey = getFullCacheKey(text);
    
    try {
      // Stratégie 1: Essayer Redis d'abord
      if (this.useRedis && this.redisCache.isReady()) {
        try {
          const cached = await this.redisCache.get(fullKey);
          if (cached) {
            const result: EmbeddingResult = JSON.parse(cached);
            this.hits++;
            this.hitTimes.push(Date.now() - startTime);
            
            console.info('RedisEmbeddingCache: Cache hit (Redis)', {
              textPreview: text.substring(0, 50) + '...',
              duration: `${Date.now() - startTime}ms`,
            });
            
            return result;
          }
        } catch (redisError) {
          // Si Redis échoue, continuer avec in-memory
          console.warn('RedisEmbeddingCache: Erreur Redis, fallback vers in-memory', {
            error: redisError instanceof Error ? redisError.message : String(redisError),
          });
        }
      }
      
      // Stratégie 2: Essayer In-Memory
      if (this.useInMemory) {
        const cached = this.inMemoryCache.get(cacheKey);
        if (cached) {
          // Vérifier le TTL
          const age = Date.now() - (cached.cachedAt || Date.now());
          if (age <= this.inMemoryTTL) {
            this.hits++;
            this.hitTimes.push(Date.now() - startTime);
            
            console.info('RedisEmbeddingCache: Cache hit (In-Memory)', {
              textPreview: text.substring(0, 50) + '...',
              duration: `${Date.now() - startTime}ms`,
            });
            
            // Retourner sans cachedAt
            const { cachedAt, ...result } = cached;
            return result;
          } else {
            // Cache expiré, supprimer
            this.inMemoryCache.delete(cacheKey);
          }
        }
      }
      
      // Stratégie 3: Rien trouvé
      this.misses++;
      this.missTimes.push(Date.now() - startTime);
      
      console.info('RedisEmbeddingCache: Cache miss', {
        textPreview: text.substring(0, 50) + '...',
        duration: `${Date.now() - startTime}ms`,
      });
      
      return null;
    } catch (error) {
      console.error('RedisEmbeddingCache: Erreur lors de la récupération depuis le cache', {
        error: error instanceof Error ? error.message : String(error),
        textPreview: text.substring(0, 50) + '...',
      });
      return null;
    }
  }

  /**
   * Ajouter un embedding au cache
   * Stocke dans Redis ET in-memory
   * @param text Texte original
   * @param result Résultat à cache
   */
  async setEmbedding(text: string, result: EmbeddingResult): Promise<void> {
    const cacheKey = generateEmbeddingCacheKey(text);
    const fullKey = getFullCacheKey(text);
    const value = JSON.stringify(result);
    
    // Stocker dans in-memory
    if (this.useInMemory) {
      this.inMemoryCache.set(cacheKey, {
        ...result,
        cachedAt: Date.now(),
      });
      
      console.info('RedisEmbeddingCache: Embedding stocké en in-memory', {
        cacheKey: cacheKey.substring(0, 20) + '...',
        cacheSize: this.inMemoryCache.size,
      });
    }
    
    // Stocker dans Redis
    if (this.useRedis && this.redisCache.isReady()) {
      try {
        await this.redisCache.set(fullKey, value, {
          ttl: RedisEmbeddingCache.DEFAULT_TTL_SECONDS,
        });
        
        console.info('RedisEmbeddingCache: Embedding stocké dans Redis', {
          cacheKey: fullKey.substring(0, 30) + '...',
        });
      } catch (redisError) {
        console.warn('RedisEmbeddingCache: Échec de l\'écriture dans Redis', {
          error: redisError instanceof Error ? redisError.message : String(redisError),
        });
      }
    }
  }

  /**
   * Supprimer un embedding du cache
   * @param text Texte à supprimer
   */
  async deleteEmbedding(text: string): Promise<void> {
    const cacheKey = generateEmbeddingCacheKey(text);
    const fullKey = getFullCacheKey(text);
    
    // Supprimer de in-memory
    if (this.useInMemory) {
      this.inMemoryCache.delete(cacheKey);
    }
    
    // Supprimer de Redis
    if (this.useRedis && this.redisCache.isReady()) {
      try {
        await this.redisCache.del(fullKey);
      } catch (redisError) {
        console.warn('RedisEmbeddingCache: Échec de la suppression de Redis', {
          error: redisError instanceof Error ? redisError.message : String(redisError),
        });
      }
    }
  }

  /**
   * Vérifier si un embedding est dans le cache
   * @param text Texte à vérifier
   * @returns true si dans le cache
   */
  async hasEmbedding(text: string): Promise<boolean> {
    const cacheKey = generateEmbeddingCacheKey(text);
    const fullKey = getFullCacheKey(text);
    
    // Vérifier Redis
    if (this.useRedis && this.redisCache.isReady()) {
      try {
        const exists = await this.redisCache.exists(fullKey);
        if (exists) return true;
      } catch {
        // Si Redis échoue, vérifier in-memory
      }
    }
    
    // Vérifier in-memory
    if (this.useInMemory) {
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached) {
        const age = Date.now() - (cached.cachedAt || Date.now());
        return age <= this.inMemoryTTL;
      }
    }
    
    return false;
  }

  /**
   * Vider complètement le cache
   */
  async clear(): Promise<void> {
    if (this.useInMemory) {
      this.inMemoryCache.clear();
    }
    
    if (this.useRedis && this.redisCache.isReady()) {
      try {
        await this.redisCache.clear();
      } catch (redisError) {
        console.warn('RedisEmbeddingCache: Échec du vidage de Redis', {
          error: redisError instanceof Error ? redisError.message : String(redisError),
        });
      }
    }
    
    // Réinitialiser les métriques
    this.hits = 0;
    this.misses = 0;
    this.apiCalls = 0;
    this.hitTimes = [];
    this.missTimes = [];
    
    console.info('RedisEmbeddingCache: Cache vidé');
  }

  /**
   * Incrémenter le compteur d'appels API
   */
  incrementApiCalls(): void {
    this.apiCalls++;
  }

  /**
   * Obtenir les statistiques du cache
   */
  getStats(): EmbeddingCacheStats {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
    
    const avgHitTime = this.hitTimes.length > 0
      ? this.hitTimes.reduce((a, b) => a + b, 0) / this.hitTimes.length
      : 0;
    
    const avgMissTime = this.missTimes.length > 0
      ? this.missTimes.reduce((a, b) => a + b, 0) / this.missTimes.length
      : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      apiCalls: this.apiCalls,
      hitRate,
      avgHitTime,
      avgMissTime,
    };
  }

  /**
   * Générer une clé de cache (méthode publique pour la compatibilité)
   * @param text Texte à hash
   * @returns Clé de cache SHA-256
   */
  generateCacheKey(text: string): string {
    return generateEmbeddingCacheKey(text);
  }

  /**
   * Obtenir la taille du cache in-memory
   */
  getInMemorySize(): number {
    return this.inMemoryCache.size;
  }

  /**
   * Vérifier si Redis est disponible
   */
  isRedisReady(): boolean {
    return this.useRedis && this.redisCache.isReady();
  }

  /**
   * Vérifier si le cache est complètement disponible
   */
  isAvailable(): boolean {
    return this.useInMemory || this.isRedisReady();
  }
}

/**
 * Instance singleton pour RedisEmbeddingCache
 */
let embeddingCacheInstance: RedisEmbeddingCache | null = null;

/**
 * Obtenir l'instance singleton du cache des embeddings
 */
export function getEmbeddingCache(): RedisEmbeddingCache {
  if (!embeddingCacheInstance) {
    embeddingCacheInstance = new RedisEmbeddingCache();
  }
  return embeddingCacheInstance;
}

/**
 * Réinitialiser l'instance singleton (pour les tests)
 */
export function resetEmbeddingCache(): void {
  if (embeddingCacheInstance) {
    embeddingCacheInstance.clear().catch(() => {});
  }
  embeddingCacheInstance = null;
  resetRedisCache();
}

export default RedisEmbeddingCache;
