# Blind Hunter — Rapport de Revue (ST-402, Groupe 3 — Scripts de Benchmark)

*Revue aveugle basée uniquement sur le diff fourni (`scripts/benchmark/benchmark-vector-index.js`, `scripts/benchmark/benchmark-vector-index.mock.js`), sans autre contexte projet. Code supposé malveillant jusqu'à preuve du contraire.*

---

## [CRITIQUE] - `console.exit(1)` n'existe pas — crash garanti dans le handler d'erreur du mock

**Evidence :** `benchmark-vector-index.mock.js`, bloc `require.main === module` :
```js
.catch(error => {
  console.error('\n❌ ERREUR:', error.message);
  console.exit(1);
});
```

**Impact :** `console` n'a pas de méthode `.exit()` (c'est `process.exit()`). Dès qu'une erreur survient dans `runVectorIndexBenchmark()` en mode MOCK, ce handler lève lui-même un `TypeError: console.exit is not a function`, sans aucun `.catch()` supplémentaire pour l'intercepter — le process se termine par un unhandled rejection au lieu de sortir proprement avec le code 1 prévu, et le message d'erreur original qui a déclenché ce chemin risque d'être masqué par cette nouvelle exception.

**Recommandation :** Remplacer `console.exit(1)` par `process.exit(1)`.

---

## [CRITIQUE] - Les deux fonctions RPC dont dépend tout le script réel ne sont définies nulle part dans ce diff

**Evidence :** `benchmark-vector-index.js` lignes 104-106 et 113-118 :
```js
const { error: dropError } = await client.rpc('drop_index_if_exists', { index_name: indexName }).catch(() => ({ error: null }));
...
const { data, error } = await client.rpc('create_ivfflat_index', {
  table_name: 'embeddings', column_name: 'vector', index_name: indexName, lists: lists
}).catch(() => ({ data: null, error: { message: 'RPC non disponible' } }));
```

**Impact :** Aucune définition SQL de `drop_index_if_exists` ou `create_ivfflat_index` n'apparaît dans ce diff. Si ces fonctions n'existent pas côté serveur, `createIndexWithConfig` échoue systématiquement (le `.catch` sur le `create` renvoie explicitement `error: { message: 'RPC non disponible' }`, qui est ensuite `throw`), donc **`benchmarkConfiguration` échoue pour chaque configuration testée** — le script entier ne peut produire aucune donnée de benchmark réelle telle que livrée. Pire, l'appel `drop_index_if_exists` avale silencieusement TOUTE erreur (`.catch(() => ({ error: null }))`), donnant l'illusion que la suppression a réussi même quand la fonction RPC elle-même n'existe pas.

**Recommandation :** Fournir les migrations SQL créant ces deux fonctions RPC (avec `SECURITY DEFINER` et validation stricte des identifiants), ou ne pas swallow l'erreur du drop silencieusement.

---

## [CRITIQUE] - Requête de similarité construite par concaténation de chaîne brute au lieu d'un paramètre

**Evidence :** `benchmark-vector-index.js` ligne 141 :
```js
.select('chunk_id, vector <=> array[' + testVector.map((v, i) => `'${v}'`).join(',') + '] as distance')
```

**Impact :** Le vecteur de test (384 valeurs) est injecté par concaténation directe de chaînes dans l'argument de `.select()`, plutôt que passé comme paramètre lié (RPC ou binding). Ici, `testVector` provient uniquement de `Math.random()`, donc non exploitable dans ce cas précis — mais le motif lui-même (construire une expression de requête par concaténation de valeurs) est le patron classique d'injection SQL, et le premier jour où une seule de ces valeurs proviendra d'une source externe (paramètre CLI, entrée utilisateur, embedding fourni par un appelant), ce code devient directement injectable. De plus, il n'est même pas certain que PostgREST accepte une expression arbitraire avec l'opérateur `<=>` dans un `select` de cette façon (ce n'est pas juste une liste de colonnes) — la requête risque simplement d'échouer.

**Recommandation :** Passer le vecteur de test via une fonction RPC dédiée qui prend le vecteur en paramètre typé (`vector`), jamais via concaténation de chaîne dans le select.

---

## [CRITIQUE] - Aucune isolation ni nettoyage entre les configurations testées : le benchmark comparatif est méthodologiquement invalide

**Evidence :** `runFullBenchmark` boucle sur `BENCHMARK_CONFIG.listConfigurations` (`[50, 100, 200, 400]`) et appelle `benchmarkConfiguration(client, lists)` pour chacune, qui crée un index `idx_embeddings_vector_bench_${lists}` **différent à chaque itération** (ligne 99) sans jamais supprimer les index des itérations précédentes.

**Impact :** À la fin de la boucle, 4 index ivfflat distincts coexistent sur la même colonne `vector` de la même table `embeddings`. PostgreSQL choisit lui-même quel index utiliser pour une requête donnée selon son estimation de coût — la simple création d'un nouvel index ne garantit pas que les requêtes de benchmark suivantes l'utilisent réellement plutôt qu'un des index précédents encore présents. À partir de la 2e configuration testée (`lists=100`), il n'y a **aucune garantie que le temps mesuré corresponde à l'index qu'on croit tester** — ce qui invalide la comparaison même que ce script est censé produire.

**Recommandation :** Supprimer explicitement tous les autres index de benchmark avant/après chaque configuration testée, ou utiliser `SET enable_seqscan = off` / des hints explicites pour forcer l'utilisation du bon index pendant la mesure.

---

## [HAUTE] - Conception de la fonction RPC `create_ivfflat_index` ouverte à l'injection si les paramètres cessent d'être codés en dur

**Evidence :** `benchmark-vector-index.js` lignes 113-117 :
```js
const { data, error } = await client.rpc('create_ivfflat_index', {
  table_name: 'embeddings',
  column_name: 'vector',
  index_name: indexName,
  lists: lists
})
```

**Impact :** `table_name`, `column_name` et `index_name` (ce dernier construit par interpolation : `` `idx_embeddings_vector_bench_${lists}` ``) sont envoyés tels quels à une fonction RPC dont l'implémentation SQL n'est pas présente dans ce diff. Si cette fonction construit du DDL dynamique (`EXECUTE format('CREATE INDEX %s ON %s ...', index_name, table_name)`) sans échappement d'identifiant (`%I`), et que ces valeurs deviennent un jour paramétrables depuis l'extérieur plutôt que codées en dur ici, la porte est ouverte à une injection SQL via cette RPC.

**Recommandation :** Documenter/imposer que l'implémentation SQL de `create_ivfflat_index` utilise `format('%I', ...)` pour tous les identifiants, et valider `table_name`/`column_name` contre une liste blanche côté fonction RPC elle-même (ne pas faire confiance à l'appelant).

---

## [HAUTE] - Attente arbitraire de 1 seconde utilisée comme preuve que l'index est prêt

**Evidence :** `benchmark-vector-index.js` lignes 184-185 :
```js
// Attendre un peu pour que l'index soit prêt
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Impact :** Un `setTimeout` fixe ne garantit en rien que la construction de l'index ivfflat est terminée — sur une table volumineuse, la construction peut prendre bien plus d'une seconde. Si les requêtes de réchauffement et de mesure démarrent avant la fin réelle de la construction, tous les temps mesurés pour cette configuration sont biaisés (voire mesurés contre un index partiellement construit ou inexistant).

**Recommandation :** Interroger `pg_stat_progress_create_index` (ou l'équivalent exposé par la RPC) pour attendre la fin réelle de la construction avant de lancer les mesures.

---

## [MOYENNE] - Dimension du vecteur de test codée en dur sans validation contre la colonne réelle

**Evidence :** `benchmark-vector-index.js` ligne 136 :
```js
const testVector = Array.from({ length: 384 }, () => Math.random() * 2 - 1);
```

**Impact :** La dimension `384` est une constante figée dans ce script, jamais vérifiée contre la dimension réelle de la colonne `vector` de `embeddings`. Si la dimension réelle de la table diffère (pour quelque raison que ce soit), l'opérateur `<=>` échouera à l'exécution avec une erreur de dimension incompatible, sans qu'aucune vérification préalable dans ce diff ne le détecte ou ne produise un message clair.

**Recommandation :** Récupérer dynamiquement la dimension de la colonne avant de générer le vecteur de test, ou au minimum valider explicitement la dimension attendue avant de lancer le benchmark.

---

## [MOYENNE] - Comptabilisation incohérente de `failedQueries` entre les deux niveaux de gestion d'erreur

**Evidence :** Dans `benchmarkConfiguration`, le `catch` (lignes 225-228) fait seulement `configResults.error = error.message;` sans toucher à `configResults.statistics.failedQueries` (qui reste à sa valeur initiale `0`). Un niveau au-dessus, le `catch` de `runFullBenchmark` (lignes 257-271) fixe explicitement `failedQueries: BENCHMARK_CONFIG.testIterations` dans son objet de repli.

**Impact :** Selon l'endroit exact où l'erreur survient (dans `createIndexWithConfig` avant la boucle de test vs. ailleurs), une configuration totalement échouée peut se retrouver avec `failedQueries: 0` alors qu'aucune requête n'a réussi — donnée trompeuse dans le rapport final pour analyser les échecs.

**Recommandation :** Harmoniser : dans le `catch` de `benchmarkConfiguration`, fixer aussi `statistics.failedQueries = BENCHMARK_CONFIG.testIterations` avant de retourner.

---

## [MOYENNE] - Dégradation silencieuse en rapport « vide mais valide » si toutes les configurations échouent

**Evidence :** `generateSummary(results)` ne peuple `summary.bestConfiguration` et `summary.recommendations` que dans le bloc `if (successfulResults.length > 0) { ... }` (ligne 299 et suivantes). Si aucune configuration ne réussit (scénario très plausible vu le finding CRITIQUE sur les RPC manquantes), ce bloc entier est sauté.

**Impact :** Le rapport final reste un JSON structurellement valide (`bestConfiguration: null`, `recommendations: []`) et est sauvegardé avec succès (`saveBenchmarkReport`) sans qu'aucune alerte de premier niveau ne signale que le benchmark n'a en réalité rien mesuré — un consommateur du rapport pourrait ne pas remarquer que toutes les configurations ont échoué.

**Recommandation :** Faire échouer explicitement `runVectorIndexBenchmark()` (ou au minimum logger une alerte visible) si `summary.successfulConfigurations === 0`.

---

## [FAIBLE] - Logique dupliquée entre le script réel et le mock

**Evidence :** `calculateStandardDeviation` et une grande partie de `generateSummary` sont réimplémentées quasi à l'identique dans `benchmark-vector-index.js` et `benchmark-vector-index.mock.js`.

**Impact :** Toute correction de bug (ex. le calcul du score composite, ou la gestion des cas vides) doit être appliquée deux fois ; un oubli fait diverger silencieusement le comportement du mock et du script réel.

**Recommandation :** Extraire ces fonctions dans un module partagé importé par les deux fichiers.

---

## [FAIBLE] - Variable `data` inutilisée dans `createIndexWithConfig`

**Evidence :** `benchmark-vector-index.js` ligne 113 :
```js
const { data, error } = await client.rpc('create_ivfflat_index', { ... })...
```
`data` n'est jamais lu ensuite dans la fonction.

**Impact :** Code mort mineur, aucun effet fonctionnel, mais nuit à la lisibilité et masque potentiellement une intention non implémentée (le retour de la RPC n'est jamais exploité).

**Recommandation :** Retirer `data` de la déstructuration si elle n'est pas utilisée, ou l'utiliser pour vérifier le résultat de la création d'index.

---

## [FAIBLE] - Aucun timeout par requête individuelle

**Evidence :** `runBenchmarkQuery` exécute `await client.from('embeddings').select(...)` sans aucun timeout explicite.

**Impact :** Une requête qui bloque (contention de verrou, scan très long) bloque indéfiniment tout le benchmark, sans limite de temps ni possibilité de continuer avec les configurations suivantes.

**Recommandation :** Ajouter un timeout explicite (ex. `Promise.race` avec un délai maximal) par requête de mesure.

---

**Résumé :** 4 findings CRITIQUE (crash certain via `console.exit`, dépendance totale à des RPC non fournies, motif d'injection dans la construction de requête, méthodologie de comparaison invalidée par l'absence d'isolation entre index), 2 HAUTE (RPC ouverte à l'injection si paramétrée dynamiquement, synchronisation par `setTimeout` arbitraire), 3 MOYENNE (dimension non validée, comptage d'échecs incohérent, dégradation silencieuse en rapport vide), 3 FAIBLE (duplication mock/réel, variable morte, absence de timeout par requête).
