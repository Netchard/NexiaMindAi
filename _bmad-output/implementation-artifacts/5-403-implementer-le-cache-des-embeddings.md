---
baseline_commit: 22ed471
---

# Story 5.403: Implémenter le Cache des Embeddings

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**En tant que** Développeur Backend
**Je veux** un cache pour les embeddings fréquemment utilisés
**Afin de** réduire les coûts API Mistral et améliorer les performances du pipeline RAG.

---

## Acceptance Criteria

### Criteria d'Acceptation Principaux (DoD)

1. **Cache Redis/Upstash opérationnel**
   - [ ] Service Redis configuré via Upstash (ou local pour dev)
   - [ ] Client Redis initialisé avec URL et token depuis variables d'environnement
   - [ ] Connection testée et validée avant utilisation

2. **Cache des embeddings distribué**
   - [ ] Remplacer le cache in-memory (Map) par Redis dans `EmbeddingService`
   - [ ] Clé de cache basée sur hash SHA-256 du texte (remplace la simple hash actuelle)
   - [ ] TTL configuré à 1 heure (3600 secondes) pour tous les embeddings
   - [ ] Sérialisation/Desérialisation JSON des embeddings pour le stockage

3. **Réduction mesurable des appels API**
   - [ ] Métriques implémentées : compteur d'appels API Mistral
   - [ ] Métriques implémentées : compteur de cache hits/misses
   - [ ] Ratio cache hit > 30% en conditions réelles (simulation acceptable)
   - [ ] Logs des métriques dans les console.info existantes

4. **Tests de performance avec/sans cache**
   - [ ] Script de benchmark créé : `scripts/benchmark/cache-benchmark.js`
   - [ ] Mesurer le temps moyen de génération avec cache (doit être < 50ms pour hits)
   - [ ] Mesurer le temps moyen sans cache (doit être > 200ms pour appels API réels)
   - [ ] Comparaison documentée dans un rapport de benchmark

5. **Backward compatibility**
   - [ ] Fallback graceux vers le cache in-memory si Redis n'est pas disponible
   - [ ] Fallback vers appel API direct si les deux caches échouent
   - [ ] Pas de breaking changes dans l'API publique de `EmbeddingService`

---

## Tâches Techniques Détaillées

### Phase 1: Configuration Redis (Estimation: 1h)
- [ ] **Tâche 1.1 : Créer le service Redis**
  - [ ] Installer dépendance `@upstash/redis`
  - [ ] Créer `src/lib/cache/redis.ts` avec client Redis singleton
  - [ ] Gérer la connection avec retry logic (3 tentatives, 5s intervalle)
  - [ ] Valider la connection au démarrage
  - [ ] Fermer la connection proprement sur shutdown

- [ ] **Tâche 1.2 : Configurer les variables d'environnement**
  - [ ] Ajouter `UPSTASH_REDIS_REST_URL` dans `.env.example`
  - [ ] Ajouter `UPSTASH_REDIS_REST_TOKEN` dans `.env.example`
  - [ ] Documenter les valeurs pour le développement local (Redis Docker)
  - [ ] Documenter les valeurs pour la production (Upstash)

- [ ] **Tâche 1.3 : Créer les wrappers de cache**
  - [ ] Implémenter `get(key: string): Promise<string | null>`
  - [ ] Implémenter `set(key: string, value: string, ttl?: number): Promise<void>`
  - [ ] Implémenter `del(key: string): Promise<void>`
  - [ ] Implémenter `exists(key: string): Promise<boolean>`
  - [ ] Implémenter `clear(): Promise<void>` (pour tests)

### Phase 2: Intégration avec EmbeddingService (Estimation: 1.5h)
- [ ] **Tâche 2.1 : Créer RedisEmbeddingCache**
  - [ ] Implémenter la classe `RedisEmbeddingCache`
  - [ ] Méthode `getEmbedding(key: string): Promise<EmbeddingResult | null>`
  - [ ] Méthode `setEmbedding(key: string, result: EmbeddingResult): Promise<void>`
  - [ ] Gérer la sérialisation/desérialisation automatiquement

- [ ] **Tâche 2.2 : Mettre à jour EmbeddingService**
  - [ ] Ajouter dépendance optionnelle sur `RedisEmbeddingCache`
  - [ ] Modifier `getFromCache()` pour utiliser Redis en premier
  - [ ] Modifier `addToCache()` pour écrire dans Redis
  - [ ] Maintenir le cache in-memory comme fallback
  - [ ] Ajouter logging des cache hits/misses

- [ ] **Tâche 2.3 : Génération de clé de cache améliorée**
  - [ ] Remplacer `generateCacheKey()` par hash SHA-256
  - [ ] Utiliser `crypto.createHash('sha256')` pour le hachage
  - [ ] Préfixer les clés avec `embedding:` pour l'organisation Redis
  - [ ] Limiter la taille de la clé (hash hex seul, sans préfixe de texte)

### Phase 3: Métriques et Monitoring (Estimation: 0.5h)
- [ ] **Tâche 3.1 : Implémenter les métriques**
  - [ ] Ajouter compteur `apiCallsCount` dans `EmbeddingService`
  - [ ] Ajouter compteur `cacheHitsCount` dans `EmbeddingService`
  - [ ] Ajouter compteur `cacheMissesCount` dans `EmbeddingService`
  - [ ] Exposer méthode `getMetrics()` pour récupérer les statistiques

- [ ] **Tâche 3.2 : Logging des métriques**
  - [ ] Logger chaque cache hit avec durée (doit être < 50ms)
  - [ ] Logger chaque cache miss avant l'appel API
  - [ ] Logger chaque appel API avec durée totale

### Phase 4: Benchmark et Validation (Estimation: 1h)
- [ ] **Tâche 4.1 : Créer le script de benchmark**
  - [ ] Créer `scripts/benchmark/cache-benchmark.js`
  - [ ] Tester avec 100 requêtes uniques (cache miss)
  - [ ] Tester avec 100 requêtes répétées (cache hit)
  - [ ] Mesurer temps moyen, min, max pour chaque scénario

- [ ] **Tâche 4.2 : Exécuter les benchmarks**
  - [ ] Exécuter avec cache Redis activé
  - [ ] Exécuter avec cache in-memory seulement
  - [ ] Exécuter sans cache du tout
  - [ ] Documenter les résultats dans `docs/benchmark/embedding-cache-benchmark.md`

- [ ] **Tâche 4.3 : Valider les AC**
  - [ ] Vérifier que le ratio cache hit > 30% pour les requêtes répétées
  - [ ] Vérifier que le temps de réponse < 50ms pour les cache hits
  - [ ] Vérifier que les appels API sont réduits pour les requêtes en double

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
- [x] Hierarchical cache pattern designed
- [x] Fallback strategies documented

### Next Steps
1. `npm install @upstash/redis`
2. Créer `src/lib/cache/redis.ts`
3. Mettre à jour `src/lib/rag/embeddings.ts`
4. Créer les tests: `src/lib/cache/__tests__/redis.test.ts`
5. Créer `scripts/benchmark/cache-benchmark.js`
6. Exécuter benchmarks et valider AC

---
*Story générée par BMAD Create-Story Workflow*
*Date: 2026-07-14 | Projet: NexiaMind AI | Épic: 5*
