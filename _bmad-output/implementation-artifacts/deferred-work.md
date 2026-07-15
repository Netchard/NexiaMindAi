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
