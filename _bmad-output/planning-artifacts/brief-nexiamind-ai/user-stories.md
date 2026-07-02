---
title: User Stories - NexiaMind AI V1
status: validated
created: 2026-06-21
updated: 2026-06-21
author: Dday
project: NexiaMind AI
version: 1.0
type: user-stories
related_to: prd.md
---

# 📝 User Stories Détailées - NexiaMind AI V1
*Approche RAG (Retrieval-Augmented Generation) - Validées le 21/06/2026*

---

## 🎯 Contexte

Ces user stories détaillées complètent le [Product Brief](brief.md) et le [PRD](../prd-nexiamind-ai/prd.md) de NexiaMind AI V1.

**Approche :** 
- **RAG (Retrieval-Augmented Generation)** : L'IA ne retourne pas juste des documents, elle **génère des réponses contextuelles** basées sur les documents trouvés
- **Mistral AI au cœur** : Toutes les interactions passent par l'IA pour la compréhension et la génération
- **3 sources V1** : Supabase (docs internes), GitLab (code + docs tech), Nexia (GED métiers + OCR)

---

## 🔧 Persona : Consultant Technique (⭐⭐⭐⭐⭐)

### US-001 : Comprendre un concept métier client
**En tant que** Consultant Technique  
**Je veux** poser une question en langage naturel comme "Comment fonctionne le prorata de TVA pour le client X ?"  
**Afin de** obtenir une réponse claire et contextuelle générée par IA, sans avoir à lire 10 documents.

**Critères d'Acceptation :**
- [ ] L'IA comprend la question en langage naturel
- [ ] Génère une réponse structurée avec explication
- [ ] Cite les sources (documents Nexia/Supabase utilisés)
- [ ] Met en évidence les points clés
- [ ] Propose des documents liés

**Exemple :**
- **Requête** : "Comment fonctionne le prorata de TVA pour le client X ?"
- **Réponse IA** : "Pour le client X, le prorata de TVA est calculé selon la règle Y. Voici les étapes : 1..., 2..., 3.... Source : [Document Client X - Procédures Fiscales.pdf]"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

### US-002 : Expliquer une procédure client
**En tant que** Consultant Technique  
**Je veux** que l'IA explique une procédure complexe (ex: "procédure de facturation client Y") en termes simples, avec des exemples concrets  
**Afin de** l'appliquer correctement sans erreur.

**Critères d'Acceptation :**
- [ ] Réponse générée en langage naturel et simple
- [ ] Exemples spécifiques au client
- [ ] Sources vérifiables (liens vers les docs)
- [ ] Mise en forme claire (listes, étapes)

**Exemple :**
- **Requête** : "Explique-moi la procédure de facturation pour le client Y"
- **Réponse IA** : "La procédure de facturation pour le client Y comprend 5 étapes : 1. Vérification du bon de commande... 2. Calcul du montant HT... Source : [Procédure Facturation Y.pdf]"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

### US-003 : Comparer des processus entre clients
**En tant que** Consultant Technique  
**Je veux** que l'IA compare les processus entre deux clients (ex: "Quelle est la différence de gestion TVA entre client A et client B ?") et me donne un tableau comparatif  
**Afin de** ne pas mélanger les règles.

**Critères d'Acceptation :**
- [ ] Extrait les informations des 2 clients
- [ ] Génère un tableau comparatif
- [ ] Surligne les différences
- [ ] Cite les documents sources

**Exemple :**
- **Requête** : "Quelle est la différence de gestion TVA entre client A et client B ?"
- **Réponse IA** : "
  | Critère | Client A | Client B |
  |---------|---------|---------|
  | Méthode | Prorata | Forfaitaire |
  | Seuil | 1000€ | 5000€ |
  Source : [Doc A], [Doc B]"

**Priorité :** ⭐⭐⭐⭐  
**Effort :** Élevé  
**Valeur :** Élevée

---

### US-004 : Conversation contextuelle
**En tant que** Consultant Technique  
**Je veux** poser des questions de suivi à l'IA sur une réponse précédente (ex: "Tu as mentionné le paramètre P1, peux-tu me l'expliquer ?")  
**Afin de** approfondir sans recommencer la recherche.

**Critères d'Acceptation :**
- [ ] Maintien du contexte de la conversation
- [ ] Référence aux documents déjà consultés
- [ ] Réponse cohérente avec le contexte précédent

**Exemple :**
- **Conversation** :
  - User: "Comment fonctionne le prorata de TVA pour client X ?"
  - IA: "... mentionne le paramètre P1..."
  - User: "Qu'est-ce que le paramètre P1 ?"
  - IA: "Le paramètre P1, mentionné précédemment, est... (contexte conservé)"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

### US-005 : Détection d'ambiguïtés
**En tant que** Consultant Technique  
**Je veux** que l'IA détecte les ambiguïtés dans ma question et me demande des clarifications (ex: "Tu veux dire le client X en France ou en Belgique ?")  
**Afin de** éviter les mauvaises réponses.

**Critères d'Acceptation :**
- [ ] Détection des termes ambigus
- [ ] Demande de clarification proactive
- [ ] Suggestion de reformulation

**Exemple :**
- **Requête** : "Montre-moi les règles TVA pour client X"
- **Réponse IA** : "Il existe plusieurs clients X. Parles-tu de : 1) Client X France, 2) Client X Belgique, ou 3) Client X Luxembourg ?"

**Priorité :** ⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

## 💻 Persona : Développeur (⭐⭐⭐⭐⭐)

### US-010 : Comprendre une fonction technique
**En tant que** Développeur  
**Je veux** demander à l'IA "Comment implémenter la fonction calculTVA ?" et obtenir du code commenté + explications  
**Afin de** gagner du temps sur le développement.

**Critères d'Acceptation :**
- [ ] Extrait le code pertinent de GitLab
- [ ] Génère des extraits de code commentés
- [ ] Explique l'implémentation
- [ ] Cite le fichier et la ligne

**Exemple :**
- **Requête** : "Comment implémenter la fonction calculTVA ?"
- **Réponse IA** : "Voici la fonction calculTVA dans le fichier `taxes.js` (ligne 42-65) : ```javascript...``` Explication : Cette fonction... Source : [GitLab: taxes.js#L42]"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

### US-011 : Recherche multi-repositories
**En tant que** Développeur  
**Je veux** rechercher dans plusieurs repositories GitLab en une seule requête  
**Afin de** éviter de faire des recherches manuelles dans chaque repo.

**Critères d'Acceptation :**
- [ ] Recherche unifiée sur tous les repos autorisés
- [ ] Filtrage par repository possible
- [ ] Résultats triés par pertinence

**Exemple :**
- **Requête** : "Où est utilisé le module taxCalculator ?"
- **Réponse IA** : "Le module taxCalculator est utilisé dans : 1) Repo A - fichier X.js (ligne 10), 2) Repo B - fichier Y.js (ligne 25)..."

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Élevé  
**Valeur :** Élevée

---

### US-012 : Contexte de code
**En tant que** Développeur  
**Je veux** voir le contexte autour d'un extrait de code (5 lignes avant/après)  
**Afin de** comprendre comment utiliser ce code.

**Critères d'Acceptation :**
- [ ] Affiche le snippet avec contexte (5 lignes avant/après)
- [ ] Lien vers le fichier complet
- [ ] Numéro de ligne indiqué

**Exemple :**
- **Requête** : "Montre-moi la fonction calculTVA dans taxes.js"
- **Réponse IA** : "... (lignes 37-41) **function calculTVA() {** (ligne 42) **...code...** (ligne 65) **}** (lignes 66-70) ... Source : [GitLab: taxes.js#L37-70]"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Faible  
**Valeur :** Élevée

---

### US-013 : Filtrage par langage
**En tant que** Développeur  
**Je veux** filtrer les résultats par langage de programmation  
**Afin de** ne voir que le code pertinent pour ma stack.

**Critères d'Acceptation :**
- [ ] Filtre par langage (JavaScript, Python, etc.)
- [ ] Détection automatique du langage
- [ ] Statistiques par langage

**Exemple :**
- **Requête** : "Montre-moi les fonctions de calcul de TVA en JavaScript"
- **Réponse IA** : "Résultats filtrés par JavaScript : 1) Fonction A dans fichier X.js... 2) Fonction B dans fichier Y.js..."

**Priorité :** ⭐⭐⭐  
**Effort :** Faible  
**Valeur :** Moyenne

---

### US-014 : Lien direct vers GitLab
**En tant que** Développeur  
**Je veux** accéder directement au fichier dans GitLab depuis NexiaMind AI  
**Afin de** pouvoir modifier le code immédiatement.

**Critères d'Acceptation :**
- [ ] Lien profond vers GitLab
- [ ] Ouverture dans le bon commit/branch
- [ ] Pas de rupture de workflow

**Exemple :**
- **Requête** : "Ouvre la fonction calculTVA dans GitLab"
- **Réponse IA** : [Lien cliquable vers GitLab: repo/taxes.js#L42]

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Faible  
**Valeur :** Élevée

---

## 📊 Persona : Chef de Projet (⭐⭐⭐)

### US-020 : Analyse des risques projet
**En tant que** Chef de Projet  
**Je veux** demander à l'IA "Quels sont les risques liés au projet client A ?" et obtenir une analyse synthétique des documents projets  
**Afin de** anticiper les problèmes.

**Critères d'Acceptation :**
- [ ] Analyse des documents du projet A
- [ ] Identifie les risques potentiels
- [ ] Hiérarchise par criticité
- [ ] Propose des actions préventives

**Exemple :**
- **Requête** : "Quels sont les risques liés au projet client A ?"
- **Réponse IA** : "Analyse des documents du projet A : 1) **Risque Élevé** : Délai serré pour la livraison (date : 15/07) → Action : Négocier avec le client. 2) **Risque Moyen** : Ressource manquante → Action : Recruter un consultant. Source : [Cahier des charges A.pdf, Planning A.xlsx]"

**Priorité :** ⭐⭐⭐⭐⭐  
**Effort :** Élevé  
**Valeur :** Élevée

---

### US-021 : Résumé de document
**En tant que** Chef de Projet  
**Je veux** que l'IA résume un long document (ex: cahier des charges de 50 pages) en 5 points clés  
**Afin de** prendre une décision rapidement.

**Critères d'Acceptation :**
- [ ] Résumé structuré (5 points maximum)
- [ ] Surligne les exigences critiques
- [ ] Lien vers le document complet

**Exemple :**
- **Requête** : "Résume le cahier des charges du projet A en 5 points"
- **Réponse IA** : "Résumé du cahier des charges A : 1) **Objectif** : Développer un module de facturation... 2) **Échéance** : 15/07/2026... 3) **Budget** : 50K€... 4) **Risques** : Délai serré... 5) **Livrables** : Module + documentation. [Lire le document complet]"

**Priorité :** ⭐⭐⭐⭐  
**Effort :** Moyen  
**Valeur :** Élevée

---

### US-022 : Comparaison de projets
**En tant que** Chef de Projet  
**Je veux** que l'IA compare les exigences entre deux projets (ex: "Quelles sont les différences entre les projets A et B ?") et me donne un tableau comparatif  
**Afin de** identifier les similitudes et différences.

**Critères d'Acceptation :**
- [ ] Extrait les exigences des 2 projets
- [ ] Génère un tableau comparatif
- [ ] Met en évidence les écarts

**Exemple :**
- **Requête** : "Compare les projets A et B"
- **Réponse IA** : "
  | Critère | Projet A | Projet B |
  |---------|---------|---------|
  | Budget | 50K€ | 75K€ |
  | Échéance | 15/07 | 30/08 |
  | Équipe | 3 devs | 5 devs |
  Source : [Cahier des charges A.pdf, Cahier des charges B.pdf]"

**Priorité :** ⭐⭐⭐⭐  
**Effort :** Élevé  
**Valeur :** Élevée

---

### US-023 : Export des réponses
**En tant que** Chef de Projet  
**Je veux** exporter les réponses de l'IA (ex: analyse de risques) en format structuré (Markdown, CSV)  
**Afin de** les partager avec l'équipe.

**Critères d'Acceptation :**
- [ ] Export en Markdown (pour Confluence/GitLab)
- [ ] Export en CSV/JSON
- [ ] Liens vers les sources conservés
- [ ] Format propre et lisible

**Exemple :**
- **Requête** : "Exporte l'analyse des risques du projet A en Markdown"
- **Réponse IA** : Génère un fichier Markdown avec l'analyse complète, téléchargeable

**Priorité :** ⭐⭐⭐  
**Effort :** Faible  
**Valeur :** Moyenne

---

## 📊 Récapitulatif

### Statistiques
- **Total User Stories** : 14
- **Consultant Technique** : 5 (4x ⭐⭐⭐⭐⭐, 1x ⭐⭐⭐⭐)
- **Développeur** : 5 (4x ⭐⭐⭐⭐⭐, 1x ⭐⭐⭐⭐)
- **Chef de Projet** : 4 (2x ⭐⭐⭐⭐⭐, 2x ⭐⭐⭐⭐)

### Priorisation
- **⭐⭐⭐⭐⭐** : 10 user stories (71%)
- **⭐⭐⭐⭐** : 4 user stories (29%)

### Effort Estimé
- **Faible** : 4 US
- **Moyen** : 7 US
- **Élevé** : 3 US

---

## 🔗 Liens
- [Product Brief](brief.md)
- [PRD](../prd-nexiamind-ai/prd.md)
- [Decision Log](.decision-log.md)

---

*Statut : Validé - 21/06/2026*  
*Dernière mise à jour : 21 juin 2026*
