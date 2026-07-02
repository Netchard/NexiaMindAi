# Scripts pour ST-201 - Intégrer Supabase Storage

Ce dossier contient les scripts CLI pour tester et utiliser l'intégration Supabase Storage.

## Prérequis

- Node.js v18+ (recommandé v20+)
- ts-node (sera installé automatiquement si nécessaire)
- TypeScript

## Installation

Si ce n'est pas déjà fait, installez les dépendances du projet :

```bash
npm install
```

## Scripts disponibles

### 1. `index-supabase.ts` - Script principal d'indexation

Script CLI pour indexer les fichiers depuis Supabase Storage.

**Usage :**
```bash
# Indexation complète du bucket par défaut
npx ts-node scripts/index-supabase.ts

# Indexation avec options
npx ts-node scripts/index-supabase.ts --prefix=test-data/ --client=nexia --type=contract

# Mode dry-run (test sans sauvegarde en base)
npx ts-node scripts/index-supabase.ts --dry-run --limit=5

# Aide complète
npx ts-node scripts/index-supabase.ts --help
```

**Options disponibles :**
- `--prefix=<path>` - Prefix du bucket à indexer
- `--client=<name>` - Client spécifique pour les métadonnées
- `--type=<type>` - Type de document
- `--documentType=<type>` - Alias de --type
- `--dry-run` - Mode test (ne pas sauvegarder en base)
- `--limit=<n>` - Limite de fichiers à traiter
- `--bucket=<name>` - Nom du bucket (par défaut: documents)
- `--help, -h` - Afficher l'aide

### 2. `test-pdf-manual.ts` - Test manuel avec PDF local

Script pour tester l'extraction de texte et l'indexation complète avec un fichier PDF local.

**Usage :**
```bash
# Tester avec le PDF par défaut (./test-data/sample.pdf)
npx ts-node scripts/test-pdf-manual.ts

# Tester avec un PDF spécifique
npx ts-node scripts/test-pdf-manual.ts --path=./documents/mon-fichier.pdf

# Tester avec un PDF avec chemin absolu
npx ts-node scripts/test-pdf-manual.ts --path="C:/Users/name/Documents/test.pdf"

# Aide
npx ts-node scripts/test-pdf-manual.ts --help
```

**Ce script effectue :**
1. Extraction de texte depuis le PDF
2. Affichage d'un aperçu du texte extrait
3. Test du chunking du document
4. Test de la génération des embeddings
5. Tout en mode dry-run (pas de sauvegarde en base)

### 3. `index-supabase-simple.js` - Wrapper simple

Script wrapper qui détecte automatiquement la meilleure méthode d'exécution.

**Usage :**
```bash
# Exécution automatique (décide entre ts-node ou fichier compilé)
node scripts/index-supabase-simple.js --dry-run --limit=1
```

### 4. `test-pdf-local.js` - Test rapide (obsolète)

Script légé pour test rapide. Utilisez plutôt `test-pdf-manual.ts`.

## Exemples concrets

### Tester avec un vrai PDF

1. Placez votre fichier PDF dans le dossier `test-data/` ou n'importe où dans le projet
2. Exécutez :

```bash
npx ts-node scripts/test-pdf-manual.ts --path=./test-data/mon-document.pdf
```

### Indexer les fichiers de test depuis Supabase

```bash
# Mode dry-run pour tester sans modifier la base
npx ts-node scripts/index-supabase.ts --prefix=test-data/ --limit=1 --dry-run

# Pour de vrai (attention : sauvegarde en base)
npx ts-node scripts/index-supabase.ts --prefix=test-data/ --limit=1
```

### Tester avec différents types de fichiers

```bash
# Indexer seulement les PDFs
npx ts-node scripts/index-supabase.ts --prefix=documents/ --type=contract --dry-run

# Indexer avec un client spécifique
npx ts-node scripts/index-supabase.ts --prefix=clients/nexia/ --client=nexia --type=contract --dry-run
```

## Dépannage

### Erreur: "ts-node non trouvé"

```bash
npm install -g ts-node
```

### Erreur: "Cannot find module"

Assurez-vous d'exécuter les scripts depuis la racine du projet :

```bash
cd D:\VibeCoding\Projects\Project-D\nexiamind-ai
npx ts-node scripts/test-pdf-manual.ts
```

### Erreur: "Fichier PDF non trouvé"

Vérifiez que :
1. Le chemin vers le PDF est correct
2. Le fichier existe à l'emplacement spécifié
3. Vous utilisez le bon séparateur de chemin (\\ pour Windows, / pour Unix)

### Le script s'exécute mais ne produit pas de sortie

Essayez avec le flag `--dry-run` pour voir ce qui se passe sans sauvegarder :

```bash
npx ts-node scripts/index-supabase.ts --dry-run --limit=1
```

## Bonnes pratiques

1. **Toujours tester en mode dry-run d'abord** :
   ```bash
   npx ts-node scripts/index-supabase.ts --dry-run --limit=5
   ```

2. **Limiter le nombre de fichiers pour les tests** :
   ```bash
   npx ts-node scripts/index-supabase.ts --limit=1 --dry-run
   ```

3. **Utiliser des prefixes pour cibler des dossiers spécifiques** :
   ```bash
   npx ts-node scripts/index-supabase.ts --prefix=clients/nexia/ --dry-run
   ```

4. **Vérifier les logs** : Les scripts utilisent le logger du projet pour afficher des informations détaillées.

## Structure des fichiers de test

Pour les tests unitaires, voir :
- `src/lib/supabase/storage/__tests__/`

Les tests peuvent être exécutés avec :
```bash
npm test
# ou
npm run test:watch
```

## Notes techniques

- Les scripts utilisent `ts-node` pour exécuter directement le TypeScript
- Les imports utilisent des chemins relatifs depuis la racine du projet
- Les dépendances sont mockées dans les tests unitaires
- Les scripts supportent à la fois les chemins relatifs et absolus pour les fichiers PDF

## Aide supplémentaire

Pour plus d'informations sur les fonctionnalités de chaque script :

```bash
npx ts-node scripts/index-supabase.ts --help
npx ts-node scripts/test-pdf-manual.ts --help
```
