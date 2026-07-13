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
  private inMemoryCache: Map<string, CachedEmbeddingResult>;
  private inMemoryTTL: number; // en millisecondes
  private useRedis: boolean;
  private useInMemory: boolean;
  private reconnectionAttempts: number = 0;
  private static readonly MAX_RECONNECTION_ATTEMPTS = 5;
  private static readonly RECONNECTION_INTERVAL_MS = 30000; // 30 secondes
  private lastReconnectionTime: number = 0;
  
  // Métriques
  private hits: number = 0;
  private misses: number = 0;
  private apiCalls: number = 0;
  private hitTimes: number[] = [];
  private missTimes: number[] = [];
  
  // Constantes
  private static readonly DEFAULT_TTL_SECONDS = 3600; // 1 heure
  private static readonly MAX_IN_MEMORY_SIZE = 1000; // Limite à 1000 entrées
  
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
    
    this.redisCache = new RedisCache();
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
        this.reconnectionAttempts = 0;
        this.lastReconnectionTime = Date.now();
      } catch (error) {
        console.warn('RedisEmbeddingCache: Échec de la connexion Redis. Utilisation du cache in-memory seulement.', {
          error: error instanceof Error ? error.message : String(error),
        });
        // Ne pas désactiver définitivement Redis, permettre les reconnexions
        // this.useRedis = false; // Supprimé pour permettre les reconnexions
      }
    }
  }

  /**
   * Tentative de reconnexion Redis
   */
  private async attemptReconnection(): Promise<boolean> {
    // Vérifier si on a dépassé le nombre max de tentatives
    if (this.reconnectionAttempts >= RedisEmbeddingCache.MAX_RECONNECTION_ATTEMPTS) {
      console.warn('RedisEmbeddingCache: Nombre max de tentatives de reconnexion atteint. Utilisation du cache in-memory seulement.');
      this.useRedis = false;
      return false;
    }
    
    // Vérifier l'intervalle de temps depuis la dernière tentative
    const timeSinceLastAttempt = Date.now() - this.lastReconnectionTime;
    if (timeSinceLastAttempt < RedisEmbeddingCache.RECONNECTION_INTERVAL_MS) {
      console.warn(`RedisEmbeddingCache: Trop tôt pour une reconnexion (attendre ${RedisEmbeddingCache.RECONNECTION_INTERVAL_MS - timeSinceLastAttempt}ms).`);
      return false;
    }
    
    try {
      this.reconnectionAttempts++;
      this.lastReconnectionTime = Date.now();
      console.info(`RedisEmbeddingCache: Tentative de reconnexion Redis (#${this.reconnectionAttempts})...`);
      
      await this.redisCache.connect();
      console.info('RedisEmbeddingCache: Reconnecté à Redis avec succès');
      this.reconnectionAttempts = 0;
      return true;
    } catch (error) {
      console.warn('RedisEmbeddingCache: Échec de la reconnexion Redis', {
        error: error instanceof Error ? error.message : String(error),
        attempt: this.reconnectionAttempts,
      });
      return false;
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
      if (this.useRedis) {
        try {
          // Si Redis n'est pas prêt, tenter une reconnexion
          if (!this.redisCache.isReady()) {
            const reconnected = await this.attemptReconnection();
            if (!reconnected && !this.redisCache.isReady()) {
              // Fallback vers in-memory
              console.warn('RedisEmbeddingCache: Redis non disponible, fallback vers in-memory');
            }
          }
          
          if (this.redisCache.isReady()) {
            const cached = await this.redisCache.get(fullKey);
            if (cached) {
              try {
                const result: EmbeddingResult = JSON.parse(cached);
                this.hits++;
                this.hitTimes.push(Date.now() - startTime);
                
                console.info('RedisEmbeddingCache: Cache hit (Redis)', {
                  cacheKey: cacheKey.substring(0, 20) + '...',
                  duration: `${Date.now() - startTime}ms`,
                });
                
                return result;
              } catch (parseError) {
                // JSON corrompu - supprimer la clé et logger
                console.error('RedisEmbeddingCache: Entrée Redis corrompue, suppression de la clé', {
                  cacheKey: cacheKey.substring(0, 20) + '...',
                  error: parseError instanceof Error ? parseError.message : String(parseError),
                });
                await this.redisCache.del(fullKey);
                // Continuer avec in-memory
              }
            }
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
          const age = Date.now() - (cached.cachedAt ?? Date.now());
          if (age <= this.inMemoryTTL) {
            this.hits++;
            this.hitTimes.push(Date.now() - startTime);
            
            console.info('RedisEmbeddingCache: Cache hit (In-Memory)', {
              cacheKey: cacheKey.substring(0, 20) + '...',
              duration: `${Date.now() - startTime}ms`,
            });
            
            // Retourner sans cachedAt et cacheKey (champs internes)
            const { cachedAt, cacheKey: storedCacheKey, ...result } = cached;
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
        cacheKey: cacheKey.substring(0, 20) + '...',
        duration: `${Date.now() - startTime}ms`,
      });
      
      return null;
    } catch (error) {
      console.error('RedisEmbeddingCache: Erreur lors de la récupération depuis le cache', {
        error: error instanceof Error ? error.message : String(error),
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
      // Appliquer la limite de taille LRU simple : supprimer la première entrée si la limite est atteinte
      if (this.inMemoryCache.size >= RedisEmbeddingCache.MAX_IN_MEMORY_SIZE) {
        const firstKey = this.inMemoryCache.keys().next().value;
        if (firstKey) {
          this.inMemoryCache.delete(firstKey);
          console.warn('RedisEmbeddingCache: Limite du cache in-memory atteinte, suppression de la plus ancienne entrée');
        }
      }
      
      this.inMemoryCache.set(cacheKey, {
        ...result,
        cachedAt: Date.now(),
        cacheKey,
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
      } catch (redisError) {
        // Si Redis échoue, vérifier in-memory
        console.warn('RedisEmbeddingCache: Erreur lors de la vérification Redis dans hasEmbedding', {
          error: redisError instanceof Error ? redisError.message : String(redisError),
        });
      }
    }
    
    // Vérifier in-memory
    if (this.useInMemory) {
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached) {
        const age = Date.now() - (cached.cachedAt ?? Date.now());
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
export async function resetEmbeddingCache(): Promise<void> {
  if (embeddingCacheInstance) {
    await embeddingCacheInstance.clear();
  }
  embeddingCacheInstance = null;
  resetRedisCache();
}

export default RedisEmbeddingCache;
