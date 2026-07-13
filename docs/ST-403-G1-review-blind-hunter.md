# BMAD Code Review — Blind Hunter — ST-403 Groupe 1

**Story:** ST-403 - Implémenter le Cache des Embeddings
**Groupe:** 1 - Core Cache Implementation
**Rôle:** Blind Hunter (diff seul, aucun contexte projet)
**Fichiers:** src/lib/cache/redis.ts, embeddingCache.ts, types.ts, index.ts, __tests__/redis.test.ts
**Commit Range:** 0bfec98..1abf9a3
**Date d'exécution:** 2026-07-13
**Source prompt:** _bmad-output/implementation-artifacts/bmad-review-prompt-ST-403-G1.md (Prompt 1)

---

## Findings

### 🔴 CRITIQUE (Bloquant)

- **[BH-G1-001]** Import inexistant dans le SDK Upstash — `redis.ts:657` (ligne 7 du fichier) : `import { createClient, RedisClientType } from '@upstash/redis';`. Le SDK `@upstash/redis` n'exporte pas `createClient` ni `RedisClientType` (il expose une classe `Redis`). Impact : le fichier ne compile probablement pas, ou plante à l'exécution avec `createClient is not a function` — le module est inutilisable tel quel.

- **[BH-G1-002]** Mock de test incompatible avec l'import réel — `__tests__/redis.test.ts:27-51` mocke `@upstash/redis` via `export default class {...}` (export par défaut), alors que `redis.ts:7` importe des exports **nommés** (`createClient`, `RedisClientType`). Le mock n'intercepte donc pas l'import réellement utilisé : `createClient` reste `undefined` pendant les tests → `TypeError` immédiate dès `connect()` (appelé dans `beforeEach`, ligne 68). Conséquence : la totalité de la suite de tests échoue à l'exécution, la mention « Phase GREEN » dans les commentaires (embeddingCache.ts, redis.ts) est mensongère — aucun test ne peut réellement passer avec cette implémentation.

- **[BH-G1-003]** Incohérence de préfixage de clé entre tests et implémentation — `redis.ts` (`addPrefix`) préfixe systématiquement les clés avec `embedding:` avant tout appel `get/set/del/exists` au client Redis. Mais `__tests__/redis.test.ts:119-124` et `:149` attendent `mockRedis.set`/`mockRedis.del` appelés avec la clé **brute** (`'test-key'`, sans préfixe). Ces assertions ne peuvent pas correspondre au comportement réel du code — les tests sont soit jamais exécutés, soit garantis en échec.

- **[BH-G1-004]** Signature `set()` incompatible avec son propre test — `redis.ts` déclare `set(key: string, value: string, options?: SetOptions)` où `SetOptions = { ttl?: number }`, mais `__tests__/redis.test.ts:117` et `:127` appellent `redisCache.set('test-key', 'test-value', 3600)` en passant un **nombre brut** au lieu d'un objet `{ ttl: 3600 }`. En TypeScript, cet appel ne type-check pas ; à l'exécution, `options?.ttl` vaudrait `undefined`, donc le TTL explicitement demandé par le test serait silencieusement ignoré au profit du TTL par défaut — masquant un bug potentiel derrière une coïncidence numérique (3600 = valeur par défaut).

- **[BH-G1-005]** Violation de typage sur le cache in-memory — `embeddingCache.ts` déclare `private inMemoryCache: Map<string, EmbeddingResult>`, mais `setEmbedding()` y stocke des objets enrichis avec un champ `cachedAt` non déclaré sur `EmbeddingResult` (`{...result, cachedAt: Date.now()}`), puis `getEmbedding()`/`hasEmbedding()` lisent `cached.cachedAt` comme si ce champ existait. Un type dédié `CachedEmbeddingResult extends EmbeddingResult { cachedAt: number; ... }` est pourtant défini mais n'est jamais utilisé pour typer la `Map`. Accès à une propriété non garantie par le système de types.

### 🟠 HAUTE (Doit être corrigé)

- **[BH-G1-006]** Cache in-memory sans limite de taille ni éviction — `embeddingCache.ts` (`Map<string, EmbeddingResult>`) grandit de façon illimitée pendant toute la durée de vie du process : aucune borne max, aucune stratégie LRU, seule une expiration passive au moment de la lecture qui ne purge jamais les entrées jamais relues. Chaque entrée contient potentiellement un vecteur d'embedding volumineux → fuite mémoire / vecteur de DoS si un grand nombre de textes distincts sont soumis.

- **[BH-G1-007]** `clear()` potentiellement dangereux à l'échelle — `redis.ts` : récupère toutes les clés via `KEYS pattern` puis exécute `this.client!.del(...keys)` en étalant l'intégralité du tableau en arguments. Sur une base contenant un grand nombre de clés, cela peut dépasser la taille max d'une requête REST Upstash ou provoquer une latence/charge importante. Le commentaire admet lui-même le risque sans qu'aucune pagination/batching ne soit implémenté.

- **[BH-G1-008]** Fuite d'information dans les logs applicatifs — `embeddingCache.ts` : `textPreview: text.substring(0, 50) + '...'` est loggé en clair via `console.info`/`console.error` à chaque hit/miss/écriture, exposant potentiellement du contenu utilisateur/document sensible dans les logs. Par contraste, `redis.ts` prend soin de `[REDACTED]`-ter l'URL Redis — l'asymétrie montre que la sensibilité des données n'a pas été traitée de façon cohérente.

- **[BH-G1-009]** Gestion incorrecte de la concurrence dans `connect()` — un appelant concurrent qui entre dans la branche `isConnecting` attend en boucle (`while (this.isConnecting) { await sleep(100) }`) puis **retourne silencieusement** dès que `isConnecting` repasse à `false`, sans jamais vérifier `this.isConnected`. Si la tentative de connexion initiale échoue après tous les retries (qui met `isConnecting = false` puis `throw`), l'appelant concurrent ne reçoit jamais l'erreur et croit à tort que la connexion est opérationnelle.

- **[BH-G1-010]** Encapsulation cassée — `getClient()` expose publiquement le client Redis brut « pour usage avancé ». N'importe quel appelant externe peut alors contourner le préfixage de clé (`addPrefix`), la gestion d'erreurs et le retry logic de la classe, en effectuant des opérations Redis non contrôlées directement sur l'espace de clés partagé.

### 🟡 MOYENNE (Amélioration)

- **[BH-G1-011]** Calcul SHA-256 redondant — dans `getEmbedding`, `setEmbedding`, `deleteEmbedding`, `hasEmbedding`, `generateEmbeddingCacheKey(text)` est appelé directement **et** de nouveau en interne via `getFullCacheKey(text)` → le hash SHA-256 du même texte est calculé deux fois par opération, coût inutile surtout pour de longs textes.

- **[BH-G1-012]** Gestion d'erreurs incohérente — `hasEmbedding()` avale silencieusement les erreurs Redis avec un `catch {}` vide, alors que toutes les autres méthodes (`getEmbedding`, `setEmbedding`, `deleteEmbedding`, `clear`) loggent systématiquement un `console.warn`/`console.error`. Cette incohérence masque des pannes Redis sans aucune trace exploitable en observabilité.

- **[BH-G1-013]** Race condition potentielle dans `resetEmbeddingCache()` — `embeddingCacheInstance.clear().catch(() => {})` est appelé sans `await`, puis `embeddingCacheInstance = null` est exécuté immédiatement après, sans attendre la fin réelle du `clear()` asynchrone (qui touche à la fois Redis et l'état interne).

- **[BH-G1-014]** Code mort — `private static readonly TTL_MS = RedisEmbeddingCache.DEFAULT_TTL_SECONDS * 1000;` n'est jamais référencé ; le TTL effectivement utilisé (`this.inMemoryTTL`) est recalculé indépendamment dans le constructeur, rendant la constante trompeuse.

### ⚪ FAIBLE (Optimisation)

- **[BH-G1-015]** La métrique `apiCalls` dépend entièrement de la discipline de l'appelant externe via `incrementApiCalls()`, jamais invoquée automatiquement dans ce module — risque de statistiques faussées si l'appelant oublie de l'invoquer.

- **[BH-G1-016]** `age <= (cached.cachedAt || Date.now())`-style fallback utilise `||` plutôt que `??` : un `cachedAt` falsy (0) serait traité comme "maintenant", cas limite improbable mais sémantiquement incorrect.

- **[BH-G1-017]** La valeur par défaut du TTL (3600s) est dupliquée indépendamment à plusieurs endroits (`RedisCache.DEFAULT_TTL`, `RedisEmbeddingCache.DEFAULT_TTL_SECONDS`, et en dur dans les tests) sans constante partagée — risque de désynchronisation future.
