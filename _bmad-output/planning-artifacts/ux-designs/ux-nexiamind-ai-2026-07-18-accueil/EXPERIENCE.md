---
name: NexiaMind AI — Accueil
status: final
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-18-accueil/.memlog.md
  - _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md
updated: 2026-07-18
---

# NexiaMind AI — Accueil Experience Spine

> Périmètre : la page `/` (`src/app/page.tsx`), aujourd'hui le template Next.js par défaut, non modifiée. Écran unique, pas de sous-routes. Remplace le template starter par le hero, les deux CTA, les puces de suggestion et l'explicatif en 3 étapes décrits ici. Zone "avatar 3D" de la maquette hors périmètre (voir `DESIGN.md.Layout & Spacing`).

## Foundation

Web responsive, Next.js App Router + Tailwind CSS (pas de librairie de composants) — même socle technique que le chat. Visuel : voir `DESIGN.md` (fichier de ce dossier), qui étend `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md`.

`/` est une **route publique** au niveau du proxy (`src/proxy.ts`, `PUBLIC_PAGE_ROUTES`) — contrairement à `/chat`, elle ne redirige pas automatiquement un visiteur non connecté vers `/auth/login`. La page s'affiche donc pour tout le monde. La garde d'authentification (voir `.memlog.md`) s'applique **par action**, côté client, via `useAuth()` (`src/components/Auth/useAuth.ts`) : cliquer sur le CTA primaire, une puce de suggestion, ou le CTA de clôture alors que l'utilisateur n'est pas connecté déclenche `router.push('/auth/login?redirect=%2Fchat')` — même paramètre `?redirect=` déjà utilisé ailleurs dans le produit (`AuthProvider.getSafeRedirect`) — **au lieu** de l'action normale (navigation + envoi de message). `[ASSUMPTION]` La cible du `redirect` est `/chat` (la destination que l'action visait), pas `/` — `.memlog.md` ne précise pas la cible exacte ; ce choix évite un aller-retour inutile par l'accueil après connexion. Le CTA secondaire désactivé ("Explorer les documents") n'a aucune action de toute façon (voir Component Patterns) et n'est donc jamais concerné par cette garde.

Remplace `src/app/page.tsx` (actuellement le template Next.js par défaut — logo Next.js, liens "Deploy Now"/"Documentation"). Public : même audience professionnelle interne que le reste du produit (consultants techniques, développeurs, chefs de projet).

## Information Architecture

| Surface | Atteinte depuis | Objectif |
|---|---|---|
| Accueil (`/`) | Lien "Accueil" de la Navbar (déjà câblé, `src/components/Navbar/Navbar.tsx:31`) ; URL racine du produit | Point d'entrée pré-chat : énoncer la promesse produit, offrir un accès direct au chat sans naviguer par un menu |

Aucune sous-route. Cette page ne fait que rediriger/naviguer vers des surfaces déjà spécifiées ailleurs :

| Destination | Déclenchée par | Spine de référence |
|---|---|---|
| `/chat` | CTA primaire "Discuter avec Nexia", CTA de clôture "Commencer une conversation", 3 des 4 puces de suggestion | `../ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md` |
| `/chat/{id}` | Puce "Que fait le logiciel Codexia ?" **si** une conversation existante correspond (voir Interaction Primitives) | idem |
| `/auth/login?redirect=%2Fchat` | N'importe quelle action ci-dessus si l'utilisateur n'est pas connecté | `../ux-nexiamind-ai-2026-07-04/EXPERIENCE.md` (auth) |

"Explorer les documents" **n'a pas de destination pour l'instant** — bouton visible, visuellement désactivé, tooltip "Bientôt disponible", aucune action au clic (voir `.memlog.md`).

→ Référence de composition : `imports/maquette-nexiamind-ai-accueil-2026-07-18.html`. Spine gagne en cas de conflit — notamment sur l'état du CTA secondaire (actif dans la maquette, désactivé dans cette spine par décision produit).

## Voice and Tone

Microcopy. La posture de marque vit dans `DESIGN.md.Brand & Style`.

| Do | Don't |
|---|---|
| "Toute la connaissance de l'entreprise, à portée de conversation." | "Bienvenue sur votre assistant IA préféré ! 🎉" |
| "Posez votre question à Nexia. Elle explore vos documents techniques, croise les sources et vous répond en quelques secondes — références à l'appui." | "Notre IA super intelligente répond à tout instantanément" |
| "Bientôt disponible" (tooltip CTA désactivé) | "Fonctionnalité indisponible" (sans indiquer que c'est temporaire) |
| Puces factuelles orientées métier ("Résume la notice Workflow") | Suggestions génériques type assistant grand public |
| Même registre que le chat et l'auth : vouvoiement, factuel, jamais ludique | Rupture de ton entre l'accueil et le reste du produit |

## Component Patterns

Comportemental. Les specs visuelles vivent dans `DESIGN.md.Components`.

| Composant | Usage | Règles comportementales |
|---|---|---|
| Hero | Haut de page | Badge "Assistant RAG • en ligne" + titre + sous-titre + deux CTA côte à côte. Statique, aucune interaction propre (le contenu ne change pas selon l'état de connexion — seule l'action des CTA en dépend). |
| CTA primaire ("Discuter avec Nexia") | Hero | Connecté : navigue vers `/chat` (nouvelle conversation vide — comportement standard déjà spécifié par `../ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md`, l'accueil ne le redéfinit pas). Non connecté : redirige vers `/auth/login?redirect=%2Fchat` (voir Foundation), aucune navigation vers `/chat`. |
| CTA secondaire désactivé ("Explorer les documents") | Hero | **`<button type="button" aria-disabled="true">`, jamais un `<a>`** — un `<a>` sans `href` fonctionnel n'est pas focusable nativement, ce qui casserait l'exigence ci-dessous de rester atteignable au clavier pour la tooltip. `aria-disabled` seul ne bloque pas l'activation (contrairement à `disabled`) : le gestionnaire de clic/`keydown` doit être explicitement no-op tant que la fonctionnalité n'existe pas. Survol/focus affiche la tooltip "Bientôt disponible" (voir Accessibility Floor). Ne consulte jamais `useAuth()` : désactivé est désactivé, indépendamment de la connexion. |
| Puces de suggestion (4) | Sous le hero, disparaissent... `[NOTE FOR UX]` contrairement au chat, les puces de l'accueil ne "disparaissent" pas après un clic — le clic navigue immédiatement vers `/chat` (nouvelle page), il n'y a pas d'état "puces masquées sur place" à gérer ici | Voir Interaction Primitives pour le détail par puce. Les 4 puces partagent le même habillage visuel (`DESIGN.md.Components.suggestion-chip`) ; seul leur comportement au clic diffère selon leur texte. |
| Explicatif "3 étapes" | Sous les puces | Purement informatif — 3 cartes statiques (Demandez / Nexia cherche / Réponse sourcée), aucune interaction propre. Contenu figé, pas de `sc-for` dynamique côté React (contrairement à la maquette prototype) — les 3 étapes sont un tableau constant dans le composant. |
| CTA de clôture ("Commencer une conversation") | Bas de la section "3 étapes" | Même comportement exact que le CTA primaire du hero (même garde d'authentification, même destination `/chat`) — un second point d'entrée visuel pour l'utilisateur qui a lu jusqu'au bout de la page sans agir sur le hero. |

## State Patterns

| État | Surface | Traitement |
|---|---|---|
| Défaut | CTA primaire, CTA de clôture, puces | Habillage visuel de repos (voir `DESIGN.md.Components`). |
| Survol | CTA primaire / clôture | `filter: brightness(1.08)` — pas de changement de couleur. |
| Survol | Puces de suggestion | Bordure + fond teintés orange, texte blanc (voir `DESIGN.md.Components.suggestion-chip`). |
| Survol / focus | CTA secondaire désactivé | Tooltip "Bientôt disponible" apparaît ; aucun changement de style du bouton lui-même au-delà de son état désactivé permanent (pas de survol actif sur un élément désactivé). |
| Pressée / en cours de création | Puce cliquée | Dès le clic, la puce reste visuellement dans son état (pas de spinner inline propre à la puce — voir ligne suivante) pendant que `onSendMessage(null, <texte>, {})` crée la conversation et envoie le message ; la navigation vers `/chat` a lieu dès que la conversation est créée, avant même que la réponse assistant n'arrive — l'utilisateur atterrit sur l'état "envoi en cours" du chat (indicateur de saisie, voir `../ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md#State Patterns`) plutôt que d'attendre sur l'accueil. `[NOTE FOR UX]` Cette navigation est une transition client-side (App Router), pas un rechargement complet — elle ne déclenche donc pas nativement l'annonce "nouvelle page" qu'un lecteur d'écran obtient sur une navigation dure. Le focus doit être déplacé explicitement à l'arrivée sur `/chat` (vers le titre principal ou le message nouvellement créé) ; ce comportement d'entrée de route est à spécifier dans `../ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md` (il concerne toute arrivée sur `/chat`, pas seulement celles venant de l'accueil) — signalé ici, non redéfini. `[ASSUMPTION]` Pas de désactivation multi-clic explicitement demandée par `.memlog.md` ; par cohérence avec le reste du produit (pas de double-soumission), un second clic sur la même puce ou sur le CTA pendant la navigation est sans effet supplémentaire une fois la première requête lancée. |
| Erreur de création de conversation | Puce cliquée ou CTA | Le clic échoue silencieusement du point de vue de l'accueil (l'utilisateur ne quitte pas la page) — `onSendMessage`/`onCreateNewConversation` gèrent déjà leur propre état d'erreur (voir chat EXPERIENCE.md) ; si la création échoue avant toute navigation, `[ASSUMPTION]` afficher un message d'erreur bref et factuel sur l'accueil même (pas de bannière pleine page) plutôt que de rester silencieux — comportement à préciser en implémentation, non couvert par `.memlog.md`. |
| Non connecté | Tout CTA/puce actionnable | Clic redirige vers `/auth/login?redirect=%2Fchat` avant toute autre logique (voir Foundation) — aucun état de chargement propre à l'accueil dans ce cas, la redirection est immédiate. |
| Statut d'authentification indéterminé (`useAuth()` pas encore résolu) | Tout CTA/puce actionnable | `/` est publique et s'affiche avant que `useAuth()` n'ait forcément résolu son premier appel — un clic dans cette fenêtre ne doit jamais silencieusement échouer. Traiter comme non connecté par défaut (redirection `/auth/login?redirect=%2Fchat`) tant que l'état n'est pas résolu à `true` ; un utilisateur réellement connecté qui clique dans cette fenêtre subit au pire un aller-retour login → `/chat` (pas une régression fonctionnelle, juste un détour), ce qui est préférable à une action silencieusement no-op. |

## Interaction Primitives

Comportement exact au clic pour chacune des 4 puces (ordre visuel repris de la maquette) :

1. **"Que fait le logiciel Codexia ?"** — cherche d'abord, côté client, dans la liste de conversations existantes (`conversations` de `useConversations()`) une conversation dont le `title` contient "Codexia", insensible à la casse (`title.toLowerCase().includes('codexia')`). Si une correspondance existe, navigue directement vers `/chat/{id}` de la **première** conversation trouvée (pas de création, pas d'envoi de message). Sinon, comportement identique aux 3 puces suivantes.
2. **"Résume la notice Workflow"** — appelle `onSendMessage(null, "Résume la notice Workflow", {})` (même pattern que `src/app/chat/page.tsx:48`, qui crée la conversation, y navigue et envoie le message), puis se retrouve sur `/chat`.
3. **"Explique la GED en 3 points"** — même pattern que ci-dessus avec ce texte.
4. **"Où trouver le paramétrage des répertoires ?"** — même pattern que ci-dessus avec ce texte.

`[NOTE FOR UX]` **Point d'attention pour l'agent développeur** : `useConversations()` (le hook qui expose `conversations` et `onSendMessage`) est fourni par `ConversationsProvider`, défini et monté dans `src/app/chat/layout.tsx` — un layout scopé à `/chat/*`, pas au layout racine (`src/app/layout.tsx`). L'accueil (`/`) est un **frère** de `/chat`, pas un enfant : il n'a **pas** accès à ce contexte tel quel aujourd'hui. Deux options pour l'implémentation, à trancher par l'agent dev/l'architecte, hors périmètre de cette spine :
   - remonter `ConversationsProvider` au layout racine (`src/app/layout.tsx`), ce qui le rend disponible partout mais change son empreinte (chargement de l'historique des conversations dès `/`, pas seulement `/chat/*`) ;
   - ou, sur l'accueil uniquement, appeler directement les fonctions API sous-jacentes (`getConversations`, `createNewConversation`, `sendMessageInConversation` — voir `src/lib/api/conversations.ts`, déjà utilisées par `ConversationsProvider` lui-même) sans passer par le contexte React.
   Le comportement observable décrit ci-dessus (recherche "Codexia", création + navigation pour les 3 autres puces) doit être identique quelle que soit l'option choisie.
- **Tab** suit l'ordre visuel : badge (non focusable) → titre/sous-titre (non focusable) → CTA primaire → CTA secondaire désactivé → puces de suggestion (dans l'ordre listé ci-dessus) → cartes d'étape (non focusables, contenu statique) → CTA de clôture.
- **Entrée/Espace** sur un élément focusé déclenche la même action qu'un clic — CTA et puces sont des éléments interactifs standards (`<button>`), pas de gestion clavier custom. **Exception :** sur le CTA secondaire désactivé, Entrée/Espace n'a aucun effet, comme le clic (voir Component Patterns) — le gestionnaire reste no-op indépendamment du mode d'activation.
- **Focus visible** : ring 2px `{colors.primary}` sur tout élément interactif — même règle que le reste du produit, jamais de `outline-none` sans remplacement. `[NOTE FOR UX]` Le chat et l'auth référencent tous deux un token `{colors.ring}` dans leurs EXPERIENCE.md respectifs qui n'est en réalité défini dans aucun des trois DESIGN.md (seul `ring-glow` existe, un token distinct pour le halo de focus des champs de saisie) — bug pré-existant, non introduit ici. Cette spine référence directement `{colors.primary}`, qui existe et sert déjà de couleur d'action/focus ailleurs dans le produit, plutôt que de reconduire la référence cassée.

## Accessibility Floor

Comportemental. Le contraste visuel vit dans `DESIGN.md`.

- WCAG 2.2 AA (aligné NF-033 du PRD, même plancher que l'auth et le chat).
- Le CTA secondaire désactivé porte `aria-disabled="true"` sur un `<button type="button">` natif (voir Component Patterns — jamais un `<a>`, qui perdrait la focusabilité native requise ci-dessous) **et** un texte accessible expliquant l'indisponibilité — `aria-describedby` pointant vers le texte de la tooltip ("Bientôt disponible"), pas seulement un `title` HTML (non fiable au clavier/lecteur d'écran). Le nœud texte de la tooltip doit être **présent dans le DOM en permanence** (masqué visuellement via `opacity`/`visibility`, pas retiré/ajouté au montage) pour que l'`id` référencé par `aria-describedby` soit toujours valide, y compris au premier focus. Le bouton ne doit jamais être simplement grisé visuellement sans cet équivalent programmatique.
- La tooltip du CTA désactivé respecte WCAG 1.4.13 : dismissible par `Échap` sans perdre le focus du bouton, reste visible tant que le survol ou le focus est actif (pas de disparition sur un minuteur), et le pointeur doit pouvoir se déplacer jusqu'à elle sans qu'elle disparaisse.
- Ordre de focus (`Tab`) : hero (badge/titre non focusables) → CTA primaire → CTA secondaire désactivé (reste dans l'ordre de tabulation, focusable malgré `aria-disabled`, pour que la tooltip soit atteignable au clavier) → 4 puces de suggestion, dans leur ordre visuel → CTA de clôture.
- Hiérarchie de titres : `hero-heading` est le `<h1>` de la page, `section-display` ("Trois pas, et vous avez la réponse") un `<h2>`, les titres des cartes d'étape (`step-title` : "Demandez"/"Nexia cherche"/"Réponse sourcée") des `<h3>` — la page vit sous le `Navbar` global mais porte son propre `<h1>` de contenu.
- Le point pulsant du badge "Assistant RAG • en ligne" (animation `pulseGlow` de la maquette) respecte `prefers-reduced-motion: reduce` — halo statique, sans boucle d'animation, quand le réglage est actif. Même règle pour les transitions de survol des CTA/puces (`filter: brightness`, changements de bordure/fond) : pas de suppression fonctionnelle, seulement le retrait de toute animation continue ou de transition non essentielle.
- Chaque puce de suggestion a un texte accessible clair — le texte visible de la puce suffit (pas d'icône seule) ; l'icône flèche décorative (`→`) est `aria-hidden="true"`.
- Le badge "Assistant RAG • en ligne" est décoratif (`aria-hidden="true"` sur le point pulsant) — l'information utile est portée par le texte du badge lui-même, lu normalement.
- Les cartes d'étape (Demandez / Nexia cherche / Réponse sourcée) sont un contenu statique — pas de `role` interactif, structure sémantique standard (titre + paragraphe), pas de piège au clavier.
- Redirection vers `/auth/login` pour un utilisateur non connecté : la page de destination gère sa propre annonce/focus (voir spine auth) — l'accueil n'a rien de spécifique à faire au-delà de déclencher `router.push`.

## Key Flows

### Flow 1 — Premier contact après connexion (Marc, chef de projet, première visite de la journée)

1. Marc vient de se connecter et arrive sur `/` (pas de redirection automatique vers `/chat` depuis l'auth pour cette visite — il a navigué directement vers la racine).
2. Il voit le badge "Assistant RAG • en ligne", le titre "Toute la connaissance de l'entreprise, à portée de conversation." et le sous-titre expliquant le principe. Aucune question précise en tête, il parcourt les 4 puces de suggestion.
3. **Climax :** il clique sur "Résume la notice Workflow" — la puce ne change pas d'aspect, mais la page navigue presque immédiatement vers `/chat` : une nouvelle conversation est déjà créée, sa question apparaît en bulle corail, l'indicateur de saisie assistant pulse. Marc n'a tapé aucun mot, et se retrouve pourtant déjà en train d'obtenir une réponse.
4. Quelques secondes plus tard, la réponse arrive — Marc est maintenant dans le flux normal du chat, l'accueil n'est plus qu'un souvenir d'un clic.

Échec : la création de la conversation échoue (réseau) → Marc reste sur `/` avec un message d'erreur bref (voir State Patterns) plutôt que d'être laissé face à une page qui ne réagit pas ; il retente le clic.

### Flow 2 — Retrouver Codexia sans repasser par le chat (Amina, consultante technique, conversation "Codexia" déjà entamée hier)

1. Amina revient sur `/` par habitude (elle a mis la page en favori plutôt que `/chat`). Elle est déjà connectée (session persistée).
2. Elle repère la puce "Que fait le logiciel Codexia ?" — elle se souvient avoir déjà posé une question proche hier et espère retrouver cette conversation plutôt que d'en recommencer une nouvelle.
3. **Climax :** elle clique — la recherche côté client trouve sa conversation d'hier ("Que fait Codexia et à quoi ça sert ?", dont le titre contient bien "codexia" en minuscules) et la navigue directement vers `/chat/{id}` de cette conversation, sans créer de doublon. Elle retrouve l'historique complet de son échange d'hier, exactement comme si elle avait cliqué sur cette conversation depuis la sidebar du chat.
4. Elle poursuit la conversation avec une question de suivi, dans le fil déjà établi.

Variante : aucune conversation "Codexia" n'existe encore pour Amina → le clic se comporte exactement comme les 3 autres puces (nouvelle conversation, message envoyé, navigation vers `/chat`) — elle ne remarque aucune différence de comportement, seulement le résultat (nouvelle conversation vs conversation retrouvée).

### Flow 3 — Visiteur non connecté sur la racine (utilisateur anonyme, lien partagé vers `nexiamind.ai/`)

1. Un utilisateur non connecté ouvre `/` directement (le proxy ne le redirige pas — `/` est une route publique, contrairement à `/chat`). Il voit la page complète : hero, CTA, puces, explicatif en 3 étapes — rien ne signale visuellement qu'il n'est pas connecté.
2. Il clique sur "Discuter avec Nexia", curieux.
3. **Climax :** au lieu de naviguer vers `/chat`, il est immédiatement redirigé vers `/auth/login?redirect=%2Fchat` — aucune conversation n'a été créée, aucun message n'a été envoyé silencieusement en son nom.
4. Il se connecte ; `AuthProvider` lit le paramètre `redirect` et le renvoie directement vers `/chat` (pas de retour intermédiaire par `/`) — il atterrit là où son clic initial l'aurait mené s'il avait déjà été connecté.

Variante : le même utilisateur clique sur une puce de suggestion plutôt que le CTA primaire → même garde, même redirection vers `/auth/login?redirect=%2Fchat` — le texte de la puce n'est pas transmis à travers la connexion (`[ASSUMPTION]`, non spécifié par `.memlog.md` : une fois connecté, l'utilisateur atterrit sur `/chat` normal, pas sur une conversation pré-remplie avec le texte de la puce qu'il avait cliquée avant de se connecter).
