/**
 * Service de cache Redis pour NexiaMind AI
 * Utilise Upstash Redis (REST API compatible)
 * Phase GREEN: Implémentation du service Redis
 */

import { Redis } from '@upstash/redis';

/**
 * Configuration Redis
 */
export interface RedisConfig {
  url: string;
  token: string;
  maxRetries?: number;
  retryInterval?: number;
}

/**
 * Options pour la méthode set
 */
export interface SetOptions {
  ttl?: number; // en secondes
}

/**
 * Client Redis avec retry logic
 */
export class RedisCache {
  private client: Redis | null = null;
  private config: RedisConfig;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  
  // Constantes
  private static readonly DEFAULT_TTL = 3600; // 1 heure en secondes
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_INTERVAL = 5000; // 5 secondes
  private static readonly EMBEDDING_PREFIX = 'embedding:';
  
  /**
   * Créer une nouvelle instance RedisCache
   * @param config Configuration Redis optionnelle
   */
  constructor(config?: Partial<RedisConfig>) {
    this.config = {
      url: config?.url || process.env.UPSTASH_REDIS_REST_URL || '',
      token: config?.token || process.env.UPSTASH_REDIS_REST_TOKEN || '',
      maxRetries: config?.maxRetries || RedisCache.MAX_RETRIES,
      retryInterval: config?.retryInterval || RedisCache.RETRY_INTERVAL,
    };
    
    if (!this.config.url || !this.config.token) {
      console.warn('RedisCache: UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN non configuré. Le cache Redis sera désactivé.');
    } else if (process.env.NODE_ENV === 'production' && !this.config.url.startsWith('https://')) {
      console.warn('RedisCache: URL Redis doit utiliser HTTPS en production pour des raisons de sécurité.');
    }
  }

  /**
   * Se connecter à Redis avec retry logic
   * @param maxRetries Nombre maximal de tentatives (défaut: 3)
   * @param retryInterval Intervalle entre les tentatives en ms (défaut: 5000)
   */
  async connect(maxRetries?: number, retryInterval?: number): Promise<void> {
    if (this.isConnected) {
      return;
    }
    
    // Early return si pas de configuration - évite 10s de retry inutiles
    if (!this.config.url || !this.config.token) {
      this.isConnected = false;
      this.isConnecting = false;
      console.warn('RedisCache: Impossible de se connecter - URL ou token non configuré.');
      return;
    }
    
    if (this.isConnecting) {
      // Attendre qu'une connexion en cours se termine
      while (this.isConnecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Après attente, vérifier si la connexion a réussi
      if (this.isConnected) {
        return;
      }
      // Si isConnecting est false mais isConnected est false, c'est qu'il y a eu un échec
      // On relance une tentative
    }
    
    this.isConnecting = true;
    
    const attempts = maxRetries || this.config.maxRetries || RedisCache.MAX_RETRIES;
    const interval = retryInterval || this.config.retryInterval || RedisCache.RETRY_INTERVAL;
    const timeoutMs = attempts * interval + 5000; // Timeout total: tentatives * intervalle + buffer
    const startTime = Date.now();
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= attempts; attempt++) {
      // Vérifier timeout global
      if (Date.now() - startTime > timeoutMs) {
        this.isConnected = false;
        this.isConnecting = false;
        this.client = null;
        throw new Error(`RedisCache: Timeout de connexion dépassé (${timeoutMs}ms)`);
      }
      
      try {
        // Créer le client Upstash Redis
        this.client = new Redis({
          url: this.config.url,
          token: this.config.token,
        });
        
        // Tester la connexion avec une opération simple
        await this.client.ping();
        
        this.isConnected = true;
        this.isConnecting = false;
        
        console.info('RedisCache: Connecté à Redis avec succès', {
          attempt,
          url: this.config.url ? '[REDACTED]' : 'non configuré',
        });
        
        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < attempts) {
          console.warn(`RedisCache: Tentative ${attempt}/${attempts} échouée. Retry dans ${interval}ms...`, {
            error: lastError.message,
          });
          await new Promise(resolve => setTimeout(resolve, interval));
        } else {
          console.error('RedisCache: Échec de la connexion après toutes les tentatives', {
            error: lastError.message,
          });
          this.isConnected = false;
          this.isConnecting = false;
          this.client = null;
          throw new Error(`RedisCache: Impossible de se connecter à Redis après ${attempts} tentatives: ${lastError.message}`);
        }
      }
    }
  }

  /**
   * Déconnecter le client Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        // Upstash Redis n'a pas de méthode explicite de déconnexion
        // mais on peut réinitialiser le client
        this.client = null;
        this.isConnected = false;
        this.isConnecting = false;
        console.info('RedisCache: Déconnecté');
      } catch (error) {
        this.isConnecting = false;
        console.error('RedisCache: Erreur lors de la déconnexion', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Vérifier si le cache est connecté et opérationnel
   */
  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Obtenir une valeur depuis le cache Redis
   * @param key Clé de cache (sans préfixe)
   * @returns Valeur ou null si non trouvée
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      console.warn('RedisCache: get() appelé alors que le cache n\'est pas connecté. Retourne null.');
      return null;
    }
    
    try {
      const prefixedKey = this.addPrefix(key);
      const value = await this.client!.get(prefixedKey);
      return value as string | null;
    } catch (error) {
      console.error('RedisCache: Erreur lors de la lecture depuis Redis', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Stockage d'une valeur dans le cache Redis
   * @param key Clé de cache (sans préfixe)
   * @param value Valeur à stocker (sera sérialisée en JSON si objet)
   * @param options Options (TTL en secondes)
   */
  async set(key: string, value: string, options?: SetOptions): Promise<void> {
    if (!this.isReady()) {
      console.warn('RedisCache: set() appelé alors que le cache n\'est pas connecté. Ignoré.');
      return;
    }
    
    try {
      const prefixedKey = this.addPrefix(key);
      const ttl = options?.ttl ?? RedisCache.DEFAULT_TTL;
      
      await this.client!.set(prefixedKey, value, { ex: ttl });
      
      console.info('RedisCache: Valeur stockée dans Redis', {
        key: prefixedKey,
        ttl,
      });
    } catch (error) {
      console.error('RedisCache: Erreur lors de l\'écriture dans Redis', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Supprimer une clé du cache Redis
   * @param key Clé de cache (sans préfixe)
   */
  async del(key: string): Promise<void> {
    if (!this.isReady()) {
      console.warn('RedisCache: del() appelé alors que le cache n\'est pas connecté. Ignoré.');
      return;
    }
    
    try {
      const prefixedKey = this.addPrefix(key);
      await this.client!.del(prefixedKey);
      
      console.info('RedisCache: Clé supprimée de Redis', {
        key: prefixedKey,
      });
    } catch (error) {
      console.error('RedisCache: Erreur lors de la suppression de Redis', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Vérifier si une clé existe dans le cache Redis
   * @param key Clé de cache (sans préfixe)
   * @returns true si la clé existe
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }
    
    try {
      const prefixedKey = this.addPrefix(key);
      const result = await this.client!.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      console.error('RedisCache: Erreur lors de la vérification d\'existence', {
        key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Supprimer toutes les clés du cache (pour les tests)
   * Attention: Cette opération peut être lente sur de grandes bases de données
   * Utilise le chunking pour éviter de dépasser les limites de payload Upstash
   */
  async clear(): Promise<void> {
    if (!this.isReady()) {
      console.warn('RedisCache: clear() appelé alors que le cache n\'est pas connecté. Ignoré.');
      return;
    }
    
    try {
      // Obtenir toutes les clés avec le préfixe
      const pattern = `${RedisCache.EMBEDDING_PREFIX}*`;
      const keys = await this.client!.keys(pattern);
      
      if (keys.length === 0) {
        console.info('RedisCache: Aucune clé à supprimer');
        return;
      }
      
      // Chunking: supprimer par lots de 100 clés pour éviter overflow
      const CHUNK_SIZE = 100;
      let totalRemoved = 0;
      
      for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
        const chunk = keys.slice(i, i + CHUNK_SIZE);
        await this.client!.del(...chunk);
        totalRemoved += chunk.length;
        console.info(`RedisCache: Suppression de ${chunk.length} clés (total: ${totalRemoved}/${keys.length})`);
      }
      
      console.info('RedisCache: Cache vidé', {
        keysRemoved: totalRemoved,
      });
    } catch (error) {
      console.error('RedisCache: Erreur lors du vidage du cache', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Ajouter le préfixe aux clés de cache
   * @param key Clé de base
   * @returns Clé avec préfixe
   */
  private addPrefix(key: string): string {
    // Si la clé a déjà le préfixe, ne pas l'ajouter
    if (key.startsWith(RedisCache.EMBEDDING_PREFIX)) {
      return key;
    }
    return `${RedisCache.EMBEDDING_PREFIX}${key}`;
  }

  /**
   * Obtenir le client Redis (pour usage avancé)
   */
  getClient(): Redis | null {
    return this.client;
  }

  /**
   * Obtenir la configuration actuelle
   */
  getConfig(): RedisConfig {
    return { ...this.config };
  }
}

/**
 * Instance singleton pour le cache Redis
 */
let redisCacheInstance: RedisCache | null = null;

/**
 * Obtenir l'instance singleton du cache Redis
 */
export function getRedisCache(): RedisCache {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache();
  }
  return redisCacheInstance;
}

/**
 * Réinitialiser l'instance singleton (pour les tests)
 */
export function resetRedisCache(): void {
  redisCacheInstance = null;
}

export default RedisCache;
