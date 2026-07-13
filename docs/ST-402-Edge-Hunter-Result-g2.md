# Edge Case Hunter — Rapport de Revue (ST-402, Groupe 2)

*Revue avec accès au diff ET au projet. Fichiers : `scripts/analysis/*.js`, `*.json`, `*.log`, `package.json`. Focus : gestion d'erreurs Node.js, dépendances manquantes, compatibilité pg/Supabase, couverture réelle des tests MOCK, configuration d'environnement, sécurité des requêtes dynamiques.*

---

## 🔴 CRITIQUE

**1. `information_schema.columns` et `pg_indexes` ne sont pas exposés par PostgREST par défaut**
- **Description :** `analyzeEmbeddingsTable()` interroge `client.from('information_schema.columns')` puis `client.from('pg_indexes')` comme s'il s'agissait de tables normales exposées par l'API Supabase. Or PostgREST n'expose que les schémas explicitement déclarés (typiquement `public`) — `information_schema` et `pg_catalog` n'en font pas partie par défaut.
- **Evidence :** `analyze-vector-index.js` lignes ~331-341 (`information_schema.columns`) et ~463-468 (`pg_indexes`).
- **Conditions de déclenchement :** Exécution du script réel (pas le mock) contre n'importe quel projet Supabase standard, sans configuration API additionnelle exposant ces schémas.
- **Impact potentiel :** La toute première vraie requête (`tableError`) échoue quasi systématiquement, et comme le code fait `throw tableError` juste après, **toute l'analyse avorte dès la première étape** — ce n'est pas un cas limite rare, c'est le chemin normal d'exécution contre une base Supabase non spécialement configurée.
- **Recommandation :** Utiliser une fonction RPC dédiée (`SECURITY DEFINER`) exposée volontairement pour interroger `information_schema`/`pg_catalog`, plutôt que de les cibler directement via `.from()`.

**2. Le MOCK ne couvre strictement aucun chemin d'échec réel**
- **Description :** `analyze-vector-index.mock.js` retourne inconditionnellement un rapport figé et « parfait » (5000 lignes, dimension 384 valide, index trouvé, lists=100). Aucune variante du mock ne simule : colonne `vector` absente, index non trouvé, `tableError`/`indexError`/`countError`, RPC indisponible, ou dimension invalide.
- **Evidence :** `analyze-vector-index.mock.js` (81 lignes, une seule fonction `generateMockReport()` à sortie fixe) ; `analyze-vector-index.green.test.js` qui mocke exclusivement ce module (ligne 44).
- **Conditions de déclenchement :** N'importe quel exécution des tests « GREEN » — ils ne peuvent, par construction, jamais rencontrer un cas d'erreur.
- **Impact potentiel :** Zéro couverture des branches d'erreur du vrai script (dont celles du finding #1, garanties de se produire en pratique). Les tests « verts » donnent une confiance totalement injustifiée sur la robustesse réelle du code.
- **Recommandation :** Ajouter des variantes de mock (ou des mocks configurables) simulant chaque branche d'erreur, et des tests correspondants qui vérifient que le script échoue proprement (message clair, pas de crash silencieux).

---

## 🟠 HAUTE

**3. Fichiers `REPORT_PATH`/`LOG_PATH` partagés entre deux suites Jest sans isolation — race condition**
- **Description :** `analyze-vector-index.test.js` (phase RED) et `analyze-vector-index.green.test.js` (phase GREEN) calculent tous deux le même chemin absolu (`path.join(__dirname, 'vector-index-analysis-report.json')` / `...-analysis.log`). Le fichier GREEN supprime ces fichiers en `beforeAll`/`afterAll` (`cleanupFiles()`).
- **Evidence :** `analyze-vector-index.green.test.js` lignes 46-47, 55-66 ; mêmes constantes redéfinies dans `analyze-vector-index.test.js` lignes 750-751.
- **Conditions de déclenchement :** Jest exécute par défaut les fichiers de test en parallèle (workers séparés). Si les deux fichiers tournent en même temps (`npm test` élargi à `*.test.js`, ou CI lançant les deux), la suppression/écriture d'un fichier par l'une des suites peut survenir pendant que l'autre suite est en train de le lire ou de l'asserter.
- **Impact potentiel :** Résultats de tests non déterministes (flaky), échecs intermittents en CI difficiles à diagnostiquer, un fichier lu à moitié écrit ou supprimé sous le nez d'une assertion `fs.existsSync`.
- **Recommandation :** Isoler chaque suite avec un chemin de fichier unique (ex. suffixé par le nom du test ou un répertoire temporaire par worker Jest — `process.env.JEST_WORKER_ID`).

**4. Aucun mécanisme de configuration d'environnement documenté pour les deux variables obligatoires**
- **Description :** `initAdminClient()` exige `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans `process.env`, mais rien dans ce diff (pas de `dotenv` en dépendance, pas de `.env.example`, pas de chargement automatique) n'indique comment les fournir.
- **Evidence :** `analyze-vector-index.js` lignes 286-299 ; `package.json` dépendances (lignes 965-971) — aucune lib de chargement d'env.
- **Conditions de déclenchement :** Exécution locale (`npm run analyze`) ou en CI sans que ces deux variables soient déjà exportées par un mécanisme externe au dépôt.
- **Impact potentiel :** Échec immédiat et systématique pour quiconque clone le dépôt et lance le script sans connaître ces deux noms de variables par cœur (elles ne sont documentées nulle part dans ce diff).
- **Recommandation :** Ajouter `dotenv` en dépendance + un fichier `.env.example` documentant les variables requises pour `scripts/analysis/`.

---

## 🟡 MOYENNE

**5. Gestion incohérente entre l'échec sur `information_schema.columns` (fatal) et sur `pg_indexes` (juste loggé)**
- **Description :** Une erreur sur la récupération des colonnes lève une exception qui stoppe toute l'analyse ; une erreur équivalente sur la récupération des index est seulement journalisée, laissant `report.currentIndex = null` en silence.
- **Evidence :** comparer `analyze-vector-index.js` lignes 338-341 (`throw tableError`) et lignes 496-498 (`else if (indexError) { log(...) }`, pas de throw).
- **Conditions de déclenchement :** Toute erreur PostgREST sur la requête `pg_indexes` (cf. finding #1, cause identique).
- **Impact potentiel :** Le rapport final semble « complet » (pas d'exception) mais `currentIndex` est `null` ; la validation d'acceptance (`validate-task-1.js`) échoue alors silencieusement sur un `TypeError` évité de justesse par le short-circuit `report.currentIndex && ...`, sans qu'aucun message n'explique la vraie cause racine (accès à `pg_indexes` refusé).
- **Recommandation :** Traiter les deux erreurs de façon cohérente — soit les deux fatales, soit les deux journalisées avec un statut explicite dans le rapport (`currentIndexError: "..."`).

**6. Écritures fichiers (`log()`, `saveReport()`) non protégées contre des erreurs disque/permissions**
- **Description :** `fs.appendFileSync`/`fs.writeFileSync` sont appelés directement dans `log()` sans try/catch local ; une erreur d'E/S (disque plein, permissions, chemin verrouillé par l'autre suite de tests — cf. finding #3) remonte brute jusqu'à l'appelant, mélangée aux erreurs métier.
- **Evidence :** `analyze-vector-index.js` lignes 271-279 (`log()`).
- **Conditions de déclenchement :** Environnement CI avec quota disque restreint, ou exécution concurrente touchant le même fichier.
- **Impact potentiel :** Message d'erreur trompeur (une panne d'E/S ressemble à une panne d'analyse), diagnostic plus difficile.
- **Recommandation :** Envelopper les écritures de `log()` dans un try/catch dédié qui distingue clairement « échec de journalisation » de « échec d'analyse ».

**7. Requêtes RPC à surface d'injection potentielle si les paramètres cessent d'être codés en dur**
- **Description :** `client.rpc('vector_dim', { vector_col: 'vector', table_name: 'embeddings' })` passe des noms de colonne/table en paramètres à une fonction RPC dont l'implémentation n'est pas dans ce diff. Actuellement les valeurs sont des littéraux fixes (pas d'injection possible aujourd'hui), mais la forme de l'appel est prête à accepter des valeurs dynamiques.
- **Evidence :** `analyze-vector-index.js` lignes 405-407.
- **Conditions de déclenchement :** Si `vector_col`/`table_name` deviennent un jour configurables (variable d'env, argument CLI) sans validation, et que la fonction RPC construit du SQL dynamique avec ces valeurs (ex. via `EXECUTE format(...)` sans `%I`).
- **Impact potentiel :** Injection SQL si la fonction RPC sous-jacente n'échappe pas correctement les identifiants — actuellement latent, pas exploitable, mais à surveiller dès que ce point devient paramétrable.
- **Recommandation :** Documenter que ces valeurs doivent rester des littéraux contrôlés côté code, et s'assurer que l'implémentation SQL de `vector_dim` (si elle existe) utilise `format('%I', ...)` pour les identifiants.

---

## ⚪ FAIBLE

**8. `count` non typé/gardé avant usage arithmétique**
- **Description :** `report.totalEmbeddings = count` sans vérifier que `count` est bien un `number` ; utilisé ensuite dans `Math.ceil(currentSize * 1.5)`.
- **Evidence :** `analyze-vector-index.js` lignes 449-459, 503-511.
- **Conditions de déclenchement :** Réponse Supabase avec `count: null` (possible selon permissions/version PostgREST).
- **Impact potentiel :** `estimatedFutureSize` retombe silencieusement sur le plancher de 10000, confondant « comptage indisponible » avec « table vide ».
- **Recommandation :** Vérifier `typeof count === 'number'` avant assignation, sinon logger une alerte explicite.

**9. Fichiers générés (`vector-index-analysis-report.json`, `.log`) sans entrée `.gitignore`**
- **Description :** Rien n'exclut ces sorties générées du contrôle de version.
- **Evidence :** présence de ces deux fichiers directement dans le diff, aucun `.gitignore` associé visible.
- **Conditions de déclenchement :** Toute exécution future (réelle ou mock) du script régénère ces fichiers avec des données différentes.
- **Impact potentiel :** Diffs de bruit à chaque exécution locale, risque de re-commit accidentel de données obsolètes ou factices (cf. Blind Hunter finding #1 sur ce même groupe).
- **Recommandation :** Ajouter `scripts/analysis/vector-index-analysis-report.json` et `scripts/analysis/vector-index-analysis.log` au `.gitignore`.

---

**Résumé :** 2 CRITIQUE (appels PostgREST quasi garantis d'échouer sur `information_schema`/`pg_indexes`, MOCK sans aucune couverture des chemins d'échec réels), 2 HAUTE (race condition entre suites Jest sur des fichiers partagés, configuration d'environnement non documentée), 3 MOYENNE (gestion d'erreur incohérente entre deux requêtes similaires, écritures fichier non protégées, surface d'injection latente sur un RPC), 2 FAIBLE (`count` non gardé, artefacts générés non ignorés par git).
