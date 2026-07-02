---
title: PRD - NexiaMind AI V1
status: draft
created: 2026-06-21
updated: 2026-06-21
author: Dday
project: NexiaMind AI
version: 1.0
type: product-requirements-document
related_to: ../brief-nexiamind-ai/brief.md
---

# 📄 PRD - NexiaMind AI V1
*Product Requirements Document - Approche RAG (Retrieval-Augmented Generation)*

---

## 🎯 1. Introduction

### Contexte
Ce document détaille les **exigences complètes** pour la **V1 de NexiaMind AI**, une plateforme de **centralisation et d'analyse de la connaissance** assistée par IA, basée sur une architecture **RAG (Retrieval-Augmented Generation)**.

**Basé sur :** [Product Brief - NexiaMind AI V1](../brief-nexiamind-ai/brief.md)

### Objectifs V1
- ✅ **Centraliser** l'accès aux connaissances (Supabase, GitLab, Nexia)
- ✅ **Analyser et synthétiser** les informations via Mistral AI (RAG)
- ✅ **Générer des réponses contextuelles** (pas juste retourner des documents)
- ✅ **Permettre aux utilisateurs de comprendre** (pas juste de trouver)

### Périmètre
| Inclus | Exclu (V2+) |
|--------|-------------|
| Recherche sémantique via IA | Intégration CRM |
| Accès aux documents sources | Intégration Jira/Redmine |
| Génération de réponses contextuelles | Alertes proactives |
| Authentification par profil | Recherche vocale |
| Conversation avec historique | Tableaux de bord avancés |
| Export des réponses | Intégration emails/SharePoint |

---

## 👥 2. Personas & User Stories

### Personas Prioritaires
| Persona | Description | Priorité V1 |
|---------|-------------|--------------|
| **Consultant Technique** | Besoin de comprendre les règles métiers clients | ⭐⭐⭐⭐⭐ |
| **Développeur** | Besoin de trouver du code et de la doc technique | ⭐⭐⭐⭐⭐ |
| **Chef de Projet** | Besoin d'accéder aux docs projets centralisés | ⭐⭐⭐ |

### User Stories (14 total)
*Voir [User Stories détaillées](../../../_bmad-output/planning-artifacts/brief-nexiamind-ai/user-stories.md) pour la liste complète.*

---

## 🏗️ 3. Architecture Technique

### Schéma Global (Approche RAG)
```
┌─────────────────────────────────────────────────────────────────┐
│                        NEXIAMIND AI V1                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐     ┌─────────────┐     ┌───────────────────┐ │
│  │  User       │     │  Frontend   │     │  Mistral AI       │ │
│  │  (Browser)  │────▶│  (Next.js)  │────▶│  (API + RAG)      │ │
│  └─────────────┘     └──────────┬──┘     └──────────┬────────┘ │
│                                 │                  │            │
│                                 ▼                  ▼            │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                        RAG Pipeline                           │ │
│  │                                                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐    │ │
│  │  │             │  │             │  │                   │    │ │
│  │  │  Supabase   │  │   GitLab    │  │     Nexia (GED)   │    │ │
│  │  │ (Storage + │  │ (Code +    │  │ (Documents +      │    │ │
│  │  │  pgvector)  │  │  Docs)      │  │  OCR)             │    │ │
│  │  │             │  │             │  │                   │    │ │
│  │  └─────────────┘  └─────────────┘  └───────────────────┘    │ │
│  │                                                               │ │
│  │  ┌───────────────────────────────────────────────────┐    │ │
│  │  │  1. Indexation : Chunking + Embeddings (pgvector)       │    │ │
│  │  │  2. Retrieval : Recherche vectorielle + filtres          │    │ │
│  │  │  3. Generation : Mistral AI + contexte récupéré         │    │ │
│  │  │  4. Réponse : Texte + sources citées + liens           │    │ │
│  │  └───────────────────────────────────────────────────┘    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Composants Techniques

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| **Frontend** | Next.js (React) | Interface utilisateur, gestion des requêtes |
| **Backend API** | Node.js/Express ou Next.js API Routes | Orchestration RAG, appels Mistral AI |
| **Base de données** | Supabase (PostgreSQL) | Stockage des documents, métadonnées, embeddings |
| **Recherche vectorielle** | pgvector (Supabase) | Indexation et recherche sémantique |
| **GED Métiers** | Nexia API | Accès aux documents clients avec OCR |
| **Code Source** | GitLab API | Accès aux repositories et documentation technique |
| **IA** | Mistral AI (API) | Génération de réponses, analyse, synthèse |
| **Authentification** | Supabase Auth | Gestion des utilisateurs et profils |

### Flow Technique
1. **User** → Saisit une requête en langage naturel
2. **Frontend** → Envoie la requête au backend
3. **Backend** → 
   - a. **Retrieval** : Interroge pgvector pour trouver les chunks pertinents
   - b. **Augmentation** : Récupère le contexte depuis les sources (Nexia, GitLab, Supabase)
4. **Mistral AI** → Génère une réponse basée sur le contexte récupéré
5. **Backend** → Formate la réponse + sources citées + liens
6. **Frontend** → Affiche la réponse à l'utilisateur

---

## 📋 4. Exigences Fonctionnelles

### 4.1 Recherche & RAG

| ID | Exigence | User Stories Associées | Priorité |
|----|----------|------------------------|----------|
| FR-001 | Permettre la saisie de requêtes en langage naturel | US-001, US-002, US-010, US-011, US-020 | ⭐⭐⭐⭐⭐ |
| FR-002 | Implémenter un pipeline RAG complet (Retrieval + Generation) | Toutes | ⭐⭐⭐⭐⭐ |
| FR-003 | Retourner des réponses générées par IA (pas juste des documents) | US-001, US-002, US-010, US-012 | ⭐⭐⭐⭐⭐ |
| FR-004 | Citer les sources utilisées pour chaque réponse | Toutes | ⭐⭐⭐⭐⭐ |
| FR-005 | Permettre l'accès direct aux documents sources | US-004, US-010, US-021 | ⭐⭐⭐⭐⭐ |
| FR-006 | Maintenir le contexte de la conversation (historique) | US-004, US-014 | ⭐⭐⭐⭐ |
| FR-007 | Détecter les ambiguïtés et demander des clarifications | US-005 | ⭐⭐⭐⭐ |
| FR-008 | Générer des réponses structurées (listes, tableaux, étapes) | US-003, US-021, US-022 | ⭐⭐⭐⭐ |
| FR-009 | Proposer des reformulations de requête | US-005 | ⭐⭐⭐ |

### 4.2 Gestion des Documents

| ID | Exigence | User Stories Associées | Priorité |
|----|----------|------------------------|----------|
| FR-010 | Indexer les documents de Supabase Storage | US-001, US-002, US-020 | ⭐⭐⭐⭐⭐ |
| FR-011 | Indexer les documents de Nexia (GED) avec OCR | US-001, US-002, US-003 | ⭐⭐⭐⭐⭐ |
| FR-012 | Indexer le code et la doc technique de GitLab | US-010, US-011, US-012 | ⭐⭐⭐⭐⭐ |
| FR-013 | Chunking intelligent des documents (par section, paragraphe) | Toutes | ⭐⭐⭐⭐ |
| FR-014 | Générer et stocker des embeddings (pgvector) | Toutes | ⭐⭐⭐⭐⭐ |
| FR-015 | Mettre à jour l'index lorsque de nouveaux documents sont ajoutés | Toutes | ⭐⭐⭐⭐ |

### 4.3 Filtrage & Personnalisation

| ID | Exigence | User Stories Associées | Priorité |
|----|----------|------------------------|----------|
| FR-020 | Filtrer les résultats par client | US-003 | ⭐⭐⭐⭐ |
| FR-021 | Filtrer les résultats par type de document | US-022 | ⭐⭐⭐ |
| FR-022 | Filtrer les résultats par langage de programmation | US-013 | ⭐⭐⭐ |
| FR-023 | Adapter les résultats au profil de l'utilisateur | US-001, US-010, US-020 | ⭐⭐⭐⭐ |

### 4.4 Export & Partage

| ID | Exigence | User Stories Associées | Priorité |
|----|----------|------------------------|----------|
| FR-030 | Exporter les réponses en Markdown | US-023 | ⭐⭐⭐ |
| FR-031 | Exporter les réponses en CSV/JSON | US-023 | ⭐⭐⭐ |
| FR-032 | Générer des liens partageables (7 jours) | US-023 | ⭐⭐⭐ |

---

## ⚙️ 5. Exigences Non-Fonctionnelles

### 5.1 Performance
| ID | Exigence | Cible | Priorité |
|----|----------|-------|----------|
| NF-001 | Temps de réponse moyen | < 3 secondes | ⭐⭐⭐⭐⭐ |
| NF-002 | Temps d'indexation d'un nouveau document | < 10 secondes | ⭐⭐⭐⭐ |
| NF-003 | Nombre de requêtes simultanées supportées | 50+ | ⭐⭐⭐⭐ |
| NF-004 | Disponibilité | 99.9% | ⭐⭐⭐⭐ |

### 5.2 Sécurité
| ID | Exigence | Détails | Priorité |
|----|----------|---------|----------|
| NF-010 | Authentification | Supabase Auth (email/mot de passe) | ⭐⭐⭐⭐⭐ |
| NF-011 | Autorisation | Accès par profil (Manager, Chef de Projet, Dev, Admin) | ⭐⭐⭐⭐⭐ |
| NF-012 | Chiffrement | HTTPS, données sensibles chiffrées | ⭐⭐⭐⭐⭐ |
| NF-013 | RGPD | Respect des données personnelles | ⭐⭐⭐⭐⭐ |
| NF-014 | Audit | Logs des requêtes (qui a cherché quoi, quand) | ⭐⭐⭐⭐ |

### 5.3 Scalabilité
| ID | Exigence | Détails | Priorité |
|----|----------|---------|----------|
| NF-020 | Volume de données | Support de 10K+ documents | ⭐⭐⭐⭐ |
| NF-021 | Nombre d'utilisateurs | Support de 100+ utilisateurs actifs | ⭐⭐⭐⭐ |
| NF-022 | Extensibilité | Ajout facile de nouvelles sources | ⭐⭐⭐⭐ |

### 5.4 Qualité & Expérience Utilisateur
| ID | Exigence | Détails | Priorité |
|----|----------|---------|----------|
| NF-030 | Précision des réponses | > 90% de réponses pertinentes | ⭐⭐⭐⭐⭐ |
| NF-031 | Satisfaction utilisateur | NPS ≥ 40 après 3 mois | ⭐⭐⭐⭐ |
| NF-032 | Interface intuitive | Apprentissage < 10 minutes | ⭐⭐⭐⭐ |
| NF-033 | Accessibilité | WCAG 2.1 AA | ⭐⭐⭐ |

---

## 🎯 6. Priorisation MoSCoW

### Must Have (⭐⭐⭐⭐⭐) - Sans ça, la V1 est inutilisable
- **FR-001** : Saisie de requêtes en langage naturel
- **FR-002** : Pipeline RAG complet
- **FR-003** : Réponses générées par IA
- **FR-004** : Sources citées
- **FR-005** : Accès direct aux documents
- **FR-010** : Indexation Supabase
- **FR-011** : Indexation Nexia (OCR)
- **FR-012** : Indexation GitLab
- **FR-014** : Génération et stockage des embeddings
- **NF-001** : Temps de réponse < 3s
- **NF-010** : Authentification
- **NF-011** : Autorisation par profil
- **NF-012** : Chiffrement
- **NF-013** : RGPD
- **NF-030** : Précision > 90%

### Should Have (⭐⭐⭐⭐) - Très important, mais pas bloquant
- **FR-006** : Contexte de conversation
- **FR-007** : Détection d'ambiguïtés
- **FR-008** : Réponses structurées
- **FR-013** : Chunking intelligent
- **FR-015** : Mise à jour automatique de l'index
- **FR-020** : Filtre par client
- **FR-023** : Adaptation au profil utilisateur
- **NF-002** : Indexation < 10s
- **NF-003** : 50+ requêtes simultanées
- **NF-014** : Audit des requêtes
- **NF-020** : Support 10K+ documents

### Could Have (⭐⭐⭐) - Bonus si temps disponible
- **FR-009** : Suggestions de reformulation
- **FR-021** : Filtre par type de document
- **FR-022** : Filtre par langage
- **FR-030** : Export Markdown
- **FR-031** : Export CSV/JSON
- **FR-032** : Liens partageables
- **NF-021** : Support 100+ utilisateurs
- **NF-032** : Interface intuitive
- **NF-033** : Accessibilité WCAG

### Won't Have (V2+) - Explicitement exclus de la V1
- Intégration CRM
- Intégration Jira/Redmine
- Alertes proactives
- Recherche vocale
- Tableaux de bord avancés
- Intégration emails/SharePoint

---

## 📊 7. Critères d'Acceptation (par User Story)

### Consultant Technique
| US | Critères d'Acceptation |
|----|------------------------|
| US-001 | ✅ L'IA comprend la question en langage naturel<br>✅ Génère une réponse structurée avec explication<br>✅ Cite les sources (documents Nexia/Supabase)<br>✅ Met en évidence les points clés |
| US-002 | ✅ Réponse en langage naturel et simple<br>✅ Exemples spécifiques au client<br>✅ Sources vérifiables (liens)<br>✅ Mise en forme claire |
| US-003 | ✅ Extrait les infos des 2 clients<br>✅ Tableau comparatif généré<br>✅ Surligne les différences<br>✅ Cite les documents sources |
| US-004 | ✅ Contexte de conversation maintenu<br>✅ Référence aux documents déjà consultés<br>✅ Réponse cohérente |
| US-005 | ✅ Détection des termes ambigus<br>✅ Demande de clarification proactive<br>✅ Suggestion de reformulation |

### Développeur
| US | Critères d'Acceptation |
|----|------------------------|
| US-010 | ✅ Extrait le code de GitLab<br>✅ Génère des extraits commentés<br>✅ Explique l'implémentation<br>✅ Cite fichier et ligne |
| US-011 | ✅ Recherche unifiée sur tous les repos<br>✅ Filtrage par repository<br>✅ Résultats triés par pertinence |
| US-012 | ✅ Affiche snippet avec contexte (5 lignes avant/après)<br>✅ Lien vers fichier complet<br>✅ Numéro de ligne |
| US-013 | ✅ Filtre par langage<br>✅ Détection automatique<br>✅ Stats par langage |
| US-014 | ✅ Lien profond vers GitLab<br>✅ Ouverture dans bon commit/branch<br>✅ Pas de rupture de workflow |

### Chef de Projet
| US | Critères d'Acceptation |
|----|------------------------|
| US-020 | ✅ Analyse des docs du projet<br>✅ Identifie les risques<br>✅ Hiérarchise par criticité<br>✅ Propose actions préventives |
| US-021 | ✅ Résumé structuré (5 points max)<br>✅ Surligne exigences critiques<br>✅ Lien vers document complet |
| US-022 | ✅ Extrait exigences des 2 projets<br>✅ Tableau comparatif<br>✅ Mets en évidence les écarts |
| US-023 | ✅ Export Markdown<br>✅ Export CSV/JSON<br>✅ Liens vers sources conservés |

---

## 🗺️ 8. Roadmap & Timeline

### V1 (Cible : Mi-juillet 2026)
| Tâche | Durée | Responsable | Statut |
|-------|-------|-------------|--------|
| Finaliser PRD | 2 jours | Product Owner | 🟡 In Progress |
| Concevoir architecture technique | 3 jours | Architecte | ⬜ Todo |
| Configurer Supabase (pgvector) | 2 jours | Développeur Backend | ⬜ Todo |
| Développer pipeline RAG | 5 jours | Développeur Backend | ⬜ Todo |
| Intégrer Mistral AI | 3 jours | Développeur Backend | ⬜ Todo |
| Développer frontend (Next.js) | 5 jours | Développeur Frontend | ⬜ Todo |
| Connecter GitLab API | 2 jours | Développeur Backend | ⬜ Todo |
| Connecter Nexia API | 2 jours | Développeur Backend | ⬜ Todo |
| Tests utilisateurs (Beta) | 3 jours | QA | ⬜ Todo |
| **Déploiement MVP** | **1 jour** | DevOps | ⬜ Todo |

### V1.1 (Cible : Fin juillet 2026)
- Intégration CRM
- Amélioration interface (tableaux de bord basiques)
- Optimisation des performances

---

## 📈 9. Métriques de Succès

### KPIs Quantitatifs
- **Taux d'adoption** : 80% des Consultants/Développeurs actifs après 1 mois
- **Temps de recherche** : Réduction de **70%** du temps moyen
- **Satisfaction** : NPS ≥ 40 après 3 mois
- **Précision** : > 90% de réponses pertinentes
- **Requêtes/jour** : 50+ par utilisateur actif

### KPIs Qualitatifs
- ✅ Les consultants **comprennent mieux** les spécificités clients
- ✅ Les développeurs **trouvent le code** sans quitter leur workflow
- ✅ Les chefs de projet **accèdent aux docs** sans multiplier les outils
- ✅ Réduction des **demandes répétitives** entre équipes

---

## 🔗 10. Dépendances & Risques

### Dépendances Externes
| Dépendance | Criticité | Statut | Propriétaire |
|------------|-----------|--------|--------------|
| Accès API Mistral AI | ⭐⭐⭐⭐⭐ | À configurer | Dday |
| Accès API GitLab | ⭐⭐⭐⭐⭐ | ✅ Validé | Dday |
| Accès API Nexia | ⭐⭐⭐⭐⭐ | ✅ Validé | Dday |
| Accès Supabase | ⭐⭐⭐⭐⭐ | ✅ Validé | Dday |

### Risques & Mitigations
| Risque | Impact | Probabilité | Mitigation |
|-------|--------|-------------|------------|
| Retard intégration Mistral AI | Bloquant | Moyenne | Commencer tôt, avoir un backup |
| Problème de performance RAG | Élevé | Faible | Optimisation pgvector, cache |
| Qualité des embeddings | Élevé | Moyenne | Tests de qualité, fine-tuning |
| Adoption par les utilisateurs | Élevé | Moyenne | Formation, démonstrations |

---

## 📝 11. Annexes

### Glossaire
- **RAG** : Retrieval-Augmented Generation - Architecture IA qui combine recherche de documents et génération de réponses
- **Embeddings** : Représentation vectorielle des documents pour la recherche sémantique
- **Chunking** : Découpage des documents en morceaux pour une meilleure indexation
- **pgvector** : Extension PostgreSQL pour la recherche vectorielle

### Documents de Référence
- [Product Brief - NexiaMind AI V1](../brief-nexiamind-ai/brief.md)
- [User Stories Détailées](../brief-nexiamind-ai/user-stories.md)
- [Decision Log](../brief-nexiamind-ai/.decision-log.md)
- [Note de Cadrage Original](../../../docs/Projet%20D%20-%20S%C3%A9quence%201.5%20-%20Note%20de%20cadrage.md)

---

## 🎯 12. Prochaines Étapes

1. **✅ Valider ce PRD** avec les parties prenantes
2. **🔧 Lancer la conception architecture technique** (bmad-create-architecture)
3. **📋 Créer les Epics & User Stories** (bmad-create-epics-and-stories)
4. **🚀 Démarrer le développement** en mode agile

---

*Statut : Draft - À valider avec l'équipe*  
*Dernière mise à jour : 21 juin 2026*
