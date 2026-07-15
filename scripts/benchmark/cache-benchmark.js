/**
 * Script de Benchmark pour le Cache des Embeddings - ST-403
 * PHASE GREEN: Implémentation complète
 *
 * Ce script mesure les performances du cache des embeddings avec différentes configurations:
 * - Avec cache Redis + In-Memory
 * - Avec cache In-Memory seulement
 * - Sans cache du tout
 *
 * Contrairement à cache-benchmark.mock.js (simulation locale, sans dépendances externes,
 * pensé pour tourner en CI), ce script exécute un VRAI benchmark : appels réels à l'API
 * Mistral Embeddings et, si configuré, au vrai Upstash Redis. Il nécessite donc
 * MISTRAL_API_KEY (et optionnellement UPSTASH_REDIS_REST_URL/TOKEN pour tester le palier
 * Redis) — voir .env.example. `scripts/benchmark/` tourne en Node pur, sans transpilation
 * TypeScript configurée, il ne peut donc pas importer directement les classes TS de
 * `src/lib/cache`/`src/lib/rag` : les clients Mistral/Upstash ci-dessous sont une
 * réimplémentation légère du même protocole REST, dédiée à ce script.
 *
 * @story ST-403
 * @task Tâche 4.1 - Créer le script de benchmark
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Charger les variables d'environnement depuis .env
require('dotenv').config();

// Chemins des fichiers de sortie avec identifiant unique
const BENCHMARK_REPORT_PATH = path.join(__dirname, `embedding-cache-benchmark-report-${Date.now()}.json`);
const BENCHMARK_LOG_PATH = path.join(__dirname, `embedding-cache-benchmark-${Date.now()}.log`);

// Configuration des tests
const BENCHMARK_CONFIG = {
  // Nombre de requêtes uniques pour tester les cache misses
  uniqueRequestsCount: 100,
  // Nombre de répétitions pour tester les cache hits
  repeatedRequestsCount: 100,
  // Longueur des textes de test (en caractères)
  textLength: 100,
  // Nombre d'itérations par test
  testIterations: 1,
  // Seuil de temps pour cache hit (doit être < 50ms)
  cacheHitThresholdMs: 50,
  // Seuil de ratio cache hit (doit être > 30%)
  cacheHitRateThreshold: 30,
};

// Logger simple
function log(message, data = null, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
  };
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  const coloredMessage = `${colors[color] || ''}${logMessage}${colors.reset || ''}`;
  console.log(coloredMessage, data || '');

  // Écrire dans le fichier de log
  const logContent = `${logMessage}\n${data ? JSON.stringify(data, null, 2) + '\n' : ''}\n`;
  try {
    fs.appendFileSync(BENCHMARK_LOG_PATH, logContent, 'utf8');
  } catch (e) {
    console.error(`[log] Échec de l'écriture du fichier de log ${BENCHMARK_LOG_PATH}: ${e.message}`);
  }
}

/**
 * Valide la configuration du benchmark
 */
function validateBenchmarkConfig() {
  const errors = [];

  if (BENCHMARK_CONFIG.uniqueRequestsCount <= 0) {
    errors.push('uniqueRequestsCount doit être > 0');
  }

  if (BENCHMARK_CONFIG.repeatedRequestsCount <= 0) {
    errors.push('repeatedRequestsCount doit être > 0');
  }

  if (BENCHMARK_CONFIG.testIterations <= 0) {
    errors.push('testIterations doit être > 0');
  }

  if (BENCHMARK_CONFIG.textLength <= 0) {
    errors.push('textLength doit être > 0');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration invalide:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  log('✅ Configuration BENCHMARK_CONFIG validée', BENCHMARK_CONFIG, 'green');
}

/**
 * Génère un texte unique pour les tests
 * @param index Index pour générer un texte unique
 * @returns Texte généré
 */
function generateTestText(index) {
  const baseText = `Test text for embedding benchmark ${index}. `;
  const repeated = baseText.repeat(Math.ceil(BENCHMARK_CONFIG.textLength / baseText.length));
  return repeated.substring(0, BENCHMARK_CONFIG.textLength);
}

/**
 * Génère une clé de cache SHA-256 pour un texte
 * @param text Texte à hash
 * @returns Clé de cache hexadécimale
 */
function generateCacheKey(text) {
  const hash = crypto.createHash('sha256');
  hash.update(text);
  return `embedding:${hash.digest('hex')}`;
}

/**
 * Génère une clé de cache Mock pour éviter les dépendances Redis
 * @param text Texte à hash
 * @returns Clé de cache
 */
function generateMockCacheKey(text) {
  // Utiliser un hash simple pour le mock
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `embedding:${Math.abs(hash).toString(16)}`;
}

/**
 * Génère des données de test pour le benchmark
 * @returns { uniqueTexts: string[], repeatedTexts: string[] }
 */
function generateTestData() {
  log('🔍 Génération des données de test...', {}, 'cyan');

  // Générer des textes uniques
  const uniqueTexts = [];
  for (let i = 0; i < BENCHMARK_CONFIG.uniqueRequestsCount; i++) {
    uniqueTexts.push(generateTestText(i));
  }

  // Générer des textes répétitifs (les mêmes 100 textes)
  const repeatedTexts = [];
  for (let i = 0; i < BENCHMARK_CONFIG.repeatedRequestsCount; i++) {
    repeatedTexts.push(uniqueTexts[i % BENCHMARK_CONFIG.uniqueRequestsCount]);
  }

  log('✅ Données de test générées', {
    uniqueTextsCount: uniqueTexts.length,
    repeatedTextsCount: repeatedTexts.length,
    sampleText: uniqueTexts[0].substring(0, 50) + '...',
  }, 'green');

  return { uniqueTexts, repeatedTexts };
}

/**
 * Crée un mock de RedisCache pour les tests sans Redis
 */
class MockRedisCache {
  constructor() {
    this.store = new Map();
    this.ready = true;
  }

  isReady() {
    return this.ready;
  }

  async connect() {
    this.ready = true;
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, options) {
    this.store.set(key, value);
  }

  async del(key) {
    this.store.delete(key);
  }

  async exists(key) {
    return this.store.has(key);
  }

  async clear() {
    this.store.clear();
  }

  getStats() {
    return { size: this.store.size };
  }
}

/**
 * Crée un mock de EmbeddingService pour les tests sans API Mistral
 */
class MockEmbeddingService {
  constructor(options = {}) {
    this.cache = options.cache || null;
    this.useCache = options.useCache !== false;
    this.apiCalls = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.callCount = 0;

    // Générateur déterministe d'embeddings mock
    this.embeddingCounter = 0;
  }

  async generateEmbedding(text, options = {}) {
    const useCache = options.useCache !== undefined ? options.useCache : this.useCache;

    // Si le cache est disponible, essayer de récupérer
    if (useCache && this.cache) {
      const cached = await this.cache.getEmbedding(text);
      if (cached) {
        this.cacheHits++;
        return cached;
      }
      this.cacheMisses++;
    }

    // Générer un embedding mock (déterministe basé sur le texte)
    this.apiCalls++;
    this.callCount++;

    // Simuler un délai API (200-500ms)
    const delay = 200 + Math.random() * 300;

    // Générer un embedding mock de 1536 dimensions
    const embedding = new Array(1536);
    const seed = this.hashText(text);
    for (let i = 0; i < 1536; i++) {
      embedding[i] = (seed + i) % 1000 / 1000 - 0.5;
    }

    const result = {
      embedding,
      tokenCount: Math.ceil(text.length / 4),
      createdAt: new Date().toISOString(),
    };

    // Mettre en cache si activé
    if (useCache && this.cache) {
      await this.cache.setEmbedding(text, result);
    }

    // Simuler le délai
    await new Promise(resolve => setTimeout(resolve, delay));

    return result;
  }

  hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  getCacheStats() {
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      apiCalls: this.apiCalls,
      hitRate: this.cacheHits + this.cacheMisses > 0
        ? (this.cacheHits / (this.cacheHits + this.cacheMisses)) * 100
        : 0,
    };
  }

  async clearCache() {
    if (this.cache) {
      await this.cache.clear();
    }
    this.apiCalls = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

/**
 * Crée un mock de RedisEmbeddingCache
 */
class MockRedisEmbeddingCache {
  constructor(options = {}) {
    this.useRedis = options.useRedis !== false;
    this.useInMemory = options.useInMemory !== false;
    this.inMemoryCache = new Map();
    this.inMemoryTTL = (options.ttlSeconds || 3600) * 1000;
    this.hits = 0;
    this.misses = 0;
  }

  async initialize() {
    // Nothing to do for mock
  }

  async getEmbedding(text) {
    const startTime = Date.now();
    const cacheKey = generateMockCacheKey(text);

    if (this.useInMemory) {
      const cached = this.inMemoryCache.get(cacheKey);
      if (cached) {
        const age = Date.now() - (cached.cachedAt || Date.now());
        if (age <= this.inMemoryTTL) {
          this.hits++;
          const { cachedAt, ...result } = cached;
          return result;
        } else {
          this.inMemoryCache.delete(cacheKey);
        }
      }
    }

    this.misses++;
    return null;
  }

  async setEmbedding(text, result) {
    const cacheKey = generateMockCacheKey(text);

    if (this.useInMemory) {
      this.inMemoryCache.set(cacheKey, {
        ...result,
        cachedAt: Date.now(),
      });
    }
  }

  async clear() {
    this.inMemoryCache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const totalRequests = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      apiCalls: 0,
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      avgHitTime: 0,
      avgMissTime: 0,
    };
  }

  isRedisReady() {
    return false;
  }

  isAvailable() {
    return this.useInMemory;
  }
}

/**
 * Client Upstash Redis minimal (API REST) pour le benchmark réel.
 * Réimplémentation légère du protocole REST Upstash (voir src/lib/cache/redis.ts) :
 * ce script Node pur ne peut pas importer directement les classes TypeScript de src/lib.
 */
class RealUpstashRedis {
  constructor({ url, token }) {
    this.url = url;
    this.token = token;
  }

  isConfigured() {
    return Boolean(this.url && this.token);
  }

  async get(key) {
    const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!res.ok) {
      throw new Error(`Upstash GET a échoué (${res.status})`);
    }
    const data = await res.json();
    return data.result ?? null;
  }

  async set(key, value, ttlSeconds) {
    const res = await fetch(
      `${this.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${ttlSeconds}`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    if (!res.ok) {
      throw new Error(`Upstash SET a échoué (${res.status})`);
    }
  }
}

/**
 * Cache hiérarchique réel (Redis -> In-Memory) pour le benchmark réel.
 */
class RealEmbeddingCache {
  constructor({ useRedis, useInMemory, ttlSeconds }) {
    this.useRedis = Boolean(useRedis);
    this.useInMemory = useInMemory !== false;
    this.ttlSeconds = ttlSeconds || 3600;
    this.inMemoryCache = new Map();

    if (this.useRedis) {
      this.redis = new RealUpstashRedis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      if (!this.redis.isConfigured()) {
        throw new Error(
          'RealEmbeddingCache: useRedis=true mais UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN ' +
          'ne sont pas configurés (voir .env.example).'
        );
      }
    } else {
      this.redis = null;
    }
  }

  async get(text) {
    const key = generateCacheKey(text);

    if (this.redis) {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
    }

    if (this.useInMemory) {
      const cached = this.inMemoryCache.get(key);
      if (cached && Date.now() - cached.cachedAt <= this.ttlSeconds * 1000) {
        return cached.value;
      }
    }

    return null;
  }

  async set(text, value) {
    const key = generateCacheKey(text);

    if (this.useInMemory) {
      this.inMemoryCache.set(key, { value, cachedAt: Date.now() });
    }

    if (this.redis) {
      await this.redis.set(key, JSON.stringify(value), this.ttlSeconds);
    }
  }

  clear() {
    this.inMemoryCache.clear();
  }
}

/**
 * Appelle réellement l'API Mistral Embeddings.
 * @param text Texte à transformer en embedding
 */
async function callMistralApiReal(text) {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MISTRAL_API_KEY non configuré — impossible d'exécuter le benchmark réel. " +
      'Renseignez .env (voir .env.example) ou utilisez `npm run benchmark:cache:mock` pour une simulation locale.'
    );
  }

  const baseUrl = process.env.MISTRAL_API_BASE_URL || 'https://api.mistral.ai/v1/';
  const model = process.env.MISTRAL_EMBEDDING_MODEL || 'mistral-embed';
  const endpoint = new URL('embeddings', baseUrl).toString();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, input: [text] }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Appel API Mistral échoué (${res.status}): ${body.substring(0, 200)}`);
  }

  const data = await res.json();
  const embedding = data && data.data && data.data[0] && data.data[0].embedding;
  if (!Array.isArray(embedding)) {
    throw new Error('Réponse API Mistral invalide - embedding manquant');
  }

  return {
    embedding,
    tokenCount: Math.ceil(text.length / 4),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Service d'embeddings réel pour le benchmark : appelle la vraie API Mistral,
 * avec un cache hiérarchique réel optionnel (Redis + in-memory).
 */
class RealEmbeddingService {
  constructor(options = {}) {
    this.useCache = Boolean(options.useCache);
    this.cache = options.cache || null;
    this.apiCalls = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  async generateEmbedding(text) {
    if (this.useCache && this.cache) {
      const cached = await this.cache.get(text);
      if (cached) {
        this.cacheHits++;
        return cached;
      }
      this.cacheMisses++;
    }

    const result = await callMistralApiReal(text);
    this.apiCalls++;

    if (this.useCache && this.cache) {
      await this.cache.set(text, result);
    }

    return result;
  }
}

/**
 * Mesure la performance avec une configuration donnée, en utilisant les composants
 * MOCK (aucun appel réseau réel). Utilisé par la suite de tests automatisés (Jest/CI)
 * et par `cache-benchmark.mock.js`.
 * @param config Configuration du test
 * @returns Résultats du benchmark
 */
async function measurePerformance(config) {
  log(`\n🚀 Début du benchmark: ${config.name}`, config, 'cyan');

  // Générer les données de test
  const { uniqueTexts, repeatedTexts } = generateTestData();

  // Créer le mock embedding service avec la configuration
  const cache = new MockRedisEmbeddingCache({
    useRedis: config.useRedis,
    useInMemory: config.useInMemory,
  });

  const service = new MockEmbeddingService({
    cache: config.useCache ? cache : null,
    useCache: config.useCache,
  });

  const results = {
    config: config.name,
    uniqueRequests: {
      count: 0,
      times: [],
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
    },
    repeatedRequests: {
      count: 0,
      times: [],
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      apiCalls: 0,
    },
    overall: {
      totalRequests: 0,
      totalTime: 0,
      avgTime: 0,
      cacheHitRate: 0,
      apiCallReduction: 0,
    },
  };

  // Tester les requêtes uniques (cache miss)
  log(`\n📊 Test ${config.name}: Requêtes uniques (cache miss)...`, {}, 'yellow');

  for (let i = 0; i < uniqueTexts.length; i++) {
    const text = uniqueTexts[i];
    const startTime = Date.now();

    await service.generateEmbedding(text, { useCache: config.useCache });

    const duration = Date.now() - startTime;
    results.uniqueRequests.times.push(duration);
    results.uniqueRequests.totalTime += duration;
    results.uniqueRequests.minTime = Math.min(results.uniqueRequests.minTime, duration);
    results.uniqueRequests.maxTime = Math.max(results.uniqueRequests.maxTime, duration);
    results.uniqueRequests.count++;
  }

  results.uniqueRequests.avgTime = results.uniqueRequests.totalTime / results.uniqueRequests.count;
  results.uniqueRequests.cacheHits = service.cacheHits;
  results.uniqueRequests.cacheMisses = service.cacheMisses;
  results.uniqueRequests.apiCalls = service.apiCalls;

  // NOTE: on ne vide PAS le cache ici. Les textes de la phase "répétée" sont
  // volontairement identiques à ceux de la phase "unique" (voir generateTestData) —
  // c'est ce qui permet de mesurer un vrai cache hit lors de la phase suivante.

  // Tester les requêtes répétées (cache hit)
  log(`📊 Test ${config.name}: Requêtes répétées (cache hit)...`, {}, 'yellow');

  for (let i = 0; i < repeatedTexts.length; i++) {
    const text = repeatedTexts[i];
    const startTime = Date.now();

    await service.generateEmbedding(text, { useCache: config.useCache });

    const duration = Date.now() - startTime;
    results.repeatedRequests.times.push(duration);
    results.repeatedRequests.totalTime += duration;
    results.repeatedRequests.minTime = Math.min(results.repeatedRequests.minTime, duration);
    results.repeatedRequests.maxTime = Math.max(results.repeatedRequests.maxTime, duration);
    results.repeatedRequests.count++;
  }

  // Les compteurs de service sont cumulatifs sur les deux phases : on soustrait la part
  // déjà attribuée à la phase "unique" pour obtenir la contribution de cette phase.
  results.repeatedRequests.cacheHits = service.cacheHits - results.uniqueRequests.cacheHits;
  results.repeatedRequests.cacheMisses = service.cacheMisses - results.uniqueRequests.cacheMisses;
  results.repeatedRequests.apiCalls = service.apiCalls - results.uniqueRequests.apiCalls;
  results.repeatedRequests.avgTime = results.repeatedRequests.totalTime / results.repeatedRequests.count;

  // Calculer les métriques globales
  results.overall.totalRequests = results.uniqueRequests.count + results.repeatedRequests.count;
  results.overall.totalTime = results.uniqueRequests.totalTime + results.repeatedRequests.totalTime;
  results.overall.avgTime = results.overall.totalTime / results.overall.totalRequests;

  const totalCacheHits = results.uniqueRequests.cacheHits + results.repeatedRequests.cacheHits;
  const totalCacheMisses = results.uniqueRequests.cacheMisses + results.repeatedRequests.cacheMisses;
  const totalRequests = totalCacheHits + totalCacheMisses;
  results.overall.cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;

  // Calculer la réduction des appels API
  const apiCallsWithoutCache = results.uniqueRequests.count + results.repeatedRequests.count;
  const apiCallsWithCache = results.uniqueRequests.apiCalls + results.repeatedRequests.apiCalls;
  results.overall.apiCallReduction = apiCallsWithoutCache > 0
    ? ((apiCallsWithoutCache - apiCallsWithCache) / apiCallsWithoutCache) * 100
    : 0;

  log(`✅ Benchmark ${config.name} terminé`, results, 'green');

  await service.clearCache();

  return results;
}

/**
 * Mesure la performance RÉELLE avec une configuration donnée : vrais appels à l'API
 * Mistral Embeddings, et vrai Redis (Upstash) si `config.useRedis` est activé.
 * @param config Configuration du test ({ name, useRedis, useInMemory, useCache })
 * @returns Résultats du benchmark
 */
async function measureRealPerformance(config) {
  log(`\n🚀 Début du benchmark RÉEL: ${config.name}`, config, 'cyan');

  const { uniqueTexts, repeatedTexts } = generateTestData();

  const cache = config.useCache
    ? new RealEmbeddingCache({ useRedis: config.useRedis, useInMemory: config.useInMemory })
    : null;
  const service = new RealEmbeddingService({ useCache: config.useCache, cache });

  const results = {
    config: config.name,
    uniqueRequests: {
      count: 0, times: [], totalTime: 0, avgTime: 0, minTime: Infinity, maxTime: 0,
      cacheHits: 0, cacheMisses: 0, apiCalls: 0,
    },
    repeatedRequests: {
      count: 0, times: [], totalTime: 0, avgTime: 0, minTime: Infinity, maxTime: 0,
      cacheHits: 0, cacheMisses: 0, apiCalls: 0,
    },
    overall: { totalRequests: 0, totalTime: 0, avgTime: 0, cacheHitRate: 0, apiCallReduction: 0 },
  };

  log(`\n📊 Test RÉEL ${config.name}: Requêtes uniques (cache miss, appels API réels)...`, {}, 'yellow');
  for (const text of uniqueTexts) {
    const startTime = Date.now();
    await service.generateEmbedding(text);
    const duration = Date.now() - startTime;
    results.uniqueRequests.times.push(duration);
    results.uniqueRequests.totalTime += duration;
    results.uniqueRequests.minTime = Math.min(results.uniqueRequests.minTime, duration);
    results.uniqueRequests.maxTime = Math.max(results.uniqueRequests.maxTime, duration);
    results.uniqueRequests.count++;
  }
  results.uniqueRequests.avgTime = results.uniqueRequests.totalTime / results.uniqueRequests.count;
  results.uniqueRequests.cacheHits = service.cacheHits;
  results.uniqueRequests.cacheMisses = service.cacheMisses;
  results.uniqueRequests.apiCalls = service.apiCalls;

  log(`📊 Test RÉEL ${config.name}: Requêtes répétées (cache hit attendu)...`, {}, 'yellow');
  for (const text of repeatedTexts) {
    const startTime = Date.now();
    await service.generateEmbedding(text);
    const duration = Date.now() - startTime;
    results.repeatedRequests.times.push(duration);
    results.repeatedRequests.totalTime += duration;
    results.repeatedRequests.minTime = Math.min(results.repeatedRequests.minTime, duration);
    results.repeatedRequests.maxTime = Math.max(results.repeatedRequests.maxTime, duration);
    results.repeatedRequests.count++;
  }
  results.repeatedRequests.cacheHits = service.cacheHits - results.uniqueRequests.cacheHits;
  results.repeatedRequests.cacheMisses = service.cacheMisses - results.uniqueRequests.cacheMisses;
  results.repeatedRequests.apiCalls = service.apiCalls - results.uniqueRequests.apiCalls;
  results.repeatedRequests.avgTime = results.repeatedRequests.totalTime / results.repeatedRequests.count;

  results.overall.totalRequests = results.uniqueRequests.count + results.repeatedRequests.count;
  results.overall.totalTime = results.uniqueRequests.totalTime + results.repeatedRequests.totalTime;
  results.overall.avgTime = results.overall.totalTime / results.overall.totalRequests;

  const totalCacheHits = results.uniqueRequests.cacheHits + results.repeatedRequests.cacheHits;
  const totalCacheMisses = results.uniqueRequests.cacheMisses + results.repeatedRequests.cacheMisses;
  const totalRequests = totalCacheHits + totalCacheMisses;
  results.overall.cacheHitRate = totalRequests > 0 ? (totalCacheHits / totalRequests) * 100 : 0;

  const apiCallsWithoutCache = results.uniqueRequests.count + results.repeatedRequests.count;
  const apiCallsWithCache = results.uniqueRequests.apiCalls + results.repeatedRequests.apiCalls;
  results.overall.apiCallReduction = apiCallsWithoutCache > 0
    ? ((apiCallsWithoutCache - apiCallsWithCache) / apiCallsWithoutCache) * 100
    : 0;

  log(`✅ Benchmark RÉEL ${config.name} terminé`, results, 'green');

  if (cache) {
    cache.clear();
  }

  return results;
}

/**
 * Génère un rapport de benchmark
 * @param results Résultats de tous les benchmarks
 */
function generateReport(results) {
  log('\n📝 Génération du rapport de benchmark...', {}, 'cyan');

  const report = {
    timestamp: new Date().toISOString(),
    benchmarkVersion: '1.0.0',
    story: 'ST-403',
    task: 'Tâche 4.1 - Créer le script de benchmark',
    configuration: BENCHMARK_CONFIG,
    results: results.map(r => ({
      config: r.config,
      summary: {
        uniqueRequests: {
          count: r.uniqueRequests.count,
          avgTimeMs: Math.round(r.uniqueRequests.avgTime * 100) / 100,
          minTimeMs: Math.round(r.uniqueRequests.minTime * 100) / 100,
          maxTimeMs: Math.round(r.uniqueRequests.maxTime * 100) / 100,
          cacheHits: r.uniqueRequests.cacheHits,
          cacheMisses: r.uniqueRequests.cacheMisses,
          apiCalls: r.uniqueRequests.apiCalls,
        },
        repeatedRequests: {
          count: r.repeatedRequests.count,
          avgTimeMs: Math.round(r.repeatedRequests.avgTime * 100) / 100,
          minTimeMs: Math.round(r.repeatedRequests.minTime * 100) / 100,
          maxTimeMs: Math.round(r.repeatedRequests.maxTime * 100) / 100,
          cacheHits: r.repeatedRequests.cacheHits,
          cacheMisses: r.repeatedRequests.cacheMisses,
          apiCalls: r.repeatedRequests.apiCalls,
        },
        overall: {
          totalRequests: r.overall.totalRequests,
          totalTimeMs: Math.round(r.overall.totalTime * 100) / 100,
          avgTimeMs: Math.round(r.overall.avgTime * 100) / 100,
          cacheHitRate: Math.round(r.overall.cacheHitRate * 100) / 100,
          apiCallReduction: Math.round(r.overall.apiCallReduction * 100) / 100,
        },
      },
    })),
  };

  // Sauvegarder le rapport
  fs.writeFileSync(BENCHMARK_REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');

  log(`✅ Rapport sauvegardé: ${BENCHMARK_REPORT_PATH}`, {}, 'green');

  return report;
}

/**
 * Valide les Acceptance Criteria
 * @param results Résultats du benchmark
 */
function validateAcceptanceCriteria(results) {
  log('\n🎯 Validation des Acceptance Criteria...', {}, 'cyan');

  const acResults = {
    ac1: { satisfied: false, message: '', details: {} },
    ac2: { satisfied: false, message: '', details: {} },
    ac3: { satisfied: false, message: '', details: {} },
  };

  // Trouver les résultats avec cache
  const cacheResults = results.find(r => r.config.includes('Cache'));

  if (!cacheResults) {
    log('❌ Impossible de trouver les résultats avec cache', {}, 'red');
    return acResults;
  }

  // AC1: Cache hit ratio > 30% pour les requêtes répétées
  const repeatedHitRate = cacheResults.overall.cacheHitRate;
  acResults.ac1.satisfied = repeatedHitRate > BENCHMARK_CONFIG.cacheHitRateThreshold;
  acResults.ac1.message = acResults.ac1.satisfied
    ? `✅ Cache hit ratio ${repeatedHitRate.toFixed(2)}% > ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`
    : `❌ Cache hit ratio ${repeatedHitRate.toFixed(2)}% <= ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`;
  acResults.ac1.details = { required: `> ${BENCHMARK_CONFIG.cacheHitRateThreshold}%`, actual: `${repeatedHitRate.toFixed(2)}%` };

  // AC2: Temps de réponse < 50ms pour les cache hits
  const cacheHitAvgTime = cacheResults.repeatedRequests.avgTime;
  acResults.ac2.satisfied = cacheHitAvgTime < BENCHMARK_CONFIG.cacheHitThresholdMs;
  acResults.ac2.message = acResults.ac2.satisfied
    ? `✅ Cache hit temps moyen ${cacheHitAvgTime.toFixed(2)}ms < ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`
    : `❌ Cache hit temps moyen ${cacheHitAvgTime.toFixed(2)}ms >= ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`;
  acResults.ac2.details = { required: `< ${BENCHMARK_CONFIG.cacheHitThresholdMs}ms`, actual: `${cacheHitAvgTime.toFixed(2)}ms` };

  // AC3: Réduction des appels API
  const apiReduction = cacheResults.overall.apiCallReduction;
  acResults.ac3.satisfied = apiReduction > 0;
  acResults.ac3.message = acResults.ac3.satisfied
    ? `✅ Réduction des appels API: ${apiReduction.toFixed(2)}%`
    : `❌ Pas de réduction des appels API: ${apiReduction.toFixed(2)}%`;
  acResults.ac3.details = { required: '> 0%', actual: `${apiReduction.toFixed(2)}%` };

  // Log les résultats
  Object.keys(acResults).forEach(ac => {
    const result = acResults[ac];
    log(result.message, result.details, result.satisfied ? 'green' : 'red');
  });

  const allSatisfied = Object.values(acResults).every(r => r.satisfied);
  log(`\n${allSatisfied ? '✅ TOUS LES AC SATISFAITS' : '❌ CERTAINS AC NON SATISFAITS'}`, {}, allSatisfied ? 'green' : 'red');

  return acResults;
}

/**
 * Fonction principale du benchmark RÉEL (appels API Mistral / Redis réels).
 * Nécessite MISTRAL_API_KEY. Pour une simulation sans dépendances externes
 * (CI, dev sans credentials), utiliser cache-benchmark.mock.js à la place.
 */
async function runCacheBenchmark() {
  log('\n' + '='.repeat(60), {}, 'cyan');
  log('🚀 DÉMARRAGE DU BENCHMARK RÉEL - CACHE EMBEDDINGS', {}, 'cyan');
  log('Story: ST-403 - Implémenter le Cache des Embeddings', {}, 'cyan');
  log('Tâche: 4.1 - Créer le script de benchmark', {}, 'cyan');
  log('='.repeat(60), {}, 'cyan');

  // Valider la configuration
  validateBenchmarkConfig();

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error(
      "MISTRAL_API_KEY non configuré — ce script exécute un VRAI benchmark (appels API réels).\n" +
      "Renseignez .env (voir .env.example), ou utilisez `npm run benchmark:cache:mock` pour une " +
      'simulation locale sans dépendances externes.'
    );
  }

  const redisConfigured = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  if (!redisConfigured) {
    log(
      '⚠️  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN non configurés : la configuration ' +
      '"Avec Cache Redis + In-Memory" sera ignorée (voir .env.example pour activer Redis).',
      {},
      'yellow'
    );
  }

  // Définir les configurations à tester (réelles)
  const configurations = [
    ...(redisConfigured
      ? [{ name: 'Avec Cache Redis + In-Memory', useRedis: true, useInMemory: true, useCache: true }]
      : []),
    { name: 'Avec Cache In-Memory seulement', useRedis: false, useInMemory: true, useCache: true },
    { name: 'Sans Cache', useRedis: false, useInMemory: false, useCache: false },
  ];

  // Exécuter les benchmarks réels
  const results = [];
  for (const config of configurations) {
    const result = await measureRealPerformance(config);
    results.push(result);
  }

  // Générer le rapport
  const report = generateReport(results);

  // Valider les Acceptance Criteria
  const acResults = validateAcceptanceCriteria(results);

  // Résumé final
  log('\n' + '='.repeat(60), {}, 'cyan');
  log('📊 RÉSULTATS DU BENCHMARK RÉEL', {}, 'cyan');
  log('='.repeat(60), {}, 'cyan');

  results.forEach((result, index) => {
    log(`\n${configurations[index].name}:`, {}, 'magenta');
    log(`  Requêtes uniques (${result.uniqueRequests.count}):`, {}, 'yellow');
    log(`    - Temps moyen: ${result.uniqueRequests.avgTime.toFixed(2)}ms`, {}, 'white');
    log(`    - Temps min: ${result.uniqueRequests.minTime}ms`, {}, 'white');
    log(`    - Temps max: ${result.uniqueRequests.maxTime}ms`, {}, 'white');
    log(`    - Cache hits: ${result.uniqueRequests.cacheHits}`, {}, 'white');
    log(`    - Cache misses: ${result.uniqueRequests.cacheMisses}`, {}, 'white');
    log(`    - Appels API: ${result.uniqueRequests.apiCalls}`, {}, 'white');

    log(`  Requêtes répétées (${result.repeatedRequests.count}):`, {}, 'yellow');
    log(`    - Temps moyen: ${result.repeatedRequests.avgTime.toFixed(2)}ms`, {}, 'white');
    log(`    - Temps min: ${result.repeatedRequests.minTime}ms`, {}, 'white');
    log(`    - Temps max: ${result.repeatedRequests.maxTime}ms`, {}, 'white');
    log(`    - Cache hits: ${result.repeatedRequests.cacheHits}`, {}, 'white');
    log(`    - Cache misses: ${result.repeatedRequests.cacheMisses}`, {}, 'white');
    log(`    - Appels API: ${result.repeatedRequests.apiCalls}`, {}, 'white');

    log(`  Global:`, {}, 'yellow');
    log(`    - Taux cache hit: ${result.overall.cacheHitRate.toFixed(2)}%`, {}, 'white');
    log(`    - Réduction appels API: ${result.overall.apiCallReduction.toFixed(2)}%`, {}, 'white');
  });

  log('\n' + '='.repeat(60), {}, 'cyan');
  log('✅ BENCHMARK TERMINÉ', {}, 'green');
  log(`Fichiers générés:`, {}, 'green');
  log(`  - Rapport: ${BENCHMARK_REPORT_PATH}`, {}, 'green');
  log(`  - Log: ${BENCHMARK_LOG_PATH}`, {}, 'green');
  log('='.repeat(60), {}, 'cyan');

  return {
    results,
    report,
    acResults,
    reportPath: BENCHMARK_REPORT_PATH,
    logPath: BENCHMARK_LOG_PATH,
  };
}

/**
 * Exporter les fonctions pour les tests
 */
module.exports = {
  runCacheBenchmark,
  generateTestData,
  measurePerformance,
  measureRealPerformance,
  generateReport,
  validateAcceptanceCriteria,
  BENCHMARK_CONFIG,
  generateTestText,
  MockRedisCache,
  MockEmbeddingService,
  MockRedisEmbeddingCache,
  RealUpstashRedis,
  RealEmbeddingCache,
  RealEmbeddingService,
};

// Exécuter si ce fichier est lancé directement
if (require.main === module) {
  runCacheBenchmark().catch(error => {
    log('❌ ERREUR: Échec du benchmark', { message: error.message }, 'red');
    process.exitCode = 1;
  });
}
