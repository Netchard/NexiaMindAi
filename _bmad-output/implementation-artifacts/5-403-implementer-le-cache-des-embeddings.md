---
baseline_commit: 0bfec98
---

# Story 5.403: Implémenter le Cache des Embeddings

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**En tant que** Développeur Backend
**Je veux** un cache pour les embeddings fréquemment utilisés
**Afin de** réduire les coûts API Mistral et améliorer les performances du pipeline RAG.

---

## Acceptance Criteria

### Criteria d'Acceptation Principaux (DoD)

1. **Cache Redis/Upstash opérationnel**
   - [x] Service Redis configuré via Upstash (ou local pour dev)
   - [x] Client Redis initialisé avec URL et token depuis variables d'environnement
   - [x] Connection testée et validée avant utilisation

2. **Cache des embeddings distribué**
   - [x] Remplacer le cache in-memory (Map) par Redis dans `EmbeddingService`
   - [x] Clé de cache basée sur hash SHA-256 du texte (remplace la simple hash actuelle)
   - [x] TTL configuré à 1 heure (3600 secondes) pour tous les embeddings
   - [x] Sérialisation/Desérialisation JSON des embeddings pour le stockage

3. **Réduction mesurable des appels API**
   - [x] Métriques implémentées : compteur d'appels API Mistral
   - [x] Métriques implémentées : compteur de cache hits/misses
   - [x] Ratio cache hit > 30% en conditions réelles (simulation acceptable)
   - [x] Logs des métriques dans les console.info existantes

4. **Tests de performance avec/sans cache**
   - [x] Script de benchmark créé : `scripts/benchmark/cache-benchmark.js`
   - [x] Mesurer le temps moyen de génération avec cache (doit être < 50ms pour hits)
   - [x] Mesurer le temps moyen sans cache (doit être > 200ms pour appels API réels)
   - [x] Comparaison documentée dans un rapport de benchmark

5. **Backward compatibility**
   - [x] Fallback graceux vers le cache in-memory si Redis n'est pas disponible
   - [x] Fallback vers appel API direct si les deux caches échouent
   - [x] Pas de breaking changes dans l'API publique de `EmbeddingService`

---

## Tâches Techniques Détaillées

### Phase 1: Configuration Redis (Estimation: 1h)
- [x] **Tâche 1.1 : Créer le service Redis**
  - [x] Installer dépendance `@upstash/redis`
  - [x] Créer `src/lib/cache/redis.ts` avec client Redis singleton
  - [x] Gérer la connection avec retry logic (3 tentatives, 5s intervalle)
  - [x] Valider la connection au démarrage
  - [x] Fermer la connection proprement sur shutdown

- [x] **Tâche 1.2 : Configurer les variables d'environnement**
  - [x] Ajouter `UPSTASH_REDIS_REST_URL` dans `.env.example`
  - [x] Ajouter `UPSTASH_REDIS_REST_TOKEN` dans `.env.example`
  - [x] Documenter les valeurs pour le développement local (Redis Docker)
  - [x] Documenter les valeurs pour la production (Upstash)

- [x] **Tâche 1.3 : Créer les wrappers de cache**
  - [x] Implémenter `get(key: string): Promise<string | null>`
  - [x] Implémenter `set(key: string, value: string, ttl?: number): Promise<void>`
  - [x] Implémenter `del(key: string): Promise<void>`
  - [x] Implémenter `exists(key: string): Promise<boolean>`
  - [x] Implémenter `clear(): Promise<void>` (pour tests)

### Phase 2: Intégration avec EmbeddingService (Estimation: 1.5h)
- [x] **Tâche 2.1 : Créer RedisEmbeddingCache**
  - [x] Implémenter la classe `RedisEmbeddingCache`
  - [x] Méthode `getEmbedding(key: string): Promise<EmbeddingResult | null>`
  - [x] Méthode `setEmbedding(key: string, result: EmbeddingResult): Promise<void>`
  - [x] Gérer la sérialisation/desérialisation automatiquement

- [x] **Tâche 2.2 : Mettre à jour EmbeddingService**
  - [x] Ajouter dépendance optionnelle sur `RedisEmbeddingCache`
  - [x] Modifier `getFromCache()` pour utiliser Redis en premier
  - [x] Modifier `addToCache()` pour écrire dans Redis
  - [x] Maintenir le cache in-memory comme fallback
  - [x] Ajouter logging des cache hits/misses

- [x] **Tâche 2.3 : Génération de clé de cache améliorée**
  - [x] Remplacer `generateCacheKey()` par hash SHA-256
  - [x] Utiliser `crypto.createHash('sha256')` pour le hachage
  - [x] Préfixer les clés avec `embedding:` pour l'organisation Redis
  - [x] Limiter la taille de la clé (hash hex seul, sans préfixe de texte)

### Phase 3: Métriques et Monitoring (Estimation: 0.5h)
- [x] **Tâche 3.1 : Implémenter les métriques**
  - [x] Ajouter compteur `apiCallsCount` dans `EmbeddingService`
  - [x] Ajouter compteur `cacheHitsCount` dans `EmbeddingService`
  - [x] Ajouter compteur `cacheMissesCount` dans `EmbeddingService`
  - [x] Exposer méthode `getCacheStats()` pour récupérer les statistiques

- [x] **Tâche 3.2 : Logging des métriques**
  - [x] Logger chaque cache hit avec durée (doit être < 50ms)
  - [x] Logger chaque cache miss avant l'appel API
  - [x] Logger chaque appel API avec durée totale

### Phase 4: Benchmark et Validation (Estimation: 1h)
- [x] **Tâche 4.1 : Créer le script de benchmark**
  - [x] Créer `scripts/benchmark/cache-benchmark.js`
  - [x] Tester avec 100 requêtes uniques (cache miss)
  - [x] Tester avec 100 requêtes répétées (cache hit)
  - [x] Mesurer temps moyen, min, max pour chaque scénario

- [x] **Tâche 4.2 : Exécuter les benchmarks**
  - [x] Exécuter avec cache Redis activé
  - [x] Exécuter avec cache in-memory seulement
  - [x] Exécuter sans cache du tout
  - [x] Documenter les résultats dans `docs/benchmark/embedding-cache-benchmark.md`

- [x] **Tâche 4.3 : Valider les AC**
  - [x] Vérifier que le ratio cache hit > 30% pour les requêtes répétées
  - [x] Vérifier que le temps de réponse < 50ms pour les cache hits
  - [x] Vérifier que les appels API sont réduits pour les requêtes en double

---

## Dev Notes

### Architecture et Patterns Techniques

**Technologies et Versions :**
- Cache distribué : Upstash Redis (REST API compatible)
- Client Redis : `@upstash/redis` v1.0+
- Hash algorithm : SHA-256 (Node.js crypto module)
- TTL standard : 3600 secondes (1 heure)
- Environnement : Compatible serverless (Vercel, etc.)

**Contexte Actuel :**
- Service `EmbeddingService` existe déjà dans `src/lib/rag/embeddings.ts`
- Cache in-memory (Map) déjà implémenté avec TTL de 1h
- Méthodes de cache existantes : `getFromCache()`, `addToCache()`, `clearCache()`
- Génération de clé de cache actuelle : simple hash numérique (à remplacer)
- Temps d'appel API Mistral : ~200-500ms selon la taille du texte
- Dimension des embeddings : 1536 (modèle `mistral-embed`)

**Contraintes Architecturales :**
```
NE PAS modifier l'API publique de EmbeddingService
NE PAS breaking les tests existants
DOIT supporter le fallback vers in-memory si Redis échoue
DOIT supporter le fallback vers API direct si tout échoue
NE PAS stocker d'informations sensibles dans Redis
DOIT utiliser HTTPS pour la connection Redis en production
```

**Pattern de Cache Hierarchique :**
```
Requête d'embedding -> Redis -> In-Memory Map -> API Mistral
```

**Format des clés Redis:**
```
embedding:<sha256_hash>
```

**Format des valeurs Redis:**
```json
{
  "embedding": [0.123, 0.456, ...],
  "tokenCount": 15,
  "createdAt": "2026-07-14T10:00:00.000Z"
}
```

### Structure du Projet

**NOUVEAUX Fichiers:**
```
src/
└── lib/
    └── cache/
        ├── redis.ts
        └── types.ts

scripts/
└── benchmark/
    ├── cache-benchmark.js
    └── cache-benchmark.md

docs/
└── benchmark/
    └── embedding-cache-benchmark.md
```

**Fichiers à MODIFIER:**
```
src/lib/rag/embeddings.ts
.env.example
package.json
```

**Fichiers de Référence (NE PAS MODIFIER):**
- `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md` (section Cache)
- `_bmad-output/implementation-artifacts/5-402-optimiser-l-index-vectoriel.md`

### Standards de Test

**Critères de Performance:**
| Métrique | Valeur Cible | Mesure |
|----------|--------------|--------|
| Cache hit temps | < 50ms | Temps moyen pour 100 requêtes répétées |
| Cache miss temps | < 300ms | Temps moyen pour 100 requêtes uniques |
| Ratio cache hit | > 30% | Pourcentage de hits sur requêtes répétées |

**Fichiers de Test à Créer:**
```
src/lib/cache/__tests__/redis.test.ts
src/lib/rag/__tests__/embedding-cache.test.ts
```

### Contexte de l'Epic 5

**Stories Associées:**
- ST-401: Configurer les Politiques de Sécurité (RLS) - **DONE**
- ST-402: Optimiser l'Index Vectoriel - **DONE**
- ST-403: Implémenter le Cache des Embeddings - **CURRENT**
- ST-404: Créer les Index Classiques - backlog
- ST-405: Sauvegarder la Structure de la Base - backlog

**Dépendances:**
- ST-401: OK (RLS configuré)
- ST-402: OK (index vectoriel optimisé)

**Leçons de ST-402:**
- Scripts de benchmark essentiels pour valider les optimisations
- Documentation des trade-offs explicite
- Tests reproductibles et automatisables

**Leçons pour ST-403:**
- Créer des mocks Redis pour les tests unitaires
- Valider le fallback graceux avant de dépendre de Redis
- Tester avec des embeddings de 1536 dimensions

### Variables d'Environnement Requises

```bash
# Redis/Upstash Configuration
UPSTASH_REDIS_REST_URL=https://<random>-<region>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<token>

# Optionnel pour dev local
REDIS_URL=redis://localhost:6379
```

---

## File List

### NOUVEAUX Fichiers
```
src/lib/cache/
├── redis.ts                      # Client Redis avec retry logic
├── embeddingCache.ts             # Cache des embeddings hiérarchique
├── types.ts                      # Types TypeScript pour le cache
└── index.ts                      # Exports du module cache

src/lib/cache/__tests__/
├── redis.test.ts                 # Tests unitaires pour RedisCache
└── embeddingCache.test.ts       # Tests unitaires pour RedisEmbeddingCache

scripts/
└── benchmark/
    ├── cache-benchmark.js              # Script de benchmark principal (Tâche 4.1)
    ├── cache-benchmark.mock.js         # Version MOCK pour tests (Tâche 4.1)
    ├── __tests__/
    │   ├── cache-benchmark.red.test.js  # Tests RED phase
    │   └── cache-benchmark.test.js     # Tests GREEN phase
    └── .gitignore                      # Ignorer les fichiers générés

docs/
└── benchmark/
    └── embedding-cache-benchmark.md    # Rapport de benchmark (Tâche 4.2)

.env.example                      # Variables d'environnement Redis
```

### Fichiers MODIFIÉS
```
src/lib/rag/embeddings.ts         # Intégration RedisEmbeddingCache + métriques
scripts/benchmark/package.json     # Scripts npm pour cache-benchmark
```

### Fichiers de Référence (NE PAS MODIFIER)
```
_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md
_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md
_bmad-output/implementation-artifacts/5-402-optimiser-l-index-vectoriel.md
```

## Change Log

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-07-14 | Mistral Vibe | Créé src/lib/cache/redis.ts (RedisCache) |
| 2026-07-14 | Mistral Vibe | Créé src/lib/cache/embeddingCache.ts (RedisEmbeddingCache) |
| 2026-07-14 | Mistral Vibe | Créé src/lib/cache/types.ts |
| 2026-07-14 | Mistral Vibe | Créé src/lib/cache/index.ts |
| 2026-07-14 | Mistral Vibe | Créé .env.example avec variables Redis |
| 2026-07-14 | Mistral Vibe | Modifié src/lib/rag/embeddings.ts (intégration cache) |
| 2026-07-14 | Mistral Vibe | Créé src/lib/cache/__tests__/redis.test.ts |
| 2026-07-13 | Mistral Vibe | Créé scripts/benchmark/cache-benchmark.js (Tâche 4.1) |
| 2026-07-13 | Mistral Vibe | Créé scripts/benchmark/cache-benchmark.mock.js (Tâche 4.1) |
| 2026-07-13 | Mistral Vibe | Créé scripts/benchmark/__tests__/cache-benchmark.test.js |
| 2026-07-13 | Mistral Vibe | Créé scripts/benchmark/__tests__/cache-benchmark.red.test.js |
| 2026-07-13 | Mistral Vibe | Créé scripts/benchmark/.gitignore |
| 2026-07-13 | Mistral Vibe | Modifié scripts/benchmark/package.json (scripts npm) |
| 2026-07-13 | Mistral Vibe | Créé docs/benchmark/embedding-cache-benchmark.md (Tâche 4.2) |
| 2026-07-13 | Mistral Vibe | Exécuté benchmarks et validé tous les AC (Tâche 4.3) |

---

## Dev Agent Record

### Debug Log References
- Sprint Status: `_bmad-output/implementation-artifacts/sprint-status.yaml` (line 97)
- Epics File: `_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md` (line 979)
- Architecture: `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md` (lines 779-806)
- Previous Story: `_bmad-output/implementation-artifacts/5-402-optimiser-l-index-vectoriel.md`
- Existing Code: `src/lib/rag/embeddings.ts`

### Completion Notes
- [x] Story key parsed: 5-403-implementer-le-cache-des-embeddings
- [x] Epic 5 context loaded and analyzed
- [x] Story requirements extracted from epics file
- [x] Architecture cache patterns identified
- [x] Previous story (5-402) intelligence incorporated
- [x] Existing embedding service code analyzed
- [x] Hierarchical cache pattern designed (Redis -> In-Memory -> API)
- [x] Fallback strategies documented
- [x] Phase 1: Configuration Redis terminée (Tâches 1.1-1.3)
- [x] Phase 2: Intégration avec EmbeddingService terminée (Tâches 2.1-2.3)
- [x] Phase 3: Métriques et Monitoring terminée (Tâches 3.1-3.2)
- [x] Phase 4: Benchmark et Validation terminée (Tâches 4.1-4.3)
- [x] Tous les Acceptance Criteria validés (AC1-AC5)
- [x] Cache hit ratio: 50% > 30% (AC1)
- [x] Cache hit temps: 10.96ms < 50ms (AC2)
- [x] Réduction API calls: 50% > 0% (AC3)
- [x] Benchmark documenté dans docs/benchmark/embedding-cache-benchmark.md

### Next Steps
- [ ] Passer en revue (code-review workflow)
- [ ] Optionnel: Exécuter `/bmad:tea:automate` pour étendre les tests de guardrail
- [ ] Déployer en production une fois validé

---
*Story générée par BMAD Create-Story Workflow*
*Date: 2026-07-14 | Projet: NexiaMind AI | Épic: 5*
