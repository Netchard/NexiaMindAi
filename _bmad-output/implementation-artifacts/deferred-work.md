# Deferred Work

## Deferred from: code review of 4-302-implementer-authentification (2026-07-04)

- `UserMenu` affiche `user.user_metadata.avatar_url` via `next/image` sans domaine distant configuré — latent, aucun risque tant qu'aucun flux (auth email-only actuellement) ne renseigne ce champ.
- `PUBLIC_PAGE_ROUTES` de `src/proxy.ts` ne couvre pas `/robots.txt`, `/sitemap.xml`, `/manifest.json` — ces fichiers n'existent pas encore dans le projet, à revisiter s'ils sont ajoutés.
- Un utilisateur déjà connecté n'est pas redirigé hors de `/auth/login`/`/auth/signup` — confort UX mineur, non bloquant.
- Contexte et handlers de `src/components/Auth/AuthProvider.tsx` non mémoïsés (re-render à chaque tick d'auth) — micro-optimisation sans impact mesurable à l'échelle actuelle.
- Couverture de tests superficielle sur les composants Auth (plusieurs tests `typeof X === 'function'`, AC "25+ tests" au-dessus des ~21 réellement ajoutés) — déjà tracé dans la section Tests de la story ST-302 (intégration/sécurité/accessibilité/E2E restent à faire).
- `UserMenu` pointe vers `/profile`, `/settings`, `/history` — aucune de ces routes n'existe (404 garanti). Liens conservés (choix produit), gap documenté ici pour une future story qui créera ces pages.

## Deferred from: code review of 4-304-implementer-les-filtres-de-recherche (2026-07-07)

- Régression hors-sujet dans `getHistory()` (`src/components/Chat/api.ts:68-75`) : l'URL est reconstruite par concaténation de template string au lieu de `new URL(...) + searchParams`, changement sans rapport avec les filtres, bundlé dans le même diff. Aucun impact fonctionnel réel constaté (`limit`/`offset` sont toujours des nombres, rien à échapper), donc non corrigé — à surveiller si ces paramètres deviennent un jour des chaînes libres.

## Deferred from: code review of 4-305-afficher-les-citations-de-sources (2026-07-08)

- Emoji hardcodé non i18n dans le titre "📚 Sources :" [SourceCitationList.tsx:27] — problème général d'internationalisation hors scope de ST-305
- Icône texte "→" au lieu de composant iconographique [SourceCitation.tsx:103] — décision design system à prendre au niveau projet
- Valeurs string pour unités CSS dans style objects [SourceCitation.tsx:133,135] — préférence de style, pas bloquant fonctionnellement
- Typographie Geist Sans non spécifiée explicitement dans les composants — héritée du parent, pas responsable de ST-305
- Border radius manquant (8/10/16px) dans les styles inline — style optionnel, pas bloquant pour les acceptance criteria

## Deferred from: code review of 5-401-configurer-les-politiques-de-securite-rls (2026-07-12)

- Accès `consultant` (et pattern réutilisé sur chunks/embeddings) non scopé au client assigné — les politiques vérifient seulement `client_id IS NOT NULL`, jamais comparé au client réel du consultant ; un consultant peut lire les documents/chunks/embeddings de tous les clients. Aucun mapping consultant→client n'existe sur `profiles`. Déférré : faible risque à court terme (peu de consultants actifs), nécessitera l'ajout d'une colonne ou table de mapping.
- Politique "Project leads can view project documents" tautologique — `(client_id IS NULL OR client_id IS NOT NULL)` est toujours vraie, donc les project_lead ont un accès illimité aux documents au lieu d'un accès scopé à leur(s) projet(s). Même cause racine que le finding consultant ci-dessus (pas de mapping project_lead→client/projet).
- `documents` n'a aucune politique RLS UPDATE/DELETE — RLS est activé mais aucune politique d'écriture n'existe pour cette table (seul le service role peut modifier/supprimer). Déférré : pas de cas d'usage applicatif actuel ; nécessitera probablement une colonne `owner_id`/`created_by` si un usage self-service est ajouté plus tard.

## Deferred from: code review of 5-404-creer-les-index-classiques (2026-07-15)

- Critères "quand éviter les index" (tables très petites, faible cardinalité) jamais appliqués aux tables réelles `chunks`/`conversations`/`messages` dans la doc — aucune volumétrie/cardinalité documentée pour justifier les 7 index créés. Amélioration de rigueur documentaire, non bloquante.
- Schémas de table complets (chunks/conversations/messages) dupliqués intégralement dans `docs/database/indexes.md` sans référence de version — risque de dérive si le schéma source change ailleurs. Non actionnable simplement sans système de versioning des schémas au niveau projet.

## Deferred from: code review of 5-405-sauvegarder-la-structure-de-la-base (2026-07-15)

- Pas de garde-fou environnement (production vs test) au-delà d'un simple prompt oui/non pour la combinaison destructive `--drop --yes` dans `restore-db.js`. Déférré : la documentation recommande déjà de toujours tester la restauration hors production ; amélioration de sécurité pertinente si le script est un jour utilisé dans un pipeline de production automatisé.
- **Test de restauration réelle jamais exécuté (2026-07-15)** : `restore-db.js` a été entièrement réécrit (exécution SQL réelle via RPC Supabase) et vérifié par relecture de code + tests unitaires manuels (parsing CLI, protection de chemin), mais jamais exécuté contre une vraie restauration — la seule base disponible est celle de production, et `restore-db.js` sans `--drop` y échouerait de toute façon sur des contraintes déjà existantes. Décision (Dday, 2026-07-15) : ne pas risquer les données de production pour ce test ; le différer jusqu'à ce qu'un projet Supabase de test séparé soit provisionné. Voir `docs/database/backup-test-report.md` (Test 3-4) pour le détail. **Ne pas considérer la story 5-405 comme `done` tant que ce test n'a pas été réalisé.**

## Accueil (spec-accueil-page-fonctionnelle.md) — 2026-07-18
- Recherche Codexia (`getConversations()` côté accueil) peut manquer une conversation existante si le cache 1-min de `src/lib/api/conversations.ts` est périmé après un échec réseau (fallback sur cache stale). Pré-existant au module partagé (hors périmètre de la story accueil, marqué "consommé tel quel" dans le Code Map) — à revisiter si ça devient un problème observé en usage réel.

## Deferred from: code review of spec-documents-upload-indexation (2026-07-19)

- Validation des types de fichiers uniquement par extension (client et serveur), pas de vérification du contenu réel (magic bytes / type MIME). Mirroir exact de `detectContentType()` dans `src/lib/supabase/storage/ocr.ts`, qui est déjà extension-based — pattern préexistant à l'échelle du projet, pas une régression introduite par cette story. Renommer un fichier suffit à passer le filtre ; à durcir si l'app devient exposée à des dépôts non fiables.
- Aucune limite de taille par fichier ni de nombre de fichiers dans `/api/documents/upload` ; chaque fichier est entièrement bufferisé en mémoire et les uploads sont traités séquentiellement (pas en parallèle). Risque de timeout/consommation mémoire sur de gros lots — non demandé explicitement par la spec, à chiffrer si des lots volumineux deviennent un usage réel.
- Aucun état "indexé" distinct dans `FileStatus` (`documents/page.tsx`) après un `handleIndex()` réussi : les fichiers restent `'uploaded'`, donc rien n'empêche de recliquer "Lancer l'indexation" et de ré-indexer le même préfixe. `storageIndexer.indexAll` (préexistant, hors périmètre) n'a pas été audité ici pour son comportement de dédoublonnage de chunks en cas de ré-indexation.
- Pas de validation défensive de la forme de la réponse JSON de `/api/documents/upload` côté client (`data.results` supposé être un tableau) avant d'itérer dessus — si l'API dérive un jour de son contrat, ça lèverait une exception au lieu d'un message d'erreur propre.
- Pas de signal UI dédié si `storageIndexer.indexAll` renvoie `processed: 0` juste après un upload (latence de propagation du listing Storage) — risque jugé faible (Supabase Storage n'est pas connu pour une cohérence éventuelle comme S3), à surveiller si observé en usage réel.

## Bugs pré-existants trouvés en testant manuellement `/documents` (2026-07-19)

Ces deux bugs existaient dans `src/lib/supabase/storage/` avant la story documents-upload-indexation (hérités de ST-201/ST-204) ; ils sont corrigés car ils bloquaient de bout en bout le test manuel de la nouvelle page, mais ne faisaient pas partie du Code Map initial de la spec :

- **`listFiles()` construisait un chemin invalide pour tout prefix non-racine** (`client.ts`) : reposait sur `metadata.full_path`, un champ que l'API Storage de Supabase ne renvoie jamais. Corrigé pour reconstruire le chemin à partir du `prefix` réellement passé. Les 2 tests dont les mocks simulaient ce champ inexistant ont été corrigés en conséquence.
- **`indexer.ts` écrivait dans `documents`/`chunks`/`embeddings` via le client anon (`../server`) au lieu du client service-role (`../admin-client`)** : ces tables ont RLS activé sans policy d'écriture pour les rôles non-service (constat déjà tracé dans "Deferred from: code review of 5-401..." ci-dessus) — l'upsert échouait silencieusement (`Document upsert failed: [object Object]`, l'erreur Postgrest n'étant pas une instance de `Error`, donc mal formatée par `handleSupabaseError`). Corrigé en alignant sur le pattern déjà établi dans `src/app/api/chat/message/route.ts`. Le mock de test associé (`indexer.test.ts`) a été mis à jour pour cibler le bon module ; **14 échecs pré-existants dans ce fichier subsistent** (mock `mockSupabaseClient.from()` incomplet — pas de `.upsert()`/`.limit()` mockés — indépendant du client utilisé), non corrigés ici car hors périmètre de cette story et nécessitant une reprise plus large du fichier de test.
- **`handleSupabaseError` (indexer.ts) suppose que toute erreur est une instance de `Error`** : les erreurs Postgrest/Storage de `@supabase/supabase-js` sont des objets simples, donc `String(error)` produit `[object Object]` au lieu du message réel — masque les futures erreurs de base de données derrière un message inexploitable. Non corrigé (hors périmètre immédiat), mais à corriger en priorité si d'autres erreurs Supabase opaques réapparaissent en logs.
