---
name: NexiaMind AI — Chat
description: Visual identity for the chat conversation interface (ST-303) of NexiaMind AI, plus the global app-shell (header, navigation, source filter, refresh, user menu) shared by every authenticated route. Next.js App Router + Tailwind CSS (no component library). Extends the auth surface's dark tokens (../ux-nexiamind-ai-2026-07-04/DESIGN.md) — same values, repeated here so this file is self-contained — with chat + shell component tokens. Remplace la précédente identité claire "Corporate Chaleureux" par le thème sombre de la maquette de référence.
status: final
updated: 2026-07-09
colors:
  primary: '#F4693F'
  primary-hover: '#FF845E'
  primary-gradient-from: '#F4693F'
  primary-gradient-to: '#E64F2B'
  on-primary: '#FFFFFF'
  accent-blue-from: '#5B8DEF'
  accent-blue-to: '#2F66DF'
  ink: '#EEF2F8'
  ink-strong: '#F2F5FA'
  ink-muted: '#B7C3D6'
  ink-subtle: '#8D9CB5'
  ink-faint: '#647697'
  ink-ghost: '#4F627E'
  surface: '#0A1524'
  surface-header: '#0C1829'
  surface-panel: '#0E1B2E'
  surface-field: '#0A1524'
  border: '#2C3E5C'
  border-soft: '#2A3B58'
  border-header: '#1C2A42'
  border-panel: '#1F2E48'
  nav-active-bg: '#182842'
  error: '#FF5A46'
  error-soft: '#FF7A68'
  error-surface: 'rgba(255, 90, 70, .1)'
  error-border: 'rgba(255, 90, 70, .4)'
  assistant-bubble-bg: '#E9EEF6'
  assistant-bubble-text: '#17233A'
  dot-muted: '#9AA7BD'
  surface-hover: 'rgba(244,105,63,.08)'
typography:
  display:
    fontFamily: 'Newsreader'
    fontSize: 30px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  panel-title:
    fontFamily: system-sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.3'
  body:
    fontFamily: system-sans
    fontSize: 14.5px
    fontWeight: '400'
    lineHeight: '1.6'
  label:
    fontFamily: system-sans
    fontSize: 12.5px
    fontWeight: '500'
    lineHeight: '1.4'
  caption:
    fontFamily: system-sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
  nav-item:
    fontFamily: system-sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.3'
  nav-item-active:
    fontFamily: system-sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.3'
rounded:
  sm: 9px
  md: 13px
  lg: 14px
  xl: 20px
  full: 9999px
spacing:
  header-height: 64px
  panel-header-height: 60px
  chat-max-width: 880px
  bubble-max-width: 78%
  message-gap: 10px
  bubble-padding: '14px 17px'
  composer-padding: '16px 18px'
  gutter: 22px
  sidebar-width: 280px
components:
  app-header:
    background: '{colors.surface-header}'
    border: '{colors.border-header}'
    height: '{spacing.header-height}'
  nav-item:
    activeBackground: '{colors.nav-active-bg}'
    activeForeground: '{colors.ink-strong}'
    inactiveForeground: '{colors.ink-subtle}'
    radius: '{rounded.sm}'
  source-select:
    background: '{colors.surface-panel}'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
  refresh-button:
    background: 'transparent'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
  user-avatar:
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
  chat-panel:
    background: '{colors.surface-panel}'
    border: '{colors.border-panel}'
    radius: '{rounded.xl}'
    shadow: '0 30px 80px -40px rgba(0,0,0,.8)'
  panel-header:
    border: '{colors.border-header}'
    height: '{spacing.panel-header-height}'
  history-button:
    background: '{colors.surface-field}'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
  message-bubble-user:
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.lg}'
    radiusCorner: 'border-top-right-radius: 5px'
    shadow: '0 8px 22px -12px rgba(244,105,63,.55)'
  message-bubble-assistant:
    background: '{colors.assistant-bubble-bg}'
    foreground: '{colors.assistant-bubble-text}'
    radius: '{rounded.lg}'
    radiusCorner: 'border-top-left-radius: 5px'
  assistant-avatar:
    size: 26px
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
  typing-indicator:
    background: '{colors.assistant-bubble-bg}'
    dotColor: '{colors.dot-muted}'
    radius: '{rounded.lg}'
    radiusCorner: 'border-top-left-radius: 5px'
  suggested-prompt-chip:
    background: 'transparent'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.full}'
    hoverBorder: '{colors.primary}'
    hoverBackground: 'rgba(244,105,63,.08)'
  chat-input:
    background: '{colors.surface-field}'
    border: '{colors.border}'
    radius: '{rounded.md}'
    focusBorder: '{colors.primary}'
    text: '{colors.ink}'
  send-button:
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.md}'
    shadow: '0 8px 20px -8px rgba(244,105,63,.55)'
  sources-placeholder:
    border: '{colors.border} dashed'
    foreground: '{colors.ink-faint}'
    radius: '{rounded.sm}'
  banner-error:
    background: '{colors.error-surface}'
    border: '{colors.error-border}'
    foreground: '{colors.error-soft}'
    radius: '{rounded.lg}'
  conversation-list-sidebar:
    background: '{colors.surface-header}'
    border: '{colors.border-panel}'
    width: '{spacing.sidebar-width}'
  conversation-item:
    hoverBackground: '{colors.surface-hover}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.md}'
  conversation-item-active:
    background: '{colors.surface-panel}'
    border: '{colors.border-panel}'
    indicatorColor: '{colors.primary}'
    foreground: '{colors.ink-strong}'
    radius: '{rounded.md}'
  conversation-actions-menu:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    itemHoverBackground: '{colors.surface-hover}'
    radius: '{rounded.md}'
---

## Brand & Style

Même pivot que l'auth — vers le thème sombre de `docs/Maquette-ux-NexiaMind AI.html` (import archivé dans `imports/maquette-nexiamind-ai-dark-2026-07-07.html`) — appliqué ici à l'espace de travail quotidien plutôt qu'au point d'entrée. Le fond marine (`{colors.surface}`) devient la toile de fond permanente du produit ; le panneau de chat flotte dessus comme une carte unique (`chat-panel`), bordée et ombrée, plutôt que de s'étendre pleine largeur — c'est un changement de composition, pas seulement de couleur, par rapport à la précédente itération claire pleine largeur.

Ce fichier porte aussi, pour la première fois, les tokens de l'**app-shell global** (`app-header`, `nav-item`, `source-select`, `refresh-button`, `user-avatar`) : la maquette de référence rend un unique en-tête sombre qui remplace visuellement le `Navbar` existant sans en changer la structure — mêmes 5 entrées de navigation (`Accueil`, `Chat`, `Recherche`, `Documents`, `Admin`, déjà câblées dans `src/components/Navbar/Navbar.tsx`), même bouton Rafraîchir, même emplacement pour le menu utilisateur. `[NOTE FOR UX]` Ces tokens sont documentés ici parce que `/chat` est aujourd'hui la seule route authentifiée réellement implémentée ; quand Accueil/Recherche/Documents/Admin auront leur propre spine, ils devront référencer `app-header`/`nav-item` par le chemin `{ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md}` plutôt que redéfinir ces tokens.

Le corail reste l'unique signal d'action et de présence de l'utilisateur (bulle de ses messages, bouton d'envoi, avatar). L'assistant, lui, reste délibérément neutre — mais pas sombre : sa bulle garde un fond clair (`{colors.assistant-bubble-bg}` `#E9EEF6`) même dans un shell entièrement sombre, rupture de contraste volontaire reprise telle quelle de la maquette pour que la réponse — le contenu qu'on lit le plus longtemps — se détache visuellement de tout le reste de l'interface.

## Colors

- **Corail (`{colors.primary}`, dégradé vers `{colors.primary-gradient-to}`)** marque tout ce que **l'utilisateur** produit activement : la bulle de ses propres messages, le bouton d'envoi, son avatar (initiale). Ne s'applique jamais à un message assistant.
- **Bulle assistant (`{colors.assistant-bubble-bg}` `#E9EEF6` / `{colors.assistant-bubble-text}` `#17233A`)** est la seule zone claire de toute la surface `/chat` — texte foncé sur fond clair, à l'inverse de tout le reste de l'interface. C'est un choix délibéré de la maquette, pas un oubli de thème sombre : préserver.
- **Fond de page (`{colors.surface}`)** et **panneau de chat (`{colors.surface-panel}`)** reprennent exactement les tokens de l'auth — cohérence de marine à travers tout le produit, connecté ou non.
- **En-tête (`{colors.surface-header}` `#0C1829`)** est légèrement plus sombre que le panneau de chat, pour ancrer visuellement la navigation tout en haut de la hiérarchie.
- **Navigation active (`{colors.nav-active-bg}` `#182842`)** distingue l'onglet courant par un fond plein plutôt qu'un soulignement — lisible même à distance, cohérent avec l'absence générale de bordures fines dans le shell.
- **Texte** : cascade `{colors.ink}` → `{colors.ink-muted}` → `{colors.ink-subtle}` → `{colors.ink-faint}` identique à l'auth, réutilisée pour hiérarchiser nom de l'assistant, texte de message, libellés d'aide et disclaimer légal.
- **États d'erreur** : mêmes tokens que l'auth (`{colors.error}` / `{colors.error-surface}` / `{colors.error-border}`) — une bannière d'erreur reste visuellement identique partout dans le produit.

Interdit : ne jamais utiliser le corail en fond de bulle assistant ou de tout élément que l'utilisateur n'a pas produit lui-même ; ne jamais assombrir la bulle assistant pour la faire correspondre au reste du shell — la rupture de contraste est la fonctionnalité, pas un défaut.

## Typography

Corps en pile système sans-serif, comme l'auth. **Newsreader** apparaît une seule fois sur cette surface : le rôle `display`, réservé au titre de l'état vide ("Posez votre première question"). Le titre du panneau de chat ("NexiaMind AI" dans le `panel-header`) reste en sans-serif gras (`panel-title`) — ce n'est pas un titre éditorial, c'est un libellé de zone d'interface.

- **`display`** (30px/600 Newsreader) — titre de l'état vide.
- **`panel-title`** (15px/600 sans-serif) — titre du panneau de chat.
- **`body`** (14.5px/400) — contenu de chaque message, utilisateur comme assistant.
- **`label`** (12.5px/500) — nom de l'assistant au-dessus de sa bulle, libellés du menu historique.
- **`caption`** (12px/400) — disclaimer légal, texte de l'espace sources réservé.
- **`nav-item`** / **`nav-item-active`** (14px, 500/600) — entrées de navigation du header.

## Layout & Spacing

Le header global (`{spacing.header-height}`, 64px) est fixe en haut de toutes les routes authentifiées, pleine largeur, fond `{colors.surface-header}`. En dessous, le panneau de chat est **centré** dans la page (`{spacing.chat-max-width}`, 880px) plutôt que de s'étendre pleine largeur — rupture avec la précédente itération qui héritait du conteneur `container mx-auto` pleine largeur du layout racine sans plafond propre.

À l'intérieur du panneau : en-tête de panneau (`{spacing.panel-header-height}`, 60px) avec titre + bouton Historique ; zone de messages scrollable (padding `{spacing.gutter}`, 22px) ; zone de composition en bas (`{spacing.composer-padding}`, 16px 18px), toujours visible, jamais recouverte par le clavier virtuel ou le scroll.

- `{spacing.bubble-max-width}` (78%) — légèrement plus large que le 70% de la précédente itération, cohérent avec le panneau désormais recentré et plus étroit que la pleine page.
- `{spacing.message-gap}` (10px) — espace vertical entre deux messages.

**Contrainte de hauteur (ST-306)** : toute la surface `/chat` — sidebar (`{spacing.sidebar-width}`, 280px) comprise — occupe exactement l'espace restant sous le header global (`{spacing.header-height}`), sans jamais dépasser la hauteur du viewport. La zone de saisie doit rester atteignable sans scroll de page ; seules la liste de messages et la liste de conversations défilent en interne (`overflow-y-auto`), jamais la page entière. Un seul conteneur de scroll par zone — jamais deux `overflow-y-auto` imbriqués (le parent doit être un conteneur flex pour que le `flex-1` de son enfant ait un effet ; sinon le scroll se produit au mauvais niveau).

## Elevation & Depth

Le panneau de chat porte une ombre large et diffuse (`{components.chat-panel.shadow}`) pour se détacher du fond de page — seul élément de profondeur marqué de cette surface, à l'identique de la logique appliquée à la carte auth. Les bulles n'ont aucune ombre propre ; seule la bulle utilisateur porte une ombre teintée corail légère (`{components.message-bubble-user.shadow}`), écho du bouton d'envoi. Le header n'a pas d'ombre — seule sa bordure basse (`{colors.border-header}`) le sépare du contenu.

## Shapes

`{rounded.lg}` (14px) pour les bulles de message, avec un détail signature repris de la maquette : le coin qui pointe vers l'émetteur est resserré à 5px (`border-top-right-radius` côté utilisateur, `border-top-left-radius` côté assistant) — une pointe de bulle discrète plutôt qu'une forme parfaitement symétrique. `{rounded.xl}` (20px) pour le panneau de chat englobant. Le bouton d'envoi est `{rounded.md}` (13px, carré arrondi) — **pas circulaire**, contrairement à la précédente itération ; cohérent avec la zone de saisie adjacente qui partage le même radius. Les puces de suggestion et le menu historique restent `{rounded.full}`/`{rounded.md}` respectivement, inchangés dans leur logique.

## Components

- **En-tête (`app-header`)** — fond `{colors.surface-header}`, bordure basse `{colors.border-header}`, hauteur `{spacing.header-height}`. Contient logo + wordmark, navigation (`nav-item`), sélecteur de source (`source-select`), bouton Rafraîchir (`refresh-button`), avatar utilisateur (`user-avatar`).
- **Entrée de navigation (`nav-item`)** — fond plein `{colors.nav-active-bg}` + texte `{colors.ink-strong}` si actif, transparent + `{colors.ink-subtle}` sinon. Reprend le comportement exact de `Navbar.tsx` (5 entrées, routes existantes) — seul l'habillage change.
- **Sélecteur de source (`source-select`)** — `<select>` natif stylé, fond `{colors.surface-panel}`, bordure `{colors.border-soft}`, chevron custom. Options : "Toutes les sources", "Documents techniques", "Tickets GitLab", "Bases de connaissances" — à cabler sur `FilterBar`/`FilterDropdown` existants plutôt que recréés.
- **Avatar utilisateur (`user-avatar`)** — cercle dégradé corail avec initiale, remplace l'affichage textuel actuel de `UserMenu` dans le header (le menu déroulant lui-même conserve son comportement, seul le déclencheur change de forme).
- **Panneau de chat (`chat-panel`)** — carte centrée, fond `{colors.surface-panel}`, bordure `{colors.border-panel}`, radius `{rounded.xl}`, ombre portée.
- **Bulle utilisateur (`message-bubble-user`)** — dégradé corail plein, texte `{colors.on-primary}`, alignée à droite, coin supérieur droit resserré.
- **Bulle assistant (`message-bubble-assistant`)** — fond clair `{colors.assistant-bubble-bg}`, texte foncé `{colors.assistant-bubble-text}`, alignée à gauche, coin supérieur gauche resserré, précédée du nom "NexiaMind AI" (`label`) et d'un avatar rond 26px.
- **Indicateur de saisie (`typing-indicator`)** — remplace temporairement la bulle assistant : mêmes fond/radius, trois points `{colors.dot-muted}` qui pulsent en boucle (`nmDot`, 1.1s, décalage 0.18s/0.36s).
- **Zone de saisie (`chat-input`)** — fond `{colors.surface-field}`, bordure `{colors.border}`, radius `{rounded.md}`, bordure corail au focus (pas de glow flouté ici, contrairement à l'auth — la zone de saisie reste dense parmi les messages).
- **Bouton d'envoi (`send-button`)** — carré arrondi `{rounded.md}` (pas circulaire), dégradé corail, icône flèche seule, désactivé (opacité réduite) si champ vide ou réponse en attente.
- **Puce de suggestion (`suggested-prompt-chip`)** — pilule transparente à bordure, devient bordure + fond corail translucide au survol.
- **Bouton Historique (`history-button`)** — bordure `{colors.border-soft}`, fond `{colors.surface-field}`, dans l'en-tête du panneau (pas dans le header global).
- **Espace sources réservé (`sources-placeholder`)** — bordure pointillée `{colors.border}`, texte `{colors.ink-faint}`, sous chaque bulle assistant, neutre tant que ST-305 n'y insère rien.
- **Bannière d'erreur (`banner-error`)** — identique à l'auth, au-dessus de la zone de saisie.
- **Sidebar de conversations (`conversation-list-sidebar`, ST-306)** — fond `{colors.surface-header}` (même ton que la Navbar — ancre la sidebar comme un élément structurel, pas une carte de contenu), bordure droite `{colors.border-panel}`, largeur `{spacing.sidebar-width}` (280px). Permanente à `lg:` et au-delà ; en dessous, devient un overlay plein écran déclenché par un bouton (même fond).
- **Item de conversation (`conversation-item`)** — titre en retour à la ligne libre, sans troncature (jamais de `truncate`/ellipse — un titre long prend plusieurs lignes plutôt que de déborder horizontalement). Survol : fond `{colors.surface-hover}` (corail translucide, même valeur que `suggested-prompt-chip.hoverBackground`). Sélectionné (`conversation-item-active`) : fond `{colors.surface-panel}`, bordure `{colors.border-panel}`, barre verticale corail (`{colors.primary}`) à gauche — traitement distinct du survol, ne jamais les confondre.
- **Menu d'actions de conversation (`conversation-actions-menu`)** — renommer/supprimer, fond `{colors.surface-card}`, bordure `{colors.border}`, items en survol `{colors.surface-hover}`. Réutilise les mêmes tokens que la zone de saisie du chat (`chat-input`), pas de tokens `surface-input`/`border-input` dédiés.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Bulle assistant claire (`{colors.assistant-bubble-bg}`) même sur fond sombre | Assombrir la bulle assistant pour "matcher" le thème |
| Corail réservé aux messages/actions de l'utilisateur | Utiliser le corail sur un élément que l'utilisateur n'a pas produit lui-même |
| Bouton d'envoi carré arrondi (`{rounded.md}`), aligné visuellement sur la zone de saisie | Rendre le bouton d'envoi circulaire (ancienne itération) |
| Panneau de chat centré, plafonné à `{spacing.chat-max-width}` | Étendre le panneau pleine largeur de l'écran |
| Réutiliser `Navbar`/`RefreshButton`/`FilterBar`/`UserMenu` existants, recolorés | Recréer ces composants depuis zéro |
| Newsreader réservé au titre de l'état vide | Étendre Newsreader au corps des messages ou aux libellés d'interface |
| Titre de conversation en retour à la ligne libre dans la sidebar | Tronquer (`truncate`/ellipse) ou laisser déborder horizontalement (scroll-x) |
| Zone de saisie toujours atteignable dans la hauteur du viewport, sans scroll de page | Laisser le panneau `/chat` dépasser 100vh (composer poussé hors écran) |
</content>
