---
name: NexiaMind AI — Chat
description: Visual identity for the chat conversation interface (ST-303) of NexiaMind AI. Next.js App Router + Tailwind CSS (no component library). Extends the auth surface's brand tokens (../ux-nexiamind-ai-2026-07-04/DESIGN.md) — same values, repeated here so this file is self-contained — with chat-specific component tokens (bubbles, typing indicator, suggested prompts).
status: final
updated: 2026-07-04
colors:
  primary: '#EF6C4D'
  primary-hover: '#E1552F'
  primary-active: '#C8441F'
  on-primary: '#FFFFFF'
  ink: '#1E2A3B'
  ink-muted: '#6B7280'
  surface: '#FAFAFA'
  surface-card: '#FFFFFF'
  border: '#E5E7EB'
  ring: '#F2A084'
  error: '#DC2626'
  error-surface: '#FEF2F2'
  error-border: '#FECACA'
  ink-dark: '#F1F5F9'
  ink-muted-dark: '#94A3B8'
  surface-dark: '#0F172A'
  surface-card-dark: '#1E293B'
  border-dark: '#334155'
  ring-dark: '#F2A084'
  error-dark: '#F87171'
  error-surface-dark: 'rgba(220, 38, 38, 0.12)'
typography:
  display:
    fontFamily: 'Geist Sans'
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  body:
    fontFamily: 'Geist Sans'
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: 'Geist Sans'
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: 'Geist Sans'
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 8px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  message-gap: 12px
  bubble-padding: 14px
  bubble-max-width: 70%
  input-bar-padding: 16px
  section-gap: 32px
  gutter: 16px
components:
  message-bubble-user:
    background: '{colors.primary}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.lg}'
    align: 'right'
  message-bubble-assistant:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    foreground: '{colors.ink}'
    radius: '{rounded.lg}'
    align: 'left'
  assistant-avatar:
    size: 28px
    radius: '{rounded.full}'
  typing-indicator:
    dotColor: '{colors.ink-muted}'
    background: '{colors.surface-card}'
    border: '{colors.border}'
    radius: '{rounded.lg}'
  chat-input:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    radius: '{rounded.md}'
    focusRing: '{colors.ring}'
    text: '{colors.ink}'
  send-button:
    background: '{colors.primary}'
    backgroundHover: '{colors.primary-hover}'
    backgroundActive: '{colors.primary-active}'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
  suggested-prompt-chip:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    foreground: '{colors.ink}'
    radius: '{rounded.full}'
  history-menu:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    radius: '{rounded.md}'
  sources-placeholder:
    border: '{colors.border}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
  banner-error:
    background: '{colors.error-surface}'
    border: '{colors.error-border}'
    foreground: '{colors.error}'
    radius: '{rounded.sm}'
---

## Brand & Style

Même posture que l'auth — **Corporate Chaleureux** — mais appliquée à un espace de travail plutôt qu'à un point d'entrée : ici, pas de panneau d'illustration plein écran, la couleur de marque se retire pour laisser toute la place à la conversation elle-même. Le corail reste l'unique signal d'action et de présence (bouton d'envoi, bulle de l'utilisateur), jamais un décor. C'est un outil de travail quotidien pour des professionnels techniques — la conversation doit se lire vite, sans friction visuelle, sur des échanges qui peuvent être longs et denses.

## Colors

- **Corail (`{colors.primary}`)** marque tout ce que **l'utilisateur** produit activement : la bulle de ses propres messages, le bouton d'envoi. Ne s'applique jamais à un message assistant — l'assistant reste visuellement neutre (`{colors.surface-card}`), pour que l'œil distingue instantanément qui parle sans avoir à lire le contenu.
- **Bulle assistant** : fond `{colors.surface-card}`, bordure `{colors.border}` — au même titre qu'un champ de saisie côté auth, elle *reçoit* du contenu plutôt qu'elle ne *déclare* une action.
- **Encre (`{colors.ink}`)** pour tout le texte des messages, y compris à l'intérieur de la bulle utilisateur en négatif (`{colors.on-primary}` sur fond corail).
- **États d'erreur** : mêmes tokens que l'auth (`{colors.error}` / `{colors.error-surface}` / `{colors.error-border}`) — une bannière d'erreur reste visuellement identique partout dans le produit.
- **Mode sombre** : mêmes bascules que l'auth (`surface-dark`, `surface-card-dark`, `ink-dark`, `border-dark`) — le corail reste identique en clair/sombre (déjà validé sur l'auth).

Interdit : ne jamais utiliser le corail en fond de bulle assistant (romprait la lisibilité "qui parle") ; ne jamais introduire une deuxième couleur pour une seconde catégorie de message (le produit n'a que deux rôles : utilisateur, assistant).

## Typography

Geist Sans, identique à l'auth — aucune police additionnelle. Pas de rôles `hero`/`hero-sub` ici (réservés au panneau d'illustration auth, absent de cette surface).

- **`display`** (28px/700) — titre de l'état vide ("Posez votre première question").
- **`body`** (16px/400) — le contenu de chaque message, utilisateur comme assistant. Densité de lecture prioritaire sur tout le reste : c'est ce qu'on lit le plus longtemps dans le produit.
- **`label`** (14px/500) — nom de l'assistant ("NexiaMind AI") au-dessus de sa première bulle d'un groupe, libellés du menu historique.
- **`caption`** (13px/400) — titre des conversations dans le menu historique, texte des puces de suggestion.

## Layout & Spacing

Plein largeur de la zone de contenu héritée du layout racine (`container mx-auto px-4`, `Navbar`/`Footer` visibles — contrairement à l'auth qui s'en exclut). Colonne unique verticale : liste de messages en haut (défilement propre, `overflow-y-auto`), zone de saisie fixée en bas de la zone de chat (pas `position: fixed` sur la fenêtre — reste dans le flux de la page pour respecter le padding du layout racine).

- `{spacing.bubble-max-width}` (70%) — une bulle ne dépasse jamais 70% de la largeur du conteneur de chat, pour garder une longueur de ligne lisible même sur grand écran.
- `{spacing.message-gap}` (12px) — espace vertical entre deux messages consécutifs ; réduit de moitié entre deux messages du même rôle à la suite (regroupement visuel).
- `{spacing.bubble-padding}` (14px) — padding interne de chaque bulle.
- `{spacing.input-bar-padding}` (16px) — padding autour de la zone de saisie.

## Elevation & Depth

Aucune ombre portée sur les bulles — la distinction se fait par couleur de fond et bordure, à l'identique du champ de saisie auth. La zone de saisie se détache légèrement du fond de page par sa bordure et son fond `{colors.surface-card}`, pas par une ombre.

## Shapes

`{rounded.lg}` (16px) pour les bulles de message — plus arrondi que les champs de formulaire (`{rounded.sm}`, 8px) ou les boutons (`{rounded.md}`, 10px) de l'auth : la bulle est un objet conversationnel, pas un composant de formulaire, elle peut se permettre une forme plus douce et plus "moderne". Le bouton d'envoi est circulaire (`{rounded.full}`), comme une icône d'action autonome plutôt qu'un bouton pleine largeur (différent du bouton primaire auth qui est pleine largeur de formulaire).

## Components

- **Bulle utilisateur (`message-bubble-user`)** — fond `{colors.primary}` plein, texte `{colors.on-primary}`, alignée à droite, `{rounded.lg}`.
- **Bulle assistant (`message-bubble-assistant`)** — fond `{colors.surface-card}`, bordure `{colors.border}`, texte `{colors.ink}`, alignée à gauche, précédée d'un petit avatar rond (`assistant-avatar`, 28px, logo NexiaMind AI existant `public/logo.svg`).
- **Indicateur de saisie (`typing-indicator`)** — remplace temporairement la bulle assistant : mêmes fond/bordure/radius que `message-bubble-assistant`, contient trois points de couleur `{colors.ink-muted}` qui pulsent en boucle (animation légère, seule animation de cette surface).
- **Zone de saisie (`chat-input`)** — textarea auto-grandissante (1 à ~6 lignes visibles avant scroll interne), fond `{colors.surface-card}`, bordure `{colors.border}`, radius `{rounded.md}`, focus ring `{colors.ring}` — même traitement que `input-field` de l'auth.
- **Bouton d'envoi (`send-button`)** — icône seule (flèche/avion en papier), cercle plein `{colors.primary}`, `{rounded.full}`, désactivé (opacité réduite) si le champ est vide ou pendant l'attente de réponse — même logique de désactivation que `button-primary` de l'auth.
- **Puce de suggestion (`suggested-prompt-chip`)** — pilule cliquable (`{rounded.full}`), fond `{colors.surface-card}`, bordure `{colors.border}`, visible uniquement dans l'état vide (avant le premier message).
- **Menu historique (`history-menu`)** — déclenché par un bouton dans la zone de chat (pas dans la Navbar), panneau déroulant `{colors.surface-card}` / `{colors.border}` / `{rounded.md}`, liste de titres de conversation (`caption`), pas de sidebar permanente.
- **Espace sources réservé (`sources-placeholder`)** — zone vide, bordure fine `{colors.border}` en pointillé, sous chaque bulle assistant ; invisible/sans contenu tant que ST-305 n'y insère rien — ne doit pas ressembler à un élément interactif tant qu'il est vide (pas de curseur pointer, pas de hover state).
- **Bannière d'erreur (`banner-error`)** — identique à l'auth, positionnée au-dessus de la zone de saisie.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Corail réservé aux messages/actions de l'utilisateur (sa bulle, le bouton d'envoi) | Utiliser le corail sur une bulle assistant ou tout élément que l'utilisateur n'a pas produit lui-même |
| Bulles `{rounded.lg}`, distinctes des radius de formulaire | Réutiliser le radius `{rounded.sm}` des champs auth pour les bulles |
| Un seul indicateur de chargement (points animés dans la bulle) | Superposer un spinner ET des points animés |
| Espace "Sources" réservé mais visuellement neutre tant que vide | Donner un style interactif (hover, curseur) à l'espace sources vide |
| Menu historique en overlay à la demande | Sidebar permanente qui réduit la largeur de la zone de conversation (hors périmètre ST-303) |
