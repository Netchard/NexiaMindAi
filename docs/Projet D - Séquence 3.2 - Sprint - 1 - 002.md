---
---
---

## 🚀 **BMAD Dev-Story Workflow - ST-002 : Démarrage**

---
---
---

Bonjour **Dday** ! Je lance maintenant le **workflow bmad-dev-story** pour **ST-002: Configurer Supabase**.

---
---
---

## ⚙️ **Étape 0 : Activation du Workflow**

### Configuration Chargée ✅
```yaml
project_name: NexiaMind AI
user_name: Dday
communication_language: french
document_output_language: french
user_skill_level: intermediate
implementation_artifacts: _bmad-output/implementation-artifacts
planning_artifacts: _bmad-output/planning-artifacts
```

---
---
---

## 📋 **Étape 1 : Recherche de la Story ST-002**

**Recherche dans sprint-status.yaml...**
```yaml
development_status:
  epic-1: in-progress  # ← Déjà mis à jour grâce à ST-001
  1-001-configurer-le-projet-next-js: done  # ← ST-001 terminée
  1-002-configurer-supabase: backlog  ← TROUVÉ ! Prochaine story de l'Epic 1
  ...
```

**Statut actuel** : `backlog`  
**Action** : Le fichier de story n'existe pas encore → **Création automatique**

---
---
---

## 📄 **Étape 2 : Création du Fichier de Story**

**Fichier créé** : `_bmad-output/implementation-artifacts/1-002-configurer-supabase.md`

**Contenu généré** :

````markdown
---
story_id: ST-002
epic: Epic 1
title: Configurer Supabase
description: Configurer un projet Supabase avec pgvector, les tables RAG et l'authentification afin d'avoir la base de données prête pour le pipeline RAG.
status: in-progress
priority: ⭐⭐⭐⭐⭐
estimation: 6 heures
assigned_to: Dday
start_date: 2026-06-24 23:45:00
user_skill_level: intermediate
baseline_commit: ""
workflow: dev-story

# BMAD Metadata
epic_title: Configuration & Infrastructure
epic_goal: Mise en place de l'infrastructure de base nécessaire pour le développement
project: NexiaMind AI
---

## 🎯 Objectif
**En tant que** Développeur Backend
**Je veux** un projet Supabase configuré avec pgvector, les tables RAG et l'authentification
**Afin de** avoir la base de données prête pour le pipeline RAG.

---

## ✅ Critères d'Acceptation

- [ ] Projet Supabase créé
- [ ] Extension pgvector activée
- [ ] Toutes les tables du schéma créées (profiles, conversations, messages, chunks, embeddings, documents, sync_logs)
- [ ] Index vectoriel créé
- [ ] RBAC configuré (rôles: admin, manager, project_lead, developer, consultant)
- [ ] Variables d'environnement configurées

---

## 📋 Tâches Principales

### Phase 1: Création du Projet
- [ ] Créer le projet Supabase
- [ ] Activer l'extension pgvector

### Phase 2: Schéma de la Base de Données
- [ ] Créer les tables du schéma (profiles, conversations, messages, chunks, embeddings, documents, sync_logs)
- [ ] Créer l'index vectoriel
- [ ] Configurer les politiques RLS

### Phase 3: Configuration
- [ ] Créer un utilisateur admin
- [ ] Configurer les variables d'environnement
- [ ] Tester les connexions

---
## 🛠 **Références depuis Architecture**

> **Source** : `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md`
> Contient le SQL de création des tables et la structure complète.

---

## 🛠 Commandes et Outils

```bash
# Installer Supabase CLI (optionnel)
npm install -g supabase

# Accéder au dashboard Supabase
# https://app.supabase.com

# SQL pour créer les tables (exemple)
# Voir architecture.md pour le schéma complet
```

---
## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement
*Date : 2026-06-24 23:45:00*
*Statut : En cours*

### 🟡 Journal de Débogage
*(Vide - aucun problème rencontré)*

### ✅ Notes de Complétion
*(À remplir à la fin)*
````

---
---
---

## 🎯 **Étape 3 : Début de l'Exécution**

**Statut de la Story** : `in-progress`  
**Temps estimé** : 6 heures  
**Priorité** : ⭐⭐⭐⭐⭐  
**Dépendances** : ST-001 (✅ Terminée)

---
---
---

## 🚀 **Étape 4 : Exécution des Tâches (Mode Interactif)**

BMAD va vous guider à travers chaque tâche de ST-002.

---

### **Tâche 1/6 : Créer le Projet Supabase**

**Objectif** : Créer un nouveau projet Supabase pour NexiaMind AI

---

#### **Option A : Via Dashboard Web (Recommandé)**

1. **Aller sur** : [https://app.supabase.com](https://app.supabase.com)
2. **Cliquer sur** : "New Project"
3. **Configurer** :
   - **Nom du projet** : `nexiamind-ai`
   - **Région** : Europe (ou la plus proche)
   - **Password** : [Choisir un mot de passe sécurisé]
   - **Plan** : Free

4. **Attendre** la création (30-60 secondes)

5. **Noter** :
   - **URL du projet** : `https://pppmwsnpgsvipvwyeyfv.supabase.co/rest/v1/`
   - **Clé anonyme** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcG13c25wZ3N2aXB2d3lleWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM5NjUsImV4cCI6MjA5Nzk3OTk2NX0.9Fth99_4K5cm8iJZyQWAuwN5u2HG-_gTs-xsUWRhgug`
   - **Clé de service** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---
#### **Option B : Via CLI Supabase**

```bash
# Installer Supabase CLI (si non installé)
npm install -g supabase

# Créer le projet
supabase projects create nexiamind-ai --db-password [votre-mot-de-passe] --region eu-central-1

# Attendre la création
supabase projects wait nexiamind-ai
```

---
#### **Option C : Via API**

```bash
curl -X POST 'https://api.supabase.com/v1/projects' \
-H "Authorization: Bearer [VOTRE_TOKEN_SUPABASE]" \
-H "Content-Type: application/json" \
-d '{
  "name": "nexiamind-ai",
  "region": "eu-central-1",
  "db_pass": "[votre-mot-de-passe]"
}'
```

---
**⏳ En attente de votre action...**

---
**Dites :**
- **"Projet Supabase créé"** avec l'URL du projet si vous avez terminé
- **"Problème : [description]"** si vous rencontrez une erreur
- **"Besoin d'un compte Supabase"** si vous devez créer un compte d'abord
- **"Aide"** pour obtenir de l'aide