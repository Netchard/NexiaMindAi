---
title: Product Brief - NexiaMind AI
status: draft
created: 2026-06-21
updated: 2026-06-21
author: Dday
project: NexiaMind AI
version: 1.0
type: product-brief
--- 

# 📋 Product Brief - NexiaMind AI (V1)

*"La compréhension métier de tes clients, accessible en un éclair à tes employés."*

---

## 🎯 1. Proposition de Valeur Unique

**NexiaMind AI** est une plateforme de recherche intelligente qui **centralise et contextualise** les connaissances internes de l'entreprise, permettant à vos employés de **trouver l'information pertinente avec sa compréhension métier associée** en quelques secondes.

**Pourquoi c'est différent :**
- ❌ Pas juste un moteur de recherche (Google, SharePoint)
- ✅ **Recherche sémantique** qui comprend le contexte métier
- ✅ **Intégration native** avec vos sources de données existantes
- ✅ **Personnalisation par rôle** pour une expérience adaptée

---

## 👥 2. Public Cible & Personas

### Personas Prioritaires (V1)

| Persona | Douleur Principale | Bénéfice Attendu | Priorité V1 |
|---------|-------------------|-----------------|--------------|
| **Consultants Techniques** | Manque de compréhension fonctionnelle (ex: "Qu'est-ce que le prorata de TVA chez le client X ?") | Comprendre les règles métiers clients **sans perdre de temps** | ⭐⭐⭐⭐⭐ |
| **Développeurs** | Temps perdu à chercher du code et de la documentation dans GitLab | Accès **instantané** au code + docs techniques | ⭐⭐⭐⭐⭐ |
| **Chefs de Projet** | Infos clients/produits dispersées dans plusieurs outils | Vue **unifiée** des documents projets | ⭐⭐⭐ |

### Personas Secondaires (V2+)
- Direction (KPIs stratégiques, alertes)
- Service Client (historique clients, contrats)
- Product Owner (priorisation, specs techniques)

---

## 🔥 3. Problème & Opportunité

### Le Problème
Les employés de l'entreprise **perdent un temps précieux** (estimé à **1-3h/jour/personne**) à :
- Chercher des informations dans **5+ outils différents** (CRM, Git, Jira, SharePoint, emails, etc.)
- **Comprendre le contexte métier** spécifique à chaque client (ex: paramétrage TVA, processus internes)
- **Reconstruire manuellement** des liens entre des données dispersées

**Conséquences :**
- ⏳ **Perte de productivité** massive
- 😠 **Frustration** des équipes techniques et métiers
- 💰 **Coûts cachés** (temps non facturable, erreurs, retards)
- 📉 **Risque de perte de connaissances** (départs, turnover)

### L'Opportunité
En centralisant et **contextualisant** l'accès aux connaissances :
- ✅ **Gain de temps** : Réduction de 70-90% du temps de recherche
- ✅ **Meilleure qualité** : Moins d'erreurs grâce à la compréhension du contexte
- ✅ **Autonomie** : Les employés trouvent l'info **sans dépendre des autres**
- ✅ **Capitalisation** : Les connaissances restent **dans l'entreprise**

---

## 💡 4. Solution Proposée (V1)

### Description
**NexiaMind AI V1** est une **application web sécurisée** qui permet de :
1. **Rechercher** dans une base de connaissances unifiée
2. **Comprendre** le contexte métier associé à chaque information
3. **Accéder** aux documents sources (PDF, XML, code, etc.)

### Périmètre Fonctionnel V1

| Fonctionnalité | Description | Sources Utilisées |
|---------------|-------------|-------------------|
| **Recherche unifiée** | Moteur sémantique + mots-clés sur les documents internes | Supabase, Nexia, GitLab |
| **Recherche contextuelle** | Compréhension du contexte métier (ex: "prorata de TVA client X") | Nexia (GED métiers + OCR) |
| **Accès aux documents** | Visualisation directe des fichiers (PDF, XML, code) | Supabase Storage, GitLab |
| **Filtrage par rôle** | Résultats adaptés au profil de l'utilisateur | Tous |
| **Authentification sécurisée** | Accès par profil (Manager, Chef de Projet, Développeur, Admin) | Supabase Auth |

### Architectures & Technologies V1
- **Backend** : Supabase (PostgreSQL + pgvector pour la recherche vectorielle)
- **Frontend** : Next.js (Framework moderne, React)
- **IA** : Mistral AI (intégration pour la recherche sémantique)
- **Stockage** : Supabase Storage + Nexia (GED métiers)
- **Code** : GitLab (accès aux repositories)

---

## 🌟 5. Différenciation

| Critère | NexiaMind AI | Alternatives (Google, SharePoint, Notion) |
|---------|--------------|------------------------------------------|
| **Recherche sémantique** | ✅ Comprend le contexte métier | ❌ Mots-clés uniquement |
| **Intégration native** | ✅ Connecteurs dédiés (GitLab, Supabase, Nexia) | ❌ Import manuel |
| **Personnalisation par rôle** | ✅ Résultats adaptés au profil | ❌ Même résultat pour tous |
| **Accès aux sources** | ✅ Lien direct vers les docs originales | ❌ Copie statique |
| **OCR intégré** | ✅ Recherche dans les PDFs/Images (via Nexia) | ❌ Limité |
| **Open Source** | ✅ Pas de vendor lock-in | ❌ Propriétaire |

---

## ⚠️ 6. Contraintes & Hypothèses

### Contraintes
- **Budget** : Privilégier des solutions open source (Supabase, Mistral)
- **Déploiement** : Hébergement cloud (Vercel, Supabase Hosting)
- **Sécurité** : Respect RGPD, chiffrement des données sensibles
- **Timeline** : MVP cible **mi-juillet 2026**

### Hypothèses (V1)
| Hypothèse | Statut | Validation |
|-----------|--------|------------|
| Accès API GitLab | ✅ Validé | Testé et fonctionnel |
| Accès API Nexia (GED) | ✅ Validé | Stable, accès disponible, OCR fonctionnel |
| Accès Supabase Storage | ✅ Validé | Intégré nativement |
| Les documents Nexia sont OCRisés | ✅ Validé | Confirmé par l'utilisateur |
| Les utilisateurs ont des identifiants uniques | ⚠️ À valider | À confirmer avec l'équipe IT |

---

## 📊 7. Critères de Succès & Métriques

### KPIs Quantitatifs (V1)
- **Taux d'adoption** : 80% des Consultants Techniques et Développeurs actifs après 1 mois
- **Temps de recherche** : Réduction de **70%** du temps moyen de recherche d'information
- **Satisfaction utilisateur** : Score NPS ≥ 40 après 3 mois
- **Nombre de requêtes** : 50+ recherches/jour/utilisateur actif

### KPIs Qualitatifs
- ✅ Les consultants **comprennent mieux** les spécificités clients
- ✅ Les développeurs **trouvent le code** sans quitter leur workflow
- ✅ Les chefs de projet **accèdent aux docs** sans multiplier les outils
- ✅ Réduction des **demandes répétitives** entre équipes

---

## 🗺️ 8. Roadmap

### V1 (Mi-juillet 2026) - MVP
- Recherche unifiée sur **3 sources** (Supabase, GitLab, Nexia)
- Authentification + gestion des rôles de base
- Interface web minimaliste
- **Focus** : Consultants Techniques + Développeurs

### V1.1 (Fin juillet 2026)
- Intégration **CRM** (à identifier)
- Amélioration de l'interface (tableaux de bord)
- Optimisation de la recherche

### V2 (Q3 2026)
- Intégration **Jira** et **Redmine**
- Alertes proactives (contrats expirants, bugs critiques)
- Recherche vocale (optionnel)

### V3 (Q4 2026)
- Intégration **emails** et **SharePoint**
- Analyse prédictive
- Collaboration en temps réel

---

## 📝 Addendum

### Décisions Clés
- [2026-06-21] **Périmètre V1 réduit** à 3 sources (Supabase, GitLab, Nexia) pour garantir une livraison rapide
- [2026-06-21] **Personas prioritaires V1** : Consultants Techniques + Développeurs (plus grand ROI)
- [2026-06-21] **Proposition de valeur validée** : "La compréhension métier de tes clients, accessible en un éclair à tes employés"

### Documents de Référence
- [Projet D - Séquence 1.5 - Note de cadrage](file:///d:/VibeCoding/Projects/Project-D/project-d2/docs/Projet%20D%20-%20S%C3%A9quence%201.5%20-%20Note%20de%20cadrage.md)

---

## 🎯 Prochaines Étapes

1. **Valider ce brief** avec les parties prenantes (Product Owner, Direction)
2. **Affiner les spécifications techniques** (schéma Supabase, architecture IA)
3. **Lancer le développement** en mode Vibe Coding
4. **Préparer les données** : Vérifier l'accès et la qualité des données dans Supabase, GitLab et Nexia

---

*Statut : Draft - À valider avec l'équipe*  
*Dernière mise à jour : 21 juin 2026*
