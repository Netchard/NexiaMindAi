# Edge Case Hunter — Résultats (ST-402, Groupe 1)

*12 chemins/conditions limites non gérés, détectés par traçage mécanique des branches sur les deux fichiers SQL.*

## 📄 `supabase/migrations/20260712_optimize_vector_index.sql`

| # | Où | Condition de déclenchement | Conséquence potentielle |
|---|-----|---------------------------|--------------------------|
| 1 | lignes 16-37 (ÉTAPE 1) | La table/l'extension existent mais la colonne `embeddings.vector` est absente ou renommée | `CREATE INDEX` échoue plus tard avec une erreur peu claire "colonne inexistante" |
| 2 | lignes 43-87 (ÉTAPE 2) | La migration est ré-exécutée après un échec partiel précédent | Des lignes d'historique dupliquées s'accumulent, l'audit devient peu fiable |
| 3 | lignes 116-139 (ÉTAPE 4→5) | `CREATE INDEX` échoue juste après que `DROP INDEX` a réussi | La table reste **sans aucun index vectoriel** jusqu'à intervention manuelle |
| 4 | lignes 116-139 (ÉTAPE 4→5) | Requêtes/écritures concurrentes sur `embeddings` pendant le DROP/CREATE | Les requêtes en cours se bloquent (verrou ACCESS EXCLUSIVE) pendant toute la migration |
| 5 | lignes 164-167 (ÉTAPE 6) | Plusieurs lignes d'historique ont `new_config IS NULL` (suite à des tentatives répétées) | Le `UPDATE` les écrase toutes de façon identique, l'historique par tentative est perdu |
| 6 | lignes 190-193 (ÉTAPE 7) | La ligne de référence choisie par `LIMIT 1` sans `ORDER BY` est instable, ou son vecteur est `NULL` | Test non déterministe d'un run à l'autre ; un vecteur `NULL` fait passer le test silencieusement |
| 7 | ligne 184 (ÉTAPE 7) | Le rôle exécutant ne contourne pas RLS sur `embeddings` | Le test croit la table vide alors qu'elle a des données (RLS masque les lignes), validation ratée en silence |
| 8 | ligne 106 (ÉTAPE 3) | Le nombre réel de lignes dans `embeddings` est très éloigné de ce que `lists=200` suppose | Mauvais rappel (recall) ou mémoire gaspillée par un `lists` mal calibré vs la taille réelle |

## 📄 `supabase/sql/create-optimized-vector-index.sql`

| # | Où | Condition de déclenchement | Conséquence potentielle |
|---|-----|---------------------------|--------------------------|
| 9 | lignes 12-21 | La table `public.embeddings` n'existe pas du tout à l'exécution | `DROP`/`CREATE INDEX` échouent avec un "relation does not exist" non anticipé (contrairement au fichier de migration qui vérifie ça) |
| 10 | lignes 46-76 | `CREATE INDEX` échoue juste après que `DROP INDEX` a réussi | Table laissée **sans index vectoriel** jusqu'à correction manuelle |
| 11 | lignes 46-76 | Requêtes/écritures concurrentes pendant le DROP/CREATE | Blocage des requêtes en cours (verrou ACCESS EXCLUSIVE) le temps du script |
| 12 | lignes 107-118 | Même souci de `LIMIT 1` sans `ORDER BY` + rôle sans bypass RLS | Test non déterministe ou masqué par RLS, validation de l'index non fiable |

---

## Point le plus important

**Findings #3/#10 et #4/#11** : le couple `DROP INDEX` puis `CREATE INDEX` n'est protégé par aucune transaction explicite ni option `CONCURRENTLY`. Concrètement :

- Si la création du nouvel index échoue (ce qui vient d'arriver plusieurs fois dans cette conversation — mémoire, syntaxe...), **l'ancien index est déjà supprimé** et rien ne le remplace tant que le problème n'est pas corrigé et le script relancé.
- Pendant toute la fenêtre DROP→CREATE, Postgres pose un verrou `ACCESS EXCLUSIVE` sur `embeddings`, donc toute requête RAG en cours (ou write) est bloquée.

Correctif possible : utiliser `CREATE INDEX CONCURRENTLY` avec un nom d'index temporaire, puis basculer (rename) une fois le nouvel index validé — pattern standard pour un remplacement d'index sans interruption.
