# Acceptance Auditor — Résultats (ST-402, Groupe 1)

*Vérification du diff (`supabase/migrations/20260712_optimize_vector_index.sql`, `supabase/sql/create-optimized-vector-index.sql`) contre les Acceptance Criteria et contraintes architecturales du spec `5-402-optimiser-l-index-vectoriel.md`.*

---

## AC 1 — Index IVFFlat configuré avec le bon nombre de listes

**Verdict : ❌ NON SATISFAIT (bloquant)**

- **Preuve :** `CREATE INDEX idx_embeddings_vector ... WITH (lists = :OPTIMAL_LISTS);` précédé de `\set OPTIMAL_LISTS 200`.
- **Description :** `\set` et `:OPTIMAL_LISTS` sont des méta-commandes du client `psql` interactif, pas du SQL. Envoyé tel quel au moteur de migration Supabase (CLI `db push`, Studio SQL Editor), le script échoue avec une erreur de syntaxe avant même d'atteindre le `CREATE INDEX` — confirmé empiriquement dans cette conversation. L'AC exige de « créer ou recréer l'index... avec les paramètres optimisés » ; tel quel, le script ne crée **aucun index**, optimisé ou non.
- **Sévérité :** CRITIQUE.

**Verdict secondaire : ⚠️ PARTIEL — valeur non justifiée**

- **Preuve :** commentaire ligne ~102-106 : « Configuration déterminée par le benchmark » suivi directement de `lists = 200` codé en dur.
- **Description :** l'AC demande que X soit « déterminé par analyse de performance », avec des seuils indicatifs (100 pour <10K docs, 200 pour >10K docs). Le diff affirme que 200 est un résultat de benchmark, mais ne contient aucune donnée de dataset (nombre de documents) ni référence vérifiable à un rapport de benchmark réel dans le scope de ce diff — l'affirmation n'est pas auditable en l'état.
- **Sévérité :** MOYENNE.

---

## AC 2 — Test de performance avec différents paramètres (50/100/200/400)

**Verdict : ❌ NON VÉRIFIABLE DANS CE DIFF**

- **Preuve :** aucun des deux fichiers du diff ne contient de logique de test comparatif entre plusieurs valeurs de `lists`, ni de mesure de recall/temps de réponse. Seuls des commentaires renvoient vers `scripts/benchmark/` et `scripts/optimization/`, hors du scope de ce diff (Groupe 1 : « Core SQL & Migration »).
- **Description :** si cet AC est couvert par un autre groupe de fichiers (scripts JS de benchmark), il est hors périmètre de cette revue et cette non-conformité doit être re-vérifiée sur ce groupe-là. Dans le périmètre strict de ce diff, l'AC n'est pas honoré.
- **Sévérité :** MOYENNE (dépendante du scope — à confirmer avec le groupe couvrant les scripts de benchmark).

---

## AC 3 — Temps de réponse < 3s pour les requêtes de similarité

**Verdict : ❌ NON SATISFAIT**

- **Preuve :** ÉTAPE 7 des deux fichiers — le seul « test » présent exécute une requête de similarité via `PERFORM (...)` sans mesurer ni comparer aucun temps d'exécution à un seuil.
- **Description :** ce bloc vérifie uniquement que la requête ne lève pas d'exception (et même cette vérification est cassée : la sous-requête parenthésée à 2 colonnes `(SELECT chunk_id, vector <=> ... AS distance ...)` provoque `subquery must return only one column` dès qu'il y a des données). Aucun chronométrage, aucun `EXPLAIN ANALYZE`, aucune comparaison à la limite de 3 secondes n'existe dans ce diff. De plus, `create-optimized-vector-index.sql` utilise un vecteur de test littéralement invalide (`'[0.1, 0.2, 0.3, ...]'::vector(384)`), donc son test échouerait avant même de mesurer quoi que ce soit.
- **Sévérité :** CRITIQUE.

---

## AC 4 — Documentation des choix d'optimisation

**Verdict : ⚠️ PARTIEL**

- **Preuve :** `COMMENT ON INDEX ...` (ÉTAPE 8) documente le type, l'opérateur, la dimension et la valeur de `lists`, mais uniquement sous forme d'assertions (« optimisé par ST-402 »), sans les chiffres qui justifient le choix (recall mesuré, temps de réponse mesuré, trade-off explicite précision/performance).
- **Description :** l'AC demande explicitement de documenter « les résultats des tests de performance » et « les trade-offs entre précision et performance ». Le commentaire d'index dans ce diff ne contient ni l'un ni l'autre — c'est une déclaration d'intention, pas un compte-rendu de résultats.
- **Sévérité :** MOYENNE.

---

## Contraintes Architecturales (Dev Notes)

| Contrainte | Verdict | Constat |
|---|---|---|
| Ne pas modifier la structure de `embeddings` (vector reste `vector(384)`) | ✅ Respecté | Le diff ne contient aucun `ALTER TABLE` sur `embeddings`, uniquement des opérations d'index. |
| Index DOIT utiliser `ivfflat` | ✅ Respecté | `USING ivfflat (...)` présent dans les deux fichiers. |
| Index DOIT utiliser `vector_l2_ops` | ✅ Respecté | `vector vector_l2_ops` présent dans les deux fichiers. |
| Index DOIT être créé sur le schéma `public` | ✅ Respecté | `ON public.embeddings` dans les deux fichiers. |
| Politiques RLS existantes non affectées | ✅ Respecté, mais documentation trompeuse | Le diff ne contient aucun `ALTER ... ROW LEVEL SECURITY` ni `DROP POLICY` — la contrainte tient. **Cependant** les deux fichiers affirment à tort que « cette migration DOIT être exécutée avec la SERVICE ROLE KEY pour contourner les politiques RLS » : le DDL (CREATE/DROP INDEX) n'est jamais soumis à RLS, qui ne s'applique qu'au DML. Cette note contredit la réalité du mécanisme même si le résultat constaté (RLS non affecté) est correct. Sévérité FAIBLE (documentation, pas fonctionnel). |

---

## Résumé

| AC / Contrainte | Statut |
|---|---|
| AC1 — Index configuré avec lists optimisé | ❌ CRITIQUE — le script ne s'exécute pas (`\set`/`:OPTIMAL_LISTS`) |
| AC1 (bis) — valeur justifiée par benchmark | ⚠️ MOYENNE — affirmation non auditable dans ce diff |
| AC2 — Tests multi-configurations documentés | ⚠️ MOYENNE — absent de ce diff, probablement hors scope Groupe 1 |
| AC3 — Temps de réponse < 3s vérifié | ❌ CRITIQUE — aucune mesure, et le test présent est lui-même cassé |
| AC4 — Documentation des choix (chiffres, trade-offs) | ⚠️ MOYENNE — commentaire déclaratif sans données à l'appui |
| Contrainte table `embeddings` inchangée | ✅ Respecté |
| Contrainte `ivfflat` | ✅ Respecté |
| Contrainte `vector_l2_ops` | ✅ Respecté |
| Contrainte schéma `public` | ✅ Respecté |
| Contrainte RLS non affecté | ✅ Respecté (mais justification documentée erronée) |

**Conclusion : la story ST-402 (Groupe 1) ne peut pas être acceptée en l'état.** Les deux AC les plus critiques du DoD — un index réellement créé avec les paramètres optimisés (AC1), et un temps de réponse < 3s vérifié (AC3) — échouent tous deux : le script ne s'exécute pas jusqu'au bout sur Supabase, et aucune mesure de performance n'existe dans le diff pour étayer la conformité au seuil de 3 secondes.
