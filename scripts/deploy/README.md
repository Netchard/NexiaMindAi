# Scripts de Déploiement - NexiaMind AI

## 📁 Structure

```
scripts/deploy/
├── README.md                    # Ce fichier
├── vercel-setup.ps1           # Script PowerShell pour Vercel (Windows)
└── vercel-setup.sh            # Script Bash pour Vercel (macOS/Linux) - À créer si nécessaire
```

## 🚀 Scripts Disponibles

### 1. vercel-setup.ps1 (Windows PowerShell)

**Description:** Script PowerShell pour configurer et déployer NexiaMind AI sur Vercel.

**Usage:**

```powershell
# Affiche l'aide
.\[vercel-setup.ps1 -Help](vercel-setup.ps1 -Help)

# Vérifie la configuration actuelle
.\[vercel-setup.ps1 -Check](vercel-setup.ps1 -Check)

# Déclenche un déploiement
.\[vercel-setup.ps1 -Deploy](vercel-setup.ps1 -Deploy)

# Spécifier un nom de projet personnalisé
.\[vercel-setup.ps1 -Deploy -ProjectName "mon-projet"](vercel-setup.ps1 -Deploy -ProjectName "mon-projet")
```

**Fonctionnalités:**
- ✅ Vérification des prérequis (Node.js, npm, Git, Vercel CLI)
- ✅ Vérification de la configuration locale (vercel.json, package.json, .env.example)
- ✅ Test du build local
- ✅ Connexion à Vercel
- ✅ Liaison du projet
- ✅ Déploiement en production

**Étapes manuelles requises AVANT d'exécuter:**
1. Créer un compte sur [https://vercel.com](https://vercel.com)
2. Créer un projet dans Vercel Dashboard
3. Lier le dépôt GitHub `Netchard/NexiaMindAi`
4. Configurer les variables d'environnement dans Vercel Dashboard

---

## ⚙️ Configuration Manuelle (sans CLI)

### Étapes dans Vercel Dashboard:

1. **Créer le Projet**
   - Aller sur [https://vercel.com/new](https://vercel.com/new)
   - Sélectionner "Import Git Repository"
   - Choisir le dépôt: `Netchard/NexiaMindAi`
   - Framework: Next.js
   - Nom du projet: `nexiamind-ai`
   - Cliquer sur "Deploy"

2. **Configurer les Variables d'Environnement**
   - Aller à: Project Settings → Environment Variables
   - Ajouter dans Production:
     ```
     SUPABASE_URL=https://pppmwsnpgsvipvwyeyfv.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
     MISTRAL_API_KEY=sk-xxxxxx
     ```

3. **Déclencher le Déploiement**
   - Pousser un commit vers `master`:
     ```bash
     git add .
     git commit -m "chore: prêt pour déploiement Vercel"
     git push origin master
     ```

---

## 📋 Checklist de Déploiement

- [ ] Projet Vercel créé
- [ ] Dépôt GitHub lié
- [ ] Variables d'environnement configurées
  - [ ] SUPABASE_URL
  - [ ] SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] MISTRAL_API_KEY
- [ ] Build local testé (`npm run build`)
- [ ] Commit poussé vers master
- [ ] Déploiement réussi
- [ ] Application accessible

---

## 🎯 Après le Déploiement

### Vérifications:

1. **Accéder à l'application:** [https://nexiamind-ai.vercel.app](https://nexiamind-ai.vercel.app)
2. **Tester les fonctionnalités:**
   - Page d'accueil
   - Authentification (login/register)
   - Interface de chat
   - Génération de réponses
   - Affichage des sources
3. **Vérifier les logs:** [Vercel Dashboard → Deployments](https://vercel.com/nexiamind-ai/deployments)

### Domaines Personnalisés (Optionnel):

1. Acheter un domaine (ex: nexiamind.ai)
2. Aller à: Project Settings → Domains
3. Ajouter le domaine et suivre les instructions DNS
4. Le SSL est automatique avec Vercel

---

## 🛠️ Dépannage

### Problème: "Module not found"
**Solution:** Exécuter `npm install` localement et committer `package-lock.json`

### Problème: Variables d'environnement manquantes
**Solution:** Vérifier que toutes les variables sont ajoutées dans Vercel Dashboard → Environment Variables

### Problème: Build échoué
**Solution:**
1. Vérifier les logs dans Vercel Dashboard
2. Tester le build localement: `npm run build`
3. Corriger les erreurs et pousser un nouveau commit

### Problème: CORS errors
**Solution:**
- Vérifier `vercel.json` pour les headers CORS
- Ou configurer CORS dans Supabase Dashboard

### Problème: "Cannot find module"
**Solution:**
```bash
npm install
git add package-lock.json
git commit -m "chore: update package-lock.json"
git push origin master
```

---

## 📚 Références

- [Documentation Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Next.js + Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/environment-variables)

---

## 🔄 Maintenance

### Mettre à jour les dépendances:

```bash
npm outdated
npm update
npm run build
npm run test
npm run lint
```

### Redéployer après mise à jour:

```bash
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin master
```

---

**Note:** Les scripts dans ce dossier sont conçus pour automatiser autant que possible le processus de déploiement, mais certaines étapes (création du compte Vercel, configuration des variables dans le Dashboard) nécessitent une intervention manuelle.
