# Projet D \- Séquence 1.5 \- Note de cadrage 

Voici une **note de cadrage** et une **vision produit** structurées pour votre application **NexiaMind AI**, basée sur les décisions prises et les besoins identifiés. Ces documents serviront de référence pour aligner les parties prenantes et guider le développement de la **version 1**.

---

## **📌 Note de Cadrage – NexiaMind AI (V1)**

*Date : 19 juin 2026* *Portée : MVP pour centralisation des connaissances internes et recherche sémantique*

---

### **1\. Contexte et Objectifs**

**Problématique** : Les équipes (Direction, Chefs de Projet, Consultants, Développeurs, etc.) ont besoin d’un accès **unifié, intelligent et sécurisé** aux données dispersées (CRM, Git, Jira, bases de données, SharePoint, emails) pour :

* Accélérer la recherche d’informations (clients, produits, documentations techniques).  
* Automatiser la détection d’alertes critiques (contrats, bugs).  
* Centraliser la documentation et les KPIs stratégiques.

**Objectif principal** : Développer une **application fullstack** avec :

* Un **moteur de recherche sémantique** (Mistral AI) pour interroger toutes les sources de données.  
* Des **tableaux de bord personnalisés** par rôle (Direction, Technique, Commerce).  
* Une **gestion fine des permissions** (accès par profil).  
* Une **intégration transparente** des sources externes (APIs, connecteurs).

**Livrable** : MVP déployé pour **mi-juillet 2026**, avec :

* Authentification et gestion des rôles.  
* Recherche unifiée \+ filtres avancés.  
* Tableaux de bord dynamiques (KPIs clients/produits).  
* Alertes critiques et accès aux documentations techniques (XML, API, guides).

---

### 

### 

### **2\. Périmètre Fonctionnel**

#### **🔹 Fonctionnalités Prioritaires (V1)**

| Fonctionnalité | Description | Profils Concernés | Sources de Données |
| ----- | ----- | ----- | ----- |
| Recherche unifiée | Moteur sémantique \+ mots-clés sur clients/produits. | Tous | CRM, Git, Jira, bases de données |
| Tableaux de bord stratégiques | Vues agrégées (KPIs clients, bugs critiques, etc.). | Direction, Chefs de Projet, Product Owner | CRM, Jira, bases de données |
| Accès aux documentations | Centralisation des fichiers XML, APIs, guides techniques. | Consultants, Développeurs, Product Owner | Git, bases internes |
| Recherche par filtres | Filtres avancés (client, produit, version, statut). | Tous | CRM, Git, Jira |
| Alertes critiques | Notifications pour contrats expirants, bugs non résolus. | Direction, Commerce, Service Client | CRM, Jira |
| Gestion des permissions | Contrôle d’accès par rôle (ex: Dev \= code, Commerce \= contrats). | Administrateur | Base utilisateurs |
| Intégration des sources | Connexion aux CRM, Git, Jira, bases clients/produits via APIs/connecteurs. | Administrateur | APIs, connecteurs |

#### **🔹 Sources de Données**

* **Base documentaire** (fichiers XML, guides).  
* **Git** (code, documentations techniques).  
* **SharePoint** (documents partagés).  
* **Emails** (historiques des échanges).  
* **CRM** (données clients/contrats).  
* **Jira** (bugs, tâches, statuts).  
* **Redmine** (gestion de projet)  
* **Bases de données** (clients, produits).

#### **🔹 Technologies Clés**

* **Backend** : Supabase (base de données \+ auth) \+ pgvector (stockage vectoriel pour la recherche sémantique).  
* **Frontend** : Framework moderne (ex: NextJs)   
* **IA** : Mistral AI (intégration pour la recherche, génération de documents, consolidation).  
* **Reconnaissance vocale** : Speech-to-text et text-to-speech.  
* **Connecteurs** : APIs pour CRM (ex: Salesforce, HubSpot), Git (GitHub/GitLab), Jira.

---

### **3\. Contraintes et Hypothèses**

**Contraintes** :

* **Open source et gratuit** : Privilégier des solutions comme Supabase, Mistral, et des connecteurs open source.  
* **Déploiement** : Hébergement cloud (ex: Vercel, Netlify, ou Supabase Hosting).  
* **Sécurité** : Chiffrement des données sensibles (RGPD), gestion stricte des permissions.  
* **Performance** : Optimisation pour des requêtes rapides malgré la diversité des sources.

**Hypothèses** :

* Les données des sources externes (CRM, Git, etc.) sont **accessibles via APIs**.  
* Les utilisateurs ont des **identifiants uniques** pour l’authentification.  
* Les fichiers XML sont **structurés et normalisés** pour le traitement par lots (10 par 10, comme demandé).

---

### **4\. Livrables et Planning**

| Livrable | Date Cible | Responsable |
| ----- | ----- | ----- |
| Spécifications techniques détaillées | 26 juin 2026 | Product Owner |
| Développement Backend (Supabase) | 3 juillet 2026 | Développeurs |
| Intégration Mistral AI | 10 juillet 2026 | Développeurs \+ Admin |
| Frontend (Tableaux de bord \+ Recherche) | 15 juillet 2026 | Développeurs |
| Tests utilisateurs (Beta) | 17 juillet 2026 | Service Client |
| **Déploiement MVP** | **20 juillet 2026** | Équipe Technique |

---

### **5\. Risques et Mitigations**

| Risque | Impact | Mitigation |
| ----- | ----- | ----- |
| Retard dans l’intégration des APIs | Bloquant pour les tests | Prioriser les connecteurs critiques |
| Données non structurées (XML) | Erreurs de recherche | Nettoyage \+ validation des fichiers |
| Performance de la recherche | Expérience utilisateur | Optimisation de pgvector \+ cache |
| Adoption par les utilisateurs | Faible utilisation | Formation \+ documentation claire |

---

## **🎯 Vision Produit – NexiaMind AI (V1)**

*"Centraliser, intelligemment, pour agir plus vite."*

### **1\. Valeur Proposition**

NexiaMind AI est une **plateforme unifiée** qui permet aux équipes de : 

✅ **Trouver instantanément** toute information (clients, produits, docs techniques) via une recherche **sémantique et contextuelle**. 

✅ **Visualiser en temps réel** les KPIs stratégiques (clients, bugs, contrats) **adaptés à leur rôle**.

✅ **Être alertés proactivement** sur les urgences (contrats expirants, bugs critiques). 

✅ **Accéder à une documentation centralisée** (XML, APIs, guides) **sans silos**.

### **2\. Public Cible**

| Persona | Besoins Principaux | Bénéfices Attendus |
| ----- | ----- | ----- |
| **Direction** | Vue d’ensemble des KPIs clients/produits, alertes stratégiques. | Prise de décision rapide. |
| **Chefs de Projet BU** | Suivi des projets, recherche de docs clients/produits. | Gain de temps, réduction des erreurs. |
| **Consultants Techniques** | Accès aux documentations (XML, APIs), recherche de solutions techniques. | Efficacité accrue, collaboration simplifiée. |
| **Product Owner** | Analyse des bugs, priorisation des features, accès aux specs techniques. | Meilleure priorisation, alignement équipe. |
| **Service Client** | Alertes sur les contrats, historique client. | Réactivité améliorée. |
| **Développeurs** | Accès au code (Git), docs techniques, recherche de bugs. | Développement plus rapide. |
| **Administrateur** | Gestion des permissions, intégration des sources. | Sécurité et contrôle renforcés. |

### **3\. Différenciation**

* **Recherche hybride** : Combinaison de **sémantique (Mistral)** \+ **mots-clés** pour une précision maximale.  
* **Personnalisation extrême** : Tableaux de bord et alertes **100% adaptés au rôle**.  
* **Intégration native** : Connecteurs prêts à l’emploi pour **CRM, Git, Jira, SharePoint**.  
* **Open source** : Coûts maîtrisés, communauté active.  
* **Extensible** : Architecture modulaire pour ajouter de nouvelles sources (ex: emails, Slack).

### **4\. Roadmap Post-V1**

* **V1.1** (Q3 2026\) : Ajout de la **reconnaissance vocale** (*triton-voice*) pour les discussions.  
* **V1.2** (Q4 2026\) : **Analyse prédictive** (ex: prédiction des bugs critiques).  
* **V2** (2027) : **Collaboration en temps réel** (commentaires, annotations partagées).

---

## **📝 Prochaines Étapes**

1. **Valider la note de cadrage** avec les parties prenantes (Direction, Product Owner).  
2. **Affiner les spécifications techniques** :  
   * Schéma de la base de données (Supabase).  
   * Architecture des connecteurs (APIs CRM/Git/Jira).  
   * Design des tableaux de bord par rôle.  
3. **Lancer le développement** en mode **Vibe Coding** (collaboration étroite avec Mistral AI).  
4. **Préparer les données** :  
   * Nettoyage des fichiers XML.  
   * Configuration des accès aux sources externes.

---

**Question pour toi** :

* Souhaites-tu que je génère un **canvas** pour la **maquette des tableaux de bord** (ex: vue Direction vs. vue Technique) ?  
* Ou préfères-tu commencer par un **schéma d’architecture technique** (backend/frontend/IA) ?

