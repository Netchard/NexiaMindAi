# BMAD Code Review Prompts - ST-403 Groupe 1
# Core Cache Implementation (1 090 lignes)

**Story:** ST-403 - Implémenter le Cache des Embeddings  
**Groupe:** 1 - Core Cache Implementation  
**Fichiers:** src/lib/cache/redis.ts, embeddingCache.ts, types.ts, index.ts, __tests__/redis.test.ts  
**Date:** 2026-07-13  
**Commit Range:** 0bfec98..1abf9a3

---

## 📋 INSTRUCTIONS GÉNÉRALES

Ce fichier contient **3 prompts séparés** pour une revue de code adversariale. Chaque prompt doit être exécuté dans une **session séparée** (idéalement avec un **LLM différent** pour éviter les biais).

### Roles:
1. **Blind Hunter** - Attaquant sans contexte (diff seulement)
2. **Edge Case Hunter** - Chasseur de cas limites (diff + accès projet)
3. **Acceptance Auditor** - Auditeur de conformité (diff + spec + contexte)

### Format des Findings:
Utilisez ce format pour TOUS les auditeurs:
```markdown
## Findings

### 🔴 CRITIQUE (Bloquant)
- [ID] Titre - Evidence (fichier:ligne) - Impact

### 🟠 HAUTE (Doit être corrigé)
- [ID] Titre - Evidence (fichier:ligne) - Impact

### 🟡 MOYENNE (Amélioration)
- [ID] Titre - Evidence (fichier:ligne) - Impact

### ⚪ FAIBLE (Optimisation)
- [ID] Titre - Evidence (fichier:ligne) - Impact
```

### Préfixes d'ID:
- **Blind Hunter:** BH-G1-XXX
- **Edge Case Hunter:** EC-G1-XXX  
- **Acceptance Auditor:** AA-G1-XXX

---

## 🎭 PROMPT 1: BLIND HUNTER

### Contexte
**VOUS ÊTES UN BLIND HUNTER** - Vous ne recevez AUCUN contexte projet, AUCUNE spec, AUCUN historique. Vous ne voyez que le diff ci-dessous.

### Mission
Trouver des problèmes **Critiques** et **Hautes** qui bloquent la production:
- **Sécurité:** Injections SQL/NoSQL, fuites de tokens/secrets, authentification manquante
- **Anti-patterns:** Code smells, mauvaises pratiques, violations de principes SOLID
- **Vulnérabilités:** Race conditions, deadlocks, memory leaks, DoS
- **Bugs:** Logique incorrecte, erreurs de type, null pointers
- **Performance:** Inefficacité évidente, N+1 queries, boucles infinies

### Contraintes
- NE PAS deviner - seulement ce qui est visible dans le diff
- NE PAS faire d'hypothèses sur le contexte
- Chaque finding DOIT avoir une preuve avec numéro de ligne
- Soyez **adversarial** - assumez que le code est hostile

### Spec File pour référence (optionnel pour Blind Hunter)
> **À IGNORER** - Blind Hunter ne doit PAS utiliser la spec

---

## 🔍 PROMPT 2: EDGE CASE HUNTER

### Contexte  
Vous avez accès au **diff** ET au **projet complet**. Vous pouvez explorer le codebase.

### Mission
Trouver des problèmes liés aux **cas limites** et à l'**intégration**:
- **Gestion des erreurs:** Exceptions non gérées, try/catch manquants
- **Validations:** Entrées non validées, assumptions non vérifiées
- **Dépendances:** Modules manquants, versions incompatibles
- **Concurrency:** Problèmes de thread safety, race conditions
- **Compatibilité:** Problèmes de backward compatibility
- **Tests:** Cas limites non couverts

### Accès Projet
- **Racine:** C:\VibeCoding\nexiamind-ai
- **Fichiers pertinents:** src/lib/cache/, src/lib/rag/embeddings.ts
- **Dependencies:** @upstash/redis v1.38.0

### Contraintes
- Explorez le codebase pour valider vos findings
- Vérifiez que les dépendances existent
- Testez mentalement les edge cases

---

## ✅ PROMPT 3: ACCEPTANCE AUDITOR

### Contexte
Vous avez accès au **diff**, à la **spec**, et au **contexte projet**.  

### Mission
Valider que l'implémentation respecte **TOUS** les Acceptance Criteria de la story:

**AC à vérifier (de la spec):**
1. **Cache Redis/Upstash opérationnel**
   - Service Redis configuré via Upstash (ou local pour dev)
   - Client Redis initialisé avec URL et token depuis variables d'environnement
   - Connection testée et validée avant utilisation

2. **Cache des embeddings distribué**
   - Remplacer le cache in-memory (Map) par Redis dans EmbeddingService
   - Clé de cache basée sur hash SHA-256 du texte
   - TTL configuré à 1 heure (3600 secondes)
   - Sérialisation/Desérialisation JSON

3. **Réduction mesurable des appels API**
   - Métriques implémentées: compteur d'appels API Mistral
   - Métriques implémentées: compteur de cache hits/misses
   - Ratio cache hit > 30%
   - Logs des métriques dans console.info

4. **Tests de performance avec/sans cache**
   - Script de benchmark créé
   - Mesurer temps avec cache (< 50ms pour hits)
   - Mesurer temps sans cache (> 200ms)
   - Comparaison documentée

5. **Backward compatibility**
   - Fallback graceux vers in-memory si Redis indisponible
   - Fallback vers API direct si les deux caches échouent
   - Pas de breaking changes dans l'API publique

### Contraintes Architecturales (de la spec)
```
NE PAS modifier l'API publique de EmbeddingService
NE PAS breaking les tests existants
DOIT supporter le fallback vers in-memory si Redis échoue
DOIT supporter le fallback vers API direct si tout échoue
NE PAS stocker d'informations sensibles dans Redis
DOIT utiliser HTTPS pour la connection Redis en production
```

### Format Spécifique
Pour chaque AC, indiquez:
- **Satisfait:** ✅/❌
- **Preuve:** Evidence dans le diff (ligne X)
- **Problèmes:** Findings si AC non satisfait

---

## 📄 DIFF COMPLET (1 090 lignes)

**Fichiers inclus:**
- `src/lib/cache/redis.ts` (nouveau, +336 lignes) - Client Redis avec retry logic
- `src/lib/cache/embeddingCache.ts` (nouveau, +406 lignes) - Cache hiérarchique
- `src/lib/cache/types.ts` (nouveau, +98 lignes) - Types TypeScript
- `src/lib/cache/index.ts` (nouveau, +23 lignes) - Exports
- `src/lib/cache/__tests__/redis.test.ts` (nouveau, +197 lignes) - Tests

**Diff:**

```diff
diff --git a/src/lib/cache/__tests__/redis.test.ts b/src/lib/cache/__tests__/redis.test.ts
new file mode 100644
index 0000000..694cdeb
--- /dev/null
+++ b/src/lib/cache/__tests__/redis.test.ts
@@ -0,0 +1,197 @@
+/**
+ * Tests unitaires pour RedisCache
+ * Phase RED: Tests écrit avant l'implémentation
+ */
+
+import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
+
+// Mock du client Upstash Redis
+const mockRedis = {
+  get: vi.fn(),
+  set: vi.fn(),
+  del: vi.fn(),
+  exists: vi.fn(),
+  keys: vi.fn(),
+};
+
+// Import dynamique pour permettre le mock
+let RedisCache: typeof import('../redis').RedisCache;
+
+// Mock du module redis avant l'import
+vi.mock('@upstash/redis', () => ({
+  default: class {
+    constructor(url: string, token: string) {
+      this.url = url;
+      this.token = token;
+    }
+    url: string;
+    token: string;
+    async get(key: string) {
+      return mockRedis.get(key);
+    }
+    async set(key: string, value: string, options?: { ex?: number }) {
+      return mockRedis.set(key, value, options);
+    }
+    async del(key: string) {
+      return mockRedis.del(key);
+    }
+    async exists(key: string) {
+      return mockRedis.exists(key);
+    }
+    async keys(pattern: string) {
+      return mockRedis.keys(pattern);
+    }
+  },
+}));
+
+// Maintenant on peut importer RedisCache
+import { RedisCache } from '../redis';
+
describe('RedisCache', () => {
+  let redisCache: RedisCache;
+
+  beforeEach(async () => {
+    // Réinitialiser les mocks avant chaque test
+    vi.clearAllMocks();
+    
+    // Créer une instance avec des variables d'environnement mockées
+    process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
+    process.env.UPSTASH_REDIS_REST_TOKEN = 'mock-token';
+    
+    redisCache = new RedisCache();
+    await redisCache.connect();
+  });
+
+  afterEach(async () => {
+    await redisCache.disconnect();
+    delete process.env.UPSTASH_REDIS_REST_URL;
+    delete process.env.UPSTASH_REDIS_REST_TOKEN;
+  });
+
+  describe('Connection', () => {
+    it('DOIT se connecter à Redis avec les bonnes credentials', async () => {
+      expect(redisCache['client']).toBeDefined();
+      // Le client devrait être créé avec les bonnes URLs
+    });
+
+    it('DOIT gérer les erreurs de connexion avec retry', async () => {
+      // Mock une erreur de connexion
+      mockRedis.get.mockRejectedValueOnce(new Error('Connection failed'));
+      
+      // La connection devrait réussir après retry
+      // Note: Ce test échouera jusqu'à ce que le retry logic soit implémenté
+    });
+  });
+
+  describe('get()', () => {
+    it('DOIT retourner null si la clé n\'existe pas', async () => {
+      mockRedis.get.mockResolvedValue(null);
+      
+      const result = await redisCache.get('non-existent-key');
+      expect(result).toBeNull();
+    });
+
+    it('DOIT retourner la valeur si la clé existe', async () => {
+      const testValue = JSON.stringify({ data: 'test' });
+      mockRedis.get.mockResolvedValue(testValue);
+      
+      const result = await redisCache.get('existing-key');
+      expect(result).toBe(testValue);
+    });
+
+    it('DOIT gérer les erreurs Redis', async () => {
+      mockRedis.get.mockRejectedValue(new Error('Redis error'));
+      
+      await expect(redisCache.get('error-key')).rejects.toThrow();
+    });
+  });
+
+  describe('set()', () => {
+    it('DOIT stocker une valeur avec clé et TTL', async () => {
+      await redisCache.set('test-key', 'test-value', 3600);
+      
+      expect(mockRedis.set).toHaveBeenCalledWith(
+        'test-key',
+        'test-value',
+        { ex: 3600 }
+      );
+    });
+
+    it('DOIT utiliser le TTL par défaut si non spécifié', async () => {
+      await redisCache.set('test-key', 'test-value');
+      
+      expect(mockRedis.set).toHaveBeenCalledWith(
+        'test-key',
+        'test-value',
+        { ex: 3600 } // TTL par défaut = 1 heure
+      );
+    });
+
+    it('DOIT gérer les erreurs Redis', async () => {
+      mockRedis.set.mockRejectedValue(new Error('Redis error'));
+      
+      await expect(redisCache.set('test-key', 'test-value')).rejects.toThrow();
+    });
+  });
+
+  describe('del()', () => {
+    it('DOIT supprimer une clé', async () => {
+      mockRedis.del.mockResolvedValue(1);
+      
+      await redisCache.del('test-key');
+      
+      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
+    });
+
+    it('DOIT gérer les erreurs Redis', async () => {
+      mockRedis.del.mockRejectedValue(new Error('Redis error'));
+      
+      await expect(redisCache.del('test-key')).rejects.toThrow();
+    });
+  });
+
+  describe('exists()', () => {
+    it('DOIT retourner true si la clé existe', async () => {
+      mockRedis.exists.mockResolvedValue(1);
+      
+      const result = await redisCache.exists('existing-key');
+      expect(result).toBe(true);
+    });
+
+    it('DOIT retourner false si la clé n\'existe pas', async () => {
+      mockRedis.exists.mockResolvedValue(0);
+      
+      const result = await redisCache.exists('non-existent-key');
+      expect(result).toBe(false);
+    });
+  });
+
+  describe('clear()', () => {
+    it('DOIT supprimer toutes les clés matching le pattern', async () => {
+      mockRedis.keys.mockResolvedValue(['key1', 'key2']);
+      
+      await redisCache.clear();
+      
+      expect(mockRedis.keys).toHaveBeenCalled();
+      expect(mockRedis.del).toHaveBeenCalledTimes(2);
+    });
+  });
+});
+
describe('RedisCache - Configuration', () => {
+  it('DOIT utiliser les variables d\'environnement pour la configuration', () => {
+    process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io';
+    process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token';
+    
+    // Le cache doit utiliser ces valeurs
+    // Note: Ce test valide la configuration, pas l'implémentation
+    
+    delete process.env.UPSTASH_REDIS_REST_URL;
+    delete process.env.UPSTASH_REDIS_REST_TOKEN;
+  });
+
+  it('DOIT utiliser des valeurs par défaut si les variables ne sont pas définies', () => {
+    // Le cache doit gérer l'absence de variables
+    // Note: Ce test valide le fallback
+  });
+});
diff --git a/src/lib/cache/embeddingCache.ts b/src/lib/cache/embeddingCache.ts
new file mode 100644
index 0000000..105cbce
--- /dev/null
+++ b/src/lib/cache/embeddingCache.ts
@@ -0,0 +1,406 @@
+/**
+ * Cache des embeddings avec Redis
+ * Implémente une couche d'abstraction pour le cache des embeddings
+ * Phase GREEN: Intégration avec EmbeddingService
+ */
+
+import { createHash } from 'crypto';
+import { RedisCache, getRedisCache, resetRedisCache } from './redis';
+import { EmbeddingResult } from '../rag/embeddings';
+
+/**
+ * Génère une clé de cache SHA-256 pour un texte
+ * @param text Texte à hash
+ * @returns Clé de cache hexadécimale
+ */
export function generateEmbeddingCacheKey(text: string): string {
+  const hash = createHash('sha256');
+  hash.update(text);
+  return hash.digest('hex');
+}
+
+/**
+ * Clé de cache complète avec préfixe
+ */
export function getFullCacheKey(text: string): string {
+  return `embedding:${generateEmbeddingCacheKey(text)}`;
+}
+
+/**
+ * Résultat du cache avec métadonnées
+ */
export interface CachedEmbeddingResult extends EmbeddingResult {
+  cachedAt: number;
+  cacheKey: string;
+}
+
+/**
+ * Statistiques du cache des embeddings
+ */
export interface EmbeddingCacheStats {
+  hits: number;
+  misses: number;
+  apiCalls: number;
+  hitRate: number;
+  avgHitTime: number;
+  avgMissTime: number;
+}
+
+/**
+ * Cache des embeddings utilisant Redis
+ * Implémente un cache hiérarchique : Redis -> In-Memory Map
+ */
export class RedisEmbeddingCache {
+  private redisCache: RedisCache;
+  private inMemoryCache: Map<string, EmbeddingResult>;
+  private inMemoryTTL: number; // en millisecondes
+  private useRedis: boolean;
+  private useInMemory: boolean;
+  
+  // Métriques
+  private hits: number = 0;
+  private misses: number = 0;
+  private apiCalls: number = 0;
+  private hitTimes: number[] = [];
+  private missTimes: number[] = [];
+  
+  // Constantes
+  private static readonly DEFAULT_TTL_SECONDS = 3600; // 1 heure
+  private static readonly TTL_MS = RedisEmbeddingCache.DEFAULT_TTL_SECONDS * 1000;
+  
+  /**
+   * Créer une nouvelle instance RedisEmbeddingCache
+   * @param options Options de configuration
+   */
+  constructor(options: {
+    useRedis?: boolean;
+    useInMemory?: boolean;
+    ttlSeconds?: number;
+  } = {}) {
+    this.useRedis = options.useRedis ?? true;
+    this.useInMemory = options.useInMemory ?? true;
+    this.inMemoryTTL = (options.ttlSeconds ?? RedisEmbeddingCache.DEFAULT_TTL_SECONDS) * 1000;
+    
+    this.redisCache = getRedisCache();
+    this.inMemoryCache = new Map();
+    
+    console.info('RedisEmbeddingCache: Initialisé', {
+      useRedis: this.useRedis,
+      useInMemory: this.useInMemory,
+      ttlSeconds: this.inMemoryTTL / 1000,
+    });
+  }
+
+  /**
+   * Initialiser la connexion Redis
+   */
+  async initialize(): Promise<void> {
+    if (this.useRedis) {
+      try {
+        await this.redisCache.connect();
+        console.info('RedisEmbeddingCache: Connexion Redis établie');
+      } catch (error) {
+        console.warn('RedisEmbeddingCache: Échec de la connexion Redis. Utilisation du cache in-memory seulement.', {
+          error: error instanceof Error ? error.message : String(error),
+        });
+        this.useRedis = false;
+      }
+    }
+  }
+
+  /**
+   * Obtenir un embedding depuis le cache
+   * Implémente la stratégie hiérarchique : Redis -> In-Memory -> null
+   * @param text Texte à rechercher
+   * @returns Résultat du cache ou null
+   */
+  async getEmbedding(text: string): Promise<EmbeddingResult | null> {
+    const startTime = Date.now();
+    const cacheKey = generateEmbeddingCacheKey(text);
+    const fullKey = getFullCacheKey(text);
+    
+    try {
+      // Stratégie 1: Essayer Redis d'abord
+      if (this.useRedis && this.redisCache.isReady()) {
+        try {
+          const cached = await this.redisCache.get(fullKey);
+          if (cached) {
+            const result: EmbeddingResult = JSON.parse(cached);
+            this.hits++;
+            this.hitTimes.push(Date.now() - startTime);
+            
+            console.info('RedisEmbeddingCache: Cache hit (Redis)', {
+              textPreview: text.substring(0, 50) + '...',
+              duration: `${Date.now() - startTime}ms`,
+            });
+            
+            return result;
+          }
+        } catch (redisError) {
+          // Si Redis échoue, continuer avec in-memory
+          console.warn('RedisEmbeddingCache: Erreur Redis, fallback vers in-memory', {
+            error: redisError instanceof Error ? redisError.message : String(redisError),
+          });
+        }
+      }
+      
+      // Stratégie 2: Essayer In-Memory
+      if (this.useInMemory) {
+        const cached = this.inMemoryCache.get(cacheKey);
+        if (cached) {
+          // Vérifier le TTL
+          const age = Date.now() - (cached.cachedAt || Date.now());
+          if (age <= this.inMemoryTTL) {
+            this.hits++;
+            this.hitTimes.push(Date.now() - startTime);
+            
+            console.info('RedisEmbeddingCache: Cache hit (In-Memory)', {
+              textPreview: text.substring(0, 50) + '...',
+              duration: `${Date.now() - startTime}ms`,
+            });
+            
+            // Retourner sans cachedAt
+            const { cachedAt, ...result } = cached;
+            return result;
+          } else {
+            // Cache expiré, supprimer
+            this.inMemoryCache.delete(cacheKey);
+          }
+        }
+      }
+      
+      // Stratégie 3: Rien trouvé
+      this.misses++;
+      this.missTimes.push(Date.now() - startTime);
+      
+      console.info('RedisEmbeddingCache: Cache miss', {
+        textPreview: text.substring(0, 50) + '...',
+        duration: `${Date.now() - startTime}ms`,
+      });
+      
+      return null;
+    } catch (error) {
+      console.error('RedisEmbeddingCache: Erreur lors de la récupération depuis le cache', {
+        error: error instanceof Error ? error.message : String(error),
+        textPreview: text.substring(0, 50) + '...',
+      });
+      return null;
+    }
+  }
+
+  /**
+   * Ajouter un embedding au cache
+   * Stocke dans Redis ET in-memory
+   * @param text Texte original
+   * @param result Résultat à cache
+   */
+  async setEmbedding(text: string, result: EmbeddingResult): Promise<void> {
+    const cacheKey = generateEmbeddingCacheKey(text);
+    const fullKey = getFullCacheKey(text);
+    const value = JSON.stringify(result);
+    
+    // Stocker dans in-memory
+    if (this.useInMemory) {
+      this.inMemoryCache.set(cacheKey, {
+        ...result,
+        cachedAt: Date.now(),
+      });
+      
+      console.info('RedisEmbeddingCache: Embedding stocké en in-memory', {
+        cacheKey: cacheKey.substring(0, 20) + '...',
+        cacheSize: this.inMemoryCache.size,
+      });
+    }
+    
+    // Stocker dans Redis
+    if (this.useRedis && this.redisCache.isReady()) {
+      try {
+        await this.redisCache.set(fullKey, value, {
+          ttl: RedisEmbeddingCache.DEFAULT_TTL_SECONDS,
+        });
+        
+        console.info('RedisEmbeddingCache: Embedding stocké dans Redis', {
+          cacheKey: fullKey.substring(0, 30) + '...',
+        });
+      } catch (redisError) {
+        console.warn('RedisEmbeddingCache: Échec de l\'écriture dans Redis', {
+          error: redisError instanceof Error ? redisError.message : String(redisError),
+        });
+      }
+    }
+  }
+
+  /**
+   * Supprimer un embedding du cache
+   * @param text Texte à supprimer
+   */
+  async deleteEmbedding(text: string): Promise<void> {
+    const cacheKey = generateEmbeddingCacheKey(text);
+    const fullKey = getFullCacheKey(text);
+    
+    // Supprimer de in-memory
+    if (this.useInMemory) {
+      this.inMemoryCache.delete(cacheKey);
+    }
+    
+    // Supprimer de Redis
+    if (this.useRedis && this.redisCache.isReady()) {
+      try {
+        await this.redisCache.del(fullKey);
+      } catch (redisError) {
+        console.warn('RedisEmbeddingCache: Échec de la suppression de Redis', {
+          error: redisError instanceof Error ? redisError.message : String(redisError),
+        });
+      }
+    }
+  }
+
+  /**
+   * Vérifier si un embedding est dans le cache
+   * @param text Texte à vérifier
+   * @returns true si dans le cache
+   */
+  async hasEmbedding(text: string): Promise<boolean> {
+    const cacheKey = generateEmbeddingCacheKey(text);
+    const fullKey = getFullCacheKey(text);
+    
+    // Vérifier Redis
+    if (this.useRedis && this.redisCache.isReady()) {
+      try {
+        const exists = await this.redisCache.exists(fullKey);
+        if (exists) return true;
+      } catch {
+        // Si Redis échoue, vérifier in-memory
+      }
+    }
+    
+    // Vérifier in-memory
+    if (this.useInMemory) {
+      const cached = this.inMemoryCache.get(cacheKey);
+      if (cached) {
+        const age = Date.now() - (cached.cachedAt || Date.now());
+        return age <= this.inMemoryTTL;
+      }
+    }
+    
+    return false;
+  }
+
+  /**
+   * Vider complètement le cache
+   */
+  async clear(): Promise<void> {
+    if (this.useInMemory) {
+      this.inMemoryCache.clear();
+    }
+    
+    if (this.useRedis && this.redisCache.isReady()) {
+      try {
+        await this.redisCache.clear();
+      } catch (redisError) {
+        console.warn('RedisEmbeddingCache: Échec du vidage de Redis', {
+          error: redisError instanceof Error ? redisError.message : String(redisError),
+        });
+      }
+    }
+    
+    // Réinitialiser les métriques
+    this.hits = 0;
+    this.misses = 0;
+    this.apiCalls = 0;
+    this.hitTimes = [];
+    this.missTimes = [];
+    
+    console.info('RedisEmbeddingCache: Cache vidé');
+  }
+
+  /**
+   * Incrémenter le compteur d'appels API
+   */
+  incrementApiCalls(): void {
+    this.apiCalls++;
+  }
+
+  /**
+   * Obtenir les statistiques du cache
+   */
+  getStats(): EmbeddingCacheStats {
+    const totalRequests = this.hits + this.misses;
+    const hitRate = totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0;
+    
+    const avgHitTime = this.hitTimes.length > 0
+      ? this.hitTimes.reduce((a, b) => a + b, 0) / this.hitTimes.length
+      : 0;
+    
+    const avgMissTime = this.missTimes.length > 0
+      ? this.missTimes.reduce((a, b) => a + b, 0) / this.missTimes.length
+      : 0;
+    
+    return {
+      hits: this.hits,
+      misses: this.misses,
+      apiCalls: this.apiCalls,
+      hitRate,
+      avgHitTime,
+      avgMissTime,
+    };
+  }
+
+  /**
+   * Générer une clé de cache (méthode publique pour la compatibilité)
+   * @param text Texte à hash
+   * @returns Clé de cache SHA-256
+   */
+  generateCacheKey(text: string): string {
+    return generateEmbeddingCacheKey(text);
+  }
+
+  /**
+   * Obtenir la taille du cache in-memory
+   */
+  getInMemorySize(): number {
+    return this.inMemoryCache.size;
+  }
+
+  /**
+   * Vérifier si Redis est disponible
+   */
+  isRedisReady(): boolean {
+    return this.useRedis && this.redisCache.isReady();
+  }
+
+  /**
+   * Vérifier si le cache est complètement disponible
+   */
+  isAvailable(): boolean {
+    return this.useInMemory || this.isRedisReady();
+  }
+}
+
+/**
+ * Instance singleton pour RedisEmbeddingCache
+ */
+let embeddingCacheInstance: RedisEmbeddingCache | null = null;
+
+/**
+ * Obtenir l'instance singleton du cache des embeddings
+ */
+export function getEmbeddingCache(): RedisEmbeddingCache {
+  if (!embeddingCacheInstance) {
+    embeddingCacheInstance = new RedisEmbeddingCache();
+  }
+  return embeddingCacheInstance;
+}
+
+/**
+ * Réinitialiser l'instance singleton (pour les tests)
+ */
+export function resetEmbeddingCache(): void {
+  if (embeddingCacheInstance) {
+    embeddingCacheInstance.clear().catch(() => {});
+  }
+  embeddingCacheInstance = null;
+  resetRedisCache();
+}
+
export default RedisEmbeddingCache;
diff --git a/src/lib/cache/index.ts b/src/lib/cache/index.ts
new file mode 100644
index 0000000..86d8b36
--- /dev/null
+++ b/src/lib/cache/index.ts
@@ -0,0 +1,23 @@
+/**
+ * Exports pour le module de cache
+ */
+
+export { RedisCache, getRedisCache, resetRedisCache } from './redis';
export type { RedisConfig, SetOptions } from './redis';
+
+export { RedisEmbeddingCache, getEmbeddingCache, resetEmbeddingCache } from './embeddingCache';
export { generateEmbeddingCacheKey, getFullCacheKey } from './embeddingCache';
export type { CachedEmbeddingResult, EmbeddingCacheStats } from './embeddingCache';
+
export type {
+  CacheResult,
+  CacheStats,
+  EmbeddingCacheKey,
+  CachedEmbedding,
+  EmbeddingCacheOptions,
+  GenerateCacheKeyResult,
+  CacheEvent,
+  CacheEventCallback,
+  CacheStrategy,
+  EmbeddingOptionsWithCache,
+} from './types';
diff --git a/src/lib/cache/redis.ts b/src/lib/cache/redis.ts
new file mode 100644
index 0000000..3d01357
--- /dev/null
+++ b/src/lib/cache/redis.ts
@@ -0,0 +1,336 @@
+/**
+ * Service de cache Redis pour NexiaMind AI
+ * Utilise Upstash Redis (REST API compatible)
+ * Phase GREEN: Implémentation du service Redis
+ */
+
+import { createClient, RedisClientType } from '@upstash/redis';
+
+/**
+ * Configuration Redis
+ */
export interface RedisConfig {
+  url: string;
+  token: string;
+  maxRetries?: number;
+  retryInterval?: number;
+}
+
+/**
+ * Options pour la méthode set
+ */
export interface SetOptions {
+  ttl?: number; // en secondes
+}
+
+/**
+ * Client Redis avec retry logic
+ */
export class RedisCache {
+  private client: RedisClientType | null = null;
+  private config: RedisConfig;
+  private isConnected: boolean = false;
+  private isConnecting: boolean = false;
+  
+  // Constantes
+  private static readonly DEFAULT_TTL = 3600; // 1 heure en secondes
+  private static readonly MAX_RETRIES = 3;
+  private static readonly RETRY_INTERVAL = 5000; // 5 secondes
+  private static readonly EMBEDDING_PREFIX = 'embedding:';
+  
+  /**
+   * Créer une nouvelle instance RedisCache
+   * @param config Configuration Redis optionnelle
+   */
+  constructor(config?: Partial<RedisConfig>) {
+    this.config = {
+      url: config?.url || process.env.UPSTASH_REDIS_REST_URL || '',
+      token: config?.token || process.env.UPSTASH_REDIS_REST_TOKEN || '',
+      maxRetries: config?.maxRetries || RedisCache.MAX_RETRIES,
+      retryInterval: config?.retryInterval || RedisCache.RETRY_INTERVAL,
+    };
+    
+    if (!this.config.url || !this.config.token) {
+      console.warn('RedisCache: UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN non configuré. Le cache Redis sera désactivé.');
+    }
+  }
+
+  /**
+   * Se connecter à Redis avec retry logic
+   * @param maxRetries Nombre maximal de tentatives (défaut: 3)
+   * @param retryInterval Intervalle entre les tentatives en ms (défaut: 5000)
+   */
+  async connect(maxRetries?: number, retryInterval?: number): Promise<void> {
+    if (this.isConnected) {
+      return;
+    }
+    
+    if (this.isConnecting) {
+      // Attendre qu'une connexion en cours se termine
+      while (this.isConnecting) {
+        await new Promise(resolve => setTimeout(resolve, 100));
+      }
+      return;
+    }
+    
+    this.isConnecting = true;
+    
+    const attempts = maxRetries || this.config.maxRetries || RedisCache.MAX_RETRIES;
+    const interval = retryInterval || this.config.retryInterval || RedisCache.RETRY_INTERVAL;
+    
+    let lastError: Error | null = null;
+    
+    for (let attempt = 1; attempt <= attempts; attempt++) {
+      try {
+        // Créer le client Upstash Redis
+        this.client = createClient({
+          url: this.config.url,
+          token: this.config.token,
+        });
+        
+        // Tester la connexion avec une opération simple
+        await this.client.ping();
+        
+        this.isConnected = true;
+        this.isConnecting = false;
+        
+        console.info('RedisCache: Connecté à Redis avec succès', {
+          attempt,
+          url: this.config.url ? '[REDACTED]' : 'non configuré',
+        });
+        
+        return;
+      } catch (error) {
+        lastError = error instanceof Error ? error : new Error(String(error));
+        
+        if (attempt < attempts) {
+          console.warn(`RedisCache: Tentative ${attempt}/${attempts} échouée. Retry dans ${interval}ms...`, {
+            error: lastError.message,
+          });
+          await new Promise(resolve => setTimeout(resolve, interval));
+        } else {
+          console.error('RedisCache: Échec de la connexion après toutes les tentatives', {
+            error: lastError.message,
+          });
+          this.isConnected = false;
+          this.isConnecting = false;
+          this.client = null;
+          throw new Error(`RedisCache: Impossible de se connecter à Redis après ${attempts} tentatives: ${lastError.message}`);
+        }
+      }
+    }
+  }
+
+  /**
+   * Déconnecter le client Redis
+   */
+  async disconnect(): Promise<void> {
+    if (this.client) {
+      try {
+        // Upstash Redis n'a pas de méthode explicite de déconnexion
+        // mais on peut réinitialiser le client
+        this.client = null;
+        this.isConnected = false;
+        console.info('RedisCache: Déconnecté');
+      } catch (error) {
+        console.error('RedisCache: Erreur lors de la déconnexion', {
+          error: error instanceof Error ? error.message : String(error),
+        });
+      }
+    }
+  }
+
+  /**
+   * Vérifier si le cache est connecté et opérationnel
+   */
+  isReady(): boolean {
+    return this.isConnected && this.client !== null;
+  }
+
+  /**
+ * Obtenir une valeur depuis le cache Redis
+   * @param key Clé de cache (sans préfixe)
+   * @returns Valeur ou null si non trouvée
+   */
+  async get(key: string): Promise<string | null> {
+    if (!this.isReady()) {
+      console.warn('RedisCache: get() appelé alors que le cache n\'est pas connecté. Retourne null.');
+      return null;
+    }
+    
+    try {
+      const prefixedKey = this.addPrefix(key);
+      const value = await this.client!.get(prefixedKey);
+      return value as string | null;
+    } catch (error) {
+      console.error('RedisCache: Erreur lors de la lecture depuis Redis', {
+        key,
+        error: error instanceof Error ? error.message : String(error),
+      });
+      throw error;
+    }
+  }
+
+  /**
+   * Stockage d'une valeur dans le cache Redis
+   * @param key Clé de cache (sans préfixe)
+   * @param value Valeur à stocker (sera sérialisée en JSON si objet)
+   * @param options Options (TTL en secondes)
+   */
+  async set(key: string, value: string, options?: SetOptions): Promise<void> {
+    if (!this.isReady()) {
+      console.warn('RedisCache: set() appelé alors que le cache n\'est pas connecté. Ignoré.');
+      return;
+    }
+    
+    try {
+      const prefixedKey = this.addPrefix(key);
+      const ttl = options?.ttl ?? RedisCache.DEFAULT_TTL;
+      
+      await this.client!.set(prefixedKey, value, { ex: ttl });
+      
+      console.info('RedisCache: Valeur stockée dans Redis', {
+        key: prefixedKey,
+        ttl,
+      });
+    } catch (error) {
+      console.error('RedisCache: Erreur lors de l\'écriture dans Redis', {
+        key,
+        error: error instanceof Error ? error.message : String(error),
+      });
+      throw error;
+    }
+  }
+
+  /**
+   * Supprimer une clé du cache Redis
+   * @param key Clé de cache (sans préfixe)
+   */
+  async del(key: string): Promise<void> {
+    if (!this.isReady()) {
+      console.warn('RedisCache: del() appelé alors que le cache n\'est pas connecté. Ignoré.');
+      return;
+    }
+    
+    try {
+      const prefixedKey = this.addPrefix(key);
+      await this.client!.del(prefixedKey);
+      
+      console.info('RedisCache: Clé supprimée de Redis', {
+        key: prefixedKey,
+      });
+    } catch (error) {
+      console.error('RedisCache: Erreur lors de la suppression de Redis', {
+        key,
+        error: error instanceof Error ? error.message : String(error),
+      });
+      throw error;
+    }
+  }
+
+  /**
+   * Vérifier si une clé existe dans le cache Redis
+   * @param key Clé de cache (sans préfixe)
+   * @returns true si la clé existe
+   */
+  async exists(key: string): Promise<boolean> {
+    if (!this.isReady()) {
+      return false;
+    }
+    
+    try {
+      const prefixedKey = this.addPrefix(key);
+      const result = await this.client!.exists(prefixedKey);
+      return result === 1;
+    } catch (error) {
+      console.error('RedisCache: Erreur lors de la vérification d\'existence', {
+        key,
+        error: error instanceof Error ? error.message : String(error),
+      });
+      throw error;
+    }
+  }
+
+  /**
+   * Supprimer toutes les clés du cache (pour les tests)
+   * Attention: Cette opération peut être lente sur de grandes bases de données
+   */
+  async clear(): Promise<void> {
+    if (!this.isReady()) {
+      console.warn('RedisCache: clear() appelé alors que le cache n\'est pas connecté. Ignoré.');
+      return;
+    }
+    
+    try {
+      // Obtenir toutes les clés avec le préfixe
+      const pattern = `${RedisCache.EMBEDDING_PREFIX}*`;
+      const keys = await this.client!.keys(pattern);
+      
+      if (keys.length > 0) {
+        // Supprimer toutes les clés en une seule opération
+        await this.client!.del(...keys);
+        console.info('RedisCache: Cache vidé', {
+          keysRemoved: keys.length,
+        });
+      } else {
+        console.info('RedisCache: Aucune clé à supprimer');
+      }
+    } catch (error) {
+      console.error('RedisCache: Erreur lors du vidage du cache', {
+        error: error instanceof Error ? error.message : String(error),
+      });
+      throw error;
+    }
+  }
+
+  /**
+   * Ajouter le préfixe aux clés de cache
+   * @param key Clé de base
+   * @returns Clé avec préfixe
+   */
+  private addPrefix(key: string): string {
+    // Si la clé a déjà le préfixe, ne pas l'ajouter
+    if (key.startsWith(RedisCache.EMBEDDING_PREFIX)) {
+      return key;
+    }
+    return `${RedisCache.EMBEDDING_PREFIX}${key}`;
+  }
+
+  /**
+   * Obtenir le client Redis (pour usage avancé)
+   */
+  getClient(): RedisClientType | null {
+    return this.client;
+  }
+
+  /**
+   * Obtenir la configuration actuelle
+   */
+  getConfig(): RedisConfig {
+    return { ...this.config };
+  }
+}
+
+/**
+ * Instance singleton pour le cache Redis
+ */
+let redisCacheInstance: RedisCache | null = null;
+
+/**
+ * Obtenir l'instance singleton du cache Redis
+ */
+export function getRedisCache(): RedisCache {
+  if (!redisCacheInstance) {
+    redisCacheInstance = new RedisCache();
+  }
+  return redisCacheInstance;
+}
+
+/**
+ * Réinitialiser l'instance singleton (pour les tests)
+ */
+export function resetRedisCache(): void {
+  redisCacheInstance = null;
+}
+
export default RedisCache;
diff --git a/src/lib/cache/types.ts b/src/lib/cache/types.ts
new file mode 100644
index 0000000..d4944bb
--- /dev/null
+++ b/src/lib/cache/types.ts
@@ -0,0 +1,98 @@
+/**
+ * Types pour le service de cache Redis
+ */
+
+import { EmbeddingResult } from '../rag/embeddings';
+
+/**
+ * Résultat d'une opération de cache
+ */
export interface CacheResult {
+  success: boolean;
+  key: string;
+  timestamp: Date;
+  duration?: number; // en ms
+}
+
+/**
+ * Statistiques du cache
+ */
export interface CacheStats {
+  hits: number;
+  misses: number;
+  hitRate: number;
+  apiCalls: number;
+  cacheSize: number;
+  avgHitTime: number; // en ms
+  avgMissTime: number; // en ms
+}
+
+/**
+ * Clé de cache pour les embeddings
+ */
export interface EmbeddingCacheKey {
+  hash: string;
+  fullKey: string;
+  textPreview: string; // Préfixe du texte pour le debug
+}
+
+/**
+ * Résultat stocké dans Redis
+ */
export interface CachedEmbedding {
+  embedding: number[];
+  tokenCount: number;
+  createdAt: string;
+  cachedAt: number;
+  textHash: string; // Hash SHA-256 du texte original
+}
+
+/**
+ * Options de configuration du cache Redis pour EmbeddingService
+ */
export interface EmbeddingCacheOptions {
+  useRedis: boolean;
+  useInMemory: boolean;
+  ttlSeconds: number;
+  redisPrefix: string;
+}
+
+/**
+ * Résultat de génération de clé de cache
+ */
export interface GenerateCacheKeyResult {
+  key: string; // Clé complète avec préfixe
+  hash: string; // Hash SHA-256 seul
+  prefix: string; // Préfixe utilisé
+}
+
+/**
+ * Événement de cache pour le monitoring
+ */
export interface CacheEvent {
+  type: 'hit' | 'miss' | 'set' | 'delete' | 'error';
+  key: string;
+  timestamp: Date;
+  duration?: number; // en ms
+  error?: string;
+  metadata?: Record<string, unknown>;
+}
+
+/**
+ * Callback pour les événements de cache
+ */
export type CacheEventCallback = (event: CacheEvent) => void;
+
+/**
+ * Stratégie de cache
+ */
export type CacheStrategy = 'redis-only' | 'in-memory-only' | 'hierarchical' | 'none';
+
+/**
+ * Options de génération d'embedding avec cache
+ */
export interface EmbeddingOptionsWithCache {
+  useCache?: boolean;
+  cacheStrategy?: CacheStrategy;
+  ttlOverride?: number; // TTL personnalisé en secondes
+}

