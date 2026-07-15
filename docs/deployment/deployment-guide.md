# Guide de Déploiement Complet - NexiaMind AI

*Guide pas-à-pas pour déployer NexiaMind AI en production*

---

## 📋 Table des Matières

1. [Aperçu du Déploiement](#-aperçu-du-déploiement)
2. [Prérequis](#-prérequis)
3. [Déploiement du Frontend (Vercel)](#-déploiement-du-frontend-vercel)
4. [Configuration Post-Déploiement](#-configuration-post-déploiement)
5. [Vérification et Tests](#-vérification-et-tests)
6. [Maintenance et Mises à Jour](#-maintenance-et-mises-à-jour)
7. [Rollback et Récupération](#-rollback-et-récupération)
8. [Annexes](#-annexes)

---

## 🎯 Aperçu du Déploiement

### Architecture de Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXIAMIND AI - PRODUCTION                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                        FRONTEND                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │                    Vercel (Next.js)                        │  │ │
│  │  │  - URL: https://nexiamind-ai.vercel.app                  │  │ │
│  │  │  - Auto-deploy depuis GitHub master                        │  │ │
│  │  │  - Serverless Functions pour /api/*                       │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      BACKEND API                              │ │
│  │  ┌─────────────────────────────────────────────────────────┐  │ │
│  │  │              Supabase (PostgreSQL + pgvector)              │  │ │
│  │  │  - URL: https://pppmwsnpgsvipvwyeyfv.supabase.co           │  │ │
│  │  │  - Auth: Supabase Auth                                    │  │ │
│  │  │  - Storage: Stockage des documents                        │  │ │
│  │  │  - Realtime: Websockets pour les mises à jour             │  │ │
│  │  └─────────────────────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                  │                                  │
│                                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     SERVICES EXTERNES                         │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────────┐  │ │
│  │  │  Mistral   │  │   GitLab   │  │        Redis          │  │ │
│  │  │   (API)    │  │   (API)    │  │     (Upstash)         │  │ │
│  │  └─────────────┘  └─────────────┘  └───────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Étapes de Déploiement

| Étape | Tâche | Durée Estimée | Responsable |
|-------|-------|---------------|-------------|
| 1 | Créer projet Vercel | 15 min | DevOps |
| 2 | Lier dépôt GitHub | 10 min | DevOps |
| 3 | Configurer variables d'environnement | 30 min | DevOps |
| 4 | Déclencher premier déploiement | 5 min | DevOps |
| 5 | Vérifier et tester | 30 min | DevOps/Dev |
| 6 | Configurer domaine (optionnel) | 30 min | DevOps |
| **Total** | | **~2h15** | |

### Environnements

| Environnement | URL | Statut |
|---------------|-----|--------|
| Production | https://nexiamind-ai.vercel.app | À déployer |
| Preview | https://nexiamind-ai-git-*.vercel.app | Auto-généré |
| Local | http://localhost:3000 | Développement |

---

## 📦 Prérequis

### 1. Compte et Accès

| Service | Compte Requis | Accès Nécessaire |
|---------|---------------|------------------|
| **Vercel** | ✅ Oui | Créer projets, configurer variables |
| **GitHub** | ✅ Oui | Admin sur le dépôt |
| **Supabase** | ✅ Oui | Admin sur le projet |
| **Mistral** | ⚠️ Optionnel | Clé API pour LLM |

### 2. Outils Installés

```bash
# Vérifier les versions installées
node --version  # >= 20.x
npm --version   # >= 9.x
Git --version   # >= 2.x
```

### 3. Dépôt Git

- Dépôt: [Netchard/NexiaMindAi](https://github.com/Netchard/NexiaMindAi)
- Branche principale: `master`
- Protection de branche: Activée (recommandé)

### 4. Projet Supabase

- URL: https://pppmwsnpgsvipvwyeyfv.supabase.co
- Statut: Configuré et fonctionnel
- Tables: profiles, documents, chunks, embeddings, conversations, messages, sync_logs
- Index: idx_embeddings_vector (pgvector), index classiques
- RLS: Configuré (ST-401)

---

## 🚀 Déploiement du Frontend (Vercel)

### Préparation

#### 1. Vérifier la configuration locale

```bash
cd C:\VibeCoding\nexiamind-ai

# Vérifier que le projet build localement
npm run build

# Vérifier qu'il n'y a pas d'erreurs
npm run lint

# Tester localement
npm run dev
```

**✅ Vérifications:**
- [ ] Build termine avec succès
- [ ] Aucune erreur de lint
- [ ] Application fonctionnelle en local

#### 2. Vérifier vercel.json

Le fichier `vercel.json` doit contenir:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/.+",
      "dest": "/api/$1",
      "headers": { "Access-Control-Allow-Origin": "*" }
    }
  ]
}
```

#### 3. Vérifier package.json

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### Création du Projet Vercel

#### Étape 1: Créer le projet

1. Aller sur [https://vercel.com](https://vercel.com)
2. Cliquer sur "Add New" → "Project"
3. Sélectionner "Import Git Repository"
4. Choisir le dépôt: **Netchard/NexiaMindAi**
5. Configurer:
   - Project Name: `nexiamind-ai`
   - Framework Preset: **Next.js**
   - Root Directory: *(laisser vide)*
   - Build Command: `npm run build` *(déjà configuré)*
   - Output Directory: *(laisser vide - automatique pour Next.js)*
   - Development Command: `npm run dev` *(déjà configuré)*
6. Cliquer sur "Deploy"

**⏳ Temps estimé:** 10-15 minutes

#### Étape 2: Attendre le premier déploiement

- Vercel va automatiquement:
  1. Cloner le dépôt
  2. Installer les dépendances (`npm install`)
  3. Builder le projet (`npm run build`)
  4. Déployer

**📊 Statut:**
- En cours: "Building"
- Succès: "Ready"
- Échec: "Error" (voir logs)

### Configuration des Variables d'Environnement

#### Étape 3: Ajouter les variables obligatoires

Aller dans: **Project Settings → Environment Variables**

Ajouter les variables suivantes dans **Production**:

| Nom | Valeur | Catégorie |
|-----|--------|-----------|
| `SUPABASE_URL` | `https://pppmwsnpgsvipvwyeyfv.supabase.co` | Server |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcG13c25wZ3N2aXB2d3lleWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDM5NjUsImV4cCI6MjA5Nzk3OTk2NX0.9Fth99_4K5cm8iJZyQWAuwN5u2HG-_gTs-xsUWRhgug` | Server |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_MwBf77mDVTvc1mmp3gK1KQ_JYiKGP-J` | Server |
| `MISTRAL_API_KEY` | `QJ3fXSY8onaKEzmnVv4l8ROq67izZj2J` | Server |

**⚠️ ATTENTION:**
- `SUPABASE_SERVICE_ROLE_KEY` doit **NE JAMAIS** être exposée côté client
- Ne **JAMAIS** ajouter de variables `NEXT_PUBLIC_*` ici sauf si nécessaire côté client

#### Étape 4: Ajouter les variables client-side (si nécessaire)

| Nom | Valeur | Description |
|-----|--------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://nexiamind-ai.vercel.app` | URL de l'application |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pppmwsnpgsvipvwyeyfv.supabase.co` | URL Supabase (optionnel) |

**✅ Vérification:**
- [ ] Toutes les variables obligatoires sont ajoutées
- [ ] Catégorie correcte (Server vs Client)
- [ ] Aucune clé secrète n'est exposée côté client

### Déclenchement du Déploiement

#### Étape 5: Pousser un commit

```bash
cd C:\VibeCoding\nexiamind-ai

# Vérifier que tout est commité
git status

# Si nécessaire, committer les changements
git add .
git commit -m "chore: prêt pour déploiement Vercel"
git push origin master
```

**⏳ Temps estimé:** 5-10 minutes pour le build + déploiement

#### Étape 6: Surveiller le déploiement

- Aller sur: [https://vercel.com/your-team/nexiamind-ai/deployments](https://vercel.com/your-team/nexiamind-ai/deployments)
- Cliquer sur le dernier déploiement
- Vérifier les logs en temps réel

**📋 Logs à vérifier:**
```
Installing dependencies...
Running build command: npm run build
Next.js build completed
Deploying to Vercel's global network...
Deployment completed!
```

---

## ⚙️ Configuration Post-Déploiement

### Vérification de Base

#### 1. Accéder à l'application

- URL: **https://nexiamind-ai.vercel.app**
- Vérifier que la page se charge

#### 2. Tester les fonctionnalités principales

| Fonctionnalité | Test | Résultat |
|---------------|------|----------|
| Page d'accueil | Ouvrir `/` | [ ] ✅ / [ ] ❌ |
| Authentification | Login/Register | [ ] ✅ / [ ] ❌ |
| Interface de chat | Accéder à `/chat` | [ ] ✅ / [ ] ❌ |
| Génération IA | Envoyer un message | [ ] ✅ / [ ] ❌ |
| Sources | Vérifier citations | [ ] ✅ / [ ] ❌ |

#### 3. Vérifier les variables d'environnement

Ouvrir DevTools (F12) et exécuter:

```javascript
// Vérifier les variables client-side
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

// Tester la connexion Supabase (si NEXT_PUBLIC_SUPABASE_URL est défini)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
console.log('Supabase client:', supabase);
```

### Configuration du Domaine (Optionnel)

#### 1. Acheter un domaine

- Via Vercel: [https://vercel.com/domains](https://vercel.com/domains) (~$10-20/an)
- Ou via un autre registrar

**Recommandation:** `nexiamind.ai` (si disponible)

#### 2. Configurer dans Vercel

1. Aller à: **Project Settings → Domains**
2. Cliquer sur "Add Domain"
3. Entrer: `nexiamind.ai`
4. Suivre les instructions

#### 3. Configurer les DNS

**Pour un domaine acheté via Vercel:**
- Configuration automatique

**Pour un domaine acheté ailleurs:**
- Créer un enregistrement CNAME:
  - Name: `@` ou `www`
  - Type: CNAME
  - Value: `cname.vercel-dns.com`
- Ou un enregistrement A:
  - Name: `@`
  - Type: A
  - Value: `76.76.21.21` (IP de Vercel)

#### 4. Vérifier le SSL

- HTTPS est **automatique** avec Vercel (via Let's Encrypt)
- Peut prendre quelques minutes à heures
- Vérifier sur: [https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)

---

## ✅ Vérification et Tests

### Checklist de Validation

#### 1. Fonctionnalités de Base

- [ ] Page d'accueil accessible sans erreur
- [ ] Navigation entre les pages fonctionnelle
- [ ] Design responsive (mobile/tablette)

#### 2. Authentification

- [ ] Page de login accessible
- [ ] Connexion avec email/mot de passe
- [ ] Inscription de nouveau compte
- [ ] Déconnexion
- [ ] Gestion des sessions

#### 3. Fonctionnalités Principales

- [ ] Interface de chat accessible
- [ ] Envoi de messages
- [ ] Réception de réponses IA
- [ ] Affichage des sources/citations
- [ ] Historique des conversations
- [ ] Filtres (client, type, langage)

#### 4. Intégrations

- [ ] Connexion à Supabase fonctionnelle
- [ ] Récupération des documents
- [ ] Recherche vectorielle (pgvector)
- [ ] Authentification Supabase Auth

#### 5. Performance

- [ ] Temps de chargement < 3s (test avec [WebPageTest](https://www.webpagetest.org/))
- [ ] Score Lighthouse > 80 (test avec [PageSpeed Insights](https://pagespeed.web.dev/))
- [ ] Aucune erreur console
- [ ] Aucune erreur réseau (404, 500, etc.)

#### 6. Sécurité

- [ ] HTTPS activé
- [ ] Headers de sécurité présents
- [ ] Aucune variable secrète exposée côté client
- [ ] CORS correctement configuré

### Tests Automatiques

#### 1. Vérifier le build local

```bash
npm run build
npm run lint
```

#### 2. Tester avec Jest/Vitest

```bash
npm test
```

#### 3. Audit de Sécurité

```bash
npm audit
```

---

## 🔄 Maintenance et Mises à Jour

### Déploiement de Nouvelles Fonctionnalités

#### 1. Créer une branche de feature

```bash
git checkout -b feature/nouvelle-fonctionnalite
```

#### 2. Développer et tester localement

```bash
npm run dev
# Tester les nouvelles fonctionnalités
```

#### 3. Pousser la branche

```bash
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
git push origin feature/nouvelle-fonctionnalite
```

#### 4. Créer une Pull Request

- Vercel créera automatiquement une **Preview Deployment**
- URL: `https://nexiamind-ai-git-feature-nouvelle-fonctionnalite.vercel.app`
- Tester la preview avant de merger

#### 5. Merger vers master

- Après approbation de la PR
- Le merge déclenchera un déploiement automatique en production

### Mises à Jour de Sécurité

#### 1. Mettre à jour les dépendances

```bash
npm outdated
npm update
```

#### 2. Tester les mises à jour

```bash
npm run build
npm run test
npm run lint
```

#### 3. Déployer

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin master
```

### Redémarrage du Projet

Si le projet doit être redémarré:

```bash
# Localement
vercel dev

# En production
# Vercel gère automatiquement les redémarrages
```

---

## 🔙 Rollback et Récupération

### Rollback vers un Déploiement Précédent

1. Aller dans: **Deployments** → Sélectionner un déploiement précédent
2. Cliquer sur "Redeploy"
3. Choisir la raison du rollback
4. Attendre que le déploiement se termine

**Via CLI:**
```bash
# Lister les déploiements
vercel deployments

# Redéployer un déploiement spécifique
vercel deploy --id <deployment-id>
```

### Récupération après Incident

#### 1. Identifier le problème

- Vérifier les logs: `vercel logs`
- Vérifier les métriques: Vercel Dashboard → Analytics
- Vérifier les erreurs utilisateurs

#### 2. Corriger le code

```bash
# Corriger localement
git checkout -b hotfix/incident-xyz
# Faire les corrections
npm run build
npm run test
```

#### 3. Déployer la correction

```bash
git add .
git commit -m "fix: corriger incident xyz"
git push origin hotfix/incident-xyz
# Créer PR et merger vers master
```

### Restauration de la Base de Données

Si la base de données Supabase a des problèmes:

1. Utiliser les scripts de backup créés dans **ST-405**
2. Exécuter: `node scripts/database/restore-db.js --file <backup-file>.sql`
3. Vérifier l'intégrité des données

---

## 📚 Annexes

### A. Commandes Vercel CLI Utiles

| Commande | Description |
|----------|-------------|
| `vercel` | Lister les projets |
| `vercel login` | Se connecter |
| `vercel logout` | Se déconnecter |
| `vercel link` | Lier un projet local |
| `vercel` | Déployer (preview) |
| `vercel --prod` | Déployer en production |
| `vercel pull` | Télécharger la configuration |
| `vercel logs` | Voir les logs |
| `vercel env` | Gérer les variables |

### B. Configuration Next.js Recommandée

**`next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimisation des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pppmwsnpgsvipvwyeyfv.supabase.co',
      },
    ],
    // Taille maximale des images (1MB par défaut)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Redirections
  async redirects() {
    return [
      {
        source: '/',
        destination: '/chat',
        permanent: true,
      },
    ]
  },
  
  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### C. Structure du Projet

```
nexiamind-ai/
├── .env                    # Variables locales (NE PAS COMMITTER)
├── .env.example            # Template des variables
├── .env.local              # Variables locales
├── vercel.json            # Configuration Vercel
├── package.json           # Dependances et scripts
├── next.config.js         # Configuration Next.js
├── public/               # Assets statiques
├── src/                 # Code source
│   ├── app/              # Pages et layouts
│   ├── components/       # Composants React
│   ├── lib/             # Logique métier
│   ├── types/           # Types TypeScript
│   └── hooks/           # Custom hooks
├── docs/                # Documentation
│   └── deployment/      # Documentation de déploiement
└── scripts/             # Scripts utilitaires
    └── database/        # Scripts de base de données
```

### D. Variables d'Environnement Complètes

Voir: `.env.example` à la racine du projet

### E. Références

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Vercel + Next.js Guide](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)

---

## 📝 Historique des Déploiements

| Date | Version | Auteur | Description | URL |
|------|---------|--------|-------------|-----|
| À compléter | 1.0.0 | Dday | Premier déploiement | https://nexiamind-ai.vercel.app |

---

## ✅ Checklist Finale

- [ ] Projet Vercel créé
- [ ] Dépôt GitHub lié
- [ ] Variables d'environnement configurées
- [ ] Premier déploiement réussi
- [ ] Application accessible
- [ ] Toutes les fonctionnalités testées
- [ ] Domaine configuré (optionnel)
- [ ] HTTPS activé
- [ ] Documentation mise à jour
- [ ] Backup de la base de données disponible

---

**🎉 Déploiement terminé! L'application NexiaMind AI est maintenant accessible en production.**

*Document généré dans le cadre de la Story 6.501 - Configurer Vercel pour le Frontend*