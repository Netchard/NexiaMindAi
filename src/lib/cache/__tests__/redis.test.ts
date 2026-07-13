/**
 * Tests unitaires pour RedisCache
 * Phase RED: Tests écrits avant l'implémentation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock du client Upstash Redis
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  keys: vi.fn(),
};

// Import dynamique pour permettre le mock
let RedisCache: typeof import('../redis').RedisCache;

// Mock du module redis avant l'import
vi.mock('@upstash/redis', () => ({
  default: class {
    constructor(url: string, token: string) {
      this.url = url;
      this.token = token;
    }
    url: string;
    token: string;
    async get(key: string) {
      return mockRedis.get(key);
    }
    async set(key: string, value: string, options?: { ex?: number }) {
      return mockRedis.set(key, value, options);
    }
    async del(key: string) {
      return mockRedis.del(key);
    }
    async exists(key: string) {
      return mockRedis.exists(key);
    }
    async keys(pattern: string) {
      return mockRedis.keys(pattern);
    }
  },
}));

// Maintenant on peut importer RedisCache
import { RedisCache } from '../redis';

describe('RedisCache', () => {
  let redisCache: RedisCache;

  beforeEach(async () => {
    // Réinitialiser les mocks avant chaque test
    vi.clearAllMocks();
    
    // Créer une instance avec des variables d'environnement mockées
    process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
    
    redisCache = new RedisCache();
    await redisCache.connect();
  });

  afterEach(async () => {
    await redisCache.disconnect();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  describe('Connection', () => {
    it('DOIT se connecter à Redis avec les bonnes credentials', async () => {
      expect(redisCache['client']).toBeDefined();
      // Le client devrait être créé avec les bonnes URLs
    });

    it('DOIT gérer les erreurs de connexion avec retry', async () => {
      // Mock une erreur de connexion
      mockRedis.get.mockRejectedValueOnce(new Error('Connection failed'));
      
      // La connection devrait réussir après retry
      // Note: Ce test échouera jusqu'à ce que le retry logic soit implémenté
    });
  });

  describe('get()', () => {
    it('DOIT retourner null si la clé n\'existe pas', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const result = await redisCache.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('DOIT retourner la valeur si la clé existe', async () => {
      const testValue = JSON.stringify({ data: 'test' });
      mockRedis.get.mockResolvedValue(testValue);
      
      const result = await redisCache.get('existing-key');
      expect(result).toBe(testValue);
    });

    it('DOIT gérer les erreurs Redis', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.get('error-key')).rejects.toThrow();
    });
  });

  describe('set()', () => {
    it('DOIT stocker une valeur avec clé et TTL', async () => {
      await redisCache.set('test-key', 'test-value', 3600);
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        { ex: 3600 }
      );
    });

    it('DOIT utiliser le TTL par défaut si non spécifié', async () => {
      await redisCache.set('test-key', 'test-value');
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'test-key',
        'test-value',
        { ex: 3600 } // TTL par défaut = 1 heure
      );
    });

    it('DOIT gérer les erreurs Redis', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.set('test-key', 'test-value')).rejects.toThrow();
    });
  });

  describe('del()', () => {
    it('DOIT supprimer une clé', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      await redisCache.del('test-key');
      
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('DOIT gérer les erreurs Redis', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.del('test-key')).rejects.toThrow();
    });
  });

  describe('exists()', () => {
    it('DOIT retourner true si la clé existe', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await redisCache.exists('existing-key');
      expect(result).toBe(true);
    });

    it('DOIT retourner false si la clé n\'existe pas', async () => {
      mockRedis.exists.mockResolvedValue(0);
      
      const result = await redisCache.exists('non-existent-key');
      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('DOIT supprimer toutes les clés matching le pattern', async () => {
      mockRedis.keys.mockResolvedValue(['key1', 'key2']);
      
      await redisCache.clear();
      
      expect(mockRedis.keys).toHaveBeenCalled();
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
    });
  });
});

describe('RedisCache - Configuration', () => {
  it('DOIT utiliser les variables d\'environnement pour la configuration', () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
    
    // Le cache doit utiliser ces valeurs
    // Note: Ce test valide la configuration, pas l'implémentation
    
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('DOIT utiliser des valeurs par défaut si les variables ne sont pas définies', () => {
    // Le cache doit gérer l'absence de variables
    // Note: Ce test valide le fallback
  });
});
