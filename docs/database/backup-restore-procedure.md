# Procédure de Sauvegarde et Restauration - NexiaMind AI

*Documentation complète pour la sauvegarde et restauration de la base de données Supabase*

---

## 📋 Table des Matières

1. [Introduction](#-introduction)
2. [Prérequis](#-prérequis)
3. [Sauvegarde de la Base de Données](#-sauvegarde-de-la-base-de-données)
4. [Restauration de la Base de Données](#-restauration-de-la-base-de-données)
5. [Automatisation](#-automatisation)
6. [Dépannage](#-dépannage)
7. [Sécurité](#-sécurité)
8. [Annexes](#-annexes)

---

## 🎯 Introduction

Ce document décrit les procédures complètes pour sauvegarder et restaurer la base de données **NexiaMind AI** hébergée sur **Supabase**. Ces procédures sont essentielles pour:

- **Récupération après incident** : Restaurer les données en cas de suppression accidentelle ou de corruption
- **Migration** : Déplacer la base de données vers un autre environnement
- **Tests** : Créer des environnements de test avec des données de production
- **Archivage** : Conserver des sauvegardes historiques

### Périmètre

Les scripts de sauvegarde/restauration couvrent:

| Composant | Inclus | Description |
|-----------|--------|-------------|
| **Tables** | ✅ | `profiles`, `documents`, `chunks`, `embeddings`, `conversations`, `messages`, `sync_logs` |
| **Données** | ✅ | Toutes les données (INSERT statements), paginées pour les grandes tables |
| **Structure** | ✅ | Schéma des tables (CREATE TABLE), colonnes et types réels (introspection SQL directe) |
| **Index** | ✅ | Index classiques et vectoriels (convention `idx_*`) |
| **Contraintes** | ✅ | Clés primaires, étrangères, CHECK — dérivées réellement du schéma, pas de valeurs supposées |
| **Politiques RLS** | ✅ | Politiques Row Level Security (`CREATE POLICY`) |
| **Triggers** | ✅ | Triggers non internes (`CREATE TRIGGER`) |
| **Séquences, fonctions, extensions** | ❌ | Non capturés — ceci n'est pas un équivalent complet de `pg_dump` |
| **Auth** | ❌ | Tables `auth.users` (gérées par Supabase) |

### Tables Sauvegardées

Les tables sont sauvegardées dans l'ordre de dépendance suivant:

1. **profiles** - Profils utilisateurs
2. **documents** - Documents indexés
3. **chunks** - Chunks de documents (dépend de documents)
4. **embeddings** - Vecteurs d'embeddings (dépend de chunks)
5. **conversations** - Conversations utilisateurs
6. **messages** - Messages des conversations (dépend de conversations)
7. **sync_logs** - Logs de synchronisation

---

## 📦 Prérequis

### Environnement

- **Node.js** : Version 20 ou supérieure
- **npm** : Version 9 ou supérieure
- **Système d'exploitation** : Windows, macOS ou Linux

### Dependances NPM

Les scripts utilisent l'API REST Supabase (`@supabase/supabase-js`) — **pas** de connexion PostgreSQL directe (utile quand la base n'est accessible qu'en REST, par exemple derrière un réseau qui ne permet pas la connexion directe sur le port 5432/6543).

```json
{
  "@supabase/supabase-js": "^2.110.6",
  "dotenv": "^16.6.1"
}
```

Ces deux paquets sont déjà des dépendances du projet racine (`package.json`) — aucune installation supplémentaire n'est nécessaire.

### Étape préalable obligatoire : fonctions RPC

`information_schema`/`pg_catalog` (colonnes, contraintes, index, politiques RLS, triggers) et l'exécution de SQL arbitraire (DDL/DML) ne sont **pas** exposés par l'API REST/PostgREST standard. Pour contourner cette limite sans connexion directe, exécutez **une seule fois** le script suivant dans l'éditeur SQL du Dashboard Supabase (**SQL Editor**, pas besoin de `psql`) :

```
scripts/database/setup-exec-sql-functions.sql
```

Il crée deux fonctions RPC (`exec_sql_query`, `exec_sql_batch`) que les scripts appellent ensuite via `supabase.rpc(...)`.

> ⚠️ **SÉCURITÉ** : ces fonctions exécutent du SQL dynamique arbitraire sous privilèges `SECURITY DEFINER` — l'équivalent d'une porte dérobée SQL pour quiconque peut les appeler. Le script les verrouille au rôle `service_role` uniquement (`REVOKE ALL ... FROM public, anon, authenticated`) — **ne jamais** les rendre accessibles à `anon`/`authenticated` (rôles utilisés par le frontend). Si vous ne faites pas de sauvegardes régulièrement, envisagez de les supprimer après usage (`DROP FUNCTION public.exec_sql_query, public.exec_sql_batch;`) pour réduire la surface d'attaque.

### Variables d'Environnement

`SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` (déjà utilisées par le reste de l'application) suffisent — voir `.env.example`. Aucune variable supplémentaire n'est nécessaire.

> ⚠️ **IMPORTANT**: La **SERVICE_ROLE_KEY** est requise (elle seule a le droit d'appeler les fonctions RPC ci-dessus). Ne jamais utiliser l'ANON_KEY.

### Permissions

La clé `service_role` a par nature accès à toutes les tables et peut appeler n'importe quelle fonction RPC autorisée pour ce rôle — c'est pourquoi le verrouillage `REVOKE`/`GRANT` du script de setup est essentiel (voir ci-dessus).

---

## 💾 Sauvegarde de la Base de Données

### Procédure Manuelle

#### Étape 1: Préparer l'environnement

```bash
# Naviguer vers le projet
cd C:\VibeCoding\nexiamind-ai

# Installer les dépendances si nécessaire
npm install
```

#### Étape 2: Exécuter la sauvegarde

```bash
node scripts/database/backup-db.js
```

#### Étape 3: Vérifier la sauvegarde

```bash
# Lister les fichiers de sauvegarde
dir scripts\database\backups\ /OD

# Vérifier la taille du fichier
# Le fichier doit avoir une taille > 0 octets
```

### Sortie Attendue

```
Starting database backup...

Backup file: C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-2026-07-15-14-30-00.sql

Processing table: profiles
  ✓ Structure captured (9 columns, 1 FKs, 2 policies, 0 triggers)
  ✓ 5 rows exported

Processing table: documents
  ✓ Structure captured (8 columns, 0 FKs, 3 policies, 0 triggers)
  ✓ 20 rows exported

...

Capturing indexes...
  ✓ 9 indexes captured

✅ Backup completed successfully!
   File: C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-2026-07-15-14-30-00.sql
   Size: 2.45 MB
   Tables: 7

Next steps:
  1. Verify the backup file: C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-2026-07-15-14-30-00.sql
  2. To restore: node scripts/database/restore-db.js --file=backup-nexiamind-2026-07-15-14-30-00.sql
```

> Les chiffres exacts (colonnes, FKs, policies, triggers, lignes) dépendent de l'état réel de votre base au moment de l'exécution — ceci est un exemple illustratif, pas une garantie de sortie.

### Emplacement des Sauvegardes

Les fichiers de sauvegarde sont stockés dans:

```
C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-YYYY-MM-DD-HH-MM-SS.sql
```

### Nom des Fichiers

Format: `backup-nexiamind-YYYY-MM-DD-HH-MM-SS.sql`

- `YYYY`: Année
- `MM`: Mois
- `DD`: Jour
- `HH`: Heure (24h)
- `MM`: Minutes
- `SS`: Secondes

### Contenu du Fichier SQL

Le fichier de sauvegarde contient:

1. **En-tête** : Métadonnées (date, schéma)
2. **Structure des tables** : Instructions CREATE TABLE pour chaque table
3. **Données** : Instructions INSERT pour toutes les lignes
4. **Index** : Définitions des index (y compris vectoriels)
5. **Contraintes** : Clés primaires, étrangères, CHECK

Exemple:

```sql
-- NexiaMind AI Database Backup
-- Generated: 2026-07-15T14:30:00.000Z
-- Schema: public

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  ...
);

-- Data for profiles
INSERT INTO public.profiles ("id","user_id","email",...) VALUES (...);
INSERT INTO public.profiles ("id","user_id","email",...) VALUES (...);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON public.embeddings USING ivfflat (vector vector_l2_ops) WITH (lists = 100);
```

---

## 🔄 Restauration de la Base de Données

### ⚠️ Avertissements Importants

1. **Données existantes** : La restauration écrase les données existantes
2. **Environment** : Toujours tester sur un environnement non-production d'abord
3. **Temps d'arrêt** : Prévoyez un temps d'arrêt pour les restaurations en production
4. **Sauvegarde** : Faites une sauvegarde avant de restaurer (si possible)

### Procédure Manuelle

#### Étape 1: Préparer l'environnement

```bash
# Naviguer vers le projet
cd C:\VibeCoding\nexiamind-ai

# pg est déjà une dépendance du projet — aucune installation supplémentaire
npm install
```

#### Étape 2: Vérifier le fichier de sauvegarde

```bash
# Lister les sauvegardes disponibles
dir scripts\database\backups\ /OD

# Choisir un fichier de sauvegarde
# Exemple: backup-nexiamind-2026-07-15-14-30-00.sql
```

#### Étape 3: Exécuter la restauration

```bash
node scripts/database/restore-db.js --file=backup-nexiamind-2026-07-15-14-30-00.sql
```

#### Étape 4: Confirmer la restauration

Le script demandera confirmation:

```
⚠️  WARNING: This will RESTORE the database from backup!
    Existing data may be overwritten.

Are you sure you want to continue? (yes/no):
> yes
```

#### Étape 5: Vérifier la restauration

```bash
# Le script vérifie automatiquement les tables restaurées
# Vous pouvez aussi vérifier manuellement via l'interface Supabase
```

### Options de Restauration

| Option | Description | Exemple |
|--------|-------------|---------|
| `--file, -f` | Chemin vers le fichier SQL (relatif à `scripts/database/backups/`, ou absolu et terminant en `.sql`) | `--file=backup.sql` ou `--file backup.sql` |
| `--drop, -d` | Supprimer les tables existantes avant restauration (réellement exécuté via `DROP TABLE ... CASCADE`) | `--drop` |
| `--yes, -y` | Ignorer la confirmation | `--yes` |

Les deux formes `--file=backup.sql` (recommandée) et `--file backup.sql` (espacée) sont acceptées. `--drop=false` désactive explicitement l'option (contrairement à une simple chaîne "false" qui serait truthy en JavaScript).

Exemples:

```bash
# Restauration avec confirmation
node scripts/database/restore-db.js --file=backup.sql

# Restauration automatique (sans confirmation)
node scripts/database/restore-db.js --file=backup.sql --yes

# Restauration avec suppression des tables existantes
node scripts/database/restore-db.js --file=backup.sql --drop --yes
```

### Sortie Attendue

```
============================================================
NexiaMind AI Database Restore Script
============================================================
Starting database restore...

Backup file: C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-nexiamind-2026-07-15-14-30-00.sql

Verifying backup file...
  ✓ CREATE TABLE statements: Yes
  ✓ INSERT statements: Yes
  ✓ Index definitions: Yes
  ✓ Public schema: Yes
  ✓ Tables found: 7/7
    - profiles
    - documents
    - chunks
    - embeddings
    - conversations
    - messages
    - sync_logs

Backup file is valid.
  Size: 2.45 MB
  Tables: 7

⚠️  WARNING: This will RESTORE the database from backup!
    Existing data may be overwritten.

Are you sure you want to continue? (yes/no):
> yes

Starting restore (single transaction)...

✅ Restore completed successfully!

Next steps:
  1. Verify the restored data in your database
  2. Test application functionality
  3. Check indexes are properly restored

Verifying restore...
  ✓ profiles: 5 rows (attendu: 5)
  ✓ documents: 20 rows (attendu: 20)
  ✓ chunks: 100 rows (attendu: 100)
  ✓ embeddings: 100 rows (attendu: 100)
  ✓ conversations: 10 rows (attendu: 10)
  ✓ messages: 50 rows (attendu: 50)
  ✓ sync_logs: 5 rows (attendu: 5)

✅ Verification complete: all row counts match!
```

> Le nombre attendu par table est calculé en comptant les instructions `INSERT INTO` correspondantes dans le fichier de sauvegarde lui-même — la vérification post-restauration compare un compte réel à cette attente, plutôt que d'afficher un compte sans le comparer à rien.

L'ensemble du fichier est exécuté dans **une seule transaction** : en cas d'erreur, tout est annulé (`ROLLBACK`) plutôt que de laisser la base dans un état partiellement restauré.

---

## 🤖 Automatisation

### Script de Sauvegarde Automatique

Créez un script pour des sauvegardes automatiques:

#### Windows (PowerShell)

`scripts/database/backup-auto.ps1`:

```powershell
# Backup automatique quotidien
$logFile = "C:\VibeCoding\nexiamind-ai\scripts\database\backups\backup-log.txt"

cd C:\VibeCoding\nexiamind-ai

# Exécuter la sauvegarde
node scripts/database/backup-db.js >> $logFile 2>&1

# Conserver seulement les 7 dernières sauvegardes
Get-ChildItem scripts\database\backups\ -Filter "backup-nexiamind-*.sql" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -Skip 7 | 
  Remove-Item -Force
```

#### Linux/macOS (Bash)

`scripts/database/backup-auto.sh`:

```bash
#!/bin/bash

LOG_FILE="$(dirname "$0")/backups/backup-log.txt"
CD $(dirname "$0")/../..

# Exécuter la sauvegarde
node scripts/database/backup-db.js >> "$LOG_FILE" 2>&1

# Conserver seulement les 7 dernières sauvegardes
ls -t scripts/database/backups/backup-nexiamind-*.sql | tail -n +8 | xargs rm -f
```

### Planification (Windows)

Utilisez le Planificateur de tâches Windows:

1. Ouvrez le Planificateur de tâches
2. Créez une nouvelle tâche:
   - **Déclencheur** : Quotidien à 2h00
   - **Action** : Démarrer un programme
   - **Programme** : `C:\Program Files\nodejs\node.exe`
   - **Arguments** : `C:\VibeCoding\nexiamind-ai\scripts\database\backup-auto.ps1`
   - **Dossier de travail** : `C:\VibeCoding\nexiamind-ai`

### Planification (Linux)

Utilisez cron:

```bash
# Éditer le crontab
crontab -e

# Ajouter la ligne suivante pour une sauvegarde quotidienne à 2h
0 2 * * * /usr/bin/node /path/to/nexiamind-ai/scripts/database/backup-auto.sh
```

---

## 🛠️ Dépannage

### Problèmes Courants

#### 1. Erreur: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"

**Solution:**

```bash
# Ajouter dans .env à la racine du projet
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_cle_service
```

#### 2. Erreur: "Backup file not found"

**Solution:**

```bash
# Vérifier le chemin du fichier
dir scripts\database\backups\ /OD

# Utiliser le bon nom de fichier
node scripts/database/restore-db.js --file=backup-nexiamind-2026-07-15-14-30-00.sql
```

#### 3. Erreur: "exec_sql_query a échoué" / "exec_sql_batch a échoué"

**Solution:**

```bash
# Avez-vous exécuté scripts/database/setup-exec-sql-functions.sql
# UNE FOIS dans l'éditeur SQL du Dashboard Supabase ? C'est un prérequis
# obligatoire (voir section Prérequis) — sans ces fonctions RPC, l'introspection
# de schéma et l'exécution SQL échouent systématiquement.

# Tester que les fonctions existent et sont accessibles :
node -e "require('dotenv').config(); const { createClient } = require('@supabase/supabase-js'); const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); s.rpc('exec_sql_query', { query: 'select 1 as ok' }).then(r => console.log(r)).catch(e => console.error(e));"
```

#### 4. Fichier de sauvegarde vide ou incomplet

**Solution:**

```bash
# Vérifier que la clé SERVICE_ROLE_KEY (pas ANON_KEY) est bien utilisée

# Inspecter le fichier généré : il doit contenir des blocs "-- Table: <nom>"
# n'existe plus dans la nouvelle version (statements à plat), mais on peut
# vérifier la présence de CREATE TABLE par table :
grep -c "CREATE TABLE IF NOT EXISTS public" scripts/database/backups/backup-nexiamind-*.sql
```

#### 5. Restauration lente

**Solution:**

- La restauration de grandes bases peut prendre du temps
- Utilisez l'option `--drop` pour supprimer les tables avant la restauration
- Pour les très grandes bases, considérez une restauration par lots

### Journalisation

Les scripts écrivent dans la console. Pour rediriger vers un fichier:

```bash
node scripts/database/backup-db.js > backup-2026-07-15.log 2>&1
node scripts/database/restore-db.js --file=backup.sql > restore-2026-07-15.log 2>&1
```

---

## 🔒 Sécurité

### Bonnes Pratiques

1. **Ne jamais committer les clés** : Ajoutez `.env` à `.gitignore`

```gitignore
# .gitignore
.env
*.env
scripts/database/backups/*.sql
```

2. **Chiffrer les sauvegardes** : Pour les sauvegardes sensibles

```bash
# Chiffrer avec OpenSSL (Linux/macOS)
openssl enc -aes-256-cbc -salt -in backup.sql -out backup.sql.enc

# Déchiffrer
openssl enc -d -aes-256-cbc -in backup.sql.enc -out backup.sql
```

3. **Stockage externe** : Sauvegarder les fichiers sur un stockage externe
   - AWS S3
   - Google Cloud Storage
   - Azure Blob Storage
   - Stockage local chiffré

4. **Rotation des clés** : Changer la SERVICE_ROLE_KEY régulièrement

### Permissions Minimales

Pour la sauvegarde, utilisez un rôle avec uniquement les permissions nécessaires:

```sql
-- Créer un rôle dédié
CREATE ROLE backup_role WITH LOGIN PASSWORD 'secure_password';

-- Donner les permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup_role;
GRANT SELECT ON information_schema.columns TO backup_role;
GRANT SELECT ON pg_indexes TO backup_role;
```

---

## 📊 Annexes

### A. Structure des Tables

Voir: `_bmad-output/planning-artifacts/architecture-nexiamind-ai/bdd.md`

### B. Index Disponibles

Voir: `docs/database/indexes.md`

### C. Scripts de Backup Existants

- `scripts/database/create-classical-indexes.sql` - Création des index classiques
- `scripts/database/setup-exec-sql-functions.sql` - Prérequis one-shot : fonctions RPC (à exécuter dans le SQL Editor Supabase)
- `scripts/database/backup-db.js` - Script de sauvegarde
- `scripts/database/restore-db.js` - Script de restauration

### D. Références

- [Documentation Supabase](https://supabase.com/docs)
- [Client JavaScript Supabase](https://supabase.com/docs/guides/api)
- [Fonctions RPC Supabase (Database Functions)](https://supabase.com/docs/guides/database/functions)
- [pgvector](https://github.com/pgvector/pgvector)

---

## 📝 Historique des Modifications

| Date | Auteur | Description |
|------|--------|-------------|
| 2026-07-15 | Mistral Vibe | Création initiale de la documentation |
| 2026-07-15 | Dday | Implémentation des scripts et tests |
| 2026-07-15 | Revue de code | Réécriture complète de `backup-db.js`/`restore-db.js` : la restauration n'exécutait auparavant aucun SQL (stub qui loggait sans agir) ; introspection de schéma réelle (PK/FK/CHECK/politiques RLS/triggers) au lieu de valeurs codées en dur ; correctifs CLI (`--file` espacé, `--drop=false`), échappement JSON, pagination, protection contre la lecture de fichier arbitraire. Exécution via fonctions RPC Supabase (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, voir `setup-exec-sql-functions.sql`) plutôt qu'une connexion PostgreSQL directe, la base n'étant accessible qu'en API REST dans cet environnement. |

---

*Document généré dans le cadre de la Story 5.405 - Sauvegarder la Structure de la Base*