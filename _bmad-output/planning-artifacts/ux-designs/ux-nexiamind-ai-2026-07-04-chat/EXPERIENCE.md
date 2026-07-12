---
name: NexiaMind AI — Chat
status: final
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04/EXPERIENCE.md
  - _bmad-output/implementation-artifacts/4-303-creer-l-interface-de-chat.md
  - _bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md
updated: 2026-07-11
---

# NexiaMind AI — Chat Experience Spine

> Périmètre : la page `/chat` et `/chat/[conversationId]` — envoyer un message, voir les réponses, basculer entre conversations multiples via une sidebar (ST-306, remplace le menu déroulant initial de ST-303). L'affichage fonctionnel des citations/sources (ST-305) et les filtres de recherche (ST-304) sont intégrés ; le rendu Markdown enrichi reste hors périmètre (ST-307). Depuis le 2026-07-11, le panneau Avatar sous la sidebar (dictée vocale par micro, zone réservée à un avatar 3D) et le footer global de la page entrent également dans le périmètre.

## Foundation

Web responsive, Next.js App Router + Tailwind CSS (pas de librairie de composants) — identique à l'auth, même pivot vers le thème sombre de `docs/Maquette-ux-NexiaMind AI.html` (voir `DESIGN.md`). Contrairement aux pages `/auth/*`, `/chat` **conserve** `Navbar` du layout racine — restylée en app-shell sombre, mêmes routes/comportements (voir `DESIGN.md.Components.app-header`). `/chat` a un **footer** (`app-footer`, `DESIGN.md.Components.app-footer`) — décision inversée le 2026-07-11 (`docs/Maquette-structure-NexiaMind-AI-Chat.html` fait apparaître une bande basse pleine largeur ; la spine du 2026-07-09 avait au contraire retiré tout pied de page). C'est un footer applicatif minimal (disclaimer légal), pas le `Footer` marketing des pages publiques. `[NOTE FOR UX]` Le sort de `Footer` sur les futures pages Accueil/Recherche/Documents/Admin (non encore spécifiées) reste ouvert — cette spine ne tranche que pour `/chat`. Protection d'accès déjà assurée par `src/proxy.ts` (redirection vers `/auth/login?redirect=%2Fchat` si non connecté) — aucune logique de garde supplémentaire dans cette spine.

Toute la surface `/chat/*` (sidebar + panneau de chat + footer global) occupe exactement la hauteur restante sous `Navbar`, sans jamais excéder celle du viewport — la page elle-même ne défile jamais ; seuls la liste de messages et la liste de conversations défilent en interne. Cette contrainte garantit que la zone de saisie reste toujours atteignable, quelle que soit la taille de la fenêtre (voir `DESIGN.md.Layout & Spacing`).

Public : consultants techniques, développeurs, chefs de projet — même public professionnel interne que l'auth. Un seul rôle de conversation implémenté ici (question → réponse RAG) ; le filtrage par profil et les citations de sources arrivent dans des stories ultérieures.

## Information Architecture

| Surface | Atteinte depuis | Objectif |
|---|---|---|
| Chat (`/chat`) | Lien "Chat" dans la Navbar ; redirection automatique après connexion réussie (`AuthProvider`, paramètre `?redirect=`) ; sans conversation active, crée automatiquement une nouvelle conversation | Point d'entrée du chat, résout vers la conversation active ou son état vide |
| Conversation (`/chat/[conversationId]`) | Sélection d'une conversation dans la sidebar, ou lien direct (URL partagée) | Poser une question au système RAG et consulter les réponses dans le contexte d'une conversation précise |
| Sidebar de conversations (permanente `≥lg`, overlay `<lg` sur `/chat/*`) | Toujours visible à `≥lg` ; bouton dédié en dessous | Consulter, sélectionner, renommer ou supprimer une conversation passée ; créer une nouvelle conversation |

Le sélecteur de source (`DESIGN.md.Components.source-select`) vit dans le header global, pas dans le panneau de chat — il filtre le périmètre documentaire sur lequel porte la question suivante, sans changer de route. Les filtres actifs (thème, format) sont persistés **par conversation** — changer de conversation restaure ses filtres, une nouvelle conversation repart des filtres par défaut.

→ Référence de composition (header, état vide, conversation active, erreur d'envoi) : `mockups/chat.html`. Spine gagne en cas de conflit. La sidebar de conversations n'a pas de maquette dédiée — construire depuis les tableaux ci-dessous et `DESIGN.md.Components.conversation-list-sidebar`/`conversation-item`.

## Voice and Tone

Microcopy. La posture de marque vit dans `DESIGN.md.Brand & Style` (fichier de ce dossier).

| Do | Don't |
|---|---|
| "Posez votre première question" | "Hey ! Qu'est-ce que je peux faire pour toi aujourd'hui ? 😊" |
| "NexiaMind AI réfléchit…" (label du groupe de points animés, si un texte accompagne l'indicateur) | "Je réfléchis très fort là 🤔" |
| "Échec de l'envoi du message. Réessayez." | "Oups, une erreur est survenue" (sans piste de résolution) |
| Suggestions factuelles orientées métier ("Quels sont les derniers livrables pour le client X ?") | Suggestions génériques type assistant grand public ("Raconte-moi une blague") |

Même registre que l'auth : vouvoiement, factuel, jamais ludique.

## Component Patterns

Comportemental. Les specs visuelles vivent dans `DESIGN.md.Components` (fichier de ce dossier).

| Composant | Usage | Règles comportementales |
|---|---|---|
| Zone de saisie | Toujours visible en bas de la zone de chat | Auto-grandit avec le contenu (jusqu'à ~6 lignes visibles, puis scroll interne). `Entrée` seule soumet ; `Shift+Entrée` insère un saut de ligne. Se vide après envoi réussi. Reste éditable pendant l'attente de réponse (l'utilisateur peut déjà taper le message suivant, mais l'envoi est bloqué par le bouton désactivé — voir État de chargement). |
| Bouton d'envoi | À droite de la zone de saisie | Désactivé (opacité réduite) si le champ est vide ou pendant l'attente d'une réponse en cours. Pas de double-envoi possible. |
| Bulle de message | Chaque message, utilisateur ou assistant | Les retours à la ligne du contenu sont préservés (`whitespace-pre-wrap`) — pas de rendu Markdown enrichi (ST-307). Les bulles consécutives du même rôle se regroupent visuellement (espace réduit, avatar assistant affiché une seule fois par groupe). |
| Bouton Écouter | Barre d'actions de chaque bulle assistant, à côté du bouton Export | Clic démarre la lecture à voix haute (synthèse vocale) du contenu du message ; l'icône passe en "stop" pendant la lecture. Reclic (ou clic sur un autre bouton Écouter) arrête la lecture en cours — une seule lecture active à la fois, tous messages confondus. Désactivé (jamais masqué) si le navigateur ne supporte pas la synthèse vocale. |
| Indicateur de saisie assistant | Entre l'envoi d'un message et la réception de la réponse | Remplace la place où la prochaine bulle assistant apparaîtra (pas un indicateur flottant séparé) — la transition indicateur → contenu réel se fait sans saut de mise en page brusque. |
| Puces de suggestion | Uniquement dans l'état vide (avant le premier message) | Cliquer une puce remplit la zone de saisie avec son texte et l'envoie immédiatement (pas juste un pré-remplissage à valider) — geste en un clic. Disparaissent dès le premier message envoyé, ne réapparaissent jamais dans la même session. |
| Liste de conversations (sidebar) | Permanente à `≥lg` ; overlay plein écran déclenché par un bouton à `<lg` | Conversations triées par date de dernière activité (la plus récente en haut) — cohérent avec le tri déjà appliqué côté API (`GET /api/chat/history`, `updated_at` décroissant). Cliquer une conversation charge ses messages complets (pas juste un résumé) dans la zone de chat active. En overlay mobile : fermeture au clic extérieur (même pattern que `UserMenu` de la Navbar). |
| Titre de conversation (item de liste) | Chaque item de la sidebar | Retour à la ligne libre, jamais tronqué ni source de scroll horizontal (voir `DESIGN.md.Do's and Don'ts`) — un titre long occupe plusieurs lignes, l'item de liste grandit en conséquence. |
| Actions de conversation (renommer / supprimer) | Bouton menu (icône ⋮) sur chaque item, ou dans l'en-tête de la conversation active | Renommer : champ inline avec validation (titre non vide, max 200 caractères). Supprimer : confirmation explicite avant suppression irréversible (voir État de chargement / State Patterns). |
| Bouton "Nouvelle conversation" | En-tête de la sidebar et en-tête de la conversation active | Crée une conversation vide (pas de message initial), la sélectionne immédiatement, réinitialise les filtres aux valeurs par défaut (une conversation existante conserve les siens). |
| Espace sources réservé | Sous chaque bulle assistant | Vide et neutre pour ST-303 (voir `DESIGN.md`) — ne réagit à aucune interaction tant qu'il est vide. |
| Sélecteur de source | Header global, toutes les routes authentifiées | `<select>` natif (`FilterBar`/`FilterDropdown` existants, recolorés) — change le périmètre documentaire de la prochaine question, n'affecte pas les messages déjà affichés. Comportement de filtrage fonctionnel hors périmètre de cette itération visuelle. |
| Navigation globale (header) | Toutes les routes authentifiées | 5 entrées (`Accueil`/`Chat`/`Recherche`/`Documents`/`Admin`), comportement inchangé de `Navbar.tsx` — seul l'onglet actif change de style (`DESIGN.md.Components.nav-item`). |
| Footer global | Bas de toute la surface `/chat/*`, pleine largeur (sous sidebar et panneau de chat) | Statique, une seule instance par page (pas par état de chargement/vide/actif) — porte uniquement le disclaimer légal, aucune interaction. |
| Panneau Avatar | Sous la liste de conversations, sidebar (permanente `≥lg`, dans l'overlay `<lg`) | Zone fixe en bas de sidebar : avatar réservé + deux boutons micro. Ne défile pas avec la liste de conversations (reste ancré même si la liste est longue et scrolle). |
| Bouton micro bascule | Panneau Avatar, premier des deux boutons | Clic démarre une écoute continue (dictée) ; second clic l'arrête. Reste actif tant que l'utilisateur ne le désactive pas explicitement — ne s'arrête pas tout seul après un silence. Un seul micro actif à la fois dans l'app : si le bouton maintien (F8) est pressé pendant que la bascule est déjà active, il n'a aucun effet (la bascule reste seule maîtresse de la session en cours). |
| Bouton micro maintien (F8) | Panneau Avatar, second des deux boutons | Écoute uniquement pendant l'appui — sur la touche `F8` (raccourci global, capturé quel que soit l'élément focus) ou sur un appui maintenu (souris/tactile) directement sur le bouton. Le relâchement (touche ou bouton) arrête l'écoute immédiatement. Sans effet si la bascule est déjà active (voir ligne ci-dessus). |
| Dictée → zone de saisie | Résultat du micro (bascule ou maintien) | Le texte reconnu s'insère au point courant du curseur dans `ChatInput` au fur et à mesure (résultats intermédiaires visibles, affinés jusqu'au résultat final) — jamais d'envoi automatique, l'utilisateur relit et déclenche l'envoi lui-même (Entrée ou bouton d'envoi). Fonctionne quelle que soit la page (`/chat` ou `/chat/[conversationId]`) puisque le panneau Avatar est toujours visible en sidebar. |

## State Patterns

| État | Traitement |
|---|---|
| Vide (aucun message, nouvelle session) | Titre `display` + puces de suggestion (voir Component Patterns). Zone de saisie déjà visible et utilisable directement, sans attendre un clic sur une suggestion. |
| Chargement de l'historique (montage de la page) | Ne bloque pas l'affichage de la zone de saisie ni de l'état vide — l'historique se charge en arrière-plan ; s'il échoue, le menu historique affiche un état d'erreur discret en son sein (pas une bannière pleine page), la conversation reste utilisable. |
| Envoi en cours | Message utilisateur ajouté immédiatement à la liste (optimistic UI) ; indicateur de saisie affiché à la place de la future bulle assistant ; bouton d'envoi désactivé ; champ de saisie reste éditable pour préparer le message suivant. |
| Erreur d'envoi (réseau, 401, 500) | Bannière d'erreur (`banner-error`) au-dessus de la zone de saisie, `role="alert"`. Le message utilisateur déjà affiché (optimistic UI) reste visible avec un indicateur discret d'échec (ex. texte "Non envoyé" en `{colors.error}` sous la bulle) plutôt que de disparaître silencieusement — l'utilisateur ne perd jamais le texte qu'il a tapé. |
| Réponse reçue | L'indicateur de saisie est remplacé par la bulle assistant réelle ; scroll automatique vers le bas pour révéler la nouvelle bulle. |
| Conversation rouverte depuis la sidebar | Remplace entièrement la liste de messages affichée (pas d'ajout à la suite de la conversation en cours) ; scroll positionné en bas (derniers messages visibles en premier) ; les filtres de cette conversation sont restaurés. |
| Renommage / suppression en cours | Le champ ou bouton concerné passe en état désactivé (opacité réduite) pendant l'appel réseau ; pas de double-soumission possible. Une erreur affiche un message clair sans fermer la modale/le champ, pour permettre de réessayer sans reperdre la saisie. |
| Conversation supprimée / introuvable (URL directe vers un id invalide) | Message clair (pas de page blanche ni de crash) proposant de revenir à la liste des conversations ou d'en créer une nouvelle. |
| Micro en écoute (bascule ou maintien) | Bouton actif visuellement (`DESIGN.md.Components.mic-toggle-button`/`mic-ptt-button`, fond corail) ; le texte reconnu apparaît progressivement dans `ChatInput`. |
| Permission microphone refusée | Le bouton concerné repasse immédiatement à l'état repos ; un message bref et factuel apparaît près du panneau Avatar ("Micro refusé — autorisez l'accès dans les paramètres du navigateur"), pas de bannière pleine largeur (portée locale au panneau, pas un échec de l'app). |
| Navigateur sans reconnaissance vocale (API non disponible) | Les deux boutons micro restent visibles mais désactivés (opacité réduite), `aria-disabled="true"`, `title`/`aria-describedby` expliquant l'indisponibilité — jamais masqués silencieusement (l'utilisateur doit comprendre pourquoi le contrôle ne répond pas). |

## Interaction Primitives

- **Entrée** dans la zone de saisie soumet le message (si non vide) ; **Shift+Entrée** insère un saut de ligne.
- **Tab** suit l'ordre visuel : puces de suggestion (si présentes) → zone de saisie → bouton d'envoi → bouton historique.
- **Échap** ferme le menu historique s'il est ouvert (aucun autre effet).
- **Scroll automatique** vers le bas à l'arrivée d'un nouveau message (utilisateur ou assistant) — sauf si l'utilisateur a manuellement remonté dans l'historique de la conversation en cours, auquel cas un nouveau message n'impose pas de re-scroll forcé (ne pas arracher l'utilisateur à ce qu'il est en train de relire).
- **Focus visible** : ring 2px `{colors.ring}` sur tout élément interactif (zone de saisie, bouton d'envoi, puces, bouton historique) — jamais de `outline-none` sans remplacement, même règle que l'auth.
- **F8** (raccourci global, capturé quel que soit l'élément focus, y compris pendant la saisie dans `ChatInput`) : maintien = micro actif (dictée), relâchement = micro coupé. N'a d'effet que si aucune écoute par bascule n'est déjà en cours (voir `Component Patterns`). Ne consomme pas le focus courant — l'utilisateur peut continuer à voir le curseur là où il était.

## Accessibility Floor

Comportemental. Le contraste visuel vit dans `DESIGN.md`.

- WCAG 2.2 AA (aligné NF-033 du PRD, même plancher que l'auth).
- La liste de messages est un `role="log"` avec `aria-live="polite"` — les nouveaux messages assistant sont annoncés aux lecteurs d'écran sans interrompre une lecture en cours (contrairement à la bannière d'erreur, `role="alert"`/`aria-live="assertive"`, qui doit interrompre).
- La zone de saisie a un `<label>` explicite (visible ou `sr-only`), jamais un placeholder seul.
- Le bouton d'envoi (icône seule) a un `aria-label` explicite ("Envoyer le message").
- L'avatar assistant est décoratif (`aria-hidden="true"`) — l'information de rôle (qui parle) est portée par la structure/le texte, pas par l'image.
- Le menu historique est navigable au clavier (`Tab`/`Entrée` pour ouvrir une conversation, `Échap` pour fermer), même exigence que `UserMenu` de la Navbar.
- La sidebar de conversations est `role="list"` avec chaque item en `role="listitem"` ; chaque item porte un `aria-label` reprenant le titre complet de la conversation (même si affiché sur plusieurs lignes) et `aria-current="true"` sur la conversation active.
- Les deux boutons micro ont un `aria-label` explicite ("Activer/désactiver le micro" pour la bascule, "Maintenir pour parler (F8)" pour le bouton maintien) et `aria-pressed` reflétant l'état d'écoute en cours. Le raccourci F8 est un renfort, jamais le seul moyen d'activer la fonction — les deux boutons restent pleinement utilisables à la souris/au clavier (`Entrée`/`Espace` sur le bouton bascule ; le bouton maintien reste opérable au clavier standard via `Tab` + maintien `Entrée`/`Espace`, F8 n'est qu'un raccourci supplémentaire).
- Le passage en écoute (ou son arrêt, ou un refus de permission) est annoncé via une région `aria-live="polite"` locale au panneau Avatar — jamais `role="alert"` (pas une erreur bloquante de l'application).
- Le bouton Écouter porte un `aria-label` reflétant l'action suivante ("Écouter la réponse à voix haute" / "Arrêter la lecture") et `aria-pressed` reflétant l'état de lecture en cours — même logique que les boutons micro du panneau Avatar.

## Responsive & Platform

Pas de version native mobile — web responsive uniquement, cohérent avec l'auth et le reste du produit.

| Breakpoint | Comportement |
|---|---|
| `≥ lg` (1024px+) | Sidebar de conversations permanente (`{spacing.sidebar-width}`, 280px) à gauche du panneau de chat. |
| `< lg` | Sidebar remplacée par un bouton "Conversations" + overlay plein écran ; le panneau de chat occupe toute la largeur. |
| `≥ md` (768px+) | Bulles limitées à `{spacing.bubble-max-width}` (78%) de la largeur du panneau de chat. |
| `< md` | Bulles jusqu'à ~90% de la largeur (le ratio 78% deviendrait trop étroit sur petit écran) ; zone de saisie et bouton d'envoi restent côte à côte, jamais empilés. |

## Key Flows

### Flow — La première question du lundi matin (Léa, consultante technique, 8h51)

*Suite directe du parcours de connexion de `../ux-nexiamind-ai-2026-07-04/EXPERIENCE.md#Flow 1`.*

1. Léa vient de se connecter ; elle est redirigée automatiquement sur `/chat`. Aucune conversation précédente aujourd'hui : elle voit l'écran vide avec "Posez votre première question" et trois suggestions basées sur son activité récente.
2. Elle ignore les suggestions — elle a une question précise en tête — et tape directement dans la zone de saisie, qui grandit pour accueillir ses deux phrases. Elle appuie sur Entrée.
3. Sa question apparaît immédiatement en bulle corail à droite. À gauche, l'avatar NexiaMind AI apparaît avec trois points qui pulsent doucement.
4. **Climax :** un peu plus de deux secondes plus tard, les points laissent place à une bulle de réponse complète et structurée — Léa a l'information qu'elle cherchait sans avoir quitté sa position de lecture, le scroll s'est ajusté tout seul pour révéler la réponse en entier.
5. Elle enchaîne une question de suivi dans la foulée — la bulle utilisateur suivante se regroupe visuellement sous la précédente, sans avatar répété, signe visuel qu'elle est toujours dans le même fil de pensée.

Échec : la requête échoue (timeout réseau) → sa question reste visible avec un discret "Non envoyé" en dessous, une bannière d'erreur factuelle apparaît au-dessus de la zone de saisie ("Échec de l'envoi du message. Réessayez."), elle retape ou clique pour réessayer sans avoir perdu son texte.

### Flow — Retrouver une conversation de la veille (Léa, mardi matin)

1. Léa se souvient avoir posé une question similaire hier. Sur son écran large, la sidebar de conversations est déjà visible à gauche du panneau de chat — elle repère directement la conversation d'hier, en second dans la liste triée par activité récente.
2. **Climax :** elle clique dessus — la zone de chat active se remplace instantanément par ces messages, elle retrouve la réponse qu'elle cherchait sans avoir à reformuler sa question. Les filtres de source qu'elle avait sélectionnés hier pour cette conversation sont restaurés automatiquement.
3. Le titre de la conversation ("Migration base de données client X — configuration réseau") est assez long pour occuper deux lignes dans la sidebar ; il reste entièrement lisible, sans coupure ni ascenseur horizontal.

Sur mobile, la même conversation se retrouve via le bouton "Conversations" qui ouvre un overlay plein écran reprenant la même liste ; le tapotement referme l'overlay et affiche la conversation sélectionnée.
