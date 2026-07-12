---
name: NexiaMind AI — Chat
description: Visual identity for the chat conversation interface (ST-303) of NexiaMind AI, plus the global app-shell (header, navigation, source filter, refresh, user menu) shared by every authenticated route. Next.js App Router + Tailwind CSS (no component library). Extends the auth surface's dark tokens (../ux-nexiamind-ai-2026-07-04/DESIGN.md) — same values, repeated here so this file is self-contained — with chat + shell component tokens. Remplace la précédente identité claire "Corporate Chaleureux" par le thème sombre de la maquette de référence.
status: final
updated: 2026-07-11
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
  assistant-bubble-bg: '#0C1829'
  assistant-bubble-text: '#EEF2F8'
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
  footer-height: 48px
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
  app-footer:
    background: '{colors.surface-header}'
    border: '{colors.border-header}'
    height: '{spacing.footer-height}'
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
  avatar-panel:
    background: 'transparent'
    border-top: '{colors.border-panel}'
  avatar-panel-avatar:
    size: 80px
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.full}'
    shadow: '0 8px 22px -12px rgba(244,105,63,.55)'
  mic-toggle-button:
    background: '{colors.surface}'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.md}'
    activeBackground: '{colors.primary}'
    activeForeground: '{colors.on-primary}'
    activeBorder: '{colors.primary}'
  mic-ptt-button:
    background: '{colors.surface}'
    border: '{colors.border-soft}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.md}'
    activeBackground: '{colors.primary}'
    activeForeground: '{colors.on-primary}'
    activeBorder: '{colors.primary}'
    badgeForeground: '{colors.ink-faint}'
  listen-button:
    background: '{colors.surface-card}'
    border: '{colors.border}'
    foreground: '{colors.ink-muted}'
    radius: '{rounded.sm}'
    speakingForeground: '{colors.ink-muted}'
---

## Brand & Style

Même pivot que l'auth — vers le thème sombre de `docs/Maquette-ux-NexiaMind AI.html` (import archivé dans `imports/maquette-nexiamind-ai-dark-2026-07-07.html`) — appliqué ici à l'espace de travail quotidien plutôt qu'au point d'entrée. Le fond marine (`{colors.surface}`) devient la toile de fond permanente du produit.

`[NOTE FOR UX]` Ossature révisée le 2026-07-11 selon `docs/Maquette-structure-NexiaMind-AI-Chat.html` : le panneau de chat (`chat-panel`) **n'est plus une carte flottante centrée** (bordure/ombre/radius/`max-width` retirés) — il occupe désormais toute la largeur de la colonne à droite de la sidebar, en pleine hauteur, comme sur la maquette de structure. Ceci **remplace** la décision de composition du 2026-07-09 ("carte centrée plutôt que pleine largeur"). Un **footer global** (`app-footer`, 48px, fond sombre `{colors.surface-header}`) apparaît aussi pour la première fois en bas de toute la surface `/chat` — il porte le disclaimer légal, déplacé depuis le pied du panneau de chat vers cette bande commune à toute la page (une seule instance au lieu d'une par page/état).

Ce fichier porte aussi, pour la première fois, les tokens de l'**app-shell global** (`app-header`, `nav-item`, `source-select`, `refresh-button`, `user-avatar`) : la maquette de référence rend un unique en-tête sombre qui remplace visuellement le `Navbar` existant sans en changer la structure — mêmes 5 entrées de navigation (`Accueil`, `Chat`, `Recherche`, `Documents`, `Admin`, déjà câblées dans `src/components/Navbar/Navbar.tsx`), même bouton Rafraîchir, même emplacement pour le menu utilisateur. `[NOTE FOR UX]` Ces tokens sont documentés ici parce que `/chat` est aujourd'hui la seule route authentifiée réellement implémentée ; quand Accueil/Recherche/Documents/Admin auront leur propre spine, ils devront référencer `app-header`/`nav-item` par le chemin `{ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md}` plutôt que redéfinir ces tokens.

Le corail reste l'unique signal d'action et de présence de l'utilisateur (bulle de ses messages, bouton d'envoi, avatar). L'assistant, lui, reste délibérément neutre — sa bulle est sombre (`{colors.assistant-bubble-bg}` `#0C1829`, texte quasi-blanc `{colors.assistant-bubble-text}` `#EEF2F8`), alignée sur le reste du shell plutôt qu'en rupture de contraste. `[NOTE FOR UX]` Ceci **remplace** la décision initiale de bulle claire (rupture de contraste volontaire de la première itération sombre) — décision explicitement inversée le 2026-07-11 à la demande utilisateur, et cohérente avec `Markdown.module.css` qui était déjà écrit pour un texte clair sur fond sombre (le rendu Markdown enrichi, ST-307, n'a jamais réellement respecté l'ancien token clair).

Ce fichier porte, depuis la mise à jour du 2026-07-11, le **panneau Avatar** (`avatar-panel`) sous la liste de conversations — un socle réservé à une future identité 3D de l'assistant (aujourd'hui un cercle dégradé corail en attendant le modèle) et à deux contrôles micro (`mic-toggle-button`, `mic-ptt-button`) pilotant la dictée vocale vers la zone de saisie. Le corail s'étend ici, par exception documentée, à un contrôle micro **actif** (écoute en cours) — parce que ce n'est plus l'assistant qui est corail, c'est l'action de l'utilisateur (parler) qui l'est, cohérent avec la règle générale ci-dessus plutôt qu'une entorse.

## Colors

- **Corail (`{colors.primary}`, dégradé vers `{colors.primary-gradient-to}`)** marque tout ce que **l'utilisateur** produit activement : la bulle de ses propres messages, le bouton d'envoi, son avatar (initiale). Ne s'applique jamais à un message assistant.
- **Bulle assistant (`{colors.assistant-bubble-bg}` `#0C1829` / `{colors.assistant-bubble-text}` `#EEF2F8`)** est sombre, texte quasi-blanc — alignée sur `{colors.surface-header}`/`{colors.ink}` déjà utilisés ailleurs dans le shell plutôt qu'une teinte inédite.
- **Fond de page (`{colors.surface}`)** et **panneau de chat (`{colors.surface-panel}`)** reprennent exactement les tokens de l'auth — cohérence de marine à travers tout le produit, connecté ou non.
- **En-tête (`{colors.surface-header}` `#0C1829`)** est légèrement plus sombre que le panneau de chat, pour ancrer visuellement la navigation tout en haut de la hiérarchie.
- **Navigation active (`{colors.nav-active-bg}` `#182842`)** distingue l'onglet courant par un fond plein plutôt qu'un soulignement — lisible même à distance, cohérent avec l'absence générale de bordures fines dans le shell.
- **Texte** : cascade `{colors.ink}` → `{colors.ink-muted}` → `{colors.ink-subtle}` → `{colors.ink-faint}` identique à l'auth, réutilisée pour hiérarchiser nom de l'assistant, texte de message, libellés d'aide et disclaimer légal.
- **États d'erreur** : mêmes tokens que l'auth (`{colors.error}` / `{colors.error-surface}` / `{colors.error-border}`) — une bannière d'erreur reste visuellement identique partout dans le produit.

Interdit : ne jamais utiliser le corail en fond de bulle assistant ou de tout élément que l'utilisateur n'a pas produit lui-même.

## Typography

Corps en pile système sans-serif, comme l'auth. **Newsreader** apparaît une seule fois sur cette surface : le rôle `display`, réservé au titre de l'état vide ("Posez votre première question"). Le titre du panneau de chat ("NexiaMind AI" dans le `panel-header`) reste en sans-serif gras (`panel-title`) — ce n'est pas un titre éditorial, c'est un libellé de zone d'interface.

- **`display`** (30px/600 Newsreader) — titre de l'état vide.
- **`panel-title`** (15px/600 sans-serif) — titre du panneau de chat.
- **`body`** (14.5px/400) — contenu de chaque message, utilisateur comme assistant.
- **`label`** (12.5px/500) — nom de l'assistant au-dessus de sa bulle, libellés du menu historique.
- **`caption`** (12px/400) — disclaimer légal, texte de l'espace sources réservé.
- **`nav-item`** / **`nav-item-active`** (14px, 500/600) — entrées de navigation du header.

## Layout & Spacing

Le header global (`{spacing.header-height}`, 64px) est fixe en haut de toutes les routes authentifiées, pleine largeur, fond `{colors.surface-header}`. En dessous, la surface `/chat` est une rangée à deux colonnes pleine largeur — sidebar (`{spacing.sidebar-width}`, 280px) puis panneau de chat occupant tout le reste (plus de plafond `max-width` ni de centrage, voir Brand & Style) — et un **footer global** (`app-footer`, `{spacing.footer-height}`, 48px) ferme la page en bas, sous cette rangée, pleine largeur lui aussi (sous la sidebar comme sous le panneau de chat).

À l'intérieur du panneau : en-tête de panneau (`{spacing.panel-header-height}`, 60px) avec titre + bouton Historique ; zone de messages scrollable (padding `{spacing.gutter}`, 22px) ; zone de composition en bas (`{spacing.composer-padding}`, 16px 18px), toujours visible, jamais recouverte par le clavier virtuel ou le scroll.

- `{spacing.bubble-max-width}` (78%) — inchangé ; le panneau étant maintenant pleine largeur, cette limite évite des bulles trop étirées sur grand écran.
- `{spacing.message-gap}` (10px) — espace vertical entre deux messages.

**Contrainte de hauteur (ST-306)** : toute la surface `/chat` — sidebar comprise, footer global compris — occupe exactement l'espace restant sous le header global (`{spacing.header-height}`), sans jamais dépasser la hauteur du viewport. La zone de saisie doit rester atteignable sans scroll de page ; seules la liste de messages (`data-testid="chat-message-list"`) et la liste de conversations défilent en interne (`overflow-y-auto`), jamais la page entière. Un seul conteneur de scroll par zone — jamais deux `overflow-y-auto` imbriqués (le parent doit être un conteneur flex pour que le `flex-1` de son enfant ait un effet ; sinon le scroll se produit au mauvais niveau). `[NOTE FOR UX]` Cette contrainte dépend d'un maillon en amont de cette spine : `src/app/layout.tsx`, `<body>` doit être borné (`h-full`, pas `min-h-screen`) — un plancher sans plafond y annule tout le chaînage `overflow-hidden` en dessous (`MainContent` → `chat/layout.tsx` → panneau) et fait défiler la page entière au lieu de la seule liste de messages (bug vécu et corrigé le 2026-07-11).

## Elevation & Depth

Le panneau de chat n'a plus d'ombre propre depuis le passage en pleine largeur (2026-07-11) — plus aucun élément de profondeur marqué sur cette surface hormis les bulles. Les bulles n'ont aucune ombre propre ; seule la bulle utilisateur porte une ombre teintée corail légère (`{components.message-bubble-user.shadow}`), écho du bouton d'envoi. Le header n'a pas d'ombre — seule sa bordure basse (`{colors.border-header}`) le sépare du contenu ; le footer global suit la même logique (bordure haute, pas d'ombre).

## Shapes

`{rounded.lg}` (14px) pour les bulles de message, avec un détail signature repris de la maquette : le coin qui pointe vers l'émetteur est resserré à 5px (`border-top-right-radius` côté utilisateur, `border-top-left-radius` côté assistant) — une pointe de bulle discrète plutôt qu'une forme parfaitement symétrique. Le panneau de chat englobant n'a plus de radius propre (pleine largeur, coins carrés implicites — voir Layout & Spacing). Le bouton d'envoi est `{rounded.md}` (13px, carré arrondi) — **pas circulaire**, contrairement à la précédente itération ; cohérent avec la zone de saisie adjacente qui partage le même radius. Les puces de suggestion et le menu historique restent `{rounded.full}`/`{rounded.md}` respectivement, inchangés dans leur logique.

## Components

- **En-tête (`app-header`)** — fond `{colors.surface-header}`, bordure basse `{colors.border-header}`, hauteur `{spacing.header-height}`. Contient logo + wordmark, navigation (`nav-item`), sélecteur de source (`source-select`), bouton Rafraîchir (`refresh-button`), avatar utilisateur (`user-avatar`).
- **Entrée de navigation (`nav-item`)** — fond plein `{colors.nav-active-bg}` + texte `{colors.ink-strong}` si actif, transparent + `{colors.ink-subtle}` sinon. Reprend le comportement exact de `Navbar.tsx` (5 entrées, routes existantes) — seul l'habillage change.
- **Sélecteur de source (`source-select`)** — `<select>` natif stylé, fond `{colors.surface-panel}`, bordure `{colors.border-soft}`, chevron custom. Options : "Toutes les sources", "Documents techniques", "Tickets GitLab", "Bases de connaissances" — à cabler sur `FilterBar`/`FilterDropdown` existants plutôt que recréés.
- **Avatar utilisateur (`user-avatar`)** — cercle dégradé corail avec initiale, remplace l'affichage textuel actuel de `UserMenu` dans le header (le menu déroulant lui-même conserve son comportement, seul le déclencheur change de forme).
- **Panneau de chat (`chat-panel`)** — pleine largeur de la colonne (plus de carte centrée depuis le 2026-07-11), fond `{colors.surface-panel}`, pas de bordure/radius/ombre propres.
- **Footer global (`app-footer`)** — fond `{colors.surface-header}`, bordure haute `{colors.border-header}`, hauteur `{spacing.footer-height}`. Pleine largeur (sous la sidebar et le panneau de chat), une seule instance pour toute la surface `/chat`. Porte le disclaimer légal (`caption`), centré.
- **Bulle utilisateur (`message-bubble-user`)** — dégradé corail plein, texte `{colors.on-primary}`, alignée à droite, coin supérieur droit resserré.
- **Bulle assistant (`message-bubble-assistant`)** — fond sombre `{colors.assistant-bubble-bg}`, texte quasi-blanc `{colors.assistant-bubble-text}`, alignée à gauche, coin supérieur gauche resserré, précédée du nom "NexiaMind AI" (`label`) et d'un avatar rond 26px. Barre d'actions (`export-button` + `listen-button`) ancrée en haut à droite de la bulle (`absolute`), texte du message décalé (`pt-8`) pour lui laisser la place.
- **Bouton Écouter (`listen-button`)** — même habillage que `export-button` (fond `{colors.surface-card}`, bordure `{colors.border}`, radius `{rounded.sm}`), icône haut-parleur au repos, icône carré (stop) pendant la lecture — synthèse vocale (Web Speech API) du contenu de la bulle, une seule lecture active à la fois tous messages confondus.
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
- **Panneau Avatar (`avatar-panel`)** — sous la liste de conversations, séparé par une bordure haute (`{colors.border-panel}`), fond transparent (hérite du fond de la sidebar). Contient l'avatar (`avatar-panel-avatar`) centré, puis les deux boutons micro côte à côte en dessous.
- **Avatar réservé (`avatar-panel-avatar`)** — cercle 80px, dégradé corail identique à `user-avatar`, initiale ou icône neutre en attendant l'intégration d'un modèle 3D (`[NOTE FOR UX]` la zone est dimensionnée et centrée dès aujourd'hui pour accueillir ce modèle sans reflow futur — voir `EXPERIENCE.md.Component Patterns`).
- **Bouton micro bascule (`mic-toggle-button`)** — icône micro seule, carré arrondi `{rounded.md}`, état repos identique à `history-button` (fond `{colors.surface}`, bordure `{colors.border-soft}`, icône `{colors.ink-muted}`). État actif (écoute en cours) : fond et bordure corail plein (`{components.mic-toggle-button.activeBackground}`), icône blanche — même traitement que les autres surfaces d'action utilisateur.
- **Bouton micro maintien / F8 (`mic-ptt-button`)** — même habillage au repos que `mic-toggle-button`, avec un badge discret "F8" (`{components.mic-ptt-button.badgeForeground}`) sous l'icône pour signaler le raccourci clavier équivalent. Même traitement actif (fond/bordure corail) pendant tout le temps où la touche F8 est maintenue ou le bouton pressé à la souris — jamais de troisième état visuel distinct entre bascule et maintien, l'utilisateur ne doit percevoir qu'un seul signal "micro actif".

## Do's and Don'ts

| Do | Don't |
|---|---|
| Bulle assistant sombre (`{colors.assistant-bubble-bg}`), texte quasi-blanc, alignée sur le reste du shell | Éclaircir la bulle assistant (ancienne rupture de contraste, abandonnée le 2026-07-11) |
| Corail réservé aux messages/actions de l'utilisateur | Utiliser le corail sur un élément que l'utilisateur n'a pas produit lui-même |
| Un seul conteneur de scroll par zone (sidebar, liste de messages) | Imbriquer deux `overflow-y-auto` — casse le confinement du scroll entre header et composer/avatar-panel |
| Bouton d'envoi carré arrondi (`{rounded.md}`), aligné visuellement sur la zone de saisie | Rendre le bouton d'envoi circulaire (ancienne itération) |
| Panneau de chat pleine largeur, sans carte flottante | Recentrer/plafonner le panneau (ancienne itération, abandonnée le 2026-07-11) |
| Footer global (`app-footer`) commun à toute la surface `/chat`, une seule instance | Dupliquer le disclaimer légal par page/état (ancien pattern, une instance par écran) |
| Réutiliser `Navbar`/`RefreshButton`/`FilterBar`/`UserMenu` existants, recolorés | Recréer ces composants depuis zéro |
| Newsreader réservé au titre de l'état vide | Étendre Newsreader au corps des messages ou aux libellés d'interface |
| Titre de conversation en retour à la ligne libre dans la sidebar | Tronquer (`truncate`/ellipse) ou laisser déborder horizontalement (scroll-x) |
| Zone de saisie toujours atteignable dans la hauteur du viewport, sans scroll de page | Laisser le panneau `/chat` dépasser 100vh (composer poussé hors écran) |
| Un seul signal visuel "micro actif" (fond/bordure corail), quel que soit le déclencheur (clic bascule, F8, clic maintenu) | Inventer un état visuel distinct par déclencheur — l'utilisateur doit reconnaître "j'écoute" d'un coup d'œil, peu importe comment il l'a activé |
| Avatar réservé pré-dimensionné (80px, centré) dès maintenant, même sans modèle 3D branché | Redimensionner/repositionner l'avatar quand le modèle 3D arrivera — le layout doit déjà être définitif |
</content>
