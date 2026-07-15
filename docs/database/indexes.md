# Documentation des Index Classiques

**Story:** ST-404 - Créer les Index Classiques  
**Épic:** 5 - Base de Données & Optimisation  
**Date de création:** 2026-07-15  
**Statut:** Index de base créés et validés en production (AC1-AC4). Script mis à jour suite à revue de code (CONCURRENTLY, index d'expression, index composites) — ces améliorations restent à appliquer sur Supabase.  

---

## Overview

Ce document documente tous les index classiques créés sur la base de données Supabase du projet NexiaMind AI. Ces index ont été ajoutés pour optimiser les performances des requêtes SQL fréquentes sur les tables principales de l'application.

---

## Index par Table

### 📊 Table: `public.chunks`

| Nom de l'Index | Colonne | Type | Justification |
|---------------|---------|------|---------------|
| `idx_chunks_document_id` | `document_id` | B-tree | Filtrer les chunks par document (requêtes RAG fréquentes) |
| `idx_chunks_metadata` | `metadata` | GIN | Recherches de containment JSON (`metadata @> '{"role":"developer"}'`) |
| `idx_chunks_metadata_role` | `(metadata->>'role')` | B-tree (expression) | Sert spécifiquement `metadata->>'role' = '...'` — le GIN ci-dessus ne le sert pas |
| `idx_chunks_created_at` | `created_at` | B-tree | Tri chronologique et pagination |

**Schéma de la table:**
```sql
CREATE TABLE public.chunks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    content text NOT NULL,
    chunk_index integer NOT NULL,
    token_count integer NOT NULL,
    hash text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT chunks_pkey PRIMARY KEY (id),
    CONSTRAINT chunks_document_id_fkey FOREIGN KEY (document_id) 
        REFERENCES public.documents(id)
);
```

**Requêtes optimisées:**
```sql
-- Récupérer tous les chunks d'un document
SELECT * FROM chunks WHERE document_id = 'xxx';

-- Filtrer par métadonnées (égalité sur un champ extrait) — servi par idx_chunks_metadata_role
SELECT * FROM chunks WHERE metadata->>'role' = 'developer';

-- Filtrer par métadonnées (containment) — servi par idx_chunks_metadata (GIN)
SELECT * FROM chunks WHERE metadata @> '{"role": "developer"}';

-- Récupérer les chunks récents
SELECT * FROM chunks ORDER BY created_at DESC LIMIT 100;
```

---

### 💬 Table: `public.conversations`

| Nom de l'Index | Colonne | Type | Justification |
|---------------|---------|------|---------------|
| `idx_conversations_user_id` | `user_id` | B-tree | Filtrer les conversations par utilisateur (critique pour RLS) |
| `idx_conversations_created_at` | `created_at` | B-tree | Tri et pagination des conversations |
| `idx_conversations_user_id_created_at` | `(user_id, created_at)` | B-tree composite | Filtre + tri en une seule passe (liste des conversations d'un utilisateur triée par date) |

**Schéma de la table:**
```sql
CREATE TABLE public.conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text,
    description text,
    is_archived boolean DEFAULT false,
    client_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversations_pkey PRIMARY KEY (id),
    CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) 
        REFERENCES auth.users(id)
);
```

**Requêtes optimisées:**
```sql
-- Récupérer les conversations d'un utilisateur (utilisé par RLS)
SELECT * FROM conversations WHERE user_id = 'xxx';

-- Lister les conversations récentes
SELECT * FROM conversations ORDER BY created_at DESC;
```

---

### 💭 Table: `public.messages`

| Nom de l'Index | Colonne | Type | Justification |
|---------------|---------|------|---------------|
| `idx_messages_conversation_id` | `conversation_id` | B-tree | Récupérer tous les messages d'une conversation |
| `idx_messages_created_at` | `created_at` | B-tree | Tri chronologique dans une conversation |
| `idx_messages_conversation_id_created_at` | `(conversation_id, created_at)` | B-tree composite | Filtre + tri en une seule passe (messages d'une conversation triés par date) |

**Schéma de la table:**
```sql
CREATE TABLE public.messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL,
    content text NOT NULL,
    role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
    token_count integer,
    sources jsonb DEFAULT '[]'::jsonb,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) 
        REFERENCES public.conversations(id)
);
```

**Requêtes optimisées:**
```sql
-- Récupérer tous les messages d'une conversation
SELECT * FROM messages WHERE conversation_id = 'xxx';

-- Récupérer les messages dans l'ordre chronologique
SELECT * FROM messages 
WHERE conversation_id = 'xxx' 
ORDER BY created_at ASC;
```

---

## Index Vectoriels Existants

En plus des index classiques ci-dessus, la base de données contient également :

| Nom de l'Index | Table | Type | Story |
|---------------|-------|------|-------|
| `idx_embeddings_vector` | `public.embeddings` | IVFFlat | ST-402 |

**Définition:**
```sql
CREATE INDEX IF NOT EXISTS idx_embeddings_vector
    ON public.embeddings USING ivfflat (vector vector_l2_ops) WITH (lists = 100);
```

---

## Script d'Implémentation

**Fichier:** `scripts/database/create-classical-indexes.sql`  
**Story:** ST-404  

Ce script contient toutes les instructions SQL pour créer les index documentés ci-dessus, ainsi que des requêtes de validation pour vérifier leur création.

### Exécution du Script

```bash
# Méthode 1: Via psql
psql -h db.xxxxxx.supabase.co -U postgres -d postgres \
  -f scripts/database/create-classical-indexes.sql

# Méthode 2: Via l'interface web Supabase
# 1. Aller dans SQL Editor
# 2. Copier-coller le contenu du script SAUF la ligne `\set ON_ERROR_STOP on`
#    (méta-commande psql, non comprise par l'éditeur SQL Supabase)
# 3. Exécuter

# Méthode 3: En plusieurs parties (pour éviter les timeouts)
# Exécuter chaque section du script séparément
```

⚠️ **Important:** le script utilise `CREATE INDEX CONCURRENTLY`, qui ne peut pas s'exécuter à l'intérieur d'un bloc de transaction (`BEGIN`/`COMMIT`). Ne pas englober son exécution dans une transaction explicite — chaque instruction se commit individuellement, ce qui est voulu pour éviter de bloquer les écritures.

---

## Validation des Index

### Vérification via psql

```sql
-- Vérifier tous les index sur les tables cibles
SELECT 
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    indexdef AS definition
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('chunks', 'conversations', 'messages')
ORDER BY tablename, indexname;
```

### Vérification via l'interface Supabase

1. Aller dans **Table Editor**
2. Sélectionner la table concernée (chunks, conversations, ou messages)
3. Cliquer sur l'onglet **Indexes**
4. Vérifier que tous les index attendus sont présents

---

## Benchmarks de Performance

Mesures réelles via `EXPLAIN ANALYZE`, exécutées le 2026-07-15 sur la base de production Supabase.

### Volumétrie au moment du test

| Table | Lignes |
|-------|--------|
| chunks | 814 |
| conversations | 13 |
| messages | 18 |

### Résultats `EXPLAIN ANALYZE`

| Requête | Temps d'exécution | Plan d'exécution réel | Index utilisé ? |
|---------|-------------------|------------------------|------------------|
| `SELECT * FROM chunks WHERE document_id = '...'` | 0.102 ms | `Bitmap Heap Scan` + `Bitmap Index Scan on idx_chunks_document_id` | ✅ Oui |
| `SELECT * FROM conversations WHERE user_id = '...'` | 0.076 ms | `Seq Scan on conversations` (Filter: user_id = ...) | ❌ Non — voir note ci-dessous |
| `SELECT * FROM messages WHERE conversation_id = '...' ORDER BY created_at ASC` | 0.114 ms | `Sort` + `Seq Scan on messages` (Filter: conversation_id = ...) | ❌ Non — voir note ci-dessous |
| `SELECT * FROM chunks ORDER BY created_at DESC LIMIT 100` | 0.149 ms | `Limit` + `Index Scan Backward using idx_chunks_created_at` | ✅ Oui |
| `SELECT * FROM conversations WHERE user_id = auth.uid()` (RLS actif, utilisateur authentifié) | 0.086 ms | `Seq Scan on conversations` (Filter sur `auth.uid()` résolu) — même plan que la requête équivalente sans RLS | ❌ Non — voir note ci-dessous |

**Note — pourquoi `idx_conversations_user_id` et `idx_messages_conversation_id` ne sont pas (encore) utilisés :** `conversations` (13 lignes) et `messages` (18 lignes) sont actuellement trop petites pour que le planificateur PostgreSQL préfère un index scan à un sequential scan — en dessous d'un certain volume, parcourir toute la table est moins coûteux que de passer par l'index. C'est un comportement normal et attendu du planner, pas un défaut des index. Ces deux index redeviendront actifs automatiquement à mesure que ces tables grandissent en production ; ils restent un investissement pertinent pour la suite mais **AC5 n'est aujourd'hui vérifié que pour `chunks`** (814 lignes), pas encore pour `conversations`/`messages`.

La vérification sous RLS actif (dernière ligne) confirme que la politique RLS ne change pas la nature du plan (toujours un Seq Scan, pour la même raison de volumétrie) — aucune dégradation spécifique à RLS constatée.

---

## Bonnes Pratiques

### Quand créer des index ?

1. **Colonnes fréquemment filtrées** (WHERE clause)
2. **Colonnes utilisées pour le tri** (ORDER BY)
3. **Colonnes utilisées dans les jointures** (JOIN)
4. **Colonnes avec des contraintes UNIQUE**

### Quand éviter les index ?

1. **Tables très petites** (moins de 100 lignes)
2. **Colonnes rarement interrogées**
3. **Colonnes avec très peu de cardinalité** (ex: genre: M/F)
4. **Tables avec des écritures très fréquentes** (les index ralentissent les INSERT/UPDATE/DELETE)

### Types d'index recommandés

| Type | Utilisation | Avantages | Inconvénients |
|------|------------|-----------|---------------|
| B-tree | Valeurs scalaires, tri, égalité | Universel, efficace | - |
| GIN | Colonnes JSON, tableaux, recherche full-text | Recherches complexes | Plus lent à créer, plus grand |

Note : aucun index de ce document n'utilise le type Hash — B-tree couvre déjà l'égalité et le tri pour toutes les colonnes ciblées ici, donc Hash n'apporte pas d'avantage concret dans ce contexte et n'est pas utilisé.

---

## Intégration avec RLS

Les index sur `user_id` et `conversation_id` sont particulièrement importants car ils sont utilisés conjointement avec les politiques **Row-Level Security (RLS)** :

- Les politiques RLS filtrent les lignes basées sur l'utilisateur actuel
- Les index permettent à PostgreSQL d'utiliser ces filtres efficacement
- Sans index, les requêtes RLS pourraient effectuer un **seq scan** sur toute la table

Exemple de politique RLS sur conversations:
```sql
CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT USING (auth.uid() = user_id);
```

Avec l'index `idx_conversations_user_id` (ou le composite `idx_conversations_user_id_created_at`), cette requête est prête à être optimisée dès que la table sera suffisamment volumineuse pour que le planificateur préfère un index scan à un sequential scan — voir la section "Benchmarks de Performance" ci-dessus : à la volumétrie actuelle (13 lignes), PostgreSQL choisit encore un Seq Scan, y compris sous RLS.

---

## Maintenance

### Monitoring des index

```sql
-- Voir la taille des index
SELECT 
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS size
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('chunks', 'conversations', 'messages')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Voir l'utilisation des index
SELECT 
    schemaname,
    relname,
    indexrelname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
    AND relname IN ('chunks', 'conversations', 'messages');
```

### Suppression d'un index

Si un index doit être supprimé (ex: pour le remplacer) :

```sql
-- PostgreSQL n'a pas de clause ON tablename sur DROP INDEX (contrairement à MySQL) :
DROP INDEX IF EXISTS idx_nom_de_index;
```

⚠️ **Attention:** La suppression d'un index peut avoir un impact significatif sur les performances. Toujours tester en environnement de staging avant de supprimer un index en production.

---

## Historique des Changements

| Date | Version | Auteur | Description |
|------|---------|--------|-------------|
| 2026-07-15 | 1.0 | Dday | Création initiale - Story ST-404 |
| 2026-07-15 | 1.1 | Revue de code | Ajout `CONCURRENTLY`, index d'expression `idx_chunks_metadata_role`, index composites, `ANALYZE`, validation automatisée ; benchmarks remplacés par de vraies mesures `EXPLAIN ANALYZE` ; corrections de syntaxe/liens/incohérences documentaires |

---

## Références

- **Story:** [5-404-creer-les-index-classiques.md](../../_bmad-output/implementation-artifacts/5-404-creer-les-index-classiques.md)
- **Épics & Stories:** [epics-and-stories.md](../../_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md)
- **BDD:** [bdd.md](../../_bmad-output/planning-artifacts/architecture-nexiamind-ai/bdd.md)
- **Script SQL:** [create-classical-indexes.sql](../../scripts/database/create-classical-indexes.sql)
