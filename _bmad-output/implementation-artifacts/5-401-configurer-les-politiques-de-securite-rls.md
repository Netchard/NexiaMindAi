# Story 5.401: Configurer les Politiques de Sécurité (RLS)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**En tant que** Développeur Backend  
**Je veux** des politiques Row-Level Security (RLS) configurées sur toutes les tables  
**Afin de** garantir que les utilisateurs n'accèdent qu'aux données autorisées.

## Acceptance Criteria

### ✅ Critères d'Acceptation Principaux (DoD)

1. **RLS activé sur toutes les tables**
   - Vérifier que RLS est activé sur : profiles, documents, chunks, embeddings, conversations, messages, sync_logs
   - Utiliser `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

2. **Politique : les utilisateurs voient seulement leurs conversations**
   - Politique SELECT sur `conversations` : `auth.uid() = user_id`
   - Politique INSERT sur `conversations` : `auth.uid() = user_id`
   - Politique UPDATE/DELETE sur `conversations` : `auth.uid() = user_id`

3. **Politique : les chunks sont filtrés par rôle utilisateur**
   - Politique SELECT sur `chunks` : filtre basé sur `metadata->>'allowed_roles'`
   - Utiliser `current_setting('app.current_role')` pour récupérer le rôle
   - Gérer le cas où `allowed_roles = 'all'`

4. **Politique : les documents sont accessibles selon les permissions**
   - Politique SELECT sur `documents` : basées sur le rôle et client_id
   - Les admins voient tous les documents
   - Les autres rôles voient uniquement les documents autorisés pour leur rôle

5. **Tests de sécurité**
   - Tester chaque politique avec différents rôles (admin, manager, project_lead, developer, consultant)
   - Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre utilisateur
   - Documenter les tests effectués

### 📋 Tâches Techniques Détaillées

- [ ] **Tâche 1 : Activer RLS sur toutes les tables** (AC: #1)
  - [ ] Lister toutes les tables du schéma public
  - [ ] Activer RLS sur chaque table avec `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  - [ ] Vérifier que RLS est bien activé

- [ ] **Tâche 2 : Créer les politiques pour la table conversations** (AC: #2)
  - [ ] Créer la politique SELECT pour la table conversations
  - [ ] Créer la politique INSERT pour la table conversations
  - [ ] Créer les politiques UPDATE et DELETE pour la table conversations
  - [ ] Tester avec un utilisateur non-admin

- [ ] **Tâche 3 : Créer les politiques pour la table chunks** (AC: #3)
  - [ ] Créer la politique SELECT basée sur les rôles
  - [ ] Implémenter la logique : `metadata->>'allowed_roles' ? current_setting('app.current_role') OR metadata->>'allowed_roles' = 'all'`
  - [ ] Tester avec différents rôles

- [ ] **Tâche 4 : Créer les politiques pour la table documents** (AC: #4)
  - [ ] Créer la politique SELECT basée sur le rôle et client_id
  - [ ] Gérer les cas particuliers pour les admins
  - [ ] Tester l'accès aux documents

- [ ] **Tâche 5 : Créer les politiques pour les autres tables** (AC: #1)
  - [ ] Politiques pour embeddings (basées sur document_id via chunks)
  - [ ] Politiques pour messages (basées sur conversation_id)
  - [ ] Politiques pour sync_logs (restreindre à admin)
  - [ ] Politiques pour profiles (chaque utilisateur voit son profil)

- [ ] **Tâche 6 : Tests de sécurité complets** (AC: #5)
  - [ ] Créer un script de test SQL
  - [ ] Tester chaque politique avec chaque rôle
  - [ ] Documenter les résultats
  - [ ] Corriger les problèmes identifiés

## Dev Notes

### 🏗️ Contexte Architecturel

**Source:** [Architecture Technique - NexiaMind AI V1](../planning-artifacts/architecture-nexiamind-ai/architecture.md)

- **Base de données:** Supabase PostgreSQL avec pgvector
- **Authentification:** Supabase Auth (JWT tokens)
- **Rôles définis:** admin, manager, project_lead, developer, consultant
- **Tables concernées:** profiles, documents, chunks, embeddings, conversations, messages, sync_logs

### 📂 Structure des Tables (depuis architecture.md)

```sql
-- Table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'developer'::text CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'project_lead'::text, 'developer'::text, 'consultant'::text])),
    ...
);

-- Table conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT,
    description TEXT,
    is_archived BOOLEAN DEFAULT false,
    client_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ...
    CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table chunks
CREATE TABLE IF NOT EXISTS public.chunks (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER NOT NULL,
    hash TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ...
);

-- Table documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type = ANY (ARRAY['pdf'::text, 'text'::text, 'markdown'::text, 'code'::text, 'csv'::text, 'json'::text, 'other'::text])),
    source TEXT NOT NULL CHECK (source = ANY (ARRAY['supabase'::text, 'gitlab'::text, 'nexia'::text, 'upload'::text])),
    client_id TEXT,
    ...
);
```

### 🔐 RBAC (Role-Based Access Control)

**Source:** [Architecture Technique - Sécurité](../planning-artifacts/architecture-nexiamind-ai/architecture.md#-sécurité)

| Rôle | Accès Supabase | Accès GitLab | Accès Nexia | Accès Admin |
|------|----------------|--------------|-------------|--------------|
| admin | ✅ All | ✅ All | ✅ All | ✅ |
| manager | ✅ All | ❌ | ✅ All | ❌ |
| project_lead | ✅ All | ✅ Repos projets | ✅ Projets | ❌ |
| developer | ✅ Docs techniques | ✅ All | ✅ Docs techniques | ❌ |
| consultant | ✅ Docs clients | ❌ | ✅ Docs clients | ❌ |

### 🎯 Politiques RLS Requises

#### Exemples fournis dans epics-and-stories.md:

```sql
-- Pour la table conversations
CREATE POLICY "Users can view their own conversations"
ON conversations
FOR SELECT USING (auth.uid() = user_id);

-- Pour la table chunks (filtre par rôle)
CREATE POLICY "Users can view chunks allowed for their role"
ON chunks
FOR SELECT USING (
  metadata->>'allowed_roles' ? current_setting('app.current_role')
  OR metadata->>'allowed_roles' = 'all'
);
```

### ⚠️ Points d'Attention

1. **Performance:** Les politiques RLS peuvent impacter les performances. Tester avec des requêtes complexes.
2. **Configuration:** Il faut configurer `app.current_role` dans Supabase pour que `current_setting('app.current_role')` fonctionne.
3. **Cascading:** Assurez-vous que les politiques sur les tables enfants (ex: messages) respectent les politiques des tables parents (ex: conversations).
4. **Service Role:** Utiliser le SUPABASE_SERVICE_ROLE_KEY pour les opérations administratives qui doivent bypass les RLS.

### 🔧 Configuration Supabase Requise

Avant de créer les politiques, il faut configurer:

```sql
-- Créer la configuration pour le rôle courant
CREATE OR REPLACE FUNCTION set_current_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Cette fonction doit être appelée pour définir le rôle courant
  -- basé sur le JWT de l'utilisateur
  PERFORM set_config('app.current_role', (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1), false);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 📊 Tests de Sécurité

**Script de test recommandé:**

```sql
-- Tester avec un utilisateur developer
SELECT * FROM conversations WHERE user_id = 'some-other-user-uuid'; -- Doit retourner 0 lignes

-- Tester avec un utilisateur admin
-- (L'admin doit pouvoir voir toutes les conversations)

-- Tester l'accès aux chunks avec différents rôles
SELECT * FROM chunks WHERE id = 'some-chunk-id'; -- Doit filtrer selon le rôle
```

### Project Structure Notes

- **Fichiers à modifier:** Les politiques RLS sont créées directement dans Supabase (via SQL ou Dashboard)
- **Fichiers à créer:** Un script SQL de déploiement (`supabase/rls-policies.sql`)
- **Documentation:** Mettre à jour la documentation Supabase avec les politiques configurées

### References

- [Epic 5: Base de Données & Optimisation - ST-401](../planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md#-st-401-configurer-les-politiques-de-sécurité-rls)
- [Architecture Technique - Sécurité](../planning-artifacts/architecture-nexiamind-ai/architecture.md#-sécurité)
- [Architecture Technique - Base de Données](../planning-artifacts/architecture-nexiamind-ai/architecture.md#-3️⃣-base-de-données-supabase---structure-réelle)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

- **NEW:** `supabase/rls-policies.sql` - Script SQL pour créer toutes les politiques RLS
- **NEW:** `supabase/tests/rls-security-tests.sql` - Tests de sécurité pour les politiques RLS
- **UPDATE:** Documentation Supabase (si existe)

## 🔍 Previous Story Intelligence

**Aucune story précédente dans l'Epic 5** - C'est la première story de l'Epic 5.

**Dernières stories terminées (pour contexte):**
- ST-309: Optimiser les performances frontend (Epic 4)
- ST-308: Implémenter l'export des réponses
- ST-307: Ajouter le support du markdown

**Patterns identifiés dans les stories précédentes:**
- Structure de fichier standard respectée
- Documentation technique détaillée
- Tests inclus dans les acceptance criteria
- Références croisées avec l'architecture

## 📝 Technical Requirements

### Must Follow

1. **Toutes les politiques RLS doivent être testées** avant de marquer la story comme terminée
2. **Ne pas casser les fonctionnalités existantes** - tester que l'application fonctionne toujours après activation de RLS
3. **Documenter toutes les politiques créées** dans un fichier SQL
4. **Respecter les rôles définis dans l'architecture** (admin, manager, project_lead, developer, consultant)

### Library/Framework Requirements

- **Supabase:** Version 2.108.2+ (déjà configuré)
- **PostgreSQL:** Version compatible avec RLS (PostgreSQL 10+)
- **pgvector:** Déjà activé dans le projet Supabase

### File Structure Requirements

```
supabase/
├── rls-policies.sql          # Script principal des politiques
├── tests/
│   └── rls-security-tests.sql # Tests de sécurité
└── README.md                 # Documentation des politiques (optionnel)
```

## 🧪 Testing Requirements

### Standards de Testing

1. **Couverture:** 100% des politiques RLS doivent être testées
2. **Rôles:** Tester avec chaque rôle (admin, manager, project_lead, developer, consultant)
3. **Scénarios:** Tester les cas positifs et négatifs
4. **Documentation:** Documenter les résultats des tests

### Exemples de Tests

```sql
-- Test: Utilisateur developer ne peut pas voir les conversations d'un autre utilisateur
INSERT INTO conversations (user_id, title) VALUES ('user1-uuid', 'Test Conversation');
INSERT INTO conversations (user_id, title) VALUES ('user2-uuid', 'Another Conversation');

-- Connexion en tant que user1
SET ROLE authenticated;
SET app.current_role = 'developer';
-- Devrait retourner 1 ligne (seulement la conversation de user1)
SELECT COUNT(*) FROM conversations WHERE user_id = 'user1-uuid';
-- Devrait retourner 0 lignes (pas accès aux conversations d'autres utilisateurs)
SELECT COUNT(*) FROM conversations WHERE user_id = 'user2-uuid';
```

## 🎯 Story Completion Checklist

- [ ] Toutes les tables ont RLS activé
- [ ] Politiques SELECT créées pour toutes les tables
- [ ] Politiques INSERT/UPDATE/DELETE créées où nécessaire
- [ ] Tests de sécurité effectués et documentés
- [ ] Script SQL de déploiement créé
- [ ] Documentation mise à jour
- [ ] Validation que l'application fonctionne toujours
