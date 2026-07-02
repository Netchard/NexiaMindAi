# Maquette des Tableaux de Bord - NexiaMind AI (V1)

*Personnalisation par rôle utilisateur*

---

## 📊 Vue Direction
*Objectif : Vue stratégique des KPIs globaux*

### Composants
- **En-tête** : Logo NexiaMind + Barre de recherche unifiée (sémantique/mots-clés)
- **Menu latéral** : Accueil | Tableaux de bord | Alertes | Documentation | Paramètres
- **Cartes KPIs** (en temps réel) :
  - Nombre total de clients actifs
  - Chiffre d'affaires mensuel
  - Taux de satisfaction client (via CRM)
  - Nombre de bugs critiques non résolus (via Jira)
  - Contrats expirant dans les 30 jours (via CRM)
- **Graphiques** :
  - Évolution du CA (courbe sur 12 mois)
  - Répartition des clients par segment
  - Top 5 produits les plus vendus
- **Alertes critiques** :
  - Liste des contrats à renouveler (avec délai)
  - Bugs bloquants (priorité = "Critical")
- **Accès rapide** :
  - Lien vers la recherche unifiée
  - Lien vers les documentations stratégiques

---

## 🛠️ Vue Projets (Chefs de Projet/Service Client)
*Objectif : Suivi des projets, contrats*

### Composants
- **En-tête** : Barre de recherche (clients, contrats, produits)
- **Menu latéral** : Clients | Contrats | Opportunités | Alertes | Reporting
- **Cartes KPIs** :
  - Nombre de clients par région
  - Nombre de ticket par client (ouverts/fermés)
  - Temps moyen de résolution
  - Valeur de l'encours client
  - Nombre de contrats expirant dans les 7/30/90 jours
- **Sections principales** :
 - **Documentation cliente** :
    - Onglet "Documents" (liste des documents)
    - Onglet "Projets" (Suivi des projets) (RedMine)
    - Onglet "Guides" (markdown/PDF)
 - **Documentation technique** :
    - Onglet "Fichiers XML" (liste des entités patrimoine, filtrable)
    - Onglet "APIs" (documentation Swagger/Redoc)
    - Onglet "Guides" (markdown/PDF)
- **Alertes** :
  - Dates et jalons (Redmine)
  - Mises à jour des documentations
--- 

## 🛠️ Vue Technique (Développeurs/Consultants)
*Objectif : Suivi des projets et accès aux ressources techniques*

### Composants
- **En-tête** : Barre de recherche + Filtres avancés (par produit, version, statut)
- **Menu latéral** : Projets | Code (Git) | Documentation | Bugs | Alertes
- **Cartes KPIs** :
  - Nombre de bugs ouverts/résolus 
  - Temps moyen de résolution
  - Nombre de commits (via Git)
  - Couverture des tests
- **Sections principales** :
  - **Recherche dans le code** : Intégration avec Git (recherche sémantique dans les repos)
  - **Documentation technique** :
    - Onglet "Fichiers XML" (liste des entités patrimoine, filtrable)
    - Onglet "APIs" (documentation Swagger/Redoc)
    - Onglet "Guides" (markdown/PDF)
  - **Bugs en cours** :
    - Tableau des bugs (ID, titre, priorité, statut, assigné)
    - Filtres : "Mes bugs", "Bugs critiques", "Non assignés"
- **Alertes** :
  - Nouveaux bugs critiques
  - Mises à jour des documentations

---

## 💼 Vue Commerce (Commerciaux)
*Objectif : Suivi des clients, contrats et opportunités*

### Composants
- **En-tête** : Barre de recherche (clients, contrats, produits)
- **Menu latéral** : Clients | Contrats | Opportunités | Alertes | Reporting
- **Cartes KPIs** :
  - Nombre de clients par région
  - Nombre de ticket par client (ouverts/fermés)
  - Temps moyen de résolution
  - Valeur de l'encours client
  - Nombre de contrats expirant dans les 7/30/90 jours
- **Sections principales** :
  - **Liste des clients** :
    - Tableau avec colonnes : Nom, Contact, Statut, Dernière interaction (via CRM), Contrats associés
    - Actions : "Voir le profil", "Envoyer un email", "Créer une alerte"
  - **Contrats** :
    - Tableau des contrats (ID, client, date début/fin, valeur, statut)
    - Filtres : "À renouveler", "Expirés", "En négociation"
  - **Opportunités** :
    - Pipeline visuel (par étape : Prospect, Qualification, Proposition, Fermé)
- **Alertes** :
  - Contrats expirant dans <7 jours
  - Clients sans interaction depuis >30 jours

---

## 🔐 Vue Administrateur
*Objectif : Gestion des utilisateurs, permissions et intégrations*

### Composants
- **En-tête** : Barre de recherche (utilisateurs, rôles)
- **Menu latéral** : Utilisateurs | Rôles | Intégrations | Logs | Paramètres
- **Cartes KPIs** :
  - Nombre d'utilisateurs actifs
  - Nombre de connexions aux sources externes (CRM, Git, etc.)
  - Dernière synchronisation des données
- **Sections principales** :
  - **Gestion des utilisateurs** :
    - Tableau : Nom, Email, Rôle, Dernière connexion, Statut (actif/inactif)
    - Actions : "Modifier le rôle", "Réinitialiser le mot de passe", "Désactiver"
  - **Gestion des rôles** :
    - Liste des rôles (Direction, Chef de Projet, etc.) avec permissions associées
    - Bouton "Créer un rôle personnalisé"
  - **Intégrations** :
    - Liste des connecteurs (CRM, Git, Jira, etc.) avec statut (connecté/erreur)
	- Fiche de paramétrage par connexion
    - Bouton "Tester la connexion" pour chaque source
	- Bouton ajouter une connexion (avec wizard de configuration)
  - **Logs** :
    - Historique des actions (recherches, modifications, erreurs)
    - Filtres par date/utilisateur

---

## 🎨 Éléments Communs à Toutes les Vues

### Design System
- **Couleurs** :
  - Primaire : Bleu (#2563EB) pour les actions principales
  - Secondaire : Gris (#6B7280) pour les textes/icônes
  - Succès : Vert (#10B981) pour les KPIs positifs
  - Danger : Rouge (#EF4444) pour les alertes
  - Avertissement : Orange (#F59E0B) pour les warnings
- **Typographie** :
  - Titres : Inter (Bold, 24px)
  - Texte : Inter (Regular, 14px)
  - Code : Mono (pour les extraits de code/XML)
- **Composants réutilisables** :
  - Cartes (avec ombre légère, border-radius: 8px)
  - Boutons : Primaire (bleu), Secondaire (gris), Danger (rouge)
  - Tableaux : En-têtes fixes, pagination, triable
  - Modales : Pour les détails (ex: profil client, code source)

### Interactions
- **Recherche unifiée** :
  - Barre en haut de chaque vue
  - Suggestions en temps réel (basées sur l'historique et le rôle)
  - Filtres contextuels (ex: dans la vue Technique, filtre par "langage de programmation")
  - chatbot pour répondre aux questions via NLP **(Mistral)**
- **Notifications** :
  - Icône de cloche en haut à droite
  - Badge rouge pour les nouvelles alertes
  - Liste déroulante avec :
    - Message court (ex: "Contrat #123 expire demain")
    - Lien vers la ressource concernée
    - Option "Marquer comme lu"
- **Export** :
  - Bouton "Exporter" (CSV/PDF) pour les tableaux et graphiques

---

## 📌 Notes Techniques
- **Backend** : Supabase (auth + base de données) + pgvector (recherche vectorielle)
- **Frontend** : React (avec Tailwind CSS pour le style) / NextJs
- **Intégrations** :
  - CRM : API REST (ex: Salesforce, HubSpot)
  - Git : API GitHub/GitLab
  - Jira : API REST
  - SharePoint : Microsoft Graph API
  - Samba - Base documentaire 
- **IA** : Mistral AI (pour la recherche sémantique et la génération de résumés)
- **Reconnaissance vocale** : À intégrer dans une future version 

---

## 🔄 Itérations Possibles
- [ ] Ajouter une **vue "Analytique"** avec des insights prédictifs (ex: "Risque de churn client")
- [ ] Intégrer un **chatbot** pour répondre aux questions via NLP (Mistral)
- [ ] Permettre la **personnalisation des tableaux de bord** (glisser-déposer des widgets)
- [ ] Ajouter un **mode sombre**
- [ ] Optimiser pour **mobile** (via Ionic, comme demandé pour *triton-voice*)