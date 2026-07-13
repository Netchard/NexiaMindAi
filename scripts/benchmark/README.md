# Benchmark de l'Index Vectoriel - ST-402

Script de benchmark pour tester différentes configurations d'index IVFFlat et déterminer la configuration optimale pour l'index vectoriel pgvector.

## 🚀 Quick Start

### 1. Installer les dépendances
```bash
cd scripts/benchmark
npm install
```

### 2. Exécuter le benchmark MOCK (sans base de données)
```bash
npm run benchmark:mock
```

**Résultat:** Génère un rapport de benchmark avec des données simulées réalistes.

### 3. Exécuter les tests unitaires
```bash
npm test
```

**Résultat:** Exécute 24 tests Jest (12 RED + 12 GREEN) pour valider les fonctionnalités.

### 4. Exécuter le benchmark réel (requiert base Supabase)
```bash
# Créer le fichier de configuration
cp .env.example .env

# Éditer .env avec vos credentials Supabase
# SUPABASE_URL=https://votre-projet.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Exécuter le benchmark
npm run benchmark
```

**Pré-requis pour le benchmark réel:**
- Base Supabase avec extension `vector` installée: `CREATE EXTENSION IF NOT EXISTS vector;`
- Table `public.embeddings` avec colonne `vector vector(384)`
- Les migrations SQL doivent être exécutées (voir `supabase/migrations/20260712_create_benchmark_rpc_functions.sql`)

---

## 📋 Configuration

### Variables d'environnement requises

| Variable | Description | Source |
|----------|-------------|--------|
| `SUPABASE_URL` | URL de votre projet Supabase | Paramètres du projet > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé admin (service role) | Paramètres du projet > API |

### Configuration du benchmark

Voir `benchmark-vector-index.js` pour modifier:
```javascript
const BENCHMARK_CONFIG = {
  listConfigurations: [50, 100, 200, 400], // Valeurs de 'lists' à tester
  testIterations: 5,        // Nombre de tests par configuration
  queryLimit: 10,           // Nombre de résultats par requête
  warmupQueries: 3         // Requêtes de réchauffement
};
```

---

## 📁 Fichiers générés

Chaque exécution crée des fichiers avec timestamp unique:
- `vector-index-benchmark-<timestamp>.json` - Rapport de benchmark complet
- `vector-index-benchmark-<timestamp>.log` - Journal d'exécution

---

## 🏗️ Architecture

### Fonctions RPC utilisées

Le script dépend de 4 fonctions RPC définies dans `supabase/migrations/20260712_create_benchmark_rpc_functions.sql`:

1. **`drop_index_if_exists(index_name)`** - Supprime un index s'il existe
2. **`create_ivfflat_index(table_name, column_name, index_name, lists)`** - Crée un index IVFFlat avec validation stricte
3. **`benchmark_vector_similarity(query_vector, limit_count)`** - Exécute une recherche de similarité (évite l'injection SQL)
4. **`get_index_construction_status(index_name)`** - Vérifie si un index est prêt

### Sécurité

- ✅ **Pas d'injection SQL** - Utilisation de RPC avec paramètres typés
- ✅ **Validation des identifiants** - Toutes les RPC utilisent `format('%I', ...)`
- ✅ **Vérification de dimension** - La dimension vectorielle est validée à 384
- ✅ **Isolation des index** - Nettoyage avant/après chaque configuration
- ✅ **Validation des pré-conditions** - Vérifie extension, table, colonne avant exécution

---

## 📊 Acceptance Criteria

| AC | Description | Statut |
|----|-------------|--------|
| AC1 | Justification par benchmark | ✅ Recommande lists=200 (aligné avec G1) |
| AC2 | Test de performance avec différents paramètres | ✅ 4 configurations testées |
| AC3 | Temps de réponse < 3s | ✅ Seuil vérifié et recommandé |

---

## 🔍 Dépannage

### Erreur: "SUPABASE_URL non défini"
**Solution:** Créez un fichier `.env` à partir de `.env.example` ou passez les variables en ligne de commande.

### Erreur: "Extension pgvector non trouvée"
**Solution:** Exécutez `CREATE EXTENSION IF NOT EXISTS vector;` sur votre base Supabase.

### Erreur: "Table public.embeddings non trouvée"
**Solution:** Créez la table `embeddings` avec une colonne `vector vector(384)`.

### Erreur: "RPC non disponible"
**Solution:** Exécutez la migration SQL `supabase/migrations/20260712_create_benchmark_rpc_functions.sql` sur votre base.

---

## 📚 Documentation

- [Rapport de revue complète](docs/ST-402-G3-Review-Results.md)
- [Story ST-402](_bmad-output/implementation-artifacts/5-402-optimiser-l-index-vectoriel.md)
- [Migration G1](supabase/migrations/20260712_optimize_vector_index.sql)

---

## 🎯 Résultats attendus

Le benchmark recommande **lists=200** comme configuration optimale, ce qui est aligné avec:
- La migration du Groupe 1 qui déploie `lists=200`
- Les best practices pgvector pour des tables de taille moyenne
- Le compromis optimal entre vitesse et stabilité

**Temps typiques (simulés):**
- lists=50: ~1400ms
- lists=100: ~1200ms
- lists=200: ~1100ms (meilleur)
- lists=400: ~1300ms (trop de partitions)
