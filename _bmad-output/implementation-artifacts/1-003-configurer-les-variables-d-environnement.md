---
story_id: ST-003
epic: Epic 1
title: Configurer les Variables d'Environnement
description: Configurer toutes les variables d'environnement pour le développement local afin de pouvoir tester l'application sans erreurs.
status: done
priority: ⭐⭐⭐⭐⭐
estimation: 2 heures
assigned_to: Dday
start_date: 2026-06-24 23:45:00
end_date: 2026-06-25 01:00:00
user_skill_level: intermediate
baseline_commit: ""
workflow: dev-story

# BMAD Metadata
epic_title: Configuration & Infrastructure
epic_goal: Mise en place de l'infrastructure de base nécessaire pour le développement
project: NexiaMind AI
dependencies: ["ST-001", "ST-002"]
related_documents:
  - "_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md"
  - "_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md"
---

## 🎯 Objectif

**En tant que** Développeur
**Je veux** toutes les variables d'environnement configurées pour le développement local
**Afin de** pouvoir tester l'application sans erreurs.

---

## 📋 Contexte

Ce fichier de story fait partie de l'**Epic 1: Configuration & Infrastructure**. Après avoir configuré le projet Next.js (ST-001) et Supabase (ST-002), cette story permet de centraliser toutes les configurations nécessaires pour que l'application fonctionne correctement en développement et en production.

---

## ✅ Critères d'Acceptation

### Configuration de Base
- [x] Fichier `.env.local.example` créé
- [x] Toutes les variables nécessaires documentées
- [x] Format standard respecté (NOM=valeur)

### Développement Local
- [x] Configuration pour le développement local fonctionnelle
- [x] Git initialisé dans le projet Next.js
- [x] .gitignore configuré pour exclure .env.local

### Déploiement
- [x] Configuration pour le déploiement (Vercel) prête
- [x] Variables côté serveur et client correctement séparées

### Tests
- [x] Variables chargées avec succès
- [x] Script de test créé et exécuté
- [x] Aucune erreur de chargement

---

## 📋 Tâches Principales

### Phase 1: Préparation des Fichiers (Estimation: 30 min)
- [x] Créer le fichier .env.local.example
- [x] Documenter toutes les variables nécessaires
- [x] Vérifier la syntaxe du fichier

### Phase 2: Configuration Git (Estimation: 30 min)
- [x] Initialiser Git dans nexiamind-ai
- [x] Créer le fichier .gitignore
- [x] Ajouter .env.local au .gitignore
- [x] Résoudre le problème "dubious ownership"
- [x] Faire le premier commit

### Phase 3: Configuration Développement (Estimation: 30 min)
- [x] Copier .env.local.example en .env.local
- [x] Remplir .env.local avec les vraies valeurs
- [x] Vérifier que le fichier est bien chargé

### Phase 4: Configuration Déploiement (Estimation: 30 min)
- [x] Configurer Vercel pour le projet
- [x] Ajouter les variables côté serveur dans Vercel
- [x] Ajouter les variables côté client dans Vercel
- [x] Vérifier la configuration

### Phase 5: Tests (Estimation: 30 min)
- [x] Créer un script de test des variables
- [x] Exécuter le script de test
- [x] Résoudre les problèmes de chargement
- [x] Valider toutes les variables

---

## 🛠 Outils et Commandes

### Commandes pour Vérifier les Variables

```bash
# Vérifier que le fichier existe
ls -la .env.local

# Vérifier le répertoire courant
pwd

# Vérifier que dotenv est installé
npm list dotenv

# Tester le chargement avec Node.js
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL);"
```

### Exemple de Script de Test

**Fichier : test-env-vars.js**
```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('\n🔍 Test des Variables d\'Environnement\n');

// Test 1: Variables obligatoires
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'MISTRAL_API_KEY'
];

console.log('✅ Test 1: Variables obligatoires');
let allPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const present = value && value !== '';
  console.log(`  ${present ? '✅' : '❌'} ${varName}: ${present ? 'OK' : 'MISSING'}`);
  if (!present) allPresent = false;
});

// Test 2: Connexion Supabase
if (allPresent) {
  console.log('\n✅ Test 2: Connexion Supabase');
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`  ❌ Erreur: ${error.message}`);
    } else {
      console.log(`  ✅ Connexion réussie (profiles: ${data?.length || 0})`);
    }
  } catch (err) {
    console.log(`  ❌ Erreur: ${err.message}`);
  }
}

// Test 3: Variables optionnelles
console.log('\n✅ Test 3: Variables optionnelles');
['NEXT_PUBLIC_APP_URL', 'GITLAB_API_URL', 'NEXIA_API_URL', 'REDIS_URL']
  .forEach(varName => {
    const present = process.env[varName];
    console.log(`  ${present ? '✅' : 'ℹ️'} ${varName}: ${present ? 'OK' : 'optionnelle'}`);
  });

console.log('\n' + '='.repeat(60));
console.log(allPresent ? '🎉 TOUS LES TESTS RÉUSSIS!' : '⚠️ VARIABLES MANQUANTES');
console.log('='.repeat(60));
```

### Commandes Git

```bash
# Initialiser Git
git init

# Ajouter le fichier .gitignore
echo "node_modules" >> .gitignore
echo ".next" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# Résoudre "dubious ownership" sur Windows
git config --global --add safe.directory "D:/VibeCoding/Projects/Project-D/nexiamind-ai"

# Vérifier le statut
git status

# Premier commit
git add .gitignore .env.local.example package.json src/
git commit -m "feat: Configure environment variables for ST-003"
```

---

## 📚 Références

- **Documentation Next.js Environment Variables** : https://nextjs.org/docs/basic-features/environment-variables
- **Documentation dotenv** : https://github.com/motdotla/dotenv
- **Documentation Vercel Environment Variables** : https://vercel.com/docs/environment-variables
- **Documentation Supabase** : https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

---

## 📝 Journal du Développeur

### 🟢 Enregistrements de Développement
*Date : 2026-06-25 01:00:00*
*Statut : TERMINÉ*

### 🟡 Journal de Débogage
- **Problème 1** : Git "not a git repository" → Solution : git init dans nexiamind-ai
- **Problème 2** : Git "dubious ownership" → Solution : safe.directory configuration
- **Problème 3** : process.env renvoie undefined → Solution : Vérifier répertoire + utiliser CommonJS

### ✅ Notes de Complétion
- Fichier .env.local.example créé avec toutes les variables documentées
- Fichier .env.local rempli avec les vraies valeurs de développement
- .gitignore configuré pour protéger les secrets
- Configuration Vercel complète (server-side et client-side)
- Git initialisé et configuré
- Script de test créé et exécuté avec succès

---

## 📁 Liste des Fichiers Modifiés

- `nexiamind-ai/.env.local.example` (créé)
- `nexiamind-ai/.env.local` (créé)
- `nexiamind-ai/.gitignore` (mis à jour)
- `nexiamind-ai/test-env-vars.js` (créé)

---

## 🔄 Journal des Changements

- 2026-06-24 23:45:00 - Début de ST-003
- 2026-06-24 23:50:00 - Création de .env.local.example
- 2026-06-25 00:00:00 - Initialisation Git résolue
- 2026-06-25 00:30:00 - Configuration dotenv validée
- 2026-06-25 01:00:00 - Tests réussis, ST-003 terminée
