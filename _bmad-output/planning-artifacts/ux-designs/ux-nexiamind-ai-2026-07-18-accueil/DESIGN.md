---
name: NexiaMind AI — Accueil
description: Visual identity for the homepage (`/`, pre-chat landing surface) of NexiaMind AI — hero, primary/secondary CTAs, suggestion chips, and the "3 steps" explainer. Next.js App Router + Tailwind CSS (no component library). Extends the chat/app-shell dark tokens (../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md) — colors and rounded values repeated here byte-identical so those two token groups are self-contained; typography/spacing roles not used on this page are only referenced by name, see the chat file for their values — with homepage-specific component tokens confirmed against imports/maquette-nexiamind-ai-accueil-2026-07-18.html.
status: final
updated: 2026-07-18
colors:
  # --- Inherited from ../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md, repeated
  # here so this file is self-contained. Do not redefine these elsewhere —
  # the chat DESIGN.md is the source of truth if a value ever needs to change. ---
  primary: '#F4693F'
  primary-hover: '#FF845E'
  primary-gradient-from: '#F4693F'
  primary-gradient-to: '#E64F2B'
  on-primary: '#FFFFFF'
  ink: '#EEF2F8'
  ink-strong: '#F2F5FA'
  ink-muted: '#B7C3D6'
  ink-subtle: '#8D9CB5'
  ink-faint: '#647697'
  ink-ghost: '#4F627E'
  surface: '#0A1524'
  surface-header: '#0C1829'
  surface-panel: '#0E1B2E'
  border: '#2C3E5C'
  border-soft: '#2A3B58'
  border-header: '#1C2A42'
  # --- New: homepage-specific tokens, extracted from
  # imports/maquette-nexiamind-ai-accueil-2026-07-18.html ---
  # hero-cta-gradient-* and hero-cta-shadow* were overridden post-extraction
  # to match {colors.primary-gradient-from}/{colors.primary-gradient-to} and
  # the chat's cta-primary shadow exactly (product decision: one CTA orange
  # across the whole app, not the maquette's slightly distinct hue).
  hero-cta-gradient-from: '#F4693F'
  hero-cta-gradient-to: '#E64F2B'
  hero-cta-shadow: 'rgba(244,105,63,.55)'
  hero-cta-shadow-soft: 'rgba(244,105,63,.4)'
  accent-orange: '#FF8A56'
  hero-heading: '#F6F8FC'
  hero-subheading: '#A8B0C0'
  hero-eyebrow-border: 'rgba(242,101,44,0.35)'
  hero-eyebrow-bg: 'rgba(242,101,44,0.08)'
  cta-secondary-border: 'rgba(255,255,255,0.12)'
  cta-secondary-bg: 'rgba(255,255,255,0.03)'
  cta-secondary-bg-hover: 'rgba(255,255,255,0.07)'
  cta-secondary-text: '#DFE4EE'
  chip-border: 'rgba(255,255,255,0.1)'
  chip-bg: 'rgba(255,255,255,0.035)'
  chip-text: '#CDD4E0'
  chip-border-hover: 'rgba(242,101,44,0.5)'
  chip-bg-hover: 'rgba(242,101,44,0.08)'
  chips-eyebrow-text: '#8D9CB5' # = {colors.ink-subtle} — corrigé post-revue accessibilité (2026-07-18) : la valeur extraite de la maquette (#6F7789) échouait au contraste AA (~4.08:1 sur {colors.surface}) ; celle-ci passe à ~6.6:1
  step-card-border: 'rgba(255,255,255,0.07)'
  step-card-border-hover: 'rgba(242,101,44,0.35)'
  step-card-bg-from: 'rgba(255,255,255,0.035)'
  step-card-bg-to: 'rgba(255,255,255,0.01)'
  step-badge-bg: 'rgba(242,101,44,0.12)'
  step-badge-border: 'rgba(242,101,44,0.3)'
  step-body-text: '#98A1B3'
typography:
  # Inherited body/label/caption from chat DESIGN.md apply unchanged to any
  # incidental text on this page. Only the roles below are new.
  hero-display:
    fontFamily: 'Newsreader'
    fontSize: 60px
    fontWeight: '600'
    lineHeight: '1.04'
    letterSpacing: -0.015em
  hero-subheading:
    fontFamily: system-sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  hero-eyebrow:
    fontFamily: system-sans
    fontSize: 12.5px
    fontWeight: '600'
    letterSpacing: 0.04em
  cta-label:
    fontFamily: system-sans
    fontSize: 19px
    fontWeight: '700'
    # Corrigé post-revue accessibilité (2026-07-18) : 15.5px/600 ne clearait
    # pas le seuil AA "grand texte" (18.66px bold minimum) ; le texte blanc
    # sur {colors.hero-cta-gradient-from} ne passe qu'à ~3.03:1, en dessous
    # des 4.5:1 requis pour du texte normal. À 19px/700 le contrôle se
    # qualifie comme "grand texte" (seuil AA 3:1) et 3.03:1 passe.
  chips-eyebrow:
    fontFamily: system-sans
    fontSize: 13px
    fontWeight: '600'
    letterSpacing: 0.05em
  chip-label:
    fontFamily: system-sans
    fontSize: 14px
    fontWeight: '500'
  section-display:
    fontFamily: 'Newsreader'
    fontSize: 38px
    fontWeight: '600'
    lineHeight: '1.2'
  step-number:
    fontFamily: 'Newsreader'
    fontSize: 22px
    fontWeight: '700'
  step-title:
    fontFamily: system-sans
    fontSize: 19px
    fontWeight: '700'
  step-body:
    fontFamily: system-sans
    fontSize: 14.5px
    fontWeight: '400'
    lineHeight: '1.6'
rounded:
  # Inherited scale (chat DESIGN.md), unchanged.
  sm: 9px
  md: 13px
  lg: 14px
  xl: 20px
  full: 9999px
  # New — the mockup's CTA/card corners don't land on the inherited scale.
  hero-cta: 12px
  step-card: 18px
spacing:
  # Inherited from chat DESIGN.md where applicable (header-height, gutter, etc.)
  hero-content-max-width: 520px
  section-max-width: 1280px
  chips-gap: 10px
  steps-grid-gap: 20px
  cta-group-gap: 14px
components:
  hero-eyebrow-badge:
    background: '{colors.hero-eyebrow-bg}'
    border: '{colors.hero-eyebrow-border}'
    foreground: '{colors.accent-orange}'
    radius: '{rounded.full}'
    dotColor: '{colors.accent-orange}'
  hero-heading:
    fontFamily: '{typography.hero-display.fontFamily}'
    foreground: '{colors.hero-heading}'
    accentForeground: '{colors.accent-orange}'
  hero-subheading:
    foreground: '{colors.hero-subheading}'
    maxWidth: '{spacing.hero-content-max-width}'
  cta-primary:
    background: 'linear-gradient(135deg, {colors.hero-cta-gradient-from}, {colors.hero-cta-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.hero-cta}'
    shadow: '0 12px 30px {colors.hero-cta-shadow}'
    hover: 'filter: brightness(1.08)'
  cta-secondary-disabled:
    background: '{colors.cta-secondary-bg}'
    border: '{colors.cta-secondary-border}'
    foreground: '{colors.cta-secondary-text}'
    radius: '{rounded.hero-cta}'
    disabledOpacity: '0.55'
    cursor: 'not-allowed'
    tooltipBackground: '{colors.surface-panel}'
    tooltipBorder: '{colors.border-soft}'
    tooltipForeground: '{colors.ink-muted}'
  suggestion-chip:
    background: '{colors.chip-bg}'
    border: '{colors.chip-border}'
    foreground: '{colors.chip-text}'
    radius: '{rounded.full}'
    arrowColor: '{colors.accent-orange}'
    hoverBorder: '{colors.chip-border-hover}'
    hoverBackground: '{colors.chip-bg-hover}'
    hoverForeground: '{colors.on-primary}'
  step-card:
    background: 'linear-gradient(180deg, {colors.step-card-bg-from}, {colors.step-card-bg-to})'
    border: '{colors.step-card-border}'
    hoverBorder: '{colors.step-card-border-hover}'
    radius: '{rounded.step-card}'
  step-number-badge:
    background: '{colors.step-badge-bg}'
    border: '{colors.step-badge-border}'
    foreground: '{colors.accent-orange}'
    radius: '{rounded.hero-cta}'
  closing-cta:
    # Same visual family as cta-primary, slightly softer shadow and tighter
    # padding in the mockup (15px 30px vs 16px 28px) — same component, not a
    # new one; see Components below.
    background: 'linear-gradient(135deg, {colors.hero-cta-gradient-from}, {colors.hero-cta-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.hero-cta}'
    shadow: '0 12px 30px {colors.hero-cta-shadow-soft}'
    hover: 'filter: brightness(1.08)'
---

## Brand & Style

L'accueil est le point d'entrée pré-chat : la promesse du produit énoncée une fois, en grand, avant que l'utilisateur ne bascule dans l'outil de travail (`/chat`). Contrairement au chat (utilitaire, dense) et à l'auth (formulaire, minimal), l'accueil s'autorise un moment éditorial — titre serif à grande échelle, respiration verticale généreuse, un unique accent chaleureux qui guide l'œil vers l'action. Il reste néanmoins un outil professionnel interne, pas une page marketing grand public : la sobriété de fond (marine `{colors.surface}`, palette héritée du chat) et le vouvoiement restent la norme.

Hérite intégralement de `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md` pour tout ce qui touche à l'app-shell (header, navigation, footer) — l'accueil vit sous la même `Navbar`/`Footer` restylées déjà documentées là-bas, non redéfinies ici. Ce fichier ajoute uniquement les tokens propres au contenu de la page : le hero, les deux CTA, les puces de suggestion et l'explicatif en 3 étapes.

`[NOTE FOR UX]` La maquette importée (`imports/maquette-nexiamind-ai-accueil-2026-07-18.html`) porte son propre header/footer de prototype (fond `rgba(9,14,26,.72)` avec flou, liens marketing "Produit / Fonctionnalités / Tarifs / API"). Ce n'est **pas** ce qui s'implémente : la page réelle reste sous le `Navbar`/`Footer` déjà en place (voir `src/app/layout.tsx`), conformément à `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md.Components.app-header`. Seule la zone de contenu (hero → CTA → puces → 3 étapes → CTA de clôture) est spécifiée par ce fichier.

## Colors

- **Dégradé CTA (`{colors.hero-cta-gradient-from}` `#F4693F` → `{colors.hero-cta-gradient-to}` `#E64F2B`)** habille les deux boutons "Discuter avec Nexia" et "Commencer une conversation" (CTA de clôture, bas de page). La maquette importée spécifiait à l'origine un dégradé légèrement distinct (`#E2673C` → `#C14E2F`) ; **décision produit (revue du 2026-07-18)** : unifier avec le dégradé corail déjà établi du chat (`{colors.primary-gradient-from}` → `{colors.primary-gradient-to}`) plutôt que d'introduire une seconde nuance d'orange — une seule couleur de marque dans toute l'app. L'ombre associée (`{colors.hero-cta-shadow}`, `rgba(244,105,63,.55)`) reprend telle quelle celle déjà définie pour `cta-primary` dans `../ux-nexiamind-ai-2026-07-04-chat/DESIGN.md`.
- **Orange accent (`{colors.accent-orange}` `#FF8A56`)** est le signal d'accroche léger : dernière ligne du titre en italique, badge "Assistant RAG • en ligne", flèche des puces de suggestion, numéro des 3 étapes. Jamais utilisé en fond plein (réservé aux dégradés CTA ci-dessus) — un accent de texte/contour, pas une couleur de remplissage.
- **Fond de page (`{colors.surface}`)** — identique au chat, aucune rupture de teinte entre les deux surfaces.
- **Texte** : `{colors.hero-heading}` (`#F6F8FC`, quasi identique à `{colors.ink-strong}`) pour le titre, `{colors.hero-subheading}` (`#A8B0C0`) pour le sous-titre, `{colors.step-body-text}` (`#98A1B3`) pour le corps des cartes d'étapes — une cascade de gris-bleu cohérente avec `{colors.ink-muted}`/`{colors.ink-subtle}` du chat sans être des alias stricts (valeurs propres à cette surface, confirmées depuis la maquette).
- **CTA secondaire ("Explorer les documents")** utilise une palette neutre (`{colors.cta-secondary-bg}`, `{colors.cta-secondary-border}`, `{colors.cta-secondary-text}`) — visuellement un bouton "fantôme" à bordure claire. `[NOTE FOR UX]` La maquette rend ce bouton dans un état actif/cliquable normal ; la décision produit (voir `.memlog.md`) le place en **désactivé** avec tooltip "Bientôt disponible" — voir Components ci-dessous pour le traitement visuel de l'état désactivé, qui n'existe pas dans la maquette et devait être inféré.

## Typography

**Newsreader** (serif) porte le moment éditorial de cette surface. La maquette importée spécifiait à l'origine "Playfair Display" (deux `@font-face` chargées en tête de fichier) ; **décision produit (revue du 2026-07-18)** : réutiliser `Newsreader`, déjà chargée pour le chat (`src/app/layout.tsx`), plutôt qu'ajouter une seconde police serif au produit — aucun nouveau `next/font/google` à câbler pour cette story.

- **`hero-display`** (60px/600 Newsreader, interligne serré 1.04) — titre principal, seul élément en Newsreader taille XL de la page. Dernière ligne en italique, couleur `{colors.accent-orange}`.
- **`section-display`** (38px/600 Newsreader) — titre de la section "Trois pas, et vous avez la réponse".
- **`step-number`** (22px/700 Newsreader) — chiffre "1"/"2"/"3" dans le badge de chaque carte d'étape ; même famille que les titres, pour ancrer les 3 étapes dans le même moment éditorial que le hero.
- **`hero-subheading`** (18px/400, sans-serif système) — paragraphe sous le titre, cascade normale de `{colors.hero-subheading}`.
- **`hero-eyebrow`** (12.5px/600, majuscules, `letter-spacing` 0.04em) — badge "Assistant RAG • en ligne" au-dessus du titre.
- **`chips-eyebrow`** (13px/600, majuscules, `letter-spacing` 0.05em) — libellé "Essayez une question — cliquez pour lancer le chat" au-dessus des puces.
- **`chip-label`** (14px/500, sans-serif système) — texte de chaque puce de suggestion.
- **`cta-label`** (15.5px/600, sans-serif système) — texte des deux CTA du hero et du CTA de clôture.
- **`step-title`** / **`step-body`** (19px/700 et 14.5px/400 sans-serif système) — titre et corps de chaque carte d'étape.

## Layout & Spacing

Contenu contraint à `{spacing.section-max-width}` (1280px), centré, cohérent avec la largeur déjà utilisée par le header/footer globaux. Le hero est une grille à deux colonnes sur grand écran (texte + zone avatar 3D réservée — voir `[NOTE FOR UX]` ci-dessous) ; le sous-titre est plafonné à `{spacing.hero-content-max-width}` (520px) pour rester lisible en une à deux lignes malgré la largeur de colonne.

Les deux CTA du hero sont côte à côte (`gap: {spacing.cta-group-gap}`, 14px), en `flex-wrap` — ils s'empilent verticalement sous le point de rupture où ils ne tiennent plus côte à côte (mobile). Les puces de suggestion suivent en `flex-wrap` avec `{spacing.chips-gap}` (10px) entre elles. La section "3 étapes" est une grille à 3 colonnes égales (`{spacing.steps-grid-gap}`, 20px) qui passe en 1 colonne sous `md`.

`[NOTE FOR UX]` La maquette inclut une zone "AVATAR 3D STAGE" (560px de hauteur, sphère dégradée + wireframe Three.js interactif, "Glissez pour tourner l'avatar") à côté du texte du hero. Cette zone est **hors périmètre** de ce spine — aucune story ne couvre encore un avatar 3D interactif pour l'accueil (à la différence du panneau Avatar réservé du chat, `avatar-panel`, qui lui est déjà spécifié). Ne pas implémenter cette zone ; le hero peut occuper toute la largeur disponible en son absence, ou une zone neutre réservée peut être laissée en `[ASSUMPTION]` si une story future en a besoin — décision à trancher hors de ce document.

## Elevation & Depth

Les deux CTA (primaire du hero et de clôture) portent une ombre teintée corail (`{components.cta-primary.shadow}`, `0 12px 30px rgba(244,105,63,.55)` / `rgba(244,105,63,.4)` pour la clôture — mêmes valeurs que `cta-primary`/`send-button` du chat, cf. dégradé unifié en § Colors) — seul élément avec une ombre marquée sur la page, cohérent avec la règle du chat "l'ombre signale l'action de l'utilisateur". Les cartes d'étape n'ont pas d'ombre propre, seulement un dégradé de fond très subtil (`{colors.step-card-bg-from}` → `{colors.step-card-bg-to}`) et une bordure qui s'éclaircit au survol (`{colors.step-card-border-hover}`) — même logique de profondeur minimale que le reste du produit.

## Shapes

`{rounded.hero-cta}` (12px) pour les deux CTA du hero, le CTA de clôture et le badge numéroté des étapes — un radius propre à cette surface, distinct de `{rounded.md}` (13px) hérité du chat. `{rounded.step-card}` (18px) pour les cartes d'étape — entre `{rounded.lg}` (14px) et `{rounded.xl}` (20px) du chat, valeur propre confirmée depuis la maquette plutôt qu'arrondie vers l'échelle existante. `{rounded.full}` (pilule) pour le badge "Assistant RAG • en ligne" et les puces de suggestion — cohérent avec `suggested-prompt-chip` du chat.

## Components

- **Badge "Assistant RAG • en ligne" (`hero-eyebrow-badge`)** — pilule `{rounded.full}`, fond `{colors.hero-eyebrow-bg}`, bordure `{colors.hero-eyebrow-border}`, texte `{colors.accent-orange}` en `{typography.hero-eyebrow}`, précédée d'un point 6px de la même couleur avec un léger halo (`box-shadow: 0 0 10px {colors.accent-orange}`).
- **Titre du hero (`hero-heading`)** — `{typography.hero-display}`, couleur `{colors.hero-heading}`. Contenu exact : "Toute la connaissance de l'entreprise, à portée de conversation." — la dernière proposition ("à portée de conversation.") en italique, couleur `{colors.accent-orange}`.
- **Sous-titre du hero (`hero-subheading`)** — `{typography.hero-subheading}`, couleur `{colors.hero-subheading}`, plafonné à `{spacing.hero-content-max-width}`. Contenu exact : "Posez votre question à Nexia. Elle explore vos documents techniques, croise les sources et vous répond en quelques secondes — références à l'appui."
- **CTA primaire (`cta-primary`)** — "Discuter avec Nexia" + icône flèche. Dégradé `{colors.hero-cta-gradient-from} → {colors.hero-cta-gradient-to}` à 135deg, texte `{colors.on-primary}` en `{typography.cta-label}` (19px/700 — voir note contraste en § Typography), `{rounded.hero-cta}`, ombre `{components.cta-primary.shadow}`. Survol : `filter: brightness(1.08)` (pas de changement de couleur, juste un éclaircissement). `[NOTE FOR UX]` Le même dégradé porte du texte blanc ailleurs dans le produit à une taille qui ne se qualifie pas "grand texte" (bulles de message utilisateur du chat, `ChatMessage.tsx`) — ce défaut de contraste AA pré-existant n'est **pas** corrigé par cette spine (hors périmètre accueil, chat déjà `status: final`) ; décision produit du 2026-07-18 : accepté comme dette technique connue, à traiter séparément.
- **CTA secondaire désactivé (`cta-secondary-disabled`)** — "Explorer les documents". Habillage visuel de base identique à un bouton fantôme (`{colors.cta-secondary-bg}`, `{colors.cta-secondary-border}`, `{colors.cta-secondary-text}`, `{rounded.hero-cta}`) mais rendu à `{components.cta-secondary-disabled.disabledOpacity}` (0.55, `[ASSUMPTION]` — valeur non fournie par la maquette qui montre le bouton dans un état actif ; alignée sur la convention déjà utilisée pour les boutons désactivés du chat, ex. `send-button`) et `cursor: not-allowed`. Au survol/focus, une tooltip apparaît : fond `{colors.surface-panel}`, bordure `{colors.border-soft}`, texte `{colors.ink-muted}`, contenu "Bientôt disponible".
- **Puce de suggestion (`suggestion-chip`)** — pilule `{rounded.full}`, fond `{colors.chip-bg}`, bordure `{colors.chip-border}`, texte `{colors.chip-text}` en `{typography.chip-label}`, précédée d'une flèche "→" colorée `{colors.accent-orange}`. Survol : bordure `{colors.chip-border-hover}`, fond `{colors.chip-bg-hover}`, texte `{colors.on-primary}` (blanc). `[NOTE FOR UX]` Visuellement proche mais distincte de `suggested-prompt-chip` du chat (mêmes intentions, valeurs rgba légèrement différentes) — composant propre à cette surface plutôt qu'un alias, les deux fichiers restent chacun self-contained.
- **Libellé au-dessus des puces (`chips-eyebrow`)** — "Essayez une question — cliquez pour lancer le chat", `{typography.chips-eyebrow}`, couleur `{colors.chips-eyebrow-text}`.
- **Carte d'étape (`step-card`)** — fond dégradé `{colors.step-card-bg-from} → {colors.step-card-bg-to}` (180deg), bordure `{colors.step-card-border}`, `{rounded.step-card}`. Survol : bordure `{colors.step-card-border-hover}` (pas de changement de fond). Contient le badge numéroté, un titre (`{typography.step-title}`, couleur `{colors.ink-strong}`) et un corps (`{typography.step-body}`, couleur `{colors.step-body-text}`).
- **Badge numéroté (`step-number-badge`)** — carré arrondi 46×46px, `{rounded.hero-cta}`, fond `{colors.step-badge-bg}`, bordure `{colors.step-badge-border}`, chiffre en `{typography.step-number}` couleur `{colors.accent-orange}`.
- **Titre de section (`section-display`)** — "Trois pas, et vous avez la réponse", `{typography.section-display}`, couleur `{colors.hero-heading}`, centré, suivi d'un sous-titre "Nexia transforme des milliers de pages en réponses claires et sourcées." (16px, `{colors.hero-subheading}`).
- **CTA de clôture (`closing-cta`)** — "Commencer une conversation" + icône flèche, sous la grille des 3 étapes, centré. Même composant visuel que `cta-primary` (même dégradé, même radius), padding légèrement plus généreux dans la maquette (15px 30px vs 16px 28px) et ombre légèrement plus douce (`{colors.hero-cta-shadow-soft}`, `rgba(244,105,63,.4)` au lieu de `.55`) — variation mineure, pas un composant distinct.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Réutiliser `Navbar`/`Footer` déjà stylés (chat DESIGN.md) pour le shell de cette page | Recréer un header/footer propre à l'accueil (la maquette en a un, ce n'est pas ce qui s'implémente) |
| Garder l'accent `{colors.accent-orange}` en texte/contour uniquement | Utiliser l'accent orange en fond plein (réservé aux dégradés CTA) |
| Rendre "Explorer les documents" visuellement désactivé (opacité réduite, curseur interdit) + tooltip | Masquer le bouton ou le rendre indiscernable d'un CTA actif (la maquette seule suggère un bouton cliquable — la décision produit prime) |
| Newsreader réservé aux titres (`hero-display`, `section-display`, `step-number`) | Étendre Newsreader au corps de texte ou aux libellés d'interface |
| Puces de suggestion : un seul clic déclenche l'action complète (pas de pré-remplissage à valider) | Traiter les puces comme de simples suggestions de saisie |
| CTA primaire et CTA de clôture : même dégradé, même comportement, ombre corail | Introduire une troisième couleur de CTA sur la page |
