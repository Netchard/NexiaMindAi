---
baseline_commit: 443e870
---

# Story 6.502: Configurer le Backend (si séparé)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

**En tant que** DevOps  
**Je veux** le backend déployé sur un service adapté (Vercel, Railway, Fly.io, etc.)  
**Afin de** traiter les requêtes API de manière scalable et sécurisée.

---

## Acceptance Criteria

### Critères d'Acceptation Principaux (DoD)

1. **Service Backend Déployé**
   - [ ] Service backend opérationnel et accessible
   - [ ] URL du backend documentée et fonctionnelle
   - [ ] Certificat SSL activé (HTTPS)
   - [ ] Uptime monitoring configuré (optionnel)

2. **Connexion à Supabase Fonctionnelle**
   - [ ] Connexion à la base de données Supabase établie
   - [ ] Toutes les tables accessibles (profiles, documents, chunks, embeddings, conversations, messages, sync_logs)
   - [ ] Politiques RLS respectées
   - [ ] Tests de connexion réussis

3. **Variables d'Environnement Sécurisées**
   - [ ] Toutes les variables backend configurées dans le service de déploiement
   - [ ] Variables sensibles marquées comme Server-only (non exposées au client)
   - [ ] SUPABASE_SERVICE_ROLE_KEY protégée (jamais exposée)
   - [ ] MISTRAL_API_KEY protégée
   - [ ] Rotation des clés possible sans downtime

4. **Scalabilité Configurée**
   - [ ] Configuration adaptée au trafic attendu (estimé: 10-100 requêtes/minute)
   - [ ] Limites de rate limiting configurées si nécessaire
   - [ ] Auto-scaling activé (si supporté par le service)
   - [ ] Resources allouées optimisées (CPU, mémoire)

5. **Intégration avec le Frontend**
   - [ ] CORS configuré pour accepter les requêtes du frontend
   - [ ] Endpoints API accessibles depuis le frontend
   - [ ] Tests d'intégration frontend-backend réussis

6. **Documentation**
   - [ ] Documentation du déploiement backend
   - [ ] Procédure de redémarrage documentée
   - [ ] Procédure de rollback documentée
   - [ ] Variables d'environnement documentées

---

## Tâches Techniques Détaillées

### Phase 1: Analyse et Préparation (Estimation: 0.5h)

- [ ] **Tâche 1.1 : Analyser les besoins backend**
  - [ ] Évaluer si une séparation backend/frontend est nécessaire
  - [ ] Analyser le trafic API attendu
  - [ ] Identifier les dépendances backend spécifiques
  - [ ] Comparer les options de déploiement (Vercel, Railway, Fly.io)

- [ ] **Tâche 1.2 : Vérifier l'architecture actuelle**
  - [ ] Vérifier que le backend fonctionne dans les API Routes de Next.js
  - [ ] Vérifier la structure api/ existante
  - [ ] Lister toutes les dépendances backend
  - [ ] Identifier les fichiers à modifier pour une séparation éventuelle

- [ ] **Tâche 1.3 : Choisir la plateforme de déploiement**
  - [ ] Comparer Vercel vs Railway vs Fly.io
  - [ ] Évaluer les coûts pour chaque option
  - [ ] Vérifier la compatibilité avec Supabase
  - [ ] Sélectionner la plateforme optimale
  - [ ] **Recommandation:** Railway (meilleur rapport coût/performance) ou Vercel (si intégration complète)

### Phase 2: Préparation du Backend (Estimation: 1h)

- [ ] **Tâche 2.1 : Configurer le projet backend**
  - [ ] Créer un nouveau projet ou configurer le projet existant
  - [ ] Configurer Node.js 20+ comme runtime
  - [ ] Installer les dépendances nécessaires
  - [ ] Configurer TypeScript si utilisé

- [ ] **Tâche 2.2 : Adapter la configuration pour le déploiement séparé**
  - [ ] Créer un fichier package.json pour le backend (si séparé)
  - [ ] Configurer les scripts de build et start
  - [ ] Adapter les chemins d'import/export
  - [ ] Vérifier la compatibilité avec la plateforme choisie

- [ ] **Tâche 2.3 : Configurer les variables d'environnement**
  - [ ] Lister toutes les variables backend requises
  - [ ] Identifier les variables pour la connexion Supabase
  - [ ] Identifier les variables pour Mistral AI
  - [ ] Créer un template .env.backend.example

- [ ] **Tâche 2.4 : Préparer la configuration CORS**
  - [ ] Configurer CORS pour accepter le frontend (https://nexiamind-ai.vercel.app)
  - [ ] Configurer CORS pour les requêtes locales
  - [ ] Tester la configuration CORS localement

### Phase 3: Déploiement (Estimation: 1h)

- [ ] **Tâche 3.1 : Créer le projet sur la plateforme choisie**
  - [ ] Créer un compte (si nécessaire)
  - [ ] Créer un nouveau projet
  - [ ] Lier le dépôt GitHub (si déploiement automatique)
  - [ ] Configurer les paramètres de base

- [ ] **Tâche 3.2 : Configurer le déploiement automatique**
  - [ ] Lier le dépôt GitHub au projet
  - [ ] Configurer les triggers de build (sur push vers master)
  - [ ] Configurer les branches de preview (optionnel)
  - [ ] Tester le déploiement automatique

- [ ] **Tâche 3.3 : Configurer les variables d'environnement dans le Dashboard**
  - [ ] Ajouter SUPABASE_URL
  - [ ] Ajouter SUPABASE_SERVICE_ROLE_KEY
  - [ ] Ajouter MISTRAL_API_KEY
  - [ ] Ajouter UPSTASH_REDIS_REST_URL (si utilisé)
  - [ ] Ajouter UPSTASH_REDIS_REST_TOKEN (si utilisé)
  - [ ] Ajouter NEXIA_API_URL et NEXIA_API_KEY (si utilisé)
  - [ ] Ajouter GITLAB_API_URL et GITLAB_PRIVATE_TOKEN (si utilisé)

- [ ] **Tâche 3.4 : Déclencher le premier déploiement**
  - [ ] Pousser un commit vers master
  - [ ] Vérifier que le build démarre automatiquement
  - [ ] Surveiller les logs de build
  - [ ] Corriger les erreurs si nécessaire

### Phase 4: Validation et Tests (Estimation: 0.5h)

- [ ] **Tâche 4.1 : Vérifier le déploiement**
  - [ ] Accéder à l'URL du backend déployé
  - [ ] Vérifier que le service répond aux requêtes
  - [ ] Tester l'endpoint de santé (health check)

- [ ] **Tâche 4.2 : Tester la connexion Supabase**
  - [ ] Tester la connexion à la base de données
  - [ ] Vérifier l'accès à toutes les tables
  - [ ] Tester les politiques RLS

- [ ] **Tâche 4.3 : Tester l'intégration avec Mistral**
  - [ ] Tester la génération d'embeddings
  - [ ] Tester la génération de chat

- [ ] **Tâche 4.4 : Tester l'intégration avec le frontend**
  - [ ] Tester les appels API depuis le frontend
  - [ ] Vérifier que CORS est correctement configuré
  - [ ] Tester toutes les fonctionnalités principales

### Phase 5: Configuration Avancée (Estimation: 0.5h)

- [ ] **Tâche 5.1 : Configurer le monitoring**
  - [ ] Activer les logs détaillés
  - [ ] Configurer des alertes pour les erreurs
  - [ ] Configurer le monitoring des performances

- [ ] **Tâche 5.2 : Configurer le scaling**
  - [ ] Configurer l'auto-scaling si disponible
  - [ ] Définir les limites de ressources

- [ ] **Tâche 5.3 : Documenter la configuration**
  - [ ] Documenter la configuration du backend
  - [ ] Documenter la procédure de déploiement
  - [ ] Documenter les étapes de dépannage

---

## Contexte Technique

### Architecture Backend Actuelle

**Technologies:**
- Runtime: Node.js 20+
- Framework: Next.js API Routes (actuellement intégré au frontend)
- Base de données: Supabase PostgreSQL avec pgvector
- Authentification: Supabase Auth
- Cache: Redis (Upstash) pour les embeddings

**Structure Actuelle (dans le projet Next.js):**
```
api/
├── auth/              # Endpoints d'authentification
│   ├── login/
│   ├── logout/
│   └── me/
├── chat/             # Endpoints principaux
│   ├── message/      # POST /api/chat/message
│   ├── history/      # GET /api/chat/history
│   └── refresh/      # POST /api/chat/refresh
├── documents/        # Gestion des documents
│   ├── index/
│   └── sync/
└── admin/           # Administration
    └── stats/
```

**Pipeline RAG (Backend):**
```
1. Requête → /api/chat/message
2. Authentification → JWT
3. Retrieval → pgvector (similarité cosinus)
4. Augmentation → texte + métadonnées
5. Generation → Mistral AI API
6. Formatage → citations + Markdown
7. Retour → Réponse à l'utilisateur
```

### Variables d'Environnement Backend Requises

| Variable | Type | Obligatoire | Description |
|----------|------|-------------|-------------|
| SUPABASE_URL | Server | ✅ Oui | URL Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Server | ✅ Oui | Clé service Supabase |
| MISTRAL_API_KEY | Server | ✅ Oui | Clé API Mistral |
| UPSTASH_REDIS_REST_URL | Server | ⚠️ Optionnel | URL Redis |
| UPSTASH_REDIS_REST_TOKEN | Server | ⚠️ Optionnel | Token Redis |
| NEXIA_API_URL | Server | ⚠️ Optionnel | URL API Nexia |
| NEXIA_API_KEY | Server | ⚠️ Optionnel | Clé API Nexia |

### Comparaison des Plateformes

| Critère | Vercel | Railway | Fly.io |
|---------|--------|---------|--------|
| Node.js Support | ✅ Excellent | ✅ Excellent | ✅ Excellent |
| Intégration GitHub | ✅ Auto | ✅ Auto | ✅ Auto |
| CORS | ✅ Facile | ✅ Facile | ✅ Facile |
| Scalabilité | ✅ Auto | ✅ Auto | ✅ Auto |
| Coût | ~$20/mois | ~$5-20/mois | ~$10-30/mois |
| **Recommandation** | Si intégré | **⭐ Meilleur** | Bonne alternative |

**Recommandation:** Railway pour les APIs Node.js (meilleur rapport coût/performance)

---

## Dépendances

### Dépendances de la Story
- **ST-501** (Configurer Vercel pour le Frontend): Le frontend est déjà déployé
- **ST-002** (Configurer Supabase): La base de données est prête
- **ST-101** à **ST-108** (Backend RAG): Le backend est déjà implémenté
- **ST-401** (RLS): Les politiques de sécurité sont configurées

### Impact sur les Stories Futures
- Toutes les stories pourront utiliser le backend déployé

---

## Estimation

- **Total:** 3 heures
  - Phase 1 (Analyse): 0.5h
  - Phase 2 (Préparation): 1h
  - Phase 3 (Déploiement): 1h
  - Phase 4 (Validation): 0.5h
  - Phase 5 (Configuration Avancée): 0.5h (optionnel)

---

## Priorité et Difficulté

- **Priorité:** ⭐⭐⭐⭐⭐ (Critique - Backend en production)
- **Difficulté:** Moyenne (nécessite des connaissances DevOps)

---

## Références

- **Épic:** Epic 6 - DevOps & Déploiement
- **Architecture:** `_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md`
- **Epics & Stories:** `_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md`
- **Story Précédente:** 6-501-configurer-vercel-pour-le-frontend.md
- **Documentation Railway:** https://docs.railway.app
- **Documentation Fly.io:** https://fly.io/docs
- **Documentation Vercel:** https://vercel.com/docs

---

## File List

### Nouveaux Fichiers à Créer
- `package.json` - Configuration npm pour le backend (si séparé)
- `.env.backend.example` - Template des variables backend
- `Dockerfile` - Pour déploiement containerisé (si nécessaire)
- `railway.json` - Configuration Railway (si Railway)
- `fly.toml` - Configuration Fly.io (si Fly.io)
- `_bmad-output/implementation-artifacts/6-502-configurer-le-backend-si-separe.md` - Story file

### Fichiers Existants à Modifier
- `api/**/*.ts` - Adapter pour déploiement séparé (si nécessaire)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Status update

---

## Change Log

| Date | Auteur | Description |
|------|--------|-------------|
| 2026-07-16 | Mistral Vibe | Création du fichier story complet |

---

## Dev Agent Record

### Implementation Plan
- [ ] Phase 1: Analyse et préparation
- [ ] Phase 2: Préparation du backend
- [ ] Phase 3: Déploiement
- [ ] Phase 4: Validation et tests
- [ ] Phase 5: Configuration avancée

### Completion Notes
À venir - Story non encore implémentée

### Learn from Previous Stories

**From ST-501:** Le frontend est déployé sur Vercel avec succès
**From Epic 5:** Supabase est configuré et fonctionnel
**From Epic 2:** Le pipeline RAG est complètement implémenté

**Patterns:** Utiliser Railway pour Node.js API, configurer CORS strictement
**À éviter:** Ne pas exposer les clés secrètes, ne pas oublier CORS

---

## Questions pour Clarification

1. **Faut-il vraiment séparer le backend ?**
   - Le backend actuel dans Next.js API Routes fonctionne bien. Une séparation n'est nécessaire que si besoin de scalabilité indépendante.

2. **Quelle plateforme choisir ?**
   - Railway est recommandé pour son rapport coût/performance.

3. **Faut-il créer un nouveau dépôt ?**
   - Non, on peut garder un mono-repo.

---

## 🎯 Recommandation Stratégique

**NE PAS SÉPARER LE BACKEND POUR L'INSTANT**

Le backend actuel dans les API Routes de Next.js fonctionne parfaitement et est déjà déployé sur Vercel. Une séparation ajouterait de la complexité sans bénéfice immédiat pour le trafic actuel.

*Story ready for development - All implementation details included*
