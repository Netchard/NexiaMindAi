---
name: NexiaMind AI — Auth
status: final
sources:
  - _bmad-output/planning-artifacts/brief-nexiamind-ai/brief.md
  - _bmad-output/planning-artifacts/prd-nexiamind-ai/prd.md
updated: 2026-07-07
---

# NexiaMind AI — Auth Experience Spine

> Périmètre : les 4 pages d'authentification existantes (connexion, inscription, mot de passe oublié, réinitialisation). Refonte visuelle sur une base fonctionnelle déjà en place (`src/components/Auth/*`, Supabase Auth). `DESIGN.md` est la référence visuelle ; cette spine couvre le comportement.

## Foundation

Web responsive, Next.js App Router + Tailwind CSS (pas de librairie de composants). Formulaires et logique déjà implémentés (`LoginForm`, `SignupForm`, `ForgotPasswordForm`, `useAuth`). Cette itération pivote l'habillage visuel vers le thème sombre de `docs/Maquette-ux-NexiaMind AI.html` (voir `DESIGN.md`) et retire une capacité fonctionnelle existante : l'authentification sociale (`SocialAuth` — Google/GitHub/GitLab), absente de la maquette de référence et retirée sur décision utilisateur explicite (voir `DESIGN.md.[NOTE FOR UX]`). Le reste de la logique métier (validation, redirection, gestion d'erreur) ne change pas.

`[NOTE FOR UX]` Point technique à traiter en implémentation : le layout racine (`src/app/layout.tsx`) englobe **tous** les enfants — y compris `/auth/*` — dans `<Navbar />` et `<Footer />`, alors que `src/app/auth/layout.tsx` documente l'intention inverse ("exclut la Navbar et le Footer"). Cette intention n'est aujourd'hui pas honorée par le code. Le layout split-screen plein écran de ce spine n'a de sens que sans Navbar/Footer autour. À corriger en implémentation (ex. : `Navbar`/`Footer` deviennent des composants clients qui se masquent eux-mêmes sur les routes `/auth/*` via `usePathname`).

Public : consultants techniques, développeurs, chefs de projet — utilisateurs professionnels internes, pas grand public. Un seul chemin d'authentification exposé à l'écran : email/mot de passe ; le filtrage par profil (Manager/Chef de Projet/Développeur/Admin, NF-011) intervient après connexion, hors périmètre de cette spine.

## Information Architecture

| Surface | Atteinte depuis | Objectif |
|---|---|---|
| Connexion (`/auth/login`) | Lien direct, redirection depuis une route protégée non authentifiée | Authentifier un utilisateur existant |
| Inscription (`/auth/signup`) | Lien "Pas encore de compte ?" depuis Connexion | Créer un nouveau compte |
| Mot de passe oublié (`/auth/forgot-password`) | Lien "Mot de passe oublié ?" depuis Connexion | Déclencher l'envoi d'un lien de réinitialisation |
| Réinitialisation (`/auth/reset-password?code=…`) | Lien reçu par email (flux PKCE Supabase) | Définir un nouveau mot de passe |

Les 4 surfaces partagent la même composition split-screen (`DESIGN.md.Components.hero-panel` + carte formulaire) et se referment les unes sur les autres par des liens croisés en bas de carte — jamais de redirection automatique sans action utilisateur, sauf le cas d'erreur ci-dessous.

→ Référence de composition : `mockups/login.html`, `mockups/signup.html`. Spine gagne en cas de conflit.

## Voice and Tone

Microcopy. La posture de marque vit dans `DESIGN.md.Brand & Style`.

| Do | Don't |
|---|---|
| "Connexion à NexiaMind AI" | "Salut ! Contente de te revoir 👋" |
| "Adresse email" / "Mot de passe" | "Ton email" / "Ton mot de passe" (le produit vouvoie, contexte pro) |
| "Vérifiez votre email" | "Youpi, presque fini !" |
| "Ce lien de réinitialisation est invalide ou a expiré." | "Oups, un souci est survenu 😅" |
| Messages d'erreur factuels et actionnables | Messages d'erreur génériques ("Une erreur est survenue") sans piste de résolution |

Le français existant dans les composants est déjà globalement dans ce registre (vouvoiement, factuel) — à conserver tel quel, ne pas re-rédiger les textes qui respectent déjà cette grille.

## Component Patterns

Comportemental. Les specs visuelles vivent dans `DESIGN.md.Components`.

| Composant | Usage | Règles comportementales |
|---|---|---|
| Champ email/mot de passe | Toutes les surfaces | Validation HTML native (`required`, `type="email"`, `minLength`) conservée. Erreur serveur efface au premier caractère retapé (déjà implémenté via `useEffect`) — comportement à garder. |
| Toggle afficher/masquer mot de passe | Connexion, Inscription, Réinitialisation | Icône œil, `aria-label` dynamique déjà correct — conserver. N'affecte jamais `autoComplete`. |
| Bouton principal | Toutes les surfaces | Désactivé tant que les champs requis ne sont pas remplis (déjà en place). État chargement = spinner + libellé au participe présent ("Connexion en cours…") — conserver le pattern existant sur les 4 pages (actuellement absent sur Reset : `Réinitialisation en cours...` texte seul sans spinner — à harmoniser avec le spinner utilisé ailleurs). |
| Bannière d'erreur | Toutes les surfaces | Une seule bannière visible à la fois, positionnée entre le titre et le formulaire. Disparaît dès que l'utilisateur modifie un champ (pattern existant sur Login/Signup — à répliquer sur Forgot/Reset qui n'ont pas cet auto-clear aujourd'hui). |
| Lien croisé bas de carte | Toutes les surfaces | Un seul lien de navigation principal par carte ("S'inscrire" / "Se connecter" / "Retour à la connexion") — jamais plus d'un CTA secondaire pour ne pas diluer l'action principale. |
| Panneau hero (blobs animés) | Toutes les surfaces | Animation continue (3 masses radiales, cycles 14-19s, jamais synchronisées — voir `DESIGN.md.Components.hero-panel`) ; le titre `hero` peut varier légèrement par page (ex. "Bienvenue sur NexiaMind AI." en connexion, "Rejoignez NexiaMind AI." en inscription, "Réinitialisez votre mot de passe." en reset) mais reste court (≤ 5 mots) et jamais transactionnel. |

`[NOTE FOR UX]` **Retrait de `SocialAuth`.** Le composant `SocialAuth` (grille Google/GitHub/GitLab) est retiré de `LoginForm` et `SignupForm`. Impact implémentation : supprimer le rendu du composant et le séparateur "ou" associé ; ne pas supprimer le composant/la logique OAuth sous-jacente sans confirmation produit séparée (ce spine couvre l'UI, pas la dépréciation de la capacité d'auth côté Supabase) — le composant peut rester dans le code, simplement non monté sur ces écrans.

## State Patterns

| État | Surface | Traitement |
|---|---|---|
| Chargement initial (vérification du lien) | Réinitialisation | Message centré "Vérification du lien…" sans mise en page split-screen complète tant que la vérification n'est pas résolue (évite un flash de formulaire invalide). |
| Lien invalide/expiré | Réinitialisation | Bannière d'erreur explicite ; le formulaire de saisie du nouveau mot de passe reste affiché mais la soumission échouera proprement côté serveur — pas de blocage préventif agressif, l'utilisateur voit le message et peut redemander un lien via Connexion. |
| Erreur de soumission (identifiants invalides, email déjà utilisé, réseau) | Toutes | Bannière d'erreur (`banner-error`), formulaire réactivé immédiatement (pas de re-render bloquant), focus reste sur le champ actif. |
| Chargement en cours | Toutes | Bouton désactivé + spinner, champs restent éditables (pas de verrouillage du formulaire pendant l'attente réseau — laisse l'utilisateur corriger s'il repère une faute de frappe). |
| Succès — inscription | Inscription | Remplace le formulaire par un état de confirmation ("Vérifiez votre email") — pattern déjà en place, recoloré uniquement. |
| Succès — demande de réinitialisation | Mot de passe oublié | Idem, avec lien de retour vers Connexion. |
| Succès — mot de passe changé | Réinitialisation | Confirmation + lien direct vers Connexion (pas de connexion automatique — l'utilisateur ressaisit ses identifiants, cohérent avec la pratique de sécurité déjà en place). |

## Interaction Primitives

- **Tab** suit l'ordre visuel du formulaire (logo → champs → bouton principal → liens). Pas d'ordre de tabulation custom.
- **Entrée** dans n'importe quel champ soumet le formulaire (comportement natif du `<form onSubmit>`, déjà correct).
- **Autofill navigateur** respecté — tous les `autoComplete` existants (`email`, `current-password`, `new-password`, `name`) sont conservés à l'identique.
- **Focus visible** : ring 2px `{colors.ring}` sur tout élément interactif (champ, bouton, lien, toggle œil) — jamais de `outline-none` sans remplacement visible.
- **Escape** : aucun comportement spécial (pas de modale sur ces surfaces).

## Accessibility Floor

Comportemental. Le contraste visuel vit dans `DESIGN.md`.

- WCAG 2.2 AA sur les 4 surfaces (aligné sur NF-033 du PRD — traité comme plancher malgré sa priorité "Could Have" globale, car ces pages sont le point d'entrée unique du produit).
- Chaque champ garde un `<label htmlFor>` explicite (déjà en place) — ne jamais remplacer par un placeholder seul.
- Bannière d'erreur annoncée aux lecteurs d'écran (`role="alert"` ou `aria-live="assertive"` à ajouter — absent du code actuel, à corriger en implémentation).
- Contraste du texte `hero`/`hero-sub` sur le dégradé garanti ≥ 4.5:1 via le scrim défini dans `DESIGN.md.Components.hero-panel` — vérifier au rendu, pas seulement en spec.
- Panneau d'illustration marqué `aria-hidden="true"` (purement décoratif, aucune information non redondante avec le formulaire) pour ne pas polluer la navigation au clavier/lecteur d'écran.
- Le bouton toggle mot de passe reste accessible au clavier (déjà un `<button type="button">`, correct) avec `aria-label` dynamique (déjà en place).

## Responsive & Platform

| Breakpoint | Comportement |
|---|---|
| `≥ lg` (1024px+) | Split-screen complet : panneau hero `{spacing.panel-split}` (~52%), formulaire sur le reste, pleine hauteur d'écran. |
| `md` (768–1023px) | Panneau d'illustration devient un bandeau compact (~220px) en haut avec le titre `hero` superposé ; formulaire pleine largeur en dessous. |
| `< md` (`sm`) | Même logique de bandeau, hauteur réduite (~160px), formulaire occupe le reste de l'écran avec padding `{spacing.gutter}`. Le panneau reste toujours visible (jamais masqué) pour préserver l'identité de marque dès le premier écran. |

Pas de version native mobile — web responsive uniquement, cohérent avec le reste du produit (NexiaMind AI est une application web).

## Key Flows

### Flow 1 — Connexion du lundi matin (Léa, consultante technique, 8h50)

1. Léa ouvre son navigateur sur `nexiamind.ai`, non authentifiée : elle atterrit sur `/auth/login`. Le panneau de gauche, sombre et animé par trois masses de couleur qui dérivent lentement, affiche "Bienvenue sur NexiaMind AI." — l'ambiance feutrée tranche immédiatement avec un formulaire d'entreprise générique.
2. Elle saisit son email professionnel, puis son mot de passe. Elle fait une faute de frappe sur le mot de passe et clique sur l'icône œil pour vérifier avant de soumettre.
3. Elle appuie sur Entrée. Le bouton "Se connecter" passe en état chargement (spinner), les champs restent visibles mais non modifiables le temps de la requête.
4. **Climax :** la connexion réussit — pas de rechargement brutal, elle est redirigée vers son espace de recherche en moins d'une seconde, l'écran de connexion n'a été qu'un passage bref et sans friction avant qu'elle ne pose sa première question du jour à NexiaMind AI.

Échec : mot de passe incorrect → bannière d'erreur factuelle ("Email ou mot de passe incorrect"), champ mot de passe vidé, focus dessus, Léa retape sans avoir à ressaisir son email.

### Flow 2 — Première inscription (Marc, nouveau développeur, son premier jour)

1. Marc reçoit un lien vers `/auth/signup` de la part de son manager. Le panneau hero affiche "Rejoignez NexiaMind AI." — variation du titre qui signale sans ambiguïté qu'il est au bon endroit pour créer un compte, pas se connecter.
2. Il remplit nom (optionnel), email professionnel, mot de passe — pas de choix de fournisseur social à faire, un seul chemin possible. L'aide sous le champ mot de passe lui indique les critères (8 caractères, majuscule, chiffre) avant qu'il ne se trompe.
3. Il confirme son mot de passe, clique sur "S'inscrire".
4. **Climax :** l'écran se transforme en confirmation — "Vérifiez votre email" — avec son adresse affichée en clair, il sait exactement quoi faire ensuite sans avoir à deviner ou revenir en arrière. Il ouvre son client mail dans un autre onglet, confiant.

Échec : email déjà utilisé → bannière d'erreur immédiate, formulaire conservé tel quel (rien à ressaisir sauf l'email), lien vers Connexion visible juste en dessous au cas où il aurait déjà un compte.
