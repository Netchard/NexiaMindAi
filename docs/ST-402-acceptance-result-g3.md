# Acceptance Auditor — Résultats (ST-402, Groupe 3)

*Vérification du diff (`scripts/benchmark/benchmark-vector-index.js`, `.mock.js`, `package.json`, artefacts générés) contre les Acceptance Criteria de ST-402.*

---

## AC par AC

### AC2: Test de performance avec différents paramètres

**Verdict:** ⚠️ PARTIEL

**Preuve:** `BENCHMARK_CONFIG.listConfigurations = [50, 100, 200, 400]` et la boucle `for (const lists of BENCHMARK_CONFIG.listConfigurations) { ... benchmarkConfiguration(client, lists) ... }` couvrent structurellement bien les 4 configurations exigées, avec `testIterations: 5` répétitions par configuration.

**Gaps identifiés:**
- Le script réel ne peut produire aucun résultat exploitable : `createIndexWithConfig` appelle les RPC `drop_index_if_exists` et `create_ivfflat_index`, dont une recherche exhaustive dans tout `supabase/` (migrations, SQL) ne trouve **aucune définition** — la RPC de création lève systématiquement `RPC non disponible`, donc chaque configuration échoue avant même d'exécuter une seule requête de mesure.
- La seule preuve de « 4 configurations testées avec succès » présente dans le dépôt est le fichier `vector-index-benchmark-report.json`, qui contient `"environment": { "mock": true }` — ce n'est pas une exécution réelle.
- Même en supposant les RPC disponibles, il n'existe aucune isolation entre les 4 index créés successivement (`idx_embeddings_vector_bench_50/100/200/400` coexistent sans suppression des précédents) : rien ne garantit que la requête de la configuration N mesure bien l'index N plutôt qu'un index précédent encore présent.
- La requête de mesure elle-même (`'chunk_id, vector <=> array[' + testVector.map(...).join(',') + '] as distance'`) construite par concaténation de chaîne est d'une syntaxe non garantie de fonctionner via PostgREST.

**Sévérité:** CRITIQUE (le critère est démontré uniquement par des données fictives ; aucune preuve qu'il fonctionne réellement).

---

### AC3: Temps de réponse < 3s

**Verdict:** ⚠️ PARTIEL

**Preuve:** `const startTime = Date.now(); ... const queryTime = endTime - startTime;` mesure correctement le temps par requête ; `statistics.avgTime` est calculé par configuration ; `successfulResults.find(r => r.statistics.avgTime < 3000)` vérifie explicitement le seuil de 3 secondes et alimente une recommandation de type `critère`.

**Gaps identifiés:**
- Le mécanisme de mesure est correctement écrit, mais **jamais exécuté avec succès contre une vraie base** (mêmes causes que l'AC2 : RPC absentes). Les seules valeurs de `avgTime` présentes dans le dépôt (680ms à 1386ms) proviennent du générateur MOCK (`baseTime = 1500 - (lists * 2)`, valeurs aléatoires), pas d'une mesure réelle.
- La formule du mock produit un temps qui **diminue** systématiquement quand `lists` augmente (50 → 1386ms, 400 → 680ms) — un rapport strictement inverse de la réalité connue des index ivfflat, où un `lists` trop élevé n'accélère pas indéfiniment les requêtes. Cette donnée fictive ne peut donc servir de preuve, même indicative, que le critère < 3s sera respecté en conditions réelles.
- Aucune donnée de charge réelle de production n'est utilisée (le spec exige explicitement de « tester avec la charge de production actuelle » selon l'AC3 du groupe 1 associé) ; ce groupe ne teste que des vecteurs aléatoires générés localement.

**Sévérité:** HAUTE (le mécanisme de vérification est correctement codé, mais aucune preuve réelle n'existe que le critère est respecté).

---

### AC1: Justification par benchmark (lien avec Groupe 3)

**Verdict:** ❌ NON SATISFAIT

**Preuve :** `summary.bestConfiguration` et les recommandations `vitesse`/`stabilité`/`compromis` sont bien calculées à partir des résultats disponibles, avec une logique de tri claire (`sort((a,b) => a.statistics.avgTime - b.statistics.avgTime)`).

**Gaps identifiés:**
- Le rapport réellement commité (`vector-index-benchmark-report.json`) désigne **`lists: 400`** comme `bestConfiguration` — or la migration du Groupe 1 (`20260712_optimize_vector_index.sql`) déploie **`lists = 200`**. Les deux artefacts de la même story se contredisent frontalement : celui qui est censé « justifier par benchmark » le choix ne justifie pas la valeur réellement appliquée.
- Cette contradiction est d'autant plus grave que le rapport qui recommande 400 est lui-même généré par le MOCK, avec une formule reconnue comme irréaliste (voir AC3) — donc même la recommandation « 400 » n'a aucune valeur probante.
- Aucune trace dans ce diff d'une exécution réelle du benchmark contre la base de production ou une base de test représentative. La « justification par benchmark » exigée par AC1 n'existe donc nulle part sous une forme vérifiable.

**Sévérité:** CRITIQUE (la valeur `lists` réellement déployée en Groupe 1 n'est appuyée par aucune donnée de benchmark réelle et probante de ce Groupe 3 ; pire, l'unique donnée disponible contredit ce choix).

---

## Problèmes de Conformité aux Standards

| Standard | Verdict | Constat |
|----------|---------|---------|
| Cycle RED/GREEN/Refactor | ❌ | Aucun fichier `*.test.js` n'existe dans `scripts/benchmark/` — ni phase RED ni phase GREEN formalisée en tests, contrairement aux Groupes 1 et 2. |
| Tests MOCK sans BDD | ⚠️ | `benchmark-vector-index.mock.js` permet bien une exécution sans base de données, mais ce n'est qu'un script exécutable isolé — il n'est rattaché à aucune suite de tests avec assertions ; rien ne vérifie automatiquement la cohérence de sa sortie. |
| Framework Jest | ❌ | `scripts/benchmark/package.json` ne déclare ni `jest` ni `@jest/globals`, et aucun script `test` n'est défini — Jest n'est pas utilisé du tout dans ce groupe. |

---

## Résumé Final

| AC | Statut | Preuve | Blocage |
|----|--------|--------|---------|
| AC1 (justifié par benchmark) | ❌ | Rapport commité recommande `lists=400`, contredisant le `lists=200` réellement déployé en Groupe 1 ; donnée issue du mock, formule reconnue irréaliste | Oui |
| AC2 (test multi-config) | ⚠️ | 4 configurations bien codées, mais RPC requises absentes du projet (confirmé par recherche exhaustive) → aucune exécution réelle possible | Oui |
| AC3 (temps < 3s) | ⚠️ | Mécanisme de mesure et de seuil correctement implémenté, mais aucune valeur réelle disponible, seulement des données MOCK | Oui |

**Conclusion:** Le Groupe 3 **ne peut pas être accepté en l'état**. Le code du script de benchmark est structurellement bien organisé (4 configurations, mesure du temps, calcul de statistiques, seuil de 3s), mais il repose entièrement sur deux fonctions RPC (`drop_index_if_exists`, `create_ivfflat_index`) qui n'existent nulle part dans le projet, rendant le script réel non fonctionnel. Le seul artefact « résultat » présent dans le dépôt est une sortie du MOCK — et cette sortie fictive recommande une configuration (`lists=400`) qui **contredit directement** la valeur (`lists=200`) réellement déployée par la migration du Groupe 1, invalidant la prétention même que ce choix soit « justifié par benchmark ». Tant que (1) les RPC ne sont pas implémentées et testées contre une vraie base, et (2) qu'un vrai rapport de benchmark (non-mock) n'est pas généré et ne converge pas avec la valeur déployée en Groupe 1, l'AC1 en particulier reste bloquant pour l'ensemble de la story ST-402.
