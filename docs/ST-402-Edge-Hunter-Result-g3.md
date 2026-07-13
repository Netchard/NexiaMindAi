# Edge Case Hunter — Rapport de Revue (ST-402, Groupe 3 — Scripts de Benchmark)

*Revue avec accès au diff et au projet complet (`scripts/benchmark/`). AC concernés : AC2 (test de performance multi-configurations), AC3 (temps de réponse < 3s).*

---

## [CRITIQUE] - Les fonctions RPC dont dépend tout le script n'existent nulle part dans le projet

**Localisation :** `benchmark-vector-index.js`, `createIndexWithConfig()` (appels à `client.rpc('drop_index_if_exists', ...)` et `client.rpc('create_ivfflat_index', ...)`).

**Evidence :** Une recherche exhaustive (`grep -r "drop_index_if_exists\|create_ivfflat_index"`) dans `supabase/` (migrations, SQL, RLS policies) ne retourne **aucun résultat**. Ces deux fonctions RPC sont appelées mais jamais définies dans le dépôt.

**Scénarios problématiques :** Exécution réelle de `npm run benchmark` (ou `node benchmark-vector-index.js`) contre n'importe quelle base Supabase de ce projet, dans son état actuel.

**Impact :** `create_ivfflat_index` échoue systématiquement (« RPC non disponible »), donc `createIndexWithConfig` lève une exception pour chaque configuration testée, donc `benchmarkConfiguration` échoue pour les 4 valeurs de `lists` — le script réel ne peut produire **aucune** donnée de benchmark exploitable tel qu'il est livré.

**Recommandation :** Ajouter les migrations SQL définissant ces deux fonctions RPC (`SECURITY DEFINER`, avec validation des identifiants via `format('%I', ...)`), et un test d'intégration qui vérifie leur existence avant de lancer un benchmark complet.

**Preuve de concept :** `grep -rn "drop_index_if_exists\|create_ivfflat_index" supabase/` → aucun fichier trouvé.

---

## [CRITIQUE] - Le nettoyage d'index avale silencieusement toute erreur, y compris les erreurs réelles

**Localisation :** `benchmark-vector-index.js` lignes 104-110 (`createIndexWithConfig`).

**Evidence :**
```js
const { error: dropError } = await client.rpc('drop_index_if_exists', {
  index_name: indexName
}).catch(() => ({ error: null }));
```

**Scénarios problématiques :** Que la RPC n'existe pas, qu'elle échoue pour une raison réseau transitoire, qu'un problème de permission bloque l'appel, ou que la fonction existe mais rejette pour une tout autre raison (ex. verrou sur l'index) — dans TOUS les cas, `.catch(() => ({ error: null }))` transforme l'échec en un succès apparent (`error: null`).

**Impact :** Le code suppose que l'ancien index a bien été supprimé alors qu'aucune preuve de cela n'existe. Si `create_ivfflat_index` échoue ensuite parce que l'index existe déjà (nom en conflit), le message d'erreur obtenu sera trompeur — rien n'indiquera que la cause racine est l'échec silencieux du drop précédent.

**Recommandation :** Ne catcher que les erreurs attendues (ex. « fonction non trouvée »), logger explicitement toute autre erreur au lieu de la transformer en `null`, et vérifier positivement (`SELECT` sur `pg_indexes`) que l'index a bien disparu avant de continuer.

---

## [CRITIQUE] - Construction de la requête de similarité par concaténation de chaîne (motif d'injection)

**Localisation :** `benchmark-vector-index.js` ligne 141 (`runBenchmarkQuery`).

**Evidence :**
```js
.select('chunk_id, vector <=> array[' + testVector.map((v, i) => `'${v}'`).join(',') + '] as distance')
```

**Scénarios problématiques :** `testVector` vient aujourd'hui uniquement de `Math.random() * 2 - 1` (jamais de caractères spéciaux, donc non exploitable en l'état). Mais le motif — construire une expression de requête par concaténation de valeurs stringifiées au lieu d'un paramètre lié — est la définition même d'une surface d'injection SQL. Le jour où une seule valeur du vecteur provient d'ailleurs (paramètre CLI, embedding fourni par un appelant, configuration externe), ce code devient directement injectable.

**Impact :** Vulnérabilité d'injection SQL latente ; de plus, PostgREST n'accepte généralement pas d'expressions arbitraires avec opérateur (`<=>`) dans un `select()` — cette requête risque simplement d'échouer à l'exécution, indépendamment du problème de sécurité.

**Recommandation :** Passer le vecteur de test comme paramètre typé (`vector`) à une fonction RPC dédiée, jamais par concaténation de chaîne dans un `select()`.

**Preuve de concept :** Remplacer un seul élément de `testVector` par une chaîne contenant `'); DROP TABLE embeddings; --` prouverait l'injection si cette valeur provenait un jour d'une source externe non contrôlée.

---

## [CRITIQUE] - Bug confirmé : incompatibilité de signature de `log()` entre le mock et le script réel, qui pollue le fichier de log commité

**Localisation :** `benchmark-vector-index.mock.js`, fonction `log(message, data = null)` vs points d'appel comme `log('🚀 Démarrage du benchmark MOCK pour ST-402', 'blue')`.

**Evidence :** Le fichier réellement commité `scripts/benchmark/vector-index-benchmark.log` (lignes 13-14 et 21-22) contient :
```
[2026-07-12T15:17:26.847Z] 🚀 Démarrage du benchmark MOCK pour ST-402
"blue"

...
✅ Benchmark MOCK terminé avec succès !
"green"
```
Le paramètre `'blue'`/`'green'` (censé être une couleur d'affichage terminal, 3e argument dans le script réel `log(message, data, color)`) est passé en 2ᵉ position dans les appels du mock, où la fonction `log(message, data = null)` ne prend que 2 paramètres. La chaîne `'blue'` est donc interprétée comme `data` et sérialisée en JSON dans le log (`JSON.stringify('blue', null, 2)` → `"blue"`).

**Scénarios problématiques :** Chaque appel `log(msg, 'blue'|'green'|'red'|'yellow'|'cyan'|'magenta')` dans le mock reproduit ce bug — confirmé de manière reproductible dans le fichier de log réellement présent dans le dépôt.

**Impact :** Le fichier de log destiné à documenter l'exécution contient des lignes parasites sans rapport avec le contenu réel, ce qui nuit à sa lisibilité et à son utilité en tant qu'artefact de diagnostic ou d'audit.

**Recommandation :** Aligner la signature de `log()` du mock sur celle du script réel (`log(message, data, color)`), ou supprimer le paramètre couleur des appels si le mock ne doit pas le gérer.

**Preuve de concept :** Fichier `scripts/benchmark/vector-index-benchmark.log` du dépôt, lignes 13-14 et 21-22.

---

## [HAUTE] - Exécutions concurrentes du benchmark : conflits de noms d'index et de fichiers partagés

**Localisation :** `benchmark-vector-index.js` — `BENCHMARK_REPORT_PATH`/`BENCHMARK_LOG_PATH` (chemins fixes), et `indexName = idx_embeddings_vector_bench_${lists}` (nom déterministe, ligne 99).

**Scénarios problématiques :** Deux exécutions simultanées du script (deux développeurs, ou une CI qui relance le job pendant qu'un précédent tourne encore) ciblent exactement les mêmes noms d'index sur la même table `embeddings`, et écrivent dans les mêmes fichiers `vector-index-benchmark-report.json`/`.log` via `fs.writeFileSync`/`appendFileSync` sans verrou.

**Impact :** Deux `CREATE INDEX` concurrents sur le même nom échouent (« la relation existe déjà ») ou, pire, l'un des process peut supprimer (`drop_index_if_exists`) l'index que l'autre vient de créer et est en train de mesurer — résultats de benchmark faussés ou tests qui échouent de façon non déterministe. Le rapport JSON final peut aussi être une fusion incohérente de deux écritures concurrentes.

**Recommandation :** Inclure un identifiant unique d'exécution (timestamp, PID, UUID) dans les noms d'index et les chemins de sortie, ou utiliser un verrou consultatif Postgres (`pg_advisory_lock`) pour sérialiser les exécutions.

---

## [HAUTE] - `BENCHMARK_CONFIG` jamais validé avant utilisation

**Localisation :** `benchmark-vector-index.js` lignes 49-54 (déclaration de `BENCHMARK_CONFIG`), consommé directement par `runFullBenchmark`/`runBenchmarkQuery`.

**Scénarios problématiques :**
- `listConfigurations: []` → la boucle `for (const lists of [])` ne s'exécute jamais ; `generateSummary([])` retourne un résumé vide (`bestConfiguration: null`) sans qu'aucune erreur explicite ne signale une configuration invalide.
- `testIterations: 0` → aucune requête de mesure n'est jamais exécutée pour aucune configuration ; le rapport final a l'air structurellement valide mais ne contient aucune vraie mesure.
- `queryLimit: 0` → `.limit(0)` renvoie systématiquement 0 résultat pour chaque requête ; le benchmark continue de « réussir » (temps mesuré) tout en ne mesurant en réalité que la latence réseau/parsing, pas un vrai scan d'index.
- `queryLimit` négatif → comportement dépendant de PostgREST, non anticipé par le code.

**Impact :** Une configuration invalide ne produit ni erreur ni avertissement — juste un rapport vide ou trompeur, ce qui peut faire croire à tort qu'aucune configuration testée n'était performante, ou au contraire qu'elles le sont toutes (si `queryLimit=0` masque un vrai problème de scan).

**Recommandation :** Valider `BENCHMARK_CONFIG` au démarrage (`listConfigurations.length > 0`, `testIterations > 0`, `queryLimit > 0`) et échouer explicitement sinon.

---

## [HAUTE] - Aucune vérification préalable de l'existence de la table/colonne/extension avant de lancer le benchmark

**Localisation :** `runVectorIndexBenchmark()` — appelle directement `runFullBenchmark(client)` après `initAdminClient()`, sans étape de vérification préalable.

**Scénarios problématiques :** Comparé à la migration du Groupe 1 (`supabase/migrations/20260712_optimize_vector_index.sql`), qui vérifie explicitement l'existence de la table `embeddings` et de l'extension `pgvector` avant toute opération, ce script de benchmark ne fait aucune vérification équivalente. Si l'extension n'est pas installée ou si la colonne `vector` n'existe pas/plus, l'erreur ne surgira que profondément dans `create_ivfflat_index` (une fois cette RPC implémentée), avec un message dépendant entièrement de ce que cette fonction non définie choisira de renvoyer.

**Impact :** Diagnostic difficile : un échec de pré-condition basique (extension absente, table absente) ressemblera à un échec de benchmark générique, sans piste claire vers la cause racine.

**Recommandation :** Reprendre le même garde-fou explicite que la migration du Groupe 1 (vérification `pg_extension`/`information_schema.tables`) en tout début de `runVectorIndexBenchmark()`.

---

## [HAUTE] - Aucune suite de tests automatisés pour ce groupe

**Localisation :** `scripts/benchmark/` — seuls `benchmark-vector-index.js`, `.mock.js` et `package.json` sont présents ; aucun fichier `*.test.js`.

**Scénarios problématiques :** Contrairement aux Groupes 1 (migrations SQL, revues séparément) et 2 (`analyze-vector-index.test.js` + `.green.test.js`), ce groupe qui implémente directement AC2 (« test de performance avec différents paramètres ») et contribue à AC3 (« < 3s ») n'a aucun test Jest, RED ou GREEN. `package.json` ne déclare même pas `jest` en devDependency ni de script `test`.

**Impact :** Aucune garantie automatisée que `generateSummary`, `calculateStandardDeviation`, ou la logique de sélection de la « meilleure configuration » fonctionnent correctement — ces fonctions ne sont validées que manuellement, si elles le sont.

**Recommandation :** Ajouter une suite de tests (au minimum sur `generateSummary`/`calculateStandardDeviation`, qui sont des fonctions pures faciles à tester unitairement sans dépendance à Supabase).

---

## [MOYENNE] - `setTimeout(1000)` ne garantit pas que l'index est prêt avant les mesures

**Localisation :** `benchmark-vector-index.js` lignes 184-185.

**Evidence :**
```js
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Scénarios problématiques :** Sur une table de taille réelle (l'AC vise justement une future volumétrie plus importante), la construction d'un index ivfflat peut prendre bien plus d'une seconde. Les requêtes de réchauffement et de mesure démarreraient alors contre un index partiellement construit ou pas encore utilisable.

**Impact :** Temps mesurés biaisés (soit trop lents si Postgres bloque en attendant la fin de construction, soit mesurés contre l'ancien index / un scan séquentiel si le nouvel index n'est pas encore pris en compte par le planner).

**Recommandation :** Interroger l'état réel de progression de la construction d'index (`pg_stat_progress_create_index`) plutôt qu'une attente fixe.

---

## [MOYENNE] - Variables d'environnement validées seulement pour leur présence, pas leur format

**Localisation :** `initAdminClient()`, lignes 84-89.

**Scénarios problématiques :** `SUPABASE_URL` mal formée (URL sans protocole, faute de frappe, URL d'un autre projet) ou `SUPABASE_SERVICE_ROLE_KEY` tronquée/invalide ne sont détectées qu'au moment du premier appel réseau réel dans `createClient(...)`, avec une erreur bas niveau (fetch/DNS/HTTP) au lieu d'un message clair au point d'entrée.

**Impact :** Diagnostic plus difficile pour quiconque configure mal son environnement local.

**Recommandation :** Valider `supabaseUrl` avec `new URL(...)` (capturé dans un try/catch) avant de l'utiliser, pour échouer tôt avec un message explicite.

---

## [MOYENNE] - Aucun fichier `.env.example` dans `scripts/benchmark/`

**Localisation :** répertoire `scripts/benchmark/` — absence constatée.

**Scénarios problématiques :** Un nouveau contributeur clonant le dépôt n'a aucune indication documentée des deux variables requises (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) sans lire le code source de `initAdminClient()`.

**Impact :** Friction d'onboarding, risque d'erreurs de configuration.

**Recommandation :** Ajouter un `.env.example` documentant les deux variables (sans valeurs réelles).

---

## [FAIBLE] - Collision de nom d'index si `listConfigurations` contenait une valeur dupliquée

**Localisation :** `benchmark-vector-index.js` ligne 99 : `` const indexName = `idx_embeddings_vector_bench_${lists}`; ``

**Scénarios problématiques :** Si `BENCHMARK_CONFIG.listConfigurations` contenait deux fois la même valeur (ex. `[100, 100, 200]`, par erreur de configuration future), les deux itérations cibleraient le même nom d'index, la seconde écrasant/réutilisant silencieusement celui de la première au lieu de produire deux mesures indépendantes.

**Impact :** Mineur avec la configuration actuelle (valeurs uniques), mais aucune garde ne protège contre une régression future de la configuration.

**Recommandation :** Dériver le nom de l'index d'un identifiant garanti unique (ex. suffixe d'index de boucle en plus de `lists`), ou valider l'unicité de `listConfigurations` au démarrage.

---

## [FAIBLE] - Aucun nettoyage des index de benchmark après la fin du run complet

**Localisation :** `runFullBenchmark()` — aucune étape finale de suppression des 4 index `idx_embeddings_vector_bench_*` créés pendant la boucle.

**Scénarios problématiques :** Une fois les RPC manquantes corrigées (cf. finding CRITIQUE #1) et le script exécuté avec succès, les 4 index de test (`_bench_50`, `_bench_100`, `_bench_200`, `_bench_400`) restent définitivement sur la table `embeddings`.

**Impact :** Surcoût de stockage et de write-amplification permanent sur `embeddings` (chaque `INSERT`/`UPDATE` doit maintenir 4 index ivfflat supplémentaires en plus de l'index de production), pour des index qui n'avaient qu'une vocation de test comparatif.

**Recommandation :** Ajouter une étape de nettoyage final (`DROP INDEX`) pour tous les index de benchmark une fois le rapport généré, sauf demande explicite de conservation.

---

**Résumé :** 4 findings CRITIQUE (RPC totalement absentes du projet — confirmé par recherche exhaustive —, échec de suppression d'index avalé silencieusement, motif d'injection dans la construction de requête, bug de log confirmé par le fichier réellement commité), 4 HAUTE (races entre exécutions concurrentes, configuration jamais validée, absence de vérification préalable extension/table, aucun test automatisé), 3 MOYENNE (`setTimeout` arbitraire, variables d'environnement non validées en format, absence de `.env.example`), 2 FAIBLE (collision de nom d'index en cas de doublon de configuration, absence de nettoyage des index de test).
