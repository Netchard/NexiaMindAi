/**
 * Tests unitaires pour RedisCache
 * Phase RED: Tests écrits avant l'implémentation
 * Phase GREEN: Tests validant l'implémentation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock du client Upstash Redis
const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  keys: vi.fn(),
  ping: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
};

// Mock du module @upstash/redis avec export nommé
// Le vrai module exporte Redis (classe), pas createClient
vi.mock('@upstash/redis', () => ({
  Redis: class {
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
    async del(...keys: string[]) {
      return mockRedis.del(...keys);
    }
    async exists(key: string) {
      return mockRedis.exists(key);
    }
    async keys(pattern: string) {
      return mockRedis.keys(pattern);
    }
    async ping() {
      return mockRedis.ping();
    }
  },
}));

// Import après le mock
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
    // ping() doit réussir pour que connect() fonctionne
    mockRedis.ping.mockResolvedValue('PONG');
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
      expect(redisCache.isReady()).toBe(true);
      expect(mockRedis.ping).toHaveBeenCalled();
    });

    it('DOIT gérer les erreurs de connexion avec retry', async () => {
      // Réinitialiser les mocks complètement
      vi.clearAllMocks();
      
      // Setup: premier ping échoue, deuxième réussit
      mockRedis.ping.mockRejectedValueOnce(new Error('Connection failed'));
      mockRedis.ping.mockResolvedValueOnce('PONG');
      
      // Créer une nouvelle instance pour ce test
      const testRedisCache = new RedisCache();
      
      // Le premier ping échoue, le deuxième réussit
      await expect(testRedisCache.connect()).resolves.toBeUndefined();
      expect(mockRedis.ping).toHaveBeenCalledTimes(2);
      expect(testRedisCache.isReady()).toBe(true);
      
      await testRedisCache.disconnect();
    });

    it('DOIT échouer après toutes les tentatives de retry', async () => {
      // Réinitialiser les mocks complètement
      vi.clearAllMocks();
      
      // Setup: tous les pings échouent
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));
      
      // Créer une nouvelle instance pour ce test
      const testRedisCache = new RedisCache();
      
      await expect(testRedisCache.connect(2, 100)).rejects.toThrow(
        'RedisCache: Impossible de se connecter à Redis après 2 tentatives'
      );
      expect(mockRedis.ping).toHaveBeenCalledTimes(2);
      expect(testRedisCache.isReady()).toBe(false);
    });

    it('DOIT retourner rapidement si URL/token non configuré', async () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      
      const testRedisCache = new RedisCache();
      await testRedisCache.connect();
      
      expect(testRedisCache.isReady()).toBe(false);
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

    it('DOIT retourner null si non connecté', async () => {
      const disconnectedCache = new RedisCache();
      const result = await disconnectedCache.get('any-key');
      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('DOIT stocker une valeur avec clé et TTL (objet)', async () => {
      await redisCache.set('test-key', 'test-value', { ttl: 3600 });
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'embedding:test-key',
        'test-value',
        { ex: 3600 }
      );
    });

    it('DOIT utiliser le TTL par défaut si non spécifié', async () => {
      await redisCache.set('test-key', 'test-value');
      
      expect(mockRedis.set).toHaveBeenCalledWith(
        'embedding:test-key',
        'test-value',
        { ex: 3600 } // TTL par défaut = 1 heure
      );
    });

    it('DOIT préfixer la clé automatiquement', async () => {
      await redisCache.set('my-key', 'my-value');
      
      // Vérifier que la clé préfixée est utilisée
      expect(mockRedis.set).toHaveBeenCalledWith(
        'embedding:my-key',
        'my-value',
        { ex: 3600 }
      );
    });

    it('DOIT gérer les erreurs Redis', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.set('test-key', 'test-value')).rejects.toThrow();
    });

    it('DOIT ignorer set() si non connecté', async () => {
      const disconnectedCache = new RedisCache();
      await disconnectedCache.set('test-key', 'test-value');
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe('del()', () => {
    it('DOIT supprimer une clé', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      await redisCache.del('test-key');
      
      expect(mockRedis.del).toHaveBeenCalledWith('embedding:test-key');
    });

    it('DOIT gérer les erreurs Redis', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis error'));
      
      await expect(redisCache.del('test-key')).rejects.toThrow();
    });

    it('DOIT ignorer del() si non connecté', async () => {
      const disconnectedCache = new RedisCache();
      await disconnectedCache.del('test-key');
      expect(mockRedis.del).not.toHaveBeenCalled();
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

    it('DOIT préfixer la clé automatiquement', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      await redisCache.exists('my-key');
      
      expect(mockRedis.exists).toHaveBeenCalledWith('embedding:my-key');
    });

    it('DOIT retourner false si non connecté', async () => {
      const disconnectedCache = new RedisCache();
      const result = await disconnectedCache.exists('any-key');
      expect(result).toBe(false);
    });
  });

  describe('clear()', () => {
    it('DOIT supprimer toutes les clés matching le pattern', async () => {
      vi.clearAllMocks();
      // Reconfigurer les mocks nécessaires
      mockRedis.ping.mockResolvedValue('PONG');
      
      mockRedis.keys.mockResolvedValue(['embedding:key1', 'embedding:key2']);
      mockRedis.del.mockResolvedValue(2);
      
      // Créer une nouvelle instance pour ce test car redisCache a déjà été connecté dans beforeEach
      const testRedisCache = new RedisCache();
      await testRedisCache.connect();
      await testRedisCache.clear();
      
      expect(mockRedis.keys).toHaveBeenCalledWith('embedding:*');
      expect(mockRedis.del).toHaveBeenCalledWith('embedding:key1', 'embedding:key2');
      
      await testRedisCache.disconnect();
    });

    it('DOIT gérer un grand nombre de clés avec chunking', async () => {
      const keys = Array.from({ length: 250 }, (_, i) => `embedding:key${i}`);
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(250);
      
      await redisCache.clear();
      
      // Le chunking devrait être utilisé
      expect(mockRedis.keys).toHaveBeenCalledWith('embedding:*');
      // del() devrait être appelé avec des chunks de 100
      expect(mockRedis.del).toHaveBeenCalledTimes(3); // 100 + 100 + 50
    });

    it('DOIT ignorer clear() si non connecté', async () => {
      const disconnectedCache = new RedisCache();
      await disconnectedCache.clear();
      expect(mockRedis.keys).not.toHaveBeenCalled();
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('isReady()', () => {
    it('DOIT retourner true après connexion réussie', async () => {
      expect(redisCache.isReady()).toBe(true);
    });

    it('DOIT retourner false avant connexion', async () => {
      const newCache = new RedisCache();
      expect(newCache.isReady()).toBe(false);
    });

    it('DOIT retourner false après déconnexion', async () => {
      await redisCache.disconnect();
      expect(redisCache.isReady()).toBe(false);
    });
  });

  describe('getClient()', () => {
    it('DOIT retourner le client après connexion', async () => {
      const client = redisCache.getClient();
      expect(client).not.toBeNull();
    });

    it('DOIT retourner null si non connecté', () => {
      const newCache = new RedisCache();
      const client = newCache.getClient();
      expect(client).toBeNull();
    });
  });

  describe('getConfig()', () => {
    it('DOIT retourner la configuration', () => {
      const config = redisCache.getConfig();
      expect(config.url).toBe('https://mock-redis.upstash.io');
      expect(config.token).toBe('mock-token');
    });
  });

  describe('Validation HTTPS en production', () => {
    it('DOIT avertir si URL non HTTPS en production', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      process.env.NODE_ENV = 'production';
      process.env.UPSTASH_REDIS_REST_URL = 'http://insecure-redis.io';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      
      new RedisCache();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('HTTPS')
      );
      
      consoleWarnSpy.mockRestore();
      delete process.env.NODE_ENV;
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
    });
  });
});
