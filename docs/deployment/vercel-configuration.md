# Configuration Vercel pour NexiaMind AI

*Documentation technique pour le déploiement du frontend sur Vercel*

---

## 📋 Table des Matières

1. [Introduction](#-introduction)
2. [Prérequis](#-prérequis)
3. [Configuration du Projet](#-configuration-du-projet)
4. [Configuration des Variables d'Environnement](#-configuration-des-variables-denvironnement)
5. [Configuration Avancée](#-configuration-avancée)
6. [Déploiement](#-déploiement)
7. [Post-Déploiement](#-post-déploiement)
8. [Dépannage](#-dépannage)
9. [Bonnes Pratiques](#-bonnes-pratiques)

---

## 🎯 Introduction

Ce document décrit la configuration spécifique à Vercel pour le projet **NexiaMind AI**. Il complément la documentation générale de déploiement.

### Objectifs
- Déployer le frontend Next.js sur Vercel
- Configurer les variables d'environnement de manière sécurisée
- Optimiser les performances et la sécurité
- Automatiser les déploiements

### Public Cible
- Équipes DevOps
- Développeurs full-stack
- Administrateurs système

---

## 📦 Prérequis

### Compte et Accès
- ✅ Compte Vercel (personnel ou entreprise)
- ✅ Accès administrateur au dépôt GitHub/GitLab
- ✅ Autorisation de déployer sur Vercel

### Connaissances Requises
- Configuration de base de Vercel
- Gestion des variables d'environnement dans Vercel
- Next.js App Router
- Git/GitHub/GitLab

### Outils
- Navigateur web (pour Vercel Dashboard)
- Git CLI
- Compte GitHub/GitLab

---

## ⚙️ Configuration du Projet

### Étape 1: Créer le Projet Vercel

1. **Se connecter à Vercel**
   - Aller sur [https://vercel.com](https://vercel.com)
   - Se connecter avec votre compte
   - Sélectionner ou créer une équipe/organisation

2. **Importer le dépôt**
   ```
   Cliquez sur "Add New" → "Project"
   Sélectionner "Import Git Repository"
   
   Configuration:
   - Repository: Netchard/NexiaMindAi
   - Project Name: nexiamind-ai
   - Framework Preset: Next.js
   ```

3. **Configurer les paramètres initiaux**
   - Build Command: `npm run build` (déjà configuré dans package.json)
   - Output Directory: `.next` (automatique pour Next.js)
   - Development Command: `npm run dev`
   - Install Command: `npm install`

### Étape 2: Configurer le Dossier Racine
- **Root Directory:** `C:\VibeCoding\nexiamind-ai` (ou laisser vide pour la racine)
- **Build Cache:** Activé (recommandé)

### Étape 3: Configurer vercel.json

Le fichier `vercel.json` existe déjà avec une configuration de base. Voici la configuration optimisée:

**`vercel.json` recommandé:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": {
        "installCommand": "npm install"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/.+",
      "dest": "/api/$1",
      "headers": {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    },
    {
      "src": "/(.*)",
      "headers": {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
      }
    }
  ],
  "regions": ["iad1"],
  "crons": [],
  "rewrites": [],
  "redirects": []
}
```

**Explications:**
- `version: 2` - Utilise la configuration Vercel v2
- `builds.use: @vercel/next` - Optimisation automatique pour Next.js
- `routes` - Configure les headers CORS pour l'API et la sécurité pour toutes les pages
- `regions: ["iad1"]` - Déploiement dans la région Virginia (peut être changé)

---

## 🔐 Configuration des Variables d'Environnement

### Variables Obligatoires

Dans Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Valeur | Catégorie | Description |
|----------|--------|-----------|-------------|
| `SUPABASE_URL` | `https://pppmwsnpgsvipvwyeyfv.supabase.co` | Server | URL du projet Supabase |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUz...` | Server | Clé anonyme Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Server | **NE JAMAIS EXPOSER** - Clé de service |
| `MISTRAL_API_KEY` | `QJ3fXSY8...` | Server | Clé API Mistral |

### Variables Client-Side (NEXT_PUBLIC_*)

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://nexiamind-ai.vercel.app` | URL de l'application |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pppmwsnpgsvipvwyeyfv.supabase.co` | URL Supabase (optionnel) |

### Variables Optionnelles

| Variable | Description |
|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | URL Redis Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Token Redis Upstash |
| `REDIS_URL` | URL Redis locale |
| `GITLAB_API_URL` | URL API GitLab |
| `GITLAB_PRIVATE_TOKEN` | Token privé GitLab |
| `NEXIA_API_URL` | URL API Nexia |
| `NEXIA_API_KEY` | Clé API Nexia |

### Comment Ajouter les Variables

1. **Dans Vercel Dashboard:**
   ```
   Aller à: https://vercel.com/your-team/nexiamind-ai/settings/environment-variables
   
   Pour chaque variable:
   - Name: Nom de la variable
   - Value: Valeur secrète
   - Environment: Production (et Preview si nécessaire)
   ```

2. **Via Vercel CLI:**
   ```bash
   # Se connecter
   vercel login
   
   # Lier le projet
   vercel link
   
   # Ajouter une variable
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Via .vercel/env/local (pour développement):**
   ```bash
   mkdir -p .vercel/env
   touch .vercel/env/local
   
   # Ajouter les variables dans .vercel/env/local
   # Format: VAR_NAME=value
   ```

⚠️ **IMPORTANT:**
- Ne **JAMAIS** committer `.vercel/env/` dans Git
- Les variables server-only ne sont **PAS** accessibles côté client
- Les variables `NEXT_PUBLIC_*` sont accessibles côté client

---

## ⚡ Configuration Avancée

### Optimisation des Builds

1. **Cache des dépendances:**
   - Vercel cache automatiquement `node_modules`
   - Pas de configuration nécessaire

2. **Cache des builds:**
   - Activé par défaut
   - Réduit le temps de build de ~50%

3. **Optimisation des images:**
   - Vercel optimise automatiquement les images via `@vercel/og`
   - Utiliser le composant Next.js `Image` pour une optimisation maximale

### Configuration Multi-Environnements

**Environnement de Preview (Pull Requests):**
- Les variables marquées "Preview" sont disponibles
- Permet de tester les changements avant la production
- URL: `https://nexiamind-ai-git-<branch>.vercel.app`

**Environnement de Development:**
- Utiliser `vercel dev` pour tester localement avec les variables Vercel
- Nécessite Vercel CLI

### Configuration Régionale

Pour déployer dans une région spécifique:

```json
{
  "regions": ["pdx1"]  // Portland (recommandé pour l'Europe)
}
```

Régions disponibles:
- `iad1` - Virginia, USA (par défaut)
- `pdx1` - Portland, USA
- `sfo1` - San Francisco, USA
- `lhr1` - Londres, UK
- `fra1` - Francfort, Allemagne

---

## 🚀 Déploiement

### Premier Déploiement

1. **Pousser vers la branche principale:**
   ```bash
   cd C:\VibeCoding\nexiamind-ai
   git add .
   git commit -m "Prêt pour déploiement Vercel"
   git push origin master
   ```

2. **Surveiller le build:**
   - Aller sur: [https://vercel.com/your-team/nexiamind-ai/deployments](https://vercel.com/your-team/nexiamind-ai/deployments)
   - Vérifier les logs en temps réel
   - Attendre que le statut passe à "Ready"

3. **Vérifier le déploiement:**
   - Cliquer sur l'URL du déploiement
   - Tester toutes les fonctionnalités

### Déploiements Ultérieurs

- **Déploiement automatique:** Chaque push vers `master` déclenche un nouveau déploiement
- **Déploiement manuel:** Possible via Vercel Dashboard ou CLI

**Via CLI:**
```bash
vercel deploy --prod
```

### Prévisualisation des Branches

- Chaque Pull Request crée une prévisualisation automatique
- URL: `https://nexiamind-ai-git-<branch>-<commit>.vercel.app`
- Les variables "Preview" sont disponibles

---

## ✅ Post-Déploiement

### Vérifications Obligatoires

1. **Fonctionnalités de base:**
   - [ ] Page d'accueil accessible
   - [ ] Authentification (login/register) fonctionnelle
   - [ ] Interface de chat opérationnelle
   - [ ] Génération de réponses IA fonctionnelle
   - [ ] Affichage des sources et citations

2. **Variables d'environnement:**
   - [ ] Supabase accessible
   - [ ] Mistral API fonctionnelle (si configurée)
   - [ ] Redis accessible (si configurée)

3. **Sécurité:**
   - [ ] HTTPS activé (automatique avec Vercel)
   - [ ] Aucune variable secrète exposée côté client
   - [ ] Headers de sécurité présents

4. **Performance:**
   - [ ] Temps de chargement < 3s
   - [ ] Score Lighthouse > 80
   - [ ] Pas d'erreurs console

### Configuration du Domaine (Optionnel)

1. **Acheter un domaine:**
   - Via Vercel: [https://vercel.com/domains](https://vercel.com/domains)
   - Ou via un autre registrar (Google Domains, Namecheap, etc.)

2. **Configurer dans Vercel:**
   ```
   Aller à: Project Settings → Domains
   Cliquer sur "Add Domain"
   Entrer: nexiamind.ai (ou votre domaine)
   Suivre les instructions pour configurer les DNS
   ```

3. **Configurer les DNS:**
   - Créer un enregistrement CNAME ou A
   - Pointer vers: `cname.vercel-dns.com`

4. **Activer HTTPS:**
   - Automatique avec Vercel (via Let's Encrypt)
   - Peut prendre quelques minutes à heures

---

## 🛠️ Dépannage

### Problèmes Courants et Solutions

#### 1. Build échoue avec "Module not found"

**Cause:** Dépendances manquantes ou version incompatible

**Solution:**
```bash
# Localement
cd C:\VibeCoding\nexiamind-ai
rm -rf node_modules package-lock.json
npm install
npm run build

# Si ça fonctionne localement, committer package-lock.json
 git add package-lock.json
 git commit -m "Update package-lock.json"
 git push origin master
```

#### 2. Variables d'environnement manquantes

**Cause:** Variables non configurées dans Vercel

**Solution:**
- Vérifier Vercel Dashboard → Environment Variables
- Vérifier que les variables sont dans "Production"
- Redéployer après avoir ajouté les variables

#### 3. Erreur CORS

**Cause:** Headers CORS manquants ou incorrects

**Solution:**
- Vérifier `vercel.json` pour les headers CORS
- Ou configurer CORS dans Supabase Dashboard

#### 4. Déploiement bloqué sur "Building"

**Cause:** Build trop long ou erreur silencieuse

**Solution:**
- Vérifier les logs de build dans Vercel Dashboard
- Augmenter le timeout de build (max 60 minutes pour Vercel Hobby)
- Optimiser le build (ex: `next build --no-lint`)

#### 5. "403 Forbidden" sur les appels API

**Cause:** Variables server-only manquantes

**Solution:**
- Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configurée
- Vérifier que les RLS (Row Level Security) sont correctement configurés dans Supabase

#### 6. Images ne s'affichent pas

**Cause:** Domaine non configuré dans Next.js Image

**Solution:**
- Ajouter le domaine dans `next.config.js`:
```javascript
module.exports = {
  images: {
    domains: ['pppmwsnpgsvipvwyeyfv.supabase.co'],
  },
}
```

---

## 💡 Bonnes Pratiques

### Sécurité

1. **Ne jamais committer de secrets:**
   ```
   # .gitignore
   .env*
   !.env.example
   .vercel/
   ```

2. **Utiliser NEXT_PUBLIC_* judicieusement:**
   - Seules les variables nécessaires côté client doivent avoir le préfixe
   - Les clés API et secrets doivent rester server-only

3. **Restriction d'accès:**
   - Limiter l'accès au projet Vercel aux membres de l'équipe
   - Utiliser des rôles appropriés (admin, developer, viewer)

### Performance

1. **Cache statique:**
   - Vercel cache automatiquement les pages statiques
   - Utiliser `getStaticProps` pour les pages statiques

2. **Serverless Functions:**
   - Les API Routes sont automatiquement déployées comme Serverless Functions
   - Timeout: 5s (Hobby) à 60s (Pro)

3. **Edge Functions:**
   - Pour les fonctions nécessitant une faible latence
   - Utiliser `runtime: 'edge'` dans les API Routes

### Monitoring

1. **Logs:**
   - Disponibles dans Vercel Dashboard → Deployments → Logs
   - Ou via CLI: `vercel logs`

2. **Metrics:**
   - Temps de réponse, bandwith, requêtes
   - Disponibles dans Vercel Dashboard → Analytics

3. **Alertes:**
   - Configurer des alertes pour les erreurs de build
   - Configurer des alertes pour les temps de réponse élevés

---

## 📚 Références

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js sur Vercel](https://nextjs.org/docs/deployment)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Environment Variables Vercel](https://vercel.com/docs/environment-variables)

---

## 📝 Historique des Modifications

| Date | Auteur | Description |
|------|--------|-------------|
| 2026-07-15 | Mistral Vibe | Création initiale de la documentation |  
| 2026-07-15 | Dday | À compléter: Configuration et déploiement |

---

*Document généré dans le cadre de la Story 6.501 - Configurer Vercel pour le Frontend*