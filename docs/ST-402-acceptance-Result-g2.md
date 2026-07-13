# Acceptance Auditor — Résultats (ST-402, Groupe 2 — Scripts d'Analyse)

*Vérification du diff (`scripts/analysis/*.js`, `*.json`, `*.log`, `package.json`) contre les Acceptance Criteria pertinents (Tâche 1) et les contraintes architecturales du spec `5-402-optimiser-l-index-vectoriel.md`.*

---

## AC 1 — Sous-critères de la Tâche 1 (Analyser la charge de données actuelle)

### « Compter le nombre de documents/indexés actuellement dans `embeddings` »

**Verdict : ⚠️ PARTIEL — implémenté mais non vérifié end-to-end**

- **Preuve :** `analyzeEmbeddingsTable()` exécute `client.from('embeddings').select('*', { count: 'exact', head: true })` puis assigne `report.totalEmbeddings = count`.
- **Description :** Le comptage est correctement codé, mais il est placé après une étape antérieure (`client.from('information_schema.columns')`) qui échoue quasi systématiquement contre un projet Supabase standard — PostgREST n'expose pas `information_schema` par défaut, et le code fait `throw tableError` sur cet échec. En pratique, ce comptage n'a aucune preuve d'avoir jamais été exécuté avec succès contre une vraie base : le seul rapport présent dans le diff est celui du MOCK.
- **Sévérité :** HAUTE.

### « Estimer la taille future maximale attendue »

**Verdict : ✅ SATISFAIT (sur le plan du code), avec la même réserve de non-vérification**

- **Preuve :** `report.estimatedFutureSize = Math.ceil(currentSize * 1.5)`, avec un plancher à 10000 si le résultat est trop petit.
- **Description :** La logique existe et respecte l'intention de l'AC (une heuristique d'estimation, le spec n'impose pas de méthode précise). Comme pour le comptage, elle hérite du risque de ne jamais s'exécuter réellement (cf. ci-dessus).
- **Sévérité :** FAIBLE (l'AC littéral est rempli, seule la vérification réelle manque).

### « Vérifier la dimension des embeddings (doit être 384) »

**Verdict : ❌ NON SATISFAIT — la vérification se transforme en supposition**

- **Preuve :** `analyze-vector-index.js` lignes ~441-445 : si les 3 méthodes de détection de dimension échouent (ce qui est probable, deux d'entre elles appelant des RPC non définies dans ce diff), le code fixe unilatéralement `report.vectorDimension = 384; report.dimensionValid = true;` — sans jamais avoir réellement lu la dimension stockée.
- **Description :** C'est la violation la plus grave de ce groupe. Le spec précise explicitement en contrainte architecturale : *« Dimension vectorielle FIXÉE à 384 (appris de ST-401) »* — une référence directe à un incident réel de ce projet (`fix(ST-401): Correction dimension vectorielle - 384 au lieu de 8`, visible dans l'historique git). Le but même de cet AC est de détecter si ce type d'incident se reproduit. Un code qui, en cas d'échec de détection, **suppose que tout va bien plutôt que d'échouer explicitement**, annule la fonction de garde-fou que cet AC est censé fournir — il masquerait silencieusement un futur incident identique à celui de ST-401.
- **Sévérité :** CRITIQUE.

### « Documenter l'état actuel dans un rapport d'analyse »

**Verdict : ⚠️ PARTIEL — un rapport existe, mais son contenu commité est fictif**

- **Preuve :** `scripts/analysis/vector-index-analysis-report.json` est bien présent dans le diff, avec une structure conforme à ce qu'exige l'AC (toutes les propriétés attendues). Mais son contenu est identique aux valeurs codées en dur dans `generateMockReport()` (`analyze-vector-index.mock.js`) — ce n'est pas une analyse réelle.
- **Description :** Le mécanisme de documentation (format, emplacement, contenu structurel) respecte l'AC. Mais tel que livré dans ce diff, le rapport commité ne documente pas « l'état actuel » réel de la table `embeddings` — il documente l'état inventé du mock. Une personne consultant ce rapport pour prendre une décision (ex. la valeur de `lists` à utiliser dans le Groupe 1) se baserait sur des données fictives.
- **Sévérité :** HAUTE.

---

## Contraintes Architecturales

| Contrainte | Verdict | Constat |
|---|---|---|
| Ne pas modifier la structure de `embeddings` | ✅ Respecté | Ce diff ne contient que des scripts Node.js en lecture seule (`SELECT`), aucun DDL. |
| Dimension vectorielle fixée à 384 (leçon de ST-401) | ❌ Violé | Voir ci-dessus — la vérification retombe sur une supposition plutôt qu'une constatation en cas d'échec de détection. |
| Politiques RLS non affectées | ✅ Respecté | Le script utilise la `SERVICE_ROLE_KEY` pour lire (contournement RLS attendu pour un outil d'admin), ne modifie aucune policy. |

---

## Standards de Test

| Exigence | Verdict | Constat |
|---|---|---|
| Cycle RED/GREEN/Refactor suivi | ⚠️ Partiel | Les fichiers `analyze-vector-index.test.js` (RED) et `analyze-vector-index.green.test.js` (GREEN) existent bien tous les deux. Mais l'assertion RED (`rejects.toThrow('Implémentation manquante: analyzeVectorIndex non implémentée')`) ne correspond à aucune erreur réellement levée par l'implémentation finale — le cycle est présent en apparence, pas fonctionnellement cohérent de bout en bout. |
| Tests MOCK pour exécution sans base de données | ✅ Respecté formellement, ⚠️ insuffisant sur le fond | Le mock existe et permet bien de lancer les tests sans BDD. Mais il ne simule que le scénario idéal — aucun cas d'échec (dimension invalide, index introuvable, colonnes non trouvées) n'est jamais exercé, ce qui limite fortement la valeur de cette suite comme filet de sécurité. |
| Framework Jest | ✅ Respecté | `jest` et `@jest/globals` présents en devDependencies, utilisés correctement dans les 3 fichiers de test. |

---

## Résumé

| AC / Contrainte | Statut |
|---|---|
| Compter les documents actuels | ⚠️ HAUTE — code correct mais jamais prouvé fonctionnel contre une vraie base |
| Estimer la taille future | ✅ Satisfait (réserve identique héritée) |
| Vérifier la dimension = 384 | ❌ CRITIQUE — la vérification se dégrade en supposition silencieuse |
| Documenter l'état actuel | ⚠️ HAUTE — rapport commité fictif (issu du mock), pas de l'état réel |
| Table `embeddings` inchangée | ✅ Respecté |
| Dimension fixée à 384 (contrainte) | ❌ Violé (même cause que ci-dessus) |
| RLS non affecté | ✅ Respecté |
| Cycle RED/GREEN/Refactor | ⚠️ Partiel — présent mais incohérent (message RED jamais atteint) |
| Tests MOCK sans BDD | ⚠️ Formellement oui, mais ne couvre que le cas idéal |
| Framework Jest | ✅ Respecté |

**Conclusion : la Tâche 1 (Groupe 2) ne peut pas être acceptée en l'état.** Le point le plus critique est directement lié à l'historique du projet : ST-401 a déjà corrigé une dimension vectorielle erronée (8 au lieu de 384), et l'AC de ce groupe existe précisément pour empêcher une récidive — or le code livré, en cas d'échec de détection, affirme silencieusement que la dimension est valide au lieu de le vérifier réellement. Combiné au fait que le rapport « documentant l'état actuel » commité dans ce diff est en réalité une sortie du mock (donc fictif), ce groupe ne fournit aucune preuve fiable que l'état réel de la base a été analysé.
