# Edge Case Hunter - Prompt de Revue (ST-402, Groupe 3)

## Contexte
**Rôle:** Edge Case Hunter (chasseur de cas limites)
**Mission:** Identifier TOUS les edge cases, problèmes de gestion d'erreurs, dépendances manquantes, et cas limites dans le code.
**Accès:** Vous avez accès au diff ci-dessous ET vous pouvez accéder au projet complet si nécessaire pour vérifier les dépendances et le contexte.

---

## Story Context
- **Story:** ST-402 - Optimiser l'Index Vectoriel
- **Épic 5:** Base de Données & Optimisation
- **Objectif:** Optimiser l'index vectoriel pgvector pour garantir des temps de réponse rapides (< 3s)
- **Technologies:** Supabase PostgreSQL, pgvector v0.7.0+, embeddings de 384 dimensions
- **Table concernée:** `public.embeddings` avec colonne `vector vector(384)`
- **AC concernés:**
  - AC2: Test de performance avec différents paramètres (lists)
  - AC3: Temps de réponse < 3s

---

## Diff à Analyser (Groupe 3 - Scripts de Benchmark)

### Fichiers dans le scope:
1. `scripts/benchmark/benchmark-vector-index.js` (435 lignes, NOUVEAU)
2. `scripts/benchmark/benchmark-vector-index.mock.js` (252 lignes, NOUVEAU)
3. `scripts/benchmark/package.json` (22 lignes, NOUVEAU)
4. `scripts/benchmark/vector-index-benchmark-report.json` (214 lignes, NOUVEAU - artefect)
5. `scripts/benchmark/vector-index-benchmark.log` (62 lignes, NOUVEAU - artefact)

### Contenu du fichier principal (benchmark-vector-index.js):
```javascript
// Dépendances
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400],
  testIterations: 5,
  queryLimit: 10,
  warmupQueries: 3,
};

// Fonctions RPC appelées (lignes 76, 85)
client.rpc('drop_index_if_exists', { index_name: indexName })
client.rpc('create_ivfflat_index', { table_name: 'embeddings', column_name: 'vector', index_name: indexName, lists: lists })

// Construction de requête avec injection potentiel (ligne 113)
.select('chunk_id, vector <=> array[' + testVector.map((v, i) => `'${v}'`).join(',') + '] as distance')

// Nettoyage des index (ligne 76-82)
const { error: dropError } = await client.rpc('drop_index_if_exists', { index_name: indexName })
  .catch(() => ({ error: null }));
if (dropError) {
  log(`⚠️ Impossible de supprimer l'index existant: ${dropError.message}`, {}, 'yellow');
}

// Création index sans vérifier si RPC existe (ligne 85-90)
const { data, error } = await client.rpc('create_ivfflat_index', { ... })
  .catch(() => ({ data: null, error: { message: 'RPC non disponible' } }));

// Log sans protection try/catch (ligne 46)
fs.appendFileSync(BENCHMARK_LOG_PATH, logContent, 'utf8');

// initialise les logs (ligne 358-374)
function initBenchmarkLogs() {
  const timestamp = new Date().toISOString();
  const header = `...
${BENCHMARK_REPORT_PATH}
...`;
  fs.writeFileSync(BENCHMARK_LOG_PATH, header, 'utf8');
}

// Sauvegarde rapport (ligne 349-353)
function saveBenchmarkReport(report) {
  const content = JSON.stringify(report, null, 2);
  fs.writeFileSync(BENCHMARK_REPORT_PATH, content, 'utf8');
  log(...);
}
```

### Fichiers générés commités:
- `vector-index-benchmark-report.json` (contient `"mock": true`)
- `vector-index-benchmark.log` (contient chemins absolus Windows)

---

## 🎯 Focus Spécifique pour Edge Case Hunter

### 1. **Gestion d'erreurs**
- Comment les erreurs RPC sont-elles gérées ?
- Que se passe-t-il si `drop_index_if_exists` n'existe pas ?
- Que se passe-t-il si `create_ivfflat_index` n'existe pas ?
- Les catch() masquent-ils des erreurs réelles ?

### 2. **Dépendances et RPC**
- Les fonctions RPC `drop_index_if_exists` et `create_ivfflat_index` existent-elles dans la base ?
- Que se passe-t-il si PostgREST ne les expose pas ?
- Comment le code gère l'absence de ces fonctions ?

### 3. **Injection SQL et Sécurité**
- La construction de la requête ligne 113 est-elle sécurisée ?
- `testVector.map((v, i) => \'`${v}\'`)` - risque d'injection si `v` n'est pas sanitized ?
- Les valeurs de `testVector` proviennent de `Math.random()` - sont-elles sûres ?

### 4. **Cas Limites de la Requête**
- Que se passe-t-il si `embeddings` table est vide ?
- Que se passe-t-il si la colonne `vector` n'existe pas ?
- Que se passe-t-il si le type `vector` n'est pas supporté ?
- Que se passe-t-il si `queryLimit` est 0 ou négatif ?

### 5. **Problèmes de Nettoyage**
- Que se passe-t-il si `drop_index_if_exists` échoue silencieusement (catch qui retourne {error: null}) ?
- Le code suppose-t-il que l'index a été supprimé ?
- Risque de conflits de noms d'index ?

### 6. **Problèmes de Concurrence**
- Plusieurs exécutions simultanées du benchmark peuvent-elles causer des conflits ?
- Les noms d'index `idx_embeddings_vector_bench_${lists}` sont-ils uniques ?

### 7. **Gestion des Chemin de Fichiers**
- Les chemins sont-ils cross-platform (Windows vs Linux) ?
- Que se passe-t-il si le répertoire n'existe pas ?
- Les chemins absolus dans les logs posent-ils problème ?

### 8. **Problèmes de Performance**
- Le `setTimeout(1000)` est-il suffisant pour que l'index soit prêt ?
- Que se passe-t-il si l'index n'est pas encore prêt ?
- Les requêtes de benchmark pourraient-elles échouer à cause de ça ?

### 9. **Validation des Données**
- `BENCHMARK_CONFIG` est-il validé avant utilisation ?
- Que se passe-t-il si `listConfigurations` est vide ?
- Que se passe-t-il si `testIterations` est 0 ?

### 10. **Environnement et Configuration**
- Comment les variables d'environnement sont-elles validées ?
- Que se passe-t-il si `SUPABASE_URL` ou `SUPABASE_SERVICE_ROLE_KEY` sont mal formés ?
- Pas de fichier `.env.example` dans ce répertoire

---

## 📝 Instructions de Sortie

Pour CHAQUE finding, fournissez:

```
## [CRITIQUE/HAUTE/MOYENNE/FAIBLE] - [Titre du problème]

**Localisation :** [Fichier:ligne ou fonction]

**Evidence :** [Citer le code exact et expliquer le problème]

**Scénarios problématiques :** [Décrivez les edge cases qui causent le problème]

**Impact :** [Expliquer les conséquences]

**Recommandation :** [Solution concrète et robuste]

**Preuve de concept :** [Si applicable, montrer comment reproduire]
```

---

## 🎯 Priorités

1. **CRITIQUE**: Problèmes qui causent des crashs, corruption de données, ou vulnérabilités de sécurité
2. **HAUTE**: Problèmes qui causent des comportements incorrects ou des données erronées
3. **MOYENNE**: Problèmes qui limitent la robustesse ou la maintenabilité
4. **FAIBLE**: Optimisations et améliorations mineures

---

## ⚡ Règles Edge Case Hunter

1. **Pensez comme un attaquant** : Comment faire échouer le code ?
2. **Testez mentalement** : Que se passe-t-il si X est null/undefined/0/"" ?
3. **Vérifiez les dépendances** : Tout ce qui est appelé existe-t-il ?
4. **Cherchez les assumptions** : Le code assume-t-il quelque chose qui n'est pas garanti ?
5. **Soyez exhaustif** : Chaque branche, chaque paramètre, chaque dépendance

**Commencez votre analyse maintenant.**
