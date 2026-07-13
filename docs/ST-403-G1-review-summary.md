# BMAD Code Review — Synthèse & Triage — ST-403 Groupe 1

**Story:** ST-403 - Implémenter le Cache des Embeddings
**Groupe:** 1 - Core Cache Implementation (src/lib/cache/redis.ts, embeddingCache.ts, types.ts, index.ts, __tests__/redis.test.ts)
**Commit Range:** 0bfec98..1abf9a3
**Date d'exécution:** 2026-07-13
**Rapports sources:** [ST-403-G1-review-blind-hunter.md](./ST-403-G1-review-blind-hunter.md), [ST-403-G1-review-edge-case-hunter.md](./ST-403-G1-review-edge-case-hunter.md), [ST-403-G1-review-acceptance-auditor.md](./ST-403-G1-review-acceptance-auditor.md)

Les 3 rôles ont tourné en parallèle (Blind Hunter = diff seul ; Edge Case Hunter = diff + accès projet, avec exécution réelle de `tsc`/`vitest`/`next build` ; Acceptance Auditor = diff + spec + contexte). Ce document dédoublonne et trie leurs findings.

## Verdict global

**Le module ne compile pas et sa suite de tests ne s'exécute jamais.** Les 3 rôles convergent indépendamment sur la même racine : `redis.ts` importe `createClient`/`RedisClientType` depuis `@upstash/redis`, qui n'exporte que la classe `Redis`. Le fichier de test a en plus un bug de syntaxe indépendant (double déclaration de `RedisCache`) qui empêche esbuild de le transformer. Résultat vérifié empiriquement (`npx tsc --noEmit`, `npx vitest run`, `npx next build`) : 0 test exécuté, build Next.js cassé jusqu'à une route API de production.

## Findings triés (dédoublonnés)

| # | Titre | Source | Sévérité | Catégorie |
|---|---|---|---|---|
| 1 | `createClient`/`RedisClientType` n'existent pas dans `@upstash/redis` — Redis totalement non fonctionnel | blind+edge+auditor (BH-001, EC-002, AA-001) | 🔴 CRITIQUE | **patch** |
| 2 | Test file : double déclaration de `RedisCache` (`let` + `import`) casse la transformation esbuild, 0 test exécuté | edge+auditor (EC-001, AA-002) | 🔴 CRITIQUE | **patch** |
| 3 | Mock `@upstash/redis` en `export default class` alors que l'implémentation utiliserait un export nommé — le mock n'intercepte rien | blind+edge (BH-002, EC-011) | 🔴 CRITIQUE | **patch** |
| 4 | Mock ne définit pas `ping()`, appelé par `connect()` — échouerait même après correction #1/#3 | edge (EC-004) | 🔴 CRITIQUE | **patch** |
| 5 | `@upstash/redis` absent de `package.json` dans le commit du diff (seulement lockfile / arbre de travail non commité) | auditor (AA-003) | 🔴 CRITIQUE | **patch** |
| 6 | Signature `set()` incompatible avec les tests (TTL passé en nombre brut au lieu de `{ttl}`) + assertions sur clé non préfixée alors que l'implémentation préfixe toujours | blind+auditor (BH-003, BH-004, AA-004) | 🟠 HAUTE | **patch** |
| 7 | Race condition dans `connect()` : un appelant concurrent qui attend `isConnecting` ne vérifie jamais `isConnected` après la boucle → croit à tort la connexion réussie après un échec | blind+edge (BH-009, EC-005) | 🟠 HAUTE | **patch** |
| 8 | Boucle busy-wait de `connect()` sans timeout/abort — bloque indéfiniment si la 1ʳᵉ tentative reste pendante | edge (EC-006) | 🟠 HAUTE | **patch** |
| 9 | `clear()` : `KEYS` + `del(...keys)` sans chunking, risque de dépasser les limites de payload Upstash sur une base volumineuse | blind+edge (BH-007, EC-009) | 🟠 HAUTE | **patch** |
| 10 | Cache in-memory (`Map`) sans limite de taille ni éviction — croissance illimitée | blind (BH-006) | 🟠 HAUTE | **decision_needed** — aucune politique d'éviction/taille max n'est spécifiée dans la story |
| 11 | Contenu utilisateur (`textPreview`, 50 premiers caractères du texte) loggé en clair via `console.info`/`error` à chaque hit/miss | blind (BH-008) | 🟠 HAUTE | **patch** |
| 12 | Entrée Redis corrompue (`JSON.parse` échoue) → retour `null` mais clé jamais supprimée → miss silencieux permanent jusqu'à expiration TTL | edge (EC-007) | 🟠 HAUTE | **patch** |
| 13 | Après un 1ᵉʳ échec de connexion, `useRedis=false` de façon permanente pour la durée de vie du singleton, aucune reconnexion tentée | edge (EC-008) | 🟠 HAUTE | **decision_needed** — comportement "circuit breaker" à confirmer : reconnexion périodique souhaitée, ou désactivation définitive intentionnelle ? |
| 14 | `connect()` ne vérifie pas si `url`/`token` sont vides avant de lancer sa boucle de retry → jusqu'à ~10s perdues quand Redis n'est simplement pas configuré (dev/CI) | auditor (AA-005) | 🟠 HAUTE | **patch** |
| 15 | Aucun test pour `RedisEmbeddingCache` (`embeddingCache.test.ts` prévu au File List de la story, absent du repo) | auditor (AA-006) | 🟠 HAUTE | **patch** |
| 16 | Tests placeholders sans `expect()` (retry, config par défaut) — fausse impression de couverture | edge+auditor (EC-010, AA-008) | 🟠 HAUTE | **patch** |
| 17 | Pas de validation HTTPS sur l'URL Redis en production, alors que c'est une contrainte architecturale explicite de la spec | auditor (AA-010) | 🟠 HAUTE *(reclassé depuis FAIBLE — violation directe d'une contrainte nommée)* | **patch** |
| 18 | `hasEmbedding()` avale les erreurs Redis silencieusement (`catch {}` vide) contrairement au reste du module qui logue systématiquement | blind (BH-012) | 🟡 MOYENNE | **patch** |
| 19 | `resetEmbeddingCache()` ne `await` pas `clear()` avant de nuller l'instance singleton — purge Redis potentiellement incomplète | blind+edge (BH-013, EC-015) | 🟡 MOYENNE | **patch** |
| 20 | SHA-256 recalculé deux fois par opération (`generateEmbeddingCacheKey` + `getFullCacheKey`) | blind (BH-011) | 🟡 MOYENNE | defer (perf, non bloquant) |
| 21 | Constante `TTL_MS` morte, jamais utilisée | blind (BH-014) | 🟡 MOYENNE | **patch** (trivial) |
| 22 | `getEmbeddingCache()` n'auto-initialise pas Redis — silencieusement inactif si appelé hors `EmbeddingService` | edge (EC-012) | 🟡 MOYENNE | defer (dépend du contrat d'usage prévu, hors scope G1) |
| 23 | `hits`/`misses` non incrémentés si une exception survient avant l'incrément (ex. `JSON.parse`) — total ne correspond plus au nombre réel de requêtes | edge (EC-013) | 🟡 MOYENNE | defer |
| 24 | `getCacheStats().totalSize` ne reflète pas le nombre réel de clés Redis (0 ou 1 selon `isRedisReady()`) | edge (EC-014) | 🟡 MOYENNE | defer (hors diff G1, dans embeddings.ts) |
| 25 | `getClient()` expose le client Redis brut, contourne préfixage/erreurs/retry | blind (BH-010) | 🟡 MOYENNE | defer (choix d'architecture, pas bloquant) |
| 26 | `disconnect()` ne réinitialise pas `isConnecting` | edge (EC-016) | ⚪ FAIBLE | defer |
| 27 | Préfixe `'embedding:'` codé en dur dans une classe nommée génériquement `RedisCache` | blind+edge (BH via constat similaire, EC-017) | ⚪ FAIBLE | defer |
| 28 | `||` au lieu de `??` pour le fallback de `cachedAt` (cas limite `cachedAt=0`) | blind (BH-016) | ⚪ FAIBLE | **patch** (trivial) |
| 29 | TTL par défaut (3600) dupliqué à plusieurs endroits sans constante partagée | blind (BH-017) | ⚪ FAIBLE | defer |
| 30 | `apiCalls` dépend entièrement de la discipline de l'appelant (`incrementApiCalls()` jamais auto-invoqué) | blind (BH-015) | ⚪ FAIBLE | dismiss (contrat d'API volontaire) |

**Comptage:** 2 `decision_needed`, 21 `patch`, 6 `defer`, 1 `dismiss` — 0 doublon exact ignoré comme bruit pur (tous les recoupements ont été fusionnés en une seule ligne ci-dessus).

## Décisions requises (`decision_needed`)

Ces deux points ne peuvent pas être corrigés sans un choix produit/architecture :

1. **#10 — Politique d'éviction du cache in-memory.** Faut-il une taille max + LRU, ou est-ce acceptable tant que le process reste court-lived (ex. serverless/Vercel) ? La story ne précise rien.
2. **#13 — Comportement après échec de connexion Redis.** `useRedis` est désactivé pour toute la durée de vie du singleton après un seul échec. Est-ce le comportement voulu (circuit breaker définitif) ou faut-il retenter périodiquement (ex. toutes les N minutes) ?

## Recommandation

Avant toute chose : **#1 à #5 bloquent totalement le build et les tests** — rien dans ce groupe n'a jamais été réellement exécuté ni validé. Le statut "ready for review" du commit `1abf9a3` doit être reconsidéré tant que ces 5 points ne sont pas corrigés ; à ce stade, AC1 (Cache Redis opérationnel) est objectivement ❌ non satisfait.

---
*Ce document et les 3 rapports sources ont été générés en exécutant les 3 prompts adversariaux définis dans `_bmad-output/implementation-artifacts/bmad-review-prompt-ST-403-G1.md`, chacun dans un sous-agent isolé (Blind Hunter sans contexte projet ; Edge Case Hunter et Acceptance Auditor avec exécution réelle de `tsc`/`vitest`/`next build`).*
