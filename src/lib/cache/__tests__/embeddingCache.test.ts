/**
 * Tests unitaires complets pour RedisEmbeddingCache
 * Phase RED: Tests écrits avant l'implémentation
 * Phase GREEN: Tests validant l'implémentation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock EmbeddingResult
interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}

// Utiliser vi.hoisted pour éviter les problèmes de hoisting
const mockRedisCache = vi.hoisted(() => ({
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  clear: vi.fn().mockResolvedValue(undefined),
  isReady: vi.fn().mockReturnValue(true),
}));

// Mock @upstash/redis
vi.mock('../redis', () => ({
  RedisCache: vi.fn().mockImplementation(() => mockRedisCache),
  getRedisCache: vi.fn().mockReturnValue(mockRedisCache),
  resetRedisCache: vi.fn(),
}));

// Mock embeddings module
vi.mock('../../rag/embeddings', () => ({
  EmbeddingResult: {} as any,
}));

// Import après les mocks
import {
  RedisEmbeddingCache,
  generateEmbeddingCacheKey,
  getFullCacheKey,
} from '../embeddingCache';

describe('RedisEmbeddingCache - Tests complets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisCache.isReady.mockReturnValue(true);
    embeddingCache = new RedisEmbeddingCache({
      useRedis: true,
      useInMemory: true,
      ttlSeconds: 3600,
    });
  });
  let embeddingCache: RedisEmbeddingCache;
  const mockEmbeddingResult: EmbeddingResult = {
    embedding: [0.1, 0.2, 0.3],
    tokenCount: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRedisCache.isReady.mockReturnValue(true);
    embeddingCache = new RedisEmbeddingCache({
      useRedis: true,
      useInMemory: true,
      ttlSeconds: 3600,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('DOIT créer une instance avec les options par défaut', () => {
      const cache = new RedisEmbeddingCache();
      expect(cache).toBeDefined();
      expect(cache.isAvailable()).toBe(true);
    });

    it('DOIT accepter les options de configuration', () => {
      const cache = new RedisEmbeddingCache({
        useRedis: false,
        useInMemory: true,
      });
      expect(cache).toBeDefined();
      expect(cache.isRedisReady()).toBe(false);
      expect(cache.isAvailable()).toBe(true);
    });

    it('DOIT désactiver Redis et in-memory si demandé', () => {
      const cache = new RedisEmbeddingCache({
        useRedis: false,
        useInMemory: false,
      });
      expect(cache).toBeDefined();
      expect(cache.isAvailable()).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('DOIT appeler connect() sur le cache Redis', async () => {
      await embeddingCache.initialize();
      expect(mockRedisCache.connect).toHaveBeenCalled();
    });

    it('DOIT gérer les erreurs de connexion sans planter', async () => {
      mockRedisCache.connect.mockRejectedValue(new Error('Connection failed'));
      mockRedisCache.isReady.mockReturnValue(false);

      await embeddingCache.initialize();
      expect(mockRedisCache.connect).toHaveBeenCalled();
      expect(embeddingCache.isAvailable()).toBe(true);
    });

    it('DOIT fonctionner sans Redis si useRedis=false', async () => {
      const cache = new RedisEmbeddingCache({
        useRedis: false,
        useInMemory: true,
      });
      await cache.initialize();
      expect(mockRedisCache.connect).not.toHaveBeenCalled();
    });
  });

  describe('getEmbedding()', () => {
    const testText = 'test text';

    it('DOIT retourner null si le cache est vide', async () => {
      mockRedisCache.get.mockResolvedValue(null);
      const result = await embeddingCache.getEmbedding(testText);
      expect(result).toBeNull();
    });

    it('DOIT retourner un embedding depuis Redis', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.get.mockResolvedValue(JSON.stringify(mockEmbeddingResult));

      const result = await embeddingCache.getEmbedding(testText);
      expect(result).toEqual(mockEmbeddingResult);
    });

    it('DOIT retourner un embedding depuis in-memory si Redis échoue', async () => {
      mockRedisCache.isReady.mockReturnValue(false);
      mockRedisCache.connect.mockRejectedValue(new Error('Redis not available'));
      await embeddingCache.setEmbedding(testText, mockEmbeddingResult);
      const result = await embeddingCache.getEmbedding(testText);
      expect(result).toMatchObject(mockEmbeddingResult);
    });

    it('DOIT gérer le JSON corrompu dans Redis', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.get.mockResolvedValue('invalid json');
      mockRedisCache.del.mockResolvedValue(undefined);

      const result = await embeddingCache.getEmbedding(testText);
      expect(result).toBeNull();
      expect(mockRedisCache.del).toHaveBeenCalled();
    });

    it('DOIT gérer les erreurs Redis et fallback vers in-memory', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.get.mockRejectedValue(new Error('Redis error'));
      await embeddingCache.setEmbedding(testText, mockEmbeddingResult);
      const result = await embeddingCache.getEmbedding(testText);
      expect(result).toMatchObject(mockEmbeddingResult);
    });

    it('DOIT incrémenter les métriques sur hit', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.get.mockResolvedValue(JSON.stringify(mockEmbeddingResult));
      await embeddingCache.getEmbedding(testText);
      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(0);
    });

    it('DOIT incrémenter les métriques sur miss', async () => {
      mockRedisCache.get.mockResolvedValue(null);
      await embeddingCache.getEmbedding(testText);
      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });
  });

  describe('setEmbedding()', () => {
    const testText = 'test text';

    it('DOIT stocker dans Redis et in-memory', async () => {
      await embeddingCache.setEmbedding(testText, mockEmbeddingResult);
      expect(mockRedisCache.set).toHaveBeenCalled();
      expect(embeddingCache.getInMemorySize()).toBe(1);
    });

    it('DOIT respecter la limite de taille in-memory', async () => {
      const cache = new RedisEmbeddingCache({
        useRedis: false,
        useInMemory: true,
        ttlSeconds: 3600,
      });
      for (let i = 0; i < 1001; i++) {
        await cache.setEmbedding(`text-${i}`, { embedding: [i], tokenCount: i });
      }
      expect(cache.getInMemorySize()).toBeLessThanOrEqual(1000);
    });

    it('DOIT gérer les erreurs Redis sans planter', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.set.mockRejectedValue(new Error('Redis error'));
      await embeddingCache.setEmbedding(testText, mockEmbeddingResult);
      expect(embeddingCache.getInMemorySize()).toBe(1);
    });
  });

  describe('deleteEmbedding()', () => {
    it('DOIT supprimer de Redis et in-memory', async () => {
      await embeddingCache.setEmbedding('test', mockEmbeddingResult);
      await embeddingCache.deleteEmbedding('test');
      expect(mockRedisCache.del).toHaveBeenCalled();
      expect(embeddingCache.getInMemorySize()).toBe(0);
    });

    it('DOIT gérer les erreurs Redis sans planter', async () => {
      mockRedisCache.isReady.mockReturnValue(true);
      mockRedisCache.del.mockRejectedValue(new Error('Redis error'));
      await embeddingCache.setEmbedding('test', mockEmbeddingResult);
      await embeddingCache.deleteEmbedding('test');
      expect(embeddingCache.getInMemorySize()).toBe(0);
    });
  });

  describe('hasEmbedding()', () => {
    it('DOIT retourner false si non trouvé', async () => {
      mockRedisCache.exists.mockResolvedValue(0);
      const has = await embeddingCache.hasEmbedding('test');
      expect(has).toBe(false);
    });

    it('DOIT retourner true si trouvé dans Redis', async () => {
      mockRedisCache.exists.mockResolvedValue(1);
      const has = await embeddingCache.hasEmbedding('test');
      expect(has).toBe(true);
    });

    it('DOIT retourner true si trouvé dans in-memory', async () => {
      mockRedisCache.exists.mockResolvedValue(0);
      await embeddingCache.setEmbedding('test', mockEmbeddingResult);
      const has = await embeddingCache.hasEmbedding('test');
      expect(has).toBe(true);
    });

    it('DOIT gérer les erreurs Redis et vérifier in-memory', async () => {
      mockRedisCache.exists.mockRejectedValue(new Error('Redis error'));
      await embeddingCache.setEmbedding('test', mockEmbeddingResult);
      const has = await embeddingCache.hasEmbedding('test');
      expect(has).toBe(true);
    });
  });

  describe('clear()', () => {
    it('DOIT vider le cache in-memory et Redis', async () => {
      await embeddingCache.setEmbedding('text1', mockEmbeddingResult);
      await embeddingCache.setEmbedding('text2', mockEmbeddingResult);
      await embeddingCache.clear();
      expect(embeddingCache.getInMemorySize()).toBe(0);
      expect(mockRedisCache.clear).toHaveBeenCalled();
    });

    it('DOIT réinitialiser les métriques', async () => {
      await embeddingCache.setEmbedding('text1', mockEmbeddingResult);
      await embeddingCache.getEmbedding('text1');
      await embeddingCache.clear();
      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('DOIT gérer les erreurs Redis sans planter', async () => {
      mockRedisCache.clear.mockRejectedValue(new Error('Redis error'));
      await embeddingCache.setEmbedding('text1', mockEmbeddingResult);
      await embeddingCache.clear();
      expect(embeddingCache.getInMemorySize()).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('DOIT retourner les statistiques avec toutes les propriétés', () => {
      const stats = embeddingCache.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('apiCalls');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('avgHitTime');
      expect(stats).toHaveProperty('avgMissTime');
    });

    it('DOIT calculer hitRate correctement', async () => {
      // Ne pas utiliser Redis, seulement in-memory pour ce test
      mockRedisCache.isReady.mockReturnValue(false);
      await embeddingCache.setEmbedding('text1', mockEmbeddingResult);
      await embeddingCache.getEmbedding('text1'); // hit
      await embeddingCache.getEmbedding('text2'); // miss
      await embeddingCache.getEmbedding('text3'); // miss
      const stats = embeddingCache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(33.33, 0);
    });
  });

  describe('incrementApiCalls()', () => {
    it('DOIT incrémenter le compteur apiCalls', () => {
      const initialStats = embeddingCache.getStats();
      expect(initialStats.apiCalls).toBe(0);
      embeddingCache.incrementApiCalls();
      embeddingCache.incrementApiCalls();
      const updatedStats = embeddingCache.getStats();
      expect(updatedStats.apiCalls).toBe(2);
    });
  });

  describe('isRedisReady() et isAvailable()', () => {
    it('DOIT retourner true si Redis est prêt', () => {
      mockRedisCache.isReady.mockReturnValue(true);
      expect(embeddingCache.isRedisReady()).toBe(true);
    });

    it('DOIT retourner false si Redis n\'est pas prêt', () => {
      mockRedisCache.isReady.mockReturnValue(false);
      expect(embeddingCache.isRedisReady()).toBe(false);
    });

    it('DOIT retourner false si useRedis=false', () => {
      const cache = new RedisEmbeddingCache({ useRedis: false, useInMemory: true });
      expect(cache.isRedisReady()).toBe(false);
    });

    it('DOIT retourner true si au moins un cache est disponible', () => {
      expect(embeddingCache.isAvailable()).toBe(true);
    });

    it('DOIT retourner false si tous les caches sont désactivés', () => {
      const cache = new RedisEmbeddingCache({ useRedis: false, useInMemory: false });
      expect(cache.isAvailable()).toBe(false);
    });
  });

  describe('Reconnexion Redis', () => {
    it('DOIT tenter de se reconnecter si Redis n\'est pas prêt', async () => {
      mockRedisCache.isReady.mockReturnValue(false);
      mockRedisCache.connect.mockResolvedValue(undefined);
      await embeddingCache.getEmbedding('test');
      expect(mockRedisCache.connect).toHaveBeenCalled();
    });

    it('DOIT limiter les tentatives de reconnexion', async () => {
      // Utiliser un intervalle de reconnexion court pour le test
      const cache = new RedisEmbeddingCache({
        useRedis: true,
        useInMemory: true,
        ttlSeconds: 3600,
      });
      
      mockRedisCache.isReady.mockReturnValue(false);
      mockRedisCache.connect.mockRejectedValue(new Error('Connection failed'));
      
      // Réinitialiser lastReconnectionTime avant chaque appel pour éviter le throttling
      for (let i = 1; i <= 6; i++) {
        cache['lastReconnectionTime'] = 0; // Réinitialiser pour chaque tentative
        await cache.getEmbedding(`test${i}`);
      }
      expect(mockRedisCache.connect).toHaveBeenCalledTimes(5);
    });
  });
});

describe('Fonctions utilitaires', () => {
  describe('generateEmbeddingCacheKey()', () => {
    it('DOIT générer des clés uniques pour différents textes', () => {
      const key1 = generateEmbeddingCacheKey('texte 1');
      const key2 = generateEmbeddingCacheKey('texte 2');
      expect(key1).not.toBe(key2);
    });

    it('DOIT générer la même clé pour le même texte', () => {
      const key1 = generateEmbeddingCacheKey('même texte');
      const key2 = generateEmbeddingCacheKey('même texte');
      expect(key1).toBe(key2);
    });

    it('DOIT générer une clé de 64 caractères (SHA-256 hex)', () => {
      const key = generateEmbeddingCacheKey('test');
      expect(key).toHaveLength(64);
    });
  });

  describe('getFullCacheKey()', () => {
    it('DOIT générer une clé avec préfixe embedding:', () => {
      const key = getFullCacheKey('test');
      expect(key).toMatch(/^embedding:/);
    });

    it('DOIT générer la même clé complète pour le même texte', () => {
      const key1 = getFullCacheKey('test');
      const key2 = getFullCacheKey('test');
      expect(key1).toBe(key2);
    });

    it('DOIT inclure le hash SHA-256', () => {
      const key = getFullCacheKey('test');
      const hash = generateEmbeddingCacheKey('test');
      expect(key).toBe(`embedding:${hash}`);
    });
  });
});
