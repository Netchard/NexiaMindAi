---
name: NexiaMind AI — Chat
status: final
sources:
  - _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04/EXPERIENCE.md
  - _bmad-output/implementation-artifacts/4-303-creer-l-interface-de-chat.md
  - _bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md
updated: 2026-07-04
---

# NexiaMind AI — Chat Experience Spine

> Périmètre : la page `/chat` (ST-303) — envoyer un message, voir les réponses, historique des conversations passées consultable. La bascule complète entre conversations multiples (route `[conversationId]`), l'affichage fonctionnel des citations/sources, les filtres de recherche et le rendu Markdown enrichi sont hors périmètre (ST-304 à ST-307) ; cette spine prépare visuellement leur arrivée sans les implémenter.

## Foundation

Web responsive, Next.js App Router + Tailwind CSS (pas de librairie de composants) — identique à l'auth. Contrairement aux pages `/auth/*`, `/chat` **conserve** `Navbar` et `Footer` du layout racine : c'est l'espace de travail principal du produit, pas un point d'entrée isolé. Protection d'accès déjà assurée par `src/proxy.ts` (redirection vers `/auth/login?redirect=%2Fchat` si non connecté) — aucune logique de garde supplémentaire dans cette spine.

Public : consultants techniques, développeurs, chefs de projet — même public professionnel interne que l'auth. Un seul rôle de conversation implémenté ici (question → réponse RAG) ; le filtrage par profil et les citations de sources arrivent dans des stories ultérieures.

## Information Architecture

| Surface | Atteinte depuis | Objectif |
|---|---|---|
| Chat (`/chat`) | Lien "Chat" dans la Navbar ; redirection automatique après connexion réussie (`AuthProvider`, paramètre `?redirect=`) | Poser une question au système RAG et consulter les réponses |
| Menu historique (overlay sur `/chat`) | Bouton dédié dans la zone de chat | Consulter la liste des conversations passées, en rouvrir une |

Une seule route pour ST-303 — pas de sous-pages. Le menu historique est un overlay, pas une navigation.

→ Référence de composition (état vide, conversation active, erreur d'envoi) : `mockups/chat.html`. Spine gagne en cas de conflit. Le panneau du menu historique ouvert n'a pas de maquette dédiée — construire depuis les tableaux ci-dessous et `DESIGN.md.Components.history-menu`, même pattern que `UserMenu` de la Navbar déjà en place.

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
| Indicateur de saisie assistant | Entre l'envoi d'un message et la réception de la réponse | Remplace la place où la prochaine bulle assistant apparaîtra (pas un indicateur flottant séparé) — la transition indicateur → contenu réel se fait sans saut de mise en page brusque. |
| Puces de suggestion | Uniquement dans l'état vide (avant le premier message) | Cliquer une puce remplit la zone de saisie avec son texte et l'envoie immédiatement (pas juste un pré-remplissage à valider) — geste en un clic. Disparaissent dès le premier message envoyé, ne réapparaissent jamais dans la même session. |
| Menu historique | Overlay déclenché par un bouton dédié | Liste des conversations triée par date de dernière activité (la plus récente en haut) — cohérent avec le tri déjà appliqué côté API (`GET /api/chat/history`, `updated_at` décroissant). Cliquer une conversation charge ses messages dans la zone de chat active et ferme le menu. Fermeture au clic extérieur ou `Échap` (même pattern que `UserMenu` de la Navbar, déjà en place). |
| Espace sources réservé | Sous chaque bulle assistant | Vide et neutre pour ST-303 (voir `DESIGN.md`) — ne réagit à aucune interaction tant qu'il est vide. |

## State Patterns

| État | Traitement |
|---|---|
| Vide (aucun message, nouvelle session) | Titre `display` + puces de suggestion (voir Component Patterns). Zone de saisie déjà visible et utilisable directement, sans attendre un clic sur une suggestion. |
| Chargement de l'historique (montage de la page) | Ne bloque pas l'affichage de la zone de saisie ni de l'état vide — l'historique se charge en arrière-plan ; s'il échoue, le menu historique affiche un état d'erreur discret en son sein (pas une bannière pleine page), la conversation reste utilisable. |
| Envoi en cours | Message utilisateur ajouté immédiatement à la liste (optimistic UI) ; indicateur de saisie affiché à la place de la future bulle assistant ; bouton d'envoi désactivé ; champ de saisie reste éditable pour préparer le message suivant. |
| Erreur d'envoi (réseau, 401, 500) | Bannière d'erreur (`banner-error`) au-dessus de la zone de saisie, `role="alert"`. Le message utilisateur déjà affiché (optimistic UI) reste visible avec un indicateur discret d'échec (ex. texte "Non envoyé" en `{colors.error}` sous la bulle) plutôt que de disparaître silencieusement — l'utilisateur ne perd jamais le texte qu'il a tapé. |
| Réponse reçue | L'indicateur de saisie est remplacé par la bulle assistant réelle ; scroll automatique vers le bas pour révéler la nouvelle bulle. |
| Conversation rouverte depuis l'historique | Remplace entièrement la liste de messages affichée (pas d'ajout à la suite de la conversation en cours) ; scroll positionné en bas (derniers messages visibles en premier). |

## Interaction Primitives

- **Entrée** dans la zone de saisie soumet le message (si non vide) ; **Shift+Entrée** insère un saut de ligne.
- **Tab** suit l'ordre visuel : puces de suggestion (si présentes) → zone de saisie → bouton d'envoi → bouton historique.
- **Échap** ferme le menu historique s'il est ouvert (aucun autre effet).
- **Scroll automatique** vers le bas à l'arrivée d'un nouveau message (utilisateur ou assistant) — sauf si l'utilisateur a manuellement remonté dans l'historique de la conversation en cours, auquel cas un nouveau message n'impose pas de re-scroll forcé (ne pas arracher l'utilisateur à ce qu'il est en train de relire).
- **Focus visible** : ring 2px `{colors.ring}` sur tout élément interactif (zone de saisie, bouton d'envoi, puces, bouton historique) — jamais de `outline-none` sans remplacement, même règle que l'auth.

## Accessibility Floor

Comportemental. Le contraste visuel vit dans `DESIGN.md`.

- WCAG 2.2 AA (aligné NF-033 du PRD, même plancher que l'auth).
- La liste de messages est un `role="log"` avec `aria-live="polite"` — les nouveaux messages assistant sont annoncés aux lecteurs d'écran sans interrompre une lecture en cours (contrairement à la bannière d'erreur, `role="alert"`/`aria-live="assertive"`, qui doit interrompre).
- La zone de saisie a un `<label>` explicite (visible ou `sr-only`), jamais un placeholder seul.
- Le bouton d'envoi (icône seule) a un `aria-label` explicite ("Envoyer le message").
- L'avatar assistant est décoratif (`aria-hidden="true"`) — l'information de rôle (qui parle) est portée par la structure/le texte, pas par l'image.
- Le menu historique est navigable au clavier (`Tab`/`Entrée` pour ouvrir une conversation, `Échap` pour fermer), même exigence que `UserMenu` de la Navbar.

## Responsive & Platform

Pas de version native mobile — web responsive uniquement, cohérent avec l'auth et le reste du produit.

| Breakpoint | Comportement |
|---|---|
| `≥ md` (768px+) | Bulles limitées à `{spacing.bubble-max-width}` (70%) de la largeur du conteneur de chat. |
| `< md` | Bulles jusqu'à ~85% de la largeur (le ratio 70% deviendrait trop étroit sur petit écran) ; zone de saisie et bouton d'envoi restent côte à côte, jamais empilés. |

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

1. Léa se souvient avoir posé une question similaire hier. Elle clique le bouton historique dans la zone de chat.
2. Un panneau s'ouvre avec la liste de ses conversations, la plus récente en haut ("Hier, 17h32" comme sous-titre implicite du titre de conversation).
3. **Climax :** elle clique sur la conversation d'hier — la zone de chat active se remplace instantanément par ces messages, elle retrouve la réponse qu'elle cherchait sans avoir à reformuler sa question.
