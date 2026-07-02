---
---
---

## 🚀 **BMAD Dev-Story Workflow - ST-003 : Démarrage**

---
---
---

Bonjour **Dday** ! Je lance maintenant le **workflow bmad-dev-story** pour **ST-003: Configurer les Variables d'Environnement**.

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
```

---
---
---

## 📋 **Étape 1 : Recherche de la Story ST-003**

**Recherche dans sprint-status.yaml...**
```yaml
development_status:
  epic-1: in-progress
  1-001-configurer-le-projet-next-js: done
  1-002-configurer-supabase: done
  1-003-configurer-les-variables-d-environnement: backlog  ← TROUVÉ !
```

**Recherche du fichier de story...**
```bash
❌ Fichier non trouvé : 1-003-configurer-les-variables-d-environnement.md
```

---
---
---

## 📄 **Étape 2 : Création du Fichier de Story**

**Fichier créé** : `_bmad-output/implementation-artifacts/1-003-configurer-les-variables-d-environnement.md`

---
---
---

## 🎯 **Étape 3 : Début de l'Exécution**

**Statut de la Story** : `in-progress`  
**Temps estimé** : 2 heures  
**Priorité** : ⭐⭐⭐⭐⭐  
**Dépendances** : ST-001, ST-002 (✅ Toutes terminées)

---
---
---

## 🚀 **Étape 4 : Exécution des Tâches**

**ST-003 a pour objectif** : Configurer toutes les variables d'environnement pour le développement local et le déploiement.

---
---

### **📁 Tâche 1/5 : Créer le Fichier .env.local.example**

**Chemin** : `D:\VibeCoding\Projects\Project-D\nexiamind-ai\.env.local.example`

---
#### **Contenu à créer** :

```env
# ========================================
# NEXIAMIND AI - CONFIGURATION D'ENVIRONNEMENT
# ========================================

# ========================================
# SUPABASE (Obligatoire)
# ========================================
# URL du projet Supabase
SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co

# Clé anonyme (pour le frontend)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx

# Clé de service (NE JAMAIS EXPOSER PUBLIQUEMENT - serveur seulement)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyyyyyyy

# ========================================
# MISTRAL AI (Obligatoire pour RAG)
# ========================================
# Clé API Mistral (pour embeddings et chat)
# Obtenez-la sur : https://console.mistral.ai/
MISTRAL_API_KEY=zzzzzzzzzzzzzzzzzzzzzzzz

# ========================================
# APPLICATION (Obligatoire)
# ========================================
# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ========================================
# INTÉGRATIONS (Optionnel - Sprint 3)
# ========================================
# GitLab API
GITLAB_API_URL=https://gitlab.com/api/v4
GITLAB_PRIVATE_TOKEN=

# Nexia GED API
NEXIA_API_URL=https://api.nexia.fr
NEXIA_API_KEY=

# ========================================
# CACHE (Optionnel)
# ========================================
# Redis pour le cache des embeddings
REDIS_URL=redis://localhost:6379

# ========================================
# DÉPLOIEMENT (Vercel)
# ========================================
# À configurer dans Vercel Dashboard
# NEXT_PUBLIC_APP_URL=https://nexiamind-ai.vercel.app

# ========================================
# INSTRUCTIONS
# ========================================
# 1. Copiez ce fichier en .env.local
#    cp .env.local.example .env.local
#
# 2. Remplissez toutes les valeurs
#
# 3. NE COMMITEZ JAMAIS .env.local dans Git
#    (ajoutez .env.local à .gitignore)
#
# 4. Pour Vercel, configurez ces variables
#    dans Dashboard → Settings → Environment Variables
```

---
#### **Créer le fichier** :

```bash
cd D:\VibeCoding\Projects\Project-D\nexiamind-ai
# Créer le fichier avec le contenu ci-dessus
```

---
**⏳ En attente de votre action...**

---
**Dites :**
- **"Fichier .env.local.example créé"** si le fichier est créé
- **"Problème : [description]"** si vous avez une erreur
- **"Aide"** pour obtenir de l'aide
✅ **Tâche 1/5 : Créer le fichier .env.local.example - TERMINÉE**

---
---
---

## 📊 **Mise à jour du Fichier de Story**

```markdown
## ✅ Critères d'Acceptation
- [x] Fichier .env.local.example créé

## 📋 Tâches Principales
- [x] Créer .env.local.example
- [ ] Documenter toutes les variables nécessaires
- [ ] Configuration pour le développement local
- [ ] Configuration pour le déploiement (Vercel)
- [ ] Tester les variables
```

---
---
---

## 🎯 **Tâche 2/5 : Documenter Toutes les Variables Nécessaires**

**Objectif** : S'assurer que toutes les variables sont correctement documentées dans `.env.local.example`

---
---

### **✅ Vérification du Contenu**

**Ouvrez le fichier** `.env.local.example` et vérifiez qu'il contient **toutes ces variables** :

| Catégorie | Variable | Obligatoire | Description |
|-----------|----------|-------------|-------------|
| **Supabase** | `SUPABASE_URL` | ✅ Oui | URL du projet Supabase |
| **Supabase** | `SUPABASE_ANON_KEY` | ✅ Oui | Clé publique pour le frontend |
| **Supabase** | `SUPABASE_SERVICE_ROLE_KEY` | ✅ Oui | Clé serveur (secrète) |
| **Mistral** | `MISTRAL_API_KEY` | ✅ Oui | Clé API Mistral pour embeddings/chat |
| **App** | `NEXT_PUBLIC_APP_URL` | ✅ Oui | URL de l'application |
| **GitLab** | `GITLAB_API_URL` | ❌ Non | URL de l'API GitLab |
| **GitLab** | `GITLAB_PRIVATE_TOKEN` | ❌ Non | Token d'API GitLab |
| **Nexia** | `NEXIA_API_URL` | ❌ Non | URL de l'API Nexia |
| **Nexia** | `NEXIA_API_KEY` | ❌ Non | Clé API Nexia |
| **Cache** | `REDIS_URL` | ❌ Non | URL Redis pour le cache |

---
### **📝 Mise à jour du Fichier**

Si des variables manquent, **ajoutez-les** au fichier `.env.local.example` :

```env
# Ajoutez ces variables si manquantes
NEXIA_API_URL=https://api.nexia.fr
NEXIA_API_KEY=your-nexia-api-key-here
GITLAB_API_URL=https://gitlab.com/api/v4
GITLAB_PRIVATE_TOKEN=your-gitlab-token-here
REDIS_URL=redis://localhost:6379
```

---
---
---
**⏳ En attente de votre confirmation...**

---
**Dites :**
- **"Variables documentées"** si toutes les variables sont présentes
- **"Variables manquantes : [liste]"** si certaines manquent
- **"Besoin de précisions"** pour savoir quelles variables ajouter
✅ **Tâche 2/5 : Documenter toutes les variables nécessaires - TERMINÉE**

---
---
---

## 📊 **Mise à jour du Fichier de Story**

```markdown
## 📋 Tâches Principales
- [x] Créer .env.local.example
- [x] Documenter toutes les variables nécessaires
- [ ] Configuration pour le développement local
- [ ] Configuration pour le déploiement (Vercel)
- [ ] Tester les variables
```

---
---
---

## 🎯 **Tâche 3/5 : Configuration pour le Développement Local**

**Objectif** : Créer le fichier `.env.local` avec les **vraies valeurs** pour le développement

---
---

### **Étape 1 : Copier le fichier exemple**

```bash
cd D:\VibeCoding\Projects\Project-D\nexiamind-ai
copy .env.local.example .env.local
```

**Résultat** : Le fichier `.env.local` est créé avec le même contenu que `.env.local.example`

---
---
---

### **Étape 2 : Remplir avec les Vraies Valeurs**

**Ouvrez** `.env.local` et **remplacez les valeurs d'exemple** par vos **vraies clés** :

```env
# ========================================
# SUPABASE (VRAIES VALEURS)
# ========================================
SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxx  # ← VRAIE valeur
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.yyyyyyyyyy  # ← VRAIE valeur

# ========================================
# MISTRAL AI (VRAIE VALEUR)
# ========================================
MISTRAL_API_KEY=zzzzzzzzzzzzzzzzzzzzzzzz  # ← VRAIE valeur depuis console.mistral.ai

# ========================================
# APPLICATION
# ========================================
NEXT_PUBLIC_APP_URL=http://localhost:3000  # OK pour développement local
```

---
---
---

### **🔐 Où Trouver les Valeurs ?**

| Variable | Où la trouver |
|----------|---------------|
| `SUPABASE_URL` | Dashboard Supabase → Project Settings → API → Project URL |
| `SUPABASE_ANON_KEY` | Dashboard Supabase → Project Settings → API → anon (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Project Settings → API → service_role (secret) |
| `MISTRAL_API_KEY` | https://console.mistral.ai/ → Settings → API Keys |

---
---
---

### **⚠️ SÉCURITÉ IMPORTANTE**

1. **NE JAMAIS** committer `.env.local` dans Git
   - ✅ Il est déjà dans `.gitignore` (créé par `create-next-app`)
   - ✅ Vérifiez avec : `git status` (doit montrer `.env.local` comme "untracked")

2. **NE JAMAIS** partager vos clés :
   - ❌ Pas dans GitHub/GitLab
   - ❌ Pas dans Slack/Email
   - ❌ Pas dans des issues publiques

3. **Utilisez** des variables d'environnement pour :
   - ✅ Développement local
   - ✅ Tests
   - ✅ Déploiement

---
---
---

### **✅ Vérification de la Sécurité**

```bash
# Vérifiez que .env.local est dans .gitignore
findstr /i "\.env\.local" .gitignore

# Vérifiez le statut Git
git status
```

**Résultat attendu** :
- `.env.local` **ne doit pas** apparaître dans les fichiers à committer

---
**⏳ En attente de votre confirmation...**

---
**Dites :**
- **"Configuration locale terminée"** si .env.local est rempli et sécurisé
- **"Problème : [description]"** si vous avez une erreur
- **"Aide pour trouver les clés"** si vous ne trouvez pas les valeurs
⚠️ **Problème : Dépôt Git Non Initialisé**

---
---
---

## 🎯 **Solution : Initialiser Git dans nexiamind-ai**

Votre projet **nexiamind-ai** n'est pas encore un dépôt Git. Voici comment résoudre cela :

---
---
---

### **Étape 1 : Initialiser Git**

```bash
cd D:\VibeCoding\Projects\Project-D\nexiamind-ai
git init
```

**Résultat attendu** :
```
Initialized empty Git repository in D:/VibeCoding/Projects/Project-D/nexiamind-ai/.git/
```

---
---
---

### **Étape 2 : Créer le fichier .gitignore (si manquant)**

```bash
# Créer .gitignore pour Next.js
echo node_modules > .gitignore
echo .next >> .gitignore
echo .env.local >> .gitignore
echo .env.*.local >> .gitignore
echo .pnp >> .gitignore
echo .pnp.js >> .gitignore
echo .yarn >> .gitignore
echo .yarn/ >> .gitignore
echo .DS_Store >> .gitignore
echo *.pem >> .gitignore
echo .cache >> .gitignore
echo dist >> .gitignore
```

**OU** utilisez le `.gitignore` standard de Next.js :

```bash
curl -o .gitignore https://raw.githubusercontent.com/vercel/next.js/main/.gitignore
```

---
---
---

### **Étape 3 : Ajouter .env.local au .gitignore**

**Vérifiez** que `.env.local` est bien dans `.gitignore` :

```bash
findstr /i "\.env\.local" .gitignore
```

**Si non trouvé**, ajoutez-le :
```bash
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---
---
---

### **Étape 4 : Vérifier le Statut**

```bash
git status
```

**Résultat attendu** :
```
On branch main
No commits yet
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        .env.local.example
        .gitignore
        package.json
        ...
```

**✅ Notez que** `.env.local` **n'apparaît PAS** dans la liste !

---
---
---

### **Étape 5 : Faire le Premier Commit (Optionnel mais Recommandé)**

```bash
git add .gitignore .env.local.example package.json src/
git commit -m "feat: Initialize Next.js project with Supabase configuration

- Add .gitignore for Next.js
- Add .env.local.example with all required variables
- Configure Supabase integration

Generated by Mistral Vibe.
Co-Authored-By: Mistral Vibe <vibe@mistral.ai>"
```

---
---
---
---
**⏳ En attente de votre confirmation...**

---
**Dites :**
- **"Git initialisé"** si `git init` a fonctionné
- **"Git déjà initialisé"** si vous avez trouvé que Git était déjà configuré
- **"Problème : [message]"** si une erreur persiste
