Blind Hunter — Rapport de Revue (ST-402, Groupe 1)
Revue aveugle basée uniquement sur le diff fourni, sans contexte projet externe.

🔴 CRITIQUE
1. \set est une méta-commande psql, pas du SQL — échec immédiat

Preuve : 20260712_optimize_vector_index.sql ligne 137 : \set OPTIMAL_LISTS 200 ; même chose dans create-optimized-vector-index.sql ligne 339.
Impact : Tout exécuteur qui n'est pas le binaire psql interactif (CLI db push, Studio SQL Editor, driver Postgres programmatique) envoie ce texte tel quel au serveur. Postgres ne comprend pas \, donc erreur de syntaxe immédiate dès la première étape utile du script — le reste ne s'exécute jamais.
Recommandation : Remplacer par une valeur littérale, ou déporter la substitution dans un DO $$ ... EXECUTE format(...) $$ si une paramétrisation dynamique est vraiment nécessaire.
2. :OPTIMAL_LISTS référencé en dehors de psql

Preuve : WITH (lists = :OPTIMAL_LISTS) — migration ligne 166, script ligne 369.
Impact : Même cause que #1 : :variable est une interpolation côté client psql. Hors psql, le serveur reçoit littéralement :OPTIMAL_LISTS, syntaxe invalide (: n'a pas de sens en SQL standard) → échec de la création d'index elle-même.
Recommandation : Valeur littérale codée en dur, avec un commentaire clair indiquant où la changer.
3. regexp_matches() (set-returning function) utilisé dans un CASE

Preuve : migration lignes 104-108, bloc ÉTAPE 2.
Impact : PostgreSQL interdit les SRF dans un CASE depuis longtemps → ERROR: 0A000: set-returning functions are not allowed in CASE. Bloque toute la sauvegarde de configuration avant même d'arriver à la création d'index.
Recommandation : Remplacer par substring(indexdef from 'lists\s*=\s*(\d+)')::int, qui ne renvoie qu'une valeur scalaire (ou NULL).
4. Collision de nom entre variable PL/pgSQL et colonne de table

Preuve : migration lignes 174-194, bloc ÉTAPE 6 : DECLARE new_config JSONB; ... UPDATE vector_index_history SET new_config = new_config WHERE ... AND new_config IS NULL;
Impact : new_config est à la fois une variable locale et une colonne de la table cible dans la même instruction UPDATE ... SET → ERROR: 42702: column reference "new_config" is ambiguous.
Recommandation : Préfixer la variable (v_new_config) pour lever toute ambiguïté.
5. PERFORM (sous-requête à 2 colonnes) — erreur retardée, ne se déclenche qu'avec des données

Preuve : migration lignes 215-220 ; script (avec en plus un vecteur factice invalide) lignes 405-410.
Impact : Entourée de parenthèses, la sous-requête est traitée comme une expression scalaire, qui exige exactement une colonne. Ici il y en a deux (chunk_id, distance) → subquery must return only one column. Comme le bloc est gardé par IF EXISTS (SELECT 1 FROM embeddings LIMIT 1), ce bug est invisible sur une base vide et n'explose qu'en environnement réel avec des données — piège classique de test insuffisant.
Recommandation : Retirer les parenthèses (PERFORM col1, col2 FROM ... ;), syntaxe standard qui accepte n'importe quelle forme de résultat.
6. Vecteur de test syntaxiquement invalide dans create-optimized-vector-index.sql

Preuve : ligne 406 : vector <=> '[0.1, 0.2, 0.3, ...]'::vector(384).
Impact : ... n'est pas un nombre valide et seulement 3 valeurs sont fournies pour une dimension déclarée à 384. Le parseur d'entrée de pgvector rejettera ce littéral avant même que le bug #5 ne s'applique — échec garanti dès qu'il y a au moins une ligne dans embeddings. Ressemble à du pseudo-code jamais réellement testé.
Recommandation : Utiliser un vrai embedding de la table, comme le fait la migration ailleurs : (SELECT vector FROM embeddings LIMIT 1).
🟠 HAUTE
7. Aucune gestion de maintenance_work_mem avant CREATE INDEX ... USING ivfflat WITH (lists = 200)

Preuve : migration lignes 163-166 ; script lignes 366-369.
Impact : La construction d'un index ivfflat avec lists=200 est gourmande en mémoire ; le maintenance_work_mem par défaut sur Supabase (souvent 32-64 MB) est généralement insuffisant → ERROR: 54000: memory required is X MB, maintenance_work_mem is 32 MB. Prévisible et systématique, pas un cas limite.
Recommandation : SET maintenance_work_mem = '256MB'; avant le CREATE INDEX, RESET après.
8. Documentation dangereuse : supabase db reset --db-url ... recommandé pour "juste" recréer un index

Preuve : script, section "Pour exécuter avec Supabase CLI" (lignes 443-445).
Impact : db reset réinitialise entièrement la base cible et rejoue toutes les migrations depuis zéro — destructeur pour toute donnée existante. Présenté ici comme une commande anodine à côté d'un script censé être un simple "create-or-update index", c'est le genre d'instruction qui cause un incident de prod si quelqu'un la suit sur un --db-url non-local.
Recommandation : Retirer cette ligne ou l'entourer d'un avertissement explicite (« UNIQUEMENT en local/dev, jamais sur un environnement avec données réelles »).
🟡 MOYENNE
9. Regex à double antislash ne matche jamais — lists sera toujours NULL dans l'historique

Preuve : migration ligne 105-106 : 'lists\\s*=\\s*(\\d+)' (chaîne simple, pas E'', donc antislash traité littéralement).
Impact : Même une fois le bug #3 corrigé, ce pattern cherche littéralement \s (backslash + s) dans indexdef, ce qui n'existe jamais → la valeur lists sauvegardée pour rollback est systématiquement NULL, silencieusement. Le mécanisme de rollback perd une information censée le rendre fiable.
Recommandation : Un seul antislash par échappement : 'lists\s*=\s*(\d+)'.
10. :OPTIMAL_LISTS à l'intérieur de littéraux RAISE NOTICE / COMMENT — même sous psql réel, ne serait pas substitué

Preuve : migration ligne 197, 239 ; script ligne 378, 458.
Impact : Selon la documentation psql, l'interpolation de variable n'a pas lieu à l'intérieur des chaînes littérales entre guillemets. Donc même en supposant que le script tourne via un vrai psql, ces messages afficheraient littéralement le texte :OPTIMAL_LISTS au lieu de la valeur — logs et commentaires d'index trompeurs.
Recommandation : Utiliser RAISE NOTICE '... %', 200; (format) plutôt que d'injecter la variable dans la chaîne.
11. Insertion non-idempotente dans vector_index_history

Preuve : migration lignes 111-112 (INSERT INTO vector_index_history ...), sans garde contre une ré-exécution du même migration_name.
Impact : Vu le nombre d'échecs partiels probables sur ce script (plusieurs CRITIQUE ci-dessus provoquent un abandon en plein milieu), toute tentative de relance après correction insère une nouvelle ligne d'historique dupliquée pour le même migration_name, et le futur UPDATE ... WHERE new_config IS NULL (bug #4) risque de cibler la mauvaise ligne si plusieurs correspondent.
Recommandation : Ajouter une contrainte d'unicité sur migration_name ou vérifier l'absence d'une ligne existante avant d'insérer.
⚪ FAIBLE
12. DROP INDEX idx_embeddings_vector; sans IF EXISTS malgré une vérification préalable

Preuve : migration ligne 152, comparé à create-optimized-vector-index.sql ligne 354 qui utilise bien DROP INDEX IF EXISTS.
Impact : Fenêtre de course théorique (TOCTOU) entre le IF EXISTS et le DROP ; en pratique très improbable en exécution single-thread, mais incohérence entre les deux fichiers qui font pourtant la même chose.
Recommandation : Harmoniser sur DROP INDEX IF EXISTS dans les deux fichiers.
13. Deux scripts quasi-identiques (~90 % de code dupliqué) à maintenir en parallèle

Preuve : l'ensemble du diff — 20260712_optimize_vector_index.sql et create-optimized-vector-index.sql répètent la même logique (vérif extension, suppression/création d'index, test de similarité).
Impact : Chaque bug ci-dessus (\set, PERFORM, mémoire) existe en double ; corriger un fichier sans l'autre laisse un script cassé en place. Risque de divergence future.
Recommandation : N'avoir qu'une source de vérité (la migration), et faire du second fichier soit un simple pointeur/doc, soit le supprimer.
14. Commentaire trompeur sur RLS et SERVICE ROLE KEY

Preuve : migration lignes 235-236 / script ligne 434 : « DOIT être exécutée avec la SERVICE ROLE KEY pour contourner les politiques RLS pendant la création de l'index ».
Impact : Le DDL (CREATE INDEX, DROP INDEX, CREATE TABLE) n'est jamais soumis aux politiques RLS — RLS ne s'applique qu'aux DML (SELECT/INSERT/UPDATE/DELETE) via des policies sur des rôles non-propriétaires de la table. L'affirmation est trompeuse : elle peut faire croire à tort qu'un exécuteur de migration standard sera bloqué par RLS, ou au contraire donner une fausse confiance que RLS est « géré » alors qu'il n'entre simplement pas en jeu ici.
Recommandation : Corriger ou retirer cette note ; la vraie raison de nécessiter un rôle privilégié (le cas échéant) est liée aux droits DDL sur le schéma, pas à RLS.
15. Aucune vérification que la colonne embeddings.vector existe / a bien 384 dimensions

Preuve : ÉTAPE 1 des deux fichiers ne vérifie que l'existence de la table et de l'extension pgvector, pas celle de la colonne vector ni sa largeur.
Impact : Étant donné qu'un bug de dimension vectorielle (384 vs 8) a déjà été corrigé récemment sur ce projet (cf. historique récent « fix ST-401 »), ce type de dérive de schéma s'est déjà produit. Si la colonne diffère, CREATE INDEX échouera avec un message générique peu clair plutôt qu'un message de garde explicite.
Recommandation : Ajouter une vérification explicite de la colonne et de sa dimension dans le bloc ÉTAPE 1, avec un message d'erreur clair.
Résumé : 6 findings CRITIQUE garantissant un échec total du script tel quel, 2 HAUTE (mémoire, doc dangereuse), 3 MOYENNE (bugs silencieux qui corrompent des données/logs sans planter), 4 FAIBLE (cohérence, duplication, doc trompeuse, garde manquante).
