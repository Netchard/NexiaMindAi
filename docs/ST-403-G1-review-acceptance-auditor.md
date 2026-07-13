# BMAD Code Review — Acceptance Auditor — ST-403 Groupe 1

**Story:** ST-403 - Implémenter le Cache des Embeddings
**Groupe:** 1 - Core Cache Implementation
**Rôle:** Acceptance Auditor (diff + spec + contexte projet)
**Fichiers:** src/lib/cache/redis.ts, embeddingCache.ts, types.ts, index.ts, __tests__/redis.test.ts
**Commit Range:** 0bfec98..1abf9a3
**Date d'exécution:** 2026-07-13
**Source prompt:** _bmad-output/implementation-artifacts/bmad-review-prompt-ST-403-G1.md (Prompt 3)
**Spec:** _bmad-output/implementation-artifacts/5-403-implementer-le-cache-des-embeddings.md

**Contexte de validation:** vérification par exécution réelle — `npx tsc --noEmit`, `npx vitest run src/lib/cache/__tests__/redis.test.ts`, `git show 1abf9a3:package.json` / `git show 1abf9a3:src/lib/rag/embeddings.ts` (pour distinguer ce qui est réellement commité dans `1abf9a3` de ce qui traîne encore non commité dans l'arbre de travail), inspection réelle de `node_modules/@upstash/redis`.

**Note de périmètre:** `src/lib/rag/embeddings.ts` contient déjà, dans l'arbre de travail (non commité), l'intégration complète de `RedisEmbeddingCache` dans `EmbeddingService`. Mais `git diff 0bfec98 1abf9a3 -- src/lib/rag/embeddings.ts` est vide — **cette intégration n'est pas dans le commit G1**. Conformément à la consigne, Groupe 1 n'est donc pas pénalisé pour l'absence d'intégration dans `EmbeddingService`, mais l'info est notée pour la revue du prochain groupe. De même, `scripts/benchmark/cache-benchmark.js` et `docs/benchmark/embedding-cache-benchmark.md` sont présents dans `1abf9a3` mais hors des 5 fichiers du diff G1 — hors périmètre.

---

## Analyse AC par AC

### AC1 — Cache Redis/Upstash opérationnel
**Satisfait:** ❌

**Preuve:** `src/lib/cache/redis.ts:7` — `import { createClient, RedisClientType } from '@upstash/redis';`. Le package réellement installé n'exporte ni `createClient` ni `RedisClientType` — il exporte `Redis` (classe), `SearchIndex`, `errors`. `npx tsc --noEmit` confirme :
```
src/lib/cache/redis.ts(7,10): error TS2305: Module '"@upstash/redis"' has no exported member 'createClient'.
src/lib/cache/redis.ts(7,24): error TS2305: Module '"@upstash/redis"' has no exported member 'RedisClientType'.
```
Aucun `ignoreBuildErrors` dans `next.config.*` → `next build` échouera sur cette erreur de typage.

**Problèmes:** Le client Redis ne peut tout simplement pas être instancié — `createClient` est `undefined` à l'exécution, donc `this.client = createClient({...})` lèverait `TypeError: createClient is not a function` au premier appel de `connect()`. La "connexion testée et validée" (ping) n'a jamais pu être exercée puisque le code ne compile même pas. Voir AA-G1-001.

### AC2 — Cache des embeddings distribué
**Satisfait:** ⚠️ (partiel dans le périmètre G1, intégration EmbeddingService hors scope)

**Preuve:**
- Hash SHA-256 : `embeddingCache.ts` (`generateEmbeddingCacheKey`) — ✅ correct, `crypto.createHash('sha256')`.
- TTL 1h : `RedisEmbeddingCache.DEFAULT_TTL_SECONDS = 3600` et `RedisCache.DEFAULT_TTL = 3600` — ✅ conforme.
- Sérialisation JSON : `JSON.stringify(result)` / `JSON.parse(cached)` — ✅ présent.
- "Remplacer le cache in-memory par Redis dans `EmbeddingService`" : **non présent dans ce diff G1** — confirmé absent du commit `1abf9a3`.

**Problèmes:** Design correct sur le papier (hash, TTL, JSON), mais invalidé fonctionnellement par le bug AC1 (le client Redis ne se connecte jamais réellement), et l'intégration côté `EmbeddingService` est explicitement hors périmètre de ce commit.

### AC3 — Réduction mesurable des appels API
**Satisfait:** ⚠️ (scaffolding présent, validation hors scope)

**Preuve:** Compteurs hits/misses (`embeddingCache.ts`), `getStats()` calcule `hitRate`. `incrementApiCalls()` exposé mais jamais appelé depuis ce module (attendu, c'est le rôle de l'appelant). Logs `console.info` présents sur hit/miss/set.

**Problèmes:** Le mécanisme de mesure existe, mais rien dans ce diff ne prouve/valide un ratio de hit > 30% (exercice de benchmark, hors scope G1). Puisque le client Redis ne fonctionne pas (AC1), tous les "hits" possibles dans ce module en conditions réelles ne peuvent provenir que du cache in-memory, pas de Redis.

### AC4 — Tests de performance avec/sans cache
**Satisfait:** ⚠️ (hors scope de ce diff)

**Preuve:** Aucun des 5 fichiers du diff G1 ne contient de script de benchmark. `scripts/benchmark/cache-benchmark.js` existe dans le commit `1abf9a3` mais n'est pas dans le diff G1.

**Problèmes:** Rien à évaluer ici pour Groupe 1 — à valider explicitement lors de la revue du groupe qui inclut `scripts/benchmark/`.

### AC5 — Backward compatibility
**Satisfait:** ⚠️ (logique présente mais non testée, et invalidée en pratique par AC1)

**Preuve:**
- Fallback Redis → in-memory : `embeddingCache.ts` (try/catch autour de l'appel Redis, puis passage au `Map` local).
- Fallback vers `null` (→ API directe côté appelant) si rien trouvé.
- "Pas de breaking change dans l'API publique de `EmbeddingService`" : trivialement vrai puisque `embeddings.ts` n'est pas touché par ce diff.

**Problèmes:** Le chemin de code "Redis disponible" n'a jamais pu être exercé en pratique à cause du bug AC1 — donc le seul chemin réellement testable actuellement est celui du fallback (par accident, pas par validation). Aucun test unitaire n'existe pour `RedisEmbeddingCache` (`embeddingCache.test.ts`, prévu dans le File List de la story, absent du repo).

---

## Findings

### 🔴 CRITIQUE (Bloquant)

- **[AA-G1-001] Import inexistant depuis `@upstash/redis` — Redis totalement non fonctionnel** — `src/lib/cache/redis.ts:7,86,302` (`import { createClient, RedisClientType } from '@upstash/redis'`). Le package réellement installé n'exporte que `Redis` (classe), `SearchIndex`, `errors` — pas `createClient` ni `RedisClientType`. Confirmé par `npx tsc --noEmit` (2 erreurs TS2305). Impact : `next build` échoue (aucun `ignoreBuildErrors` configuré), et à l'exécution `createClient` est `undefined` → `TypeError` au premier `connect()`. Le cache Redis n'a jamais pu réellement se connecter à Upstash, contrairement à ce qu'affirme la story ("Connection testée et validée").

- **[AA-G1-002] Suite de tests `redis.test.ts` ne s'exécute jamais (0 test collecté)** — `src/lib/cache/__tests__/redis.test.ts:18` (`let RedisCache: typeof import('../redis').RedisCache;`) entre en conflit avec l'import nommé `RedisCache` ligne 48. `npx vitest run` échoue immédiatement à la transformation esbuild (`The symbol "RedisCache" has already been declared`), confirmé aussi par `tsc` (TS2440). Résultat : `npm test` échoue purement et simplement sur ce fichier — les 15 tests écrits en "Phase RED/GREEN" n'ont jamais tourné une seule fois.

- **[AA-G1-003] Dépendance `@upstash/redis` absente de `package.json` dans le commit du diff** — Vérifié via `git show 1abf9a3:package.json | grep upstash` → aucune correspondance (elle n'est présente que dans `package-lock.json` et dans l'arbre de travail non commité actuel). Un `npm ci` propre sur ce commit ne déclare pas cette dépendance directe, créant une désynchronisation lockfile/manifest et un risque d'échec d'installation reproductible en CI.

### 🟠 HAUTE (Doit être corrigé)

- **[AA-G1-004] Signature de test incompatible avec l'implémentation (`set()`) + clé préfixée non anticipée** — `src/lib/cache/__tests__/redis.test.ts:111` appelle `redisCache.set('test-key', 'test-value', 3600)` (nombre brut), alors que la signature réelle est `set(key, value, options?: SetOptions)` avec `SetOptions = {ttl?: number}` → `tsc` lève `TS2559: Type '3600' has no properties in common with type 'SetOptions'`. De plus, l'implémentation (`addPrefix()`) préfixe systématiquement toutes les clés avec `'embedding:'`, alors que le test attend `mockRedis.set` appelé avec la clé brute `'test-key'` — assertion vouée à l'échec même une fois le bug de compilation corrigé.

- **[AA-G1-005] Pas de fail-fast quand Redis n'est pas configuré → jusqu'à ~10s de retry inutiles** — `src/lib/cache/redis.ts:63-113` (`connect()`). Le constructeur avertit déjà si `url`/`token` sont vides, mais `connect()` ne vérifie jamais cette condition avant de lancer sa boucle de retry (3 tentatives × 5000ms). Résultat : dans tout environnement sans credentials Redis (dev local, CI, tests), chaque instanciation attend inutilement jusqu'à ~10 secondes avant de basculer sur le fallback.

- **[AA-G1-006] Aucun test pour `RedisEmbeddingCache` (logique de fallback hiérarchique)** — La story (File List) prévoit explicitement `src/lib/cache/__tests__/embeddingCache.test.ts` pour tester `RedisEmbeddingCache`. Ce fichier n'existe nulle part dans l'historique git. C'est pourtant cette classe qui porte toute la logique métier critique des AC2/AC5 (stratégie Redis → In-Memory → null, TTL in-memory, métriques) — zéro couverture de test.

### 🟡 MOYENNE (Amélioration)

- **[AA-G1-007] Croissance non bornée de `hitTimes`/`missTimes`** — `embeddingCache.ts`, poussés à chaque appel `getEmbedding()` sans plafond ni rotation. Seul un appel explicite à `clear()` les réinitialise. Fuite mémoire potentielle sous fort trafic long-running.

- **[AA-G1-008] Tests placeholders sans assertion (faux-positifs garantis)** — le test "DOIT gérer les erreurs de connexion avec retry" (~lignes 83-89) mocke une erreur mais n'appelle jamais la méthode sous test ni n'affirme quoi que ce soit. Idem pour les deux tests du bloc `describe('RedisCache - Configuration')`. Résultat : la logique de retry, pourtant une tâche explicitement requise par la story, n'a aucune couverture réelle.

### ⚪ FAIBLE (Optimisation)

- **[AA-G1-009] `RedisCache` prétend être générique mais est câblé en dur sur le domaine "embedding"** — `addPrefix()`, constante `EMBEDDING_PREFIX = 'embedding:'`, `clear()` qui ne liste que `embedding:*`. Envisager de passer le préfixe en paramètre de constructeur.

- **[AA-G1-010] Pas de validation HTTPS explicite en production** — la contrainte architecturale « DOIT utiliser HTTPS pour la connection Redis en production » n'est vérifiée nulle part dans `redis.ts` — `config.url` est utilisé tel quel sans contrôle de schéma. Recommandé d'ajouter une validation/avertissement si `NODE_ENV === 'production'` et que l'URL ne commence pas par `https://`. *(Note: violation directe d'une contrainte architecturale nommée dans la spec — à considérer comme HAUTE plutôt que FAIBLE si on applique strictement la sévérité par rapport à la spec.)*
