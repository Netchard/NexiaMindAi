---
story_id: ST-002
epic: Epic 1
title: Configurer Supabase
description: Configurer un projet Supabase avec pgvector, les tables RAG et l'authentification afin d'avoir la base de donnees prete pour le pipeline RAG.
status: backlog
priority: ⭐⭐⭐⭐⭐
estimation: 6 heures
assigned_to: Dday
start_date: ""
end_date: ""
user_skill_level: intermediate
baseline_commit: ""
workflow: dev-story

# BMAD Metadata
epic_title: Configuration & Infrastructure
epic_goal: Mise en place de l'infrastructure de base necessaire pour le developpement
project: NexiaMind AI
dependencies: ["ST-001"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
---

## 🎯 Objectif

**En tant que** Developpeur Backend
**Je veux** un projet Supabase configure avec pgvector, les tables RAG et l'authentification
**Afin de** avoir la base de donnees prete pour le pipeline RAG.

---

## 📋 Contexte

Ce projet Supabase servira de base de donnees principale pour NexiaMind AI. Il doit :
- Stocker les documents et leurs embeddings vectoriels
- Gerer les conversations et messages utilisateurs
- Supporter l'authentification et les roles utilisateurs
- Permettre la recherche semantique via pgvector

---

## ✅ Critères d'Acceptation

### Configuration de Base
- [ ] Projet Supabase cree sur https://app.supabase.com
- [ ] Nom du projet : **nexiamind-ai**
- [ ] Region : **eu-central-1** (ou la plus proche de votre localisation)
- [ ] Mot de passe de la base de donnees configure

### Extension pgvector
- [ ] Extension pgvector activee sur la base de donnees
- [ ] Version de pgvector compatible avec Supabase (v0.5.0+)

### Schema de la Base de Donnees
- [ ] Toutes les tables du schema crees :
  - [ ] **profiles** - Informations utilisateurs
  - [ ] **conversations** - Historique des conversations
  - [ ] **messages** - Messages dans les conversations
  - [ ] **chunks** - Morceaux de documents pour RAG
  - [ ] **embeddings** - Vecteurs d'embedding
  - [ ] **documents** - Metadonnees des documents
  - [ ] **sync_logs** - Journaux de synchronisation
- [ ] Index vectoriel cree sur la table embeddings
- [ ] Index classiques crees pour optimisation

### Securite
- [ ] Politiques RLS (Row-Level Security) configurees sur toutes les tables
- [ ] Roles utilisateurs configures : **admin, manager, project_lead, developer, consultant**
- [ ] Acces restreint selon les roles

### Configuration
- [ ] Variables d'environnement configurees :
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Fichier `.env.local.example` cree avec toutes les variables
- [ ] Configuration locale fonctionnelle
- [ ] Configuration pour le deploiement (Vercel) prete

### Tests
- [ ] Connexion a la base de donnees teste
- [ ] Requetes de test executees avec succes
- [ ] Fonctionnalite pgvector teste

---

## 📋 Tâches Principales

### 🟦 Phase 1: Creation du Projet Supabase (Estimation: 1h)

#### Tâche 1.1: Creer le compte Supabase (si non existe)
- [ ] S'inscrire sur https://app.supabase.com
- [ ] Verifier l'email de confirmation
- [ ] Se connecter au dashboard

#### Tâche 1.2: Creer le projet
- [ ] Cliquer sur "New Project"
- [ ] Remplir les informations :
  - Nom : **nexiamind-ai**
  - Region : **eu-central-1** (recommande)
  - Mot de passe : [Choisir un mot de passe securise]
  - Plan : Free
- [ ] Attendre la creation (30-60 secondes)
- [ ] Noter l'URL du projet et les cles API

#### Tâche 1.3: Activer pgvector
- [ ] Dans le dashboard, aller dans : **SQL Editor** > **Extensions**
- [ ] Chercher "pgvector" dans la liste des extensions
- [ ] Cliquer sur "Enable" pour activer pgvector
- [ ] Verifier que l'extension est bien activee

### 🗃️ Phase 2: Schema de la Base de Donnees (Estimation: 2h)

#### Tâche 2.1: Creer les tables depuis architecture.md
> **Source** : Voir `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md`
> pour le schema SQL complet.

**SQL a executer** (ou utiliser l'interface Supabase) :

```sql
-- 1. Table profiles (Utilisateurs)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'developer' CHECK (role IN ('admin', 'manager', 'project_lead', 'developer', 'consultant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table documents (Metadonnees)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'pdf', 'text', 'code', etc.
  source TEXT NOT NULL, -- 'supabase', 'gitlab', 'nexia'
  client_id TEXT,
  file_path TEXT,
  language TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table chunks (Morceaux de documents)
CREATE TABLE IF NOT EXISTS chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table embeddings (Vecteurs)
CREATE TABLE IF NOT EXISTS embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chunk_id UUID NOT NULL REFERENCES chunks(id) ON DELETE CASCADE,
  vector vector(1536) NOT NULL, -- Dimensions pour mistral-embed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table conversations (Conversations)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table messages (Messages)
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table sync_logs (Journaux de synchronisation)
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL, -- 'supabase', 'gitlab', 'nexia'
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  documents_processed INTEGER DEFAULT 0,
  chunks_created INTEGER DEFAULT 0,
  embeddings_created INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT
);
```

#### Tâche 2.2: Creer l'index vectoriel
```sql
-- Creer l'index vectoriel pour la recherche semantique
CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
ON embeddings USING ivfflat (vector vector_l2_ops) 
WITH (lists = 100);

-- Index pour optimiser les requetes
CREATE INDEX IF NOT EXISTS idx_embeddings_chunk_id ON embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
```

### 🔐 Phase 3: Configuration de la Securite (Estimation: 2h)

#### Tâche 3.1: Configurer RLS sur toutes les tables

**Politiques RLS pour profiles** :
```sql
-- Autoriser les utilisateurs a voir seulement leur profil
CREATE POLICY "Users can view their own profile"
ON profiles 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles 
FOR UPDATE USING (auth.uid() = user_id);
```

**Politiques RLS pour conversations** :
```sql
-- Autoriser les utilisateurs a voir seulement leurs conversations
CREATE POLICY "Users can view their own conversations"
ON conversations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations"
ON conversations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON conversations 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON conversations 
FOR DELETE USING (auth.uid() = user_id);
```

**Politiques RLS pour messages** :
```sql
-- Autoriser via la conversation
CREATE POLICY "Users can view messages from their conversations"
ON messages 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON messages 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND conversations.user_id = auth.uid()
  )
);
```

**Politiques RLS pour chunks et embeddings** :
```sql
-- Acces base sur le document (a affiner selon les besoins)
CREATE POLICY "Public read access to chunks"
ON chunks 
FOR SELECT USING (true);

CREATE POLICY "Public read access to embeddings"
ON embeddings 
FOR SELECT USING (true);
```

#### Tâche 3.2: Configurer les roles utilisateurs
- [ ] Dans Supabase Dashboard, aller dans : **Authentication** > **Policies**
- [ ] Verifier que les roles sont bien configures :
  - admin (acces complet)
  - manager (gestion des projets)
  - project_lead (responsable de projet)
  - developer (developpeur)
  - consultant (consultation seule)

---

## 🛠 Outils et Commandes

### Commandes Supabase CLI
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lister les projets
supabase projects list

# Se connecter a un projet
supabase link --project-ref [project-id]

# Executer du SQL
supabase db psql -f [fichier.sql]

# Activer pgvector
supabase db psql -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Configuration du Projet Next.js

**Fichier : `.env.local.example`**
```env
# Supabase
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Mistral AI
MISTRAL_API_KEY=[mistral-api-key]

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Client Supabase pour Next.js

**Fichier : `src/lib/supabase/client.ts`**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 📚 References

- **Documentation Supabase** : https://supabase.com/docs
- **pgvector Documentation** : https://github.com/pgvector/pgvector
- **RLS Guide** : https://supabase.com/docs/guides/auth/row-level-security
- **Architecture du Projet** : `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md`

---

## 📝 Journal du Developpeur

### 🟢 Enregistrements de Developpement
*Date : [A remplir]*
*Statut : backlog*

### 🟡 Journal de Debogage
*(Vide)*

### ✅ Notes de Completion
*(A remplir a la fin de la story)*

---

## 📁 Liste des Fichiers Modifies
*(A remplir pendant le developpement)*

---

## 🔄 Journal des Changements
*(A remplir pendant le developpement)*
