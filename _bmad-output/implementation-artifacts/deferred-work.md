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
