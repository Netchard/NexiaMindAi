# BMAD Code Review — Edge Case Hunter — ST-403 Groupe 1

**Story:** ST-403 - Implémenter le Cache des Embeddings
**Groupe:** 1 - Core Cache Implementation
**Rôle:** Edge Case Hunter (diff + accès complet au projet)
**Fichiers:** src/lib/cache/redis.ts, embeddingCache.ts, types.ts, index.ts, __tests__/redis.test.ts
**Commit Range:** 0bfec98..1abf9a3
**Date d'exécution:** 2026-07-13
**Source prompt:** _bmad-output/implementation-artifacts/bmad-review-prompt-ST-403-G1.md (Prompt 2)

**Méthodologie:** lecture complète du diff, puis vérification empirique — `npx tsc --noEmit`, `npx next build`, exécution réelle de `npx vitest run src/lib/cache/__tests__/redis.test.ts`, et inspection du package `@upstash/redis@1.38.0` réellement installé dans `node_modules`.

---

## Findings

### 🔴 CRITIQUE (Bloquant)

- **[EC-G1-001] La suite de tests ne compile pas — 0 test exécuté** — `src/lib/cache/__tests__/redis.test.ts:18` et `:48` : `RedisCache` est déclaré deux fois dans le même scope de module (`let RedisCache: typeof import('../redis').RedisCache;` puis `import { RedisCache } from '../redis';`). Vérifié en exécutant réellement `npx vitest run` : `Error: Transform failed with 1 error: ... The symbol "RedisCache" has already been declared`. Impact : le fichier de test livré avec le commit "ready for review" échoue à la transformation esbuild — aucun des 15+ tests écrits ne s'exécute jamais.

- **[EC-G1-002] `createClient` et `RedisClientType` n'existent pas dans `@upstash/redis`** — `src/lib/cache/redis.ts:7` : `import { createClient, RedisClientType } from '@upstash/redis';`. Le package réellement installé (v1.38.0, vérifié dans `node_modules/@upstash/redis/nodejs.d.ts`) n'exporte que `{ NestedIndexSchema, Redis, type RedisConfigNodejs, Requester, s }` — pas de `createClient`, pas de `RedisClientType`, pas d'export `default`. Confirmé par deux sources indépendantes : `npx tsc --noEmit` → `TS2305: Module '"@upstash/redis"' has no exported member 'createClient'` (x2), et `npx next build` → échec réel de compilation, avec trace d'import remontant jusqu'à une route API en production : `src/lib/cache/redis.ts → embeddingCache.ts → rag/embeddings.ts → supabase/storage/indexer.ts → app/api/sources/supabase/sync/route.ts`. Impact : le build Next.js entier est cassé, y compris une route API de production non liée au cache.

- **[EC-G1-003] `this.cacheTTL` référencé alors que la propriété n'existe pas sur `EmbeddingService`** — `src/lib/rag/embeddings.ts:162` : `cacheTTL: \`${this.cacheTTL / 1000 / 60} minutes\`` dans le constructeur, alors que la seule propriété déclarée est `inMemoryTTL` (ligne 99) ; `cacheTTL` n'est qu'un paramètre d'options du constructeur, jamais assigné à `this`. Confirmé par `tsc`: `TS2339: Property 'cacheTTL' does not exist on type 'EmbeddingService'`. **Hors périmètre du diff G1** (ce fichier n'est pas dans les 5 fichiers du commit) mais casse la compilation du fichier d'intégration RAG — à traiter par le groupe qui portera cette intégration.

- **[EC-G1-004] Le mock Redis du test ne définit pas `ping()`, appelé obligatoirement par `connect()`** — `src/lib/cache/__tests__/redis.test.ts:21-45` (classe mockée) vs `src/lib/cache/redis.ts:92` (`await this.client.ping();`). Même après correction d'EC-G1-001/EC-G1-002, `beforeEach` (`await redisCache.connect()`) appellerait `this.client.ping()` sur un mock qui ne l'implémente pas → `TypeError`, capturé par le `catch` de `connect()`, qui relance jusqu'à 3 tentatives avec un intervalle par défaut de 5000ms. Durée totale ≈ 10s, à comparer au `testTimeout: 10000` de `vitest.config.ts` — chaque `beforeEach` échouerait ou timeoutrait de façon flaky.

### 🟠 HAUTE (Doit être corrigé)

- **[EC-G1-005] Race condition sur `isConnecting` : un appelant concurrent reçoit un "succès" silencieux après un échec de connexion** — `src/lib/cache/redis.ts:68-74` (boucle d'attente) ; `:111-119` (chemin d'échec final). Si l'appel A à `connect()` échoue après ses 3 tentatives, il fait `isConnected=false; isConnecting=false; client=null; throw`. Un appel B concurrent, bloqué dans `while (this.isConnecting) { await sleep(100) }`, ne vérifie que `isConnecting` — dès que celui-ci repasse à `false`, B fait simplement `return` sans jamais vérifier `isConnected`. B croit donc que la connexion a réussi alors qu'elle a échoué.

- **[EC-G1-006] Aucune limite/timeout sur la boucle busy-wait ni sur `ping()`** — `src/lib/cache/redis.ts:68-71`. Si le premier appel `connect()` reste bloqué indéfiniment (aucun `AbortController`/timeout HTTP configuré sur le client Upstash), tout appelant concurrent boucle indéfiniment par pas de 100ms sans jamais expirer.

- **[EC-G1-007] Entrée Redis corrompue → cache poisoning silencieux et permanent** — `src/lib/cache/embeddingCache.ts:128` (`JSON.parse(cached)`, capturé par le `catch` englobant). Si une valeur stockée dans Redis n'est pas un JSON valide (corruption, ancien schéma), `getEmbedding()` retourne `null` (traité comme miss côté appelant) mais ne supprime jamais la clé fautive de Redis — chaque lecture suivante refera le même échec jusqu'à expiration du TTL.

- **[EC-G1-008] Désactivation définitive de Redis après un seul échec de connexion, sans reconnexion** — `src/lib/cache/embeddingCache.ts:97-109` (`initialize()`). En cas d'échec, `this.useRedis = false` est positionné de façon permanente pour la durée de vie de l'instance singleton — aucune tentative de reconnexion ultérieure. Une simple panne réseau transitoire au démarrage désactive Redis pour toute la session.

- **[EC-G1-009] `clear()` sans découpage (chunking) sur un grand nombre de clés** — `src/lib/cache/redis.ts:266-271` : `const keys = await this.client!.keys(pattern); await this.client!.del(...keys);`. Aucune limite sur `keys.length` avant le spread dans `del(...keys)` — risque de dépasser les limites de payload/arguments de l'API REST Upstash.

- **[EC-G1-010] Tests sans assertions réelles — faux positifs** — `src/lib/cache/__tests__/redis.test.ts:83-90` ("DOIT gérer les erreurs de connexion avec retry") et `:181-197` ("DOIT utiliser les variables d'environnement..." / "DOIT utiliser des valeurs par défaut..."). Ces trois tests ne contiennent aucun `expect()` — ce sont des commentaires suivis de setup mock non exploité. Ils passeront systématiquement quel que soit le comportement réel, créant une fausse impression de couverture.

### 🟡 MOYENNE (Amélioration)

- **[EC-G1-011]** Le mock de test utilise un `export default class` alors que le vrai module n'a pas d'export `default` (exporte uniquement `Redis`, nommé). Même après correction d'EC-G1-002, ce mock ne représentera plus l'API réelle et masquera silencieusement de futures régressions.

- **[EC-G1-012]** `getEmbeddingCache()` exporté publiquement sans auto-initialisation — le singleton n'appelle jamais `initialize()`/`connect()` lui-même, c'est `EmbeddingService` qui le fait. Tout code qui importe directement `getEmbeddingCache()` sans passer par `EmbeddingService` aura Redis silencieusement inactif, sans erreur ni avertissement visible.

- **[EC-G1-013]** Métriques `hits`/`misses` incohérentes en cas d'erreur générale — en cas d'exception non gérée par les sous-blocs (ex. `JSON.parse` qui échoue avant l'incrément `hits++`), ni `hits` ni `misses` ne sont incrémentés — le total ne correspond plus au nombre réel de requêtes traitées.

- **[EC-G1-014]** `getCacheStats()` retourne une taille de cache trompeuse — `src/lib/rag/embeddings.ts:739` : `totalSize = inMemorySize + (this.redisEmbeddingCache.isRedisReady() ? 1 : 0);`. Le nombre réel de clés stockées côté Redis n'est jamais interrogé.

- **[EC-G1-015]** `resetEmbeddingCache()` réinitialise le singleton Redis sans attendre la purge asynchrone (`clear().catch(...)` non `await`) — peut laisser des clés orphelines lors de l'enchaînement de tests.

### ⚪ FAIBLE (Optimisation)

- **[EC-G1-016]** `disconnect()` ne réinitialise pas `isConnecting` — si appelé alors qu'une connexion est encore marquée "en cours", `isConnecting` peut rester bloqué à `true`, gelant tout futur `connect()`.

- **[EC-G1-017]** Préfixe `'embedding:'` codé en dur dans une classe généraliste `RedisCache` — toute réutilisation future de cette classe pour un autre cas d'usage produira des clés incorrectement préfixées.

**Fichiers concernés:**
- `src/lib/cache/redis.ts`, `embeddingCache.ts`, `types.ts`, `index.ts`, `__tests__/redis.test.ts`
- `src/lib/rag/embeddings.ts` (intégration, hors diff G1 mais cassée par/avec celui-ci)
- `package.json` (dépendance `@upstash/redis: ^1.38.0` correctement listée dans l'arbre de travail — le problème n'est pas la dépendance elle-même mais l'API utilisée)
