---
name: NexiaMind AI — Auth
description: Visual identity for the authentication surfaces (login, signup, forgot/reset password) of NexiaMind AI. Next.js App Router + Tailwind CSS (no component library) — this DESIGN.md is the full token set for the auth surface, not a delta over an existing system. Remplace la précédente identité claire "Corporate Chaleureux" par le thème sombre de la maquette de référence (voir Brand & Style).
status: final
updated: 2026-07-07
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
  surface-radial-from: '#12233D'
  surface-panel: '#0E1B2E'
  surface-field: '#0A1524'
  border: '#2C3E5C'
  border-soft: '#2A3B58'
  border-panel: '#223350'
  ring-glow: 'rgba(244, 105, 63, .15)'
  success: '#2F9E6A'
  success-surface: 'rgba(47, 158, 106, .1)'
  success-border: 'rgba(47, 158, 106, .4)'
  error: '#FF5A46'
  error-soft: '#FF7A68'
  error-surface: 'rgba(255, 90, 70, .1)'
  error-border: 'rgba(255, 90, 70, .4)'
  blob-teal: '#2EE6D6'
  blob-orange: '#F4693F'
  blob-violet: '#7C3AED'
typography:
  hero:
    fontFamily: 'Newsreader'
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.05'
    letterSpacing: -0.01em
  hero-sub:
    fontFamily: system-sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.45'
  display:
    fontFamily: 'Newsreader'
    fontSize: 33px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  body:
    fontFamily: system-sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label:
    fontFamily: system-sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.4'
  caption:
    fontFamily: system-sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.45'
  link:
    fontFamily: system-sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: '1.4'
rounded:
  sm: 9px
  md: 13px
  lg: 14px
  xl: 26px
  full: 9999px
spacing:
  form-max-width: 400px
  panel-split: 52%
  gutter: 16px
  section-gap: 30px
  field-gap: 18px
components:
  hero-panel:
    background: '{colors.surface}'
    blobs:
      - color: '{colors.blob-teal}'
        animation: 'nmFloat1 14s ease-in-out infinite'
      - color: '{colors.blob-orange}'
        animation: 'nmFloat2 17s ease-in-out infinite'
      - color: '{colors.blob-violet}'
        animation: 'nmFloat3 19s ease-in-out infinite'
    scrim: 'linear-gradient(120deg, rgba(8,15,28,.35), rgba(8,15,28,.7))'
  input-field:
    background: '{colors.surface-field}'
    border: '{colors.border}'
    borderFocus: '{colors.primary}'
    focusGlow: '0 0 0 4px {colors.ring-glow}'
    radius: '{rounded.md}'
    text: '{colors.ink}'
    placeholder: '{colors.ink-ghost}'
  button-primary:
    background: 'linear-gradient(135deg, {colors.primary-gradient-from}, {colors.primary-gradient-to})'
    foreground: '{colors.on-primary}'
    radius: '{rounded.md}'
    shadow: '0 14px 30px -10px rgba(244,105,63,.55)'
    shadowHover: '0 18px 36px -10px rgba(244,105,63,.65)'
  banner-success:
    background: '{colors.success-surface}'
    border: '{colors.success-border}'
    icon: '{colors.success}'
    foreground: '#C9E6D8'
    radius: '{rounded.lg}'
  banner-error:
    background: '{colors.error-surface}'
    border: '{colors.error-border}'
    foreground: '{colors.error-soft}'
    radius: '{rounded.lg}'
  link-inline:
    foreground: '{colors.primary}'
    foregroundHover: '{colors.primary-hover}'
  logo-mark:
    background: 'linear-gradient(135deg, {colors.accent-blue-from}, {colors.accent-blue-to})'
    radius: '12px'
    shadow: '0 8px 24px -6px rgba(47,102,223,.7)'
---

## Brand & Style

NexiaMind AI est un outil professionnel interne : consultants techniques, développeurs et chefs de projet qui viennent y chercher, comprendre et sourcer de l'information métier. Cette itération remplace la précédente identité claire « Corporate Chaleureux » par une identité **sombre et feutrée**, reprise fidèlement de la maquette de référence (`docs/Maquette-ux-NexiaMind AI.html`, import archivé dans `../ux-nexiamind-ai-2026-07-04-chat/imports/maquette-nexiamind-ai-dark-2026-07-07.html`) : un point d'entrée qui a le sérieux d'un outil pro sans la froideur d'un formulaire d'entreprise générique.

La posture devient **Studio Nocturne** : composition split-screen où trois masses radiales animées (turquoise, orange, violet) flottent lentement sur un fond marine quasi noir, pendant que le formulaire — sur un panneau légèrement plus clair — reste dense et fonctionnel, éclairé par une unique touche chaude (le dégradé orange du bouton d'action et des liens). Le mouvement est lent et ambiant, jamais distrayant ; il signale un produit vivant sans jamais concurrencer le formulaire.

`[NOTE FOR UX]` Le logo NexiaMind AI actuel (`public/logo.svg`) n'est pas dans le périmètre visuel strict de cette refonte. La maquette rend son propre repère de marque — un carré à coins arrondis en dégradé bleu (`{colors.accent-blue-from}` → `{colors.accent-blue-to}`) portant un sigle « ✦ » — qui n'est pas un asset livré mais un placeholder de démonstration. Deux options en implémentation : recolorer `logo.svg` pour s'approcher de ce dégradé bleu, ou committer un nouvel asset repris de la maquette (`logo-mark` ci-dessus). Décision de marque hors périmètre de cette session — à trancher avant implémentation du header.

## Colors

- **Fond de page (`{colors.surface}` `#0A1524`)** est le marine quasi noir qui unifie tout le produit — auth et application. Sur les écrans auth, un dégradé radial subtil (`{colors.surface-radial-from}` `#12233D` → `{colors.surface}`) l'anime légèrement en haut à droite, derrière la carte split-screen.
- **Panneau formulaire (`{colors.surface-panel}` `#0E1B2E`)** est légèrement plus clair que le fond de page — c'est la surface sur laquelle vit le formulaire, distincte du panneau hero qui reste au ton le plus sombre (`{colors.surface}`).
- **Orange (`{colors.primary}` `#F4693F`, dégradé vers `{colors.primary-gradient-to}` `#E64F2B`)** est l'unique couleur d'accent fonctionnelle : bouton d'action principal, liens actifs, bordure de focus. Jamais utilisé en aplat sur de grandes surfaces — seulement boutons, liens, glow de focus.
- **Bleu (`{colors.accent-blue-from}` → `{colors.accent-blue-to}`)** est réservé exclusivement au repère de marque (`logo-mark`) — jamais utilisé comme couleur d'action ou de lien, pour ne jamais entrer en concurrence avec l'orange.
- **Texte** : `{colors.ink}`/`{colors.ink-strong}` (quasi blanc) pour titres et texte primaire, `{colors.ink-muted}` pour le texte secondaire, `{colors.ink-subtle}`/`{colors.ink-faint}`/`{colors.ink-ghost}` en cascade décroissante pour aide contextuelle, placeholders et mentions légales.
- **Dégradé du panneau hero** — trois masses radiales floutées : turquoise `{colors.blob-teal}`, orange `{colors.blob-orange}`, violet `{colors.blob-violet}`, chacune animée indépendamment (`hero-panel.blobs`) sur un cycle lent (14 à 19s) pour éviter toute synchronisation mécanique. Un voile (`hero-panel.scrim`) assure la lisibilité du texte posé par-dessus.
- **États** : succès en vert `{colors.success}` sur fond translucide `{colors.success-surface}` (confirmation de réinitialisation), erreur en rouge `{colors.error}`/`{colors.error-soft}` sur fond translucide `{colors.error-surface}` — toujours en bordure + fond translucide sur le fond sombre, jamais en aplat opaque.

Interdits : ne jamais utiliser le dégradé bleu du logo comme couleur de lien ou de bouton, ne jamais poser le formulaire directement sur `{colors.surface}` sans passer par `{colors.surface-panel}`, ne jamais utiliser un fond translucide d'état (succès/erreur) sans sa bordure associée — le contraste sur fond sombre en dépend.

## Typography

**Newsreader** (serif, Google Fonts — à charger via `next/font/google`, poids 400/500/600/700) remplace Geist Sans sur les rôles `hero` et `display` uniquement — c'est la signature typographique de cette identité, la levée assumée de l'interdiction précédente ("pas de police serif"). Le corps du formulaire reste en pile système sans-serif (`-apple-system, 'Segoe UI', system-ui, Roboto, sans-serif`) pour la densité et la lisibilité.

- **`hero`** (48px/600 Newsreader, tracking -.01em) — titre d'accroche du panneau gauche ("Bienvenue sur NexiaMind AI.").
- **`hero-sub`** (18px/400 sans-serif) — sous-titre du panneau gauche.
- **`display`** (33px/600 Newsreader) — titre de la carte formulaire ("Connexion", "Créer un compte", "Mot de passe oublié"). Remplace le `display` sans-serif de la précédente itération.
- **`body`** (15px/400) — texte courant, messages de bannière.
- **`label`** (13px/600) — labels de champ.
- **`caption`** (12px/400) — aide sous les champs.
- **`link`** (13px/600) — liens inline.

## Layout & Spacing

Composition split-screen dans une carte unique arrondie (`{rounded.xl}`, 26px) et centrée dans la fenêtre avec une marge de respiration (`padding: 28px`) — contrairement à la précédente itération qui allait bord à bord avec l'écran, la carte flotte désormais sur le fond radial. Panneau hero à `{spacing.panel-split}` (~52%), panneau formulaire sur le reste, tous deux pleine hauteur de la carte (min-height 760px). Le formulaire est centré verticalement et horizontalement, largeur plafonnée à `{spacing.form-max-width}` (400px).

Sous `lg` (1024px), même logique de collapse que la précédente itération : le panneau hero devient un bandeau compact en haut, le formulaire prend toute la largeur en dessous.

Espacement interne : `{spacing.field-gap}` (18px) entre champs, `{spacing.section-gap}` (30px) entre le bloc titre et le formulaire.

## Elevation & Depth

La carte split-screen porte une ombre portée large et diffuse (`0 40px 120px -30px rgba(0,0,0,.85)`) pour se détacher du fond radial — seul élément de cette identité à porter une ombre marquée. À l'intérieur, aucune ombre sur les champs ; seul le focus (bordure orange + glow `{components.input-field.focusGlow}`) signale l'état actif. Le bouton principal porte une ombre teintée orange (`{components.button-primary.shadow}`) qui s'intensifie légèrement au survol (`shadowHover`) — seule micro-interaction d'élévation du formulaire.

## Shapes

Rayons généreux et cohérents : `{rounded.md}` (13px) pour champs et boutons, `{rounded.lg}` (14px) pour les bannières, `{rounded.xl}` (26px) pour la carte englobante, `{rounded.full}` pour les éventuels éléments pilule. Le panneau hero n'a pas de rayon propre — il hérite du rayon de la carte englobante côté gauche uniquement (`overflow: hidden` sur la carte).

## Components

- **Panneau hero (`hero-panel`)** — fond `{colors.surface}`, trois blobs radiaux flous (`blur(64-72px)`) animés en boucle lente, voile `scrim` en dégradé diagonal pour garantir le contraste du texte. Logo (`logo-mark`) en haut, titre `hero` + sous-titre `hero-sub` + indicateur de progression (3 barres pilules, la première en `{colors.primary}`, les deux autres à 28% d'opacité blanche) ancrés en bas.
- **Champ de saisie (`input-field`)** — fond `{colors.surface-field}`, bordure `{colors.border}` 1.5px, radius `{rounded.md}`. Au focus : bordure `{colors.primary}` + glow `{components.input-field.focusGlow}` (4px, orange à 15% d'opacité). Placeholder en `{colors.ink-ghost}`. Bouton œil (afficher/masquer mot de passe) conservé à l'identique fonctionnellement, icône en `{colors.ink-faint}`.
- **Bouton principal (`button-primary`)** — dégradé plein `{colors.primary-gradient-from}` → `{colors.primary-gradient-to}`, texte `{colors.on-primary}`, radius `{rounded.md}`, pleine largeur. Micro-translation verticale (-1px) + intensification de l'ombre au survol. État chargement : spinner + libellé (pattern existant conservé). État désactivé : opacité réduite.
- **Bannière de succès (`banner-success`)** — fond `{colors.success-surface}`, bordure `{colors.success-border}`, pastille ronde `{colors.success}` avec coche, texte clair sur fond translucide.
- **Bannière d'erreur (`banner-error`)** — fond `{colors.error-surface}`, bordure `{colors.error-border}`, texte `{colors.error-soft}`, radius `{rounded.lg}`.
- **Lien inline (`link-inline`)** — texte `{colors.primary}`, hover `{colors.primary-hover}`.
- **Liens de bascule (login/signup/reset)** — un seul lien de navigation principal par carte, identique en comportement à la précédente itération, recoloré.

`[NOTE FOR UX]` **Boutons de connexion sociale retirés.** Sur décision utilisateur explicite, les boutons Google/GitHub/GitLab (`SocialAuth`, actuellement présents sur Connexion/Inscription) disparaissent entièrement de cette identité — la maquette de référence ne montre qu'un formulaire email/mot de passe. Voir `EXPERIENCE.md` pour l'impact comportemental (retrait du composant, pas seulement recoloration).

## Do's and Don'ts

| Do | Don't |
|---|---|
| Une seule couleur d'accent fonctionnelle : l'orange | Utiliser le dégradé bleu du logo comme couleur de bouton/lien |
| Newsreader réservé aux rôles `hero` et `display` | Étendre Newsreader au corps de texte, labels ou aide (perte de densité/lisibilité) |
| Poser le formulaire sur `{colors.surface-panel}`, jamais directement sur `{colors.surface}` | Aplatir les deux surfaces marine en une seule teinte |
| Fond translucide + bordure sur tout état (succès/erreur) | Fond translucide sans bordure associée (contraste insuffisant sur fond sombre) |
| Blobs du panneau hero : mouvement lent, jamais synchronisé | Accélérer ou synchroniser les animations des trois blobs |
| Formulaire épuré email/mot de passe uniquement | Réintroduire des boutons de connexion sociale sur ces écrans |
</content>
