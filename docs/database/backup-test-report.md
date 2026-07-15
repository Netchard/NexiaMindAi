# Rapport de Test - Sauvegarde et Restauration
*Story 5.405: Sauvegarder la Structure de la Base*

---

## 📋 Informations Générales

| Champ | Valeur |
|-------|--------|
| **Date du Test** | 2026-07-15 |
| **Environnement** | Production Supabase (pas de projet de test séparé disponible) |
| **Exécuté par** | Dday |
| **Version des Scripts** | 2.0 (réécrits lors de la revue de code — exécution via fonctions RPC Supabase) |

---

## 🧪 Tests de Sauvegarde

### Test 1: Exécution du Script de Sauvegarde

**Objectif:** Vérifier que le script `backup-db.js` s'exécute sans erreur

**Commande:**
```bash
node scripts/database/backup-db.js
```

**Résultat:**
- [x] ✅ Script exécuté sans erreur
- [x] ✅ Fichier SQL généré
- [ ] ❌ Erreur rencontrée

**Fichier Généré:**
```
Chemin: scripts/database/backups/backup-nexiamind-2026-07-15-21-59-47.sql
        scripts/database/backups/backup-nexiamind-2026-07-15-21-59-47.json (sœur, utilisé par restore-db.js)
Taille: 10.30 MB
```

**Logs:**
```
Backup file: C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-2026-07-15-21-59-47.sql

Processing table: profiles
  ✓ Structure captured (9 columns, 0 FKs, 4 policies, 1 triggers)
  ✓ 10 rows exported

Processing table: documents
  ✓ Structure captured (14 columns, 0 FKs, 12 policies, 0 triggers)
  ✓ 26 rows exported

Processing table: chunks
  ✓ Structure captured (8 columns, 1 FKs, 4 policies, 0 triggers)
  ✓ 814 rows exported

Processing table: embeddings
  ✓ Structure captured (4 columns, 1 FKs, 3 policies, 0 triggers)
  ✓ 760 rows exported

Processing table: conversations
  ✓ Structure captured (9 columns, 0 FKs, 7 policies, 0 triggers)
  ✓ 13 rows exported

Processing table: messages
  ✓ Structure captured (9 columns, 1 FKs, 6 policies, 0 triggers)
  ✓ 18 rows exported

Processing table: sync_logs
  ✓ Structure captured (11 columns, 0 FKs, 6 policies, 0 triggers)
  ✓ 4 rows exported

Capturing indexes...
  ✓ 32 indexes captured

✅ Backup completed successfully!
   Size: 10.30 MB
   Tables: 7
```

---

### Test 2: Validation du Fichier de Sauvegarde

**Objectif:** Vérifier que le fichier SQL contient toutes les données nécessaires

**Vérifications:**
- [x] ✅ Fichier existe et est lisible
- [x] ✅ Contient l'en-tête avec métadonnées
- [x] ✅ Contient CREATE TABLE pour toutes les tables
- [x] ✅ Contient INSERT statements pour les données
- [x] ✅ Contient les définitions des index
- [x] ✅ Contient l'index vectoriel (`idx_embeddings_vector`, inclus dans les 32 index capturés)

**Tables Vérifiées:**
| Table | Présente | Lignes |
|-------|----------|-----------------|
| profiles | [x] | 10 |
| documents | [x] | 26 |
| chunks | [x] | 814 |
| embeddings | [x] | 760 |
| conversations | [x] | 13 |
| messages | [x] | 18 |
| sync_logs | [x] | 4 |

**Total : 1 645 lignes, 7 tables, 32 index (dont l'index vectoriel), politiques RLS et triggers capturés pour chaque table.**

**Index Vérifiés:** les 8 index classiques ST-404 + `idx_embeddings_vector` (ST-402) sont inclus dans les 32 index capturés (le nombre plus élevé reflète des index `idx_*` additionnels créés sur `profiles`/`documents`/`sync_logs` au fil du projet, non documentés dans cette story mais correctement capturés).

---

## 🔄 Tests de Restauration

### Test 3: Validation du Fichier avant Restauration

**Statut : NON EXÉCUTÉ.**

### Test 4: Restauration sur Environnement de Test

**Statut : NON EXÉCUTÉ — décision explicite.**

**Raison :** `restore-db.js` exécuté sur la même base que celle qui vient d'être sauvegardée échouerait immédiatement (contraintes déjà existantes, clés primaires en conflit sur les `INSERT`) — c'est le comportement *sûr* attendu (mieux vaut échouer que dupliquer/corrompre silencieusement), mais ça ne permet pas d'obtenir un test de restauration réellement concluant sans l'une des deux options suivantes :
1. Un projet Supabase de test séparé (non disponible actuellement dans cet environnement)
2. `--drop` sur la base actuelle (rejeté : risque jugé disproportionné pour un test, cette base étant la seule disponible)

**Décision (2026-07-15) :** ne pas risquer les données de production pour ce test. Le test de restauration réelle est différé jusqu'à ce qu'un environnement de test séparé soit disponible — voir `deferred-work.md`.

**Ce qui a été vérifié à la place (revue de code, avant ce rapport) :**
- Le code du script a été relu ligne à ligne : `exec_sql_batch` exécute réellement chaque instruction (contrairement à la version originale, qui ne faisait que logger sans exécuter)
- Vérifications unitaires manuelles hors-DB : parsing des arguments CLI (`--file` espacé/`=`, `--drop=false`), protection contre la lecture de fichier arbitraire/traversée de chemin — voir la revue de code pour le détail des cas testés
- La logique de `verifyRestore()` (comparaison comptes réels vs. attendus) a été relue mais pas exécutée contre une vraie restauration

---

## 📊 Résumé des Tests

| Test | Description | Statut | Notes |
|------|-------------|--------|-------|
| 1 | Exécution sauvegarde | ✅ | Réussi contre la base de production réelle |
| 2 | Validation fichier | ✅ | 7/7 tables, 1645 lignes, 32 index, RLS/triggers capturés |
| 3 | Validation restauration | ⏸️ Non exécuté | Dépend du Test 4 |
| 4 | Restauration test | ⏸️ Non exécuté | Pas d'environnement de test séparé disponible — voir décision ci-dessus |

**Taux de Réussite:** 2/4 exécutés et réussis (2/4 différés délibérément, pas des échecs)

---

## 🐛 Problèmes Identifiés

| Problème | Sévérité | Solution Proposée | Statut |
|----------|----------|-------------------|--------|
| Restauration jamais testée en conditions réelles (voir Test 4) | Moyenne | Créer un projet Supabase de test séparé, y exécuter `setup-exec-sql-functions.sql` puis `restore-db.js` | [ ] Ouvert |

---

## ✅ Critères d'Acceptation

Vérification des critères d'acceptation de la Story 5.405:

### 1. Script de dump de la base
- [x] Script `scripts/database/backup-db.js` créé et fonctionnel — **vérifié en conditions réelles**
- [x] Utilise l'API Supabase (REST + fonctions RPC) pour la sauvegarde
- [x] Sauvegarde complète de la structure (DDL) et des données (DML)
- [x] Fichier de sauvegarde généré au format SQL standard
- [x] Nom du fichier inclut le timestamp

### 2. Script de restauration
- [x] Script `scripts/database/restore-db.js` créé (exécution SQL réelle via RPC, revue de code ligne à ligne)
- [x] Prend en paramètre le fichier de sauvegarde à restaurer
- [x] Vérifie la validité du fichier avant restauration
- [x] Affiche un avertissement avant de remplacer les données existantes
- [x] Gestion correcte des erreurs pendant la restauration (transaction unique, rollback implicite)
- [ ] **Non vérifié en conditions réelles** (voir Test 4)

### 3. Procédure documentée
- [x] Documentation complète dans `docs/database/backup-restore-procedure.md`
- [x] Instructions étape par étape pour les deux opérations
- [x] Exemples de commandes et paramètres
- [x] Liste des prérequis et dépendances (dont le prérequis RPC one-shot)
- [x] Section de dépannage (troubleshooting)

### 4. Test de restauration
- [x] Test réussi de sauvegarde complète
- [ ] Test réussi de restauration complète — **différé, voir Test 4**
- [ ] Vérification que toutes les tables sont restaurées correctement — **différé**
- [ ] Vérification que les index (y compris vectoriels) sont restaurés — **différé**
- [ ] Vérification que les triggers et contraintes sont restaurés — **différé**
- [x] Rapport de test documenté (ce document)

---

## 📝 Notes et Observations

### Points Positifs
- La sauvegarde capture bien plus que ce que la story documentait initialement (politiques RLS, triggers, 32 index vs. les 9 attendus) grâce à la réécriture de la revue de code
- Aucune erreur d'échappement/troncature observée sur les 1645 lignes réelles (données de production, incluant du texte avec ponctuation variée)

### Améliorations Possibles
- Provisionner un projet Supabase de test dédié pour permettre un vrai test de restauration sans risque
- Automatiser la purge des anciens fichiers `.sql`/`.json` dans `backups/` (aucune rotation actuellement)

### Recommandations
- Ne pas marquer la story `done` tant que le Test 4 n'a pas été exécuté avec succès sur un environnement séparé

---

## 🎯 Prochaines Étapes

- [ ] Provisionner un projet Supabase de test séparé
- [ ] Exécuter `setup-exec-sql-functions.sql` sur ce projet de test
- [ ] Exécuter le Test 4 (restauration réelle) sur ce projet de test
- [ ] Une fois validé, repasser le statut de la story à `done`

---

**Approuvé par:** _______________  **Date:** ___________

*Rapport généré pour la Story 5.405*
