---
story_id: ST-303
sprint_id: 4
sprint_name: "Sprint 4 - Interface Utilisateur"
epic_id: EPIC-4
epic_name: "Interface Utilisateur Complète"
priority: high
status: done
assignee: "Dday"
baseline_commit: 091c20e9a56fc111bea02dd030c7c7737528189e
tags:
  - chat
  - ui
  - nextjs
  - rag
---

# Story 4.303: Créer l'Interface de Chat

Status: done

## Story

En tant que **développeur frontend**,
je veux **une interface de chat intuitive avec zone de saisie et historique**,
afin de **permettre aux utilisateurs authentifiés de poser leurs questions au système RAG et de voir les réponses de l'IA avec le contexte de conversation**.

## Acceptance Criteria

1. La page `/chat` affiche une zone de saisie de texte avec un bouton d'envoi (désactivé si le champ est vide ou pendant l'envoi).
2. Les messages utilisateur et assistant s'affichent dans une liste distincte visuellement, dans l'ordre chronologique : bulle utilisateur alignée à droite (fond corail), bulle assistant alignée à gauche (fond neutre + avatar NexiaMind AI) — voir DESIGN.md/EXPERIENCE.md du chat référencés en Dev Notes.
3. La liste des messages défile automatiquement vers le bas à l'arrivée d'un nouveau message.
4. Envoyer un message appelle `POST /api/chat/message` et affiche la réponse de l'assistant une fois reçue, avec un état de chargement visible entre l'envoi et la réponse (l'API vise < 3s — NF-001 du PRD).
5. Le contenu des réponses assistant préserve les retours à la ligne (`whitespace-pre-wrap`) ; le rendu Markdown enrichi (titres, listes, code) est **hors périmètre**, couvert par ST-307.
6. Au chargement de la page, l'historique des conversations de l'utilisateur est récupéré via `GET /api/chat/history` et peut être affiché (liste des conversations, cliquable pour recharger ses messages) — la bascule complète entre conversations multiples (URL `[conversationId]`) est hors périmètre, couverte par ST-306 ; ST-303 doit uniquement prouver que l'historique se charge et s'affiche sans erreur.
7. Toute erreur d'appel API (réseau, 401, 500) affiche un message d'erreur factuel à l'utilisateur (bannière), sans faire planter la page.
8. La page `/chat` est accessible uniquement aux utilisateurs authentifiés (héritée de `src/proxy.ts`, aucun code de garde supplémentaire à écrire dans la page).
9. Un lien "Chat" est ajouté à la Navbar pour rendre la page atteignable.
10. WCAG 2.1 AA de base : `<label>`/`aria-label` sur le champ de saisie et le bouton d'envoi, focus visible, annonce des erreurs (`role="alert"`), liste de messages en `role="log"`/`aria-live="polite"`.
11. État vide (avant le premier message) : titre d'accroche + 2-3 suggestions de questions cliquables (puces) qui remplissent et envoient immédiatement le message au clic ; disparaissent dès le premier message envoyé.
12. Chaque bulle assistant réserve un espace vide sous son contenu pour les sources/citations (aucun contenu ni interaction pour ST-303 — ST-305 s'y insère plus tard sans re-designer la bulle).

## Tasks / Subtasks

- [x] **Task 0 — Prérequis bloquant : corriger `GET /api/chat/history`** (AC: #6)
  - [x] Dans `src/app/api/chat/history/route.ts:96`, retirer `head: true` de l'option `.select(...)` — avec `head: true`, PostgREST ne renvoie **aucune ligne**, seulement le count ; `conversations` est donc toujours vide et l'historique ne peut jamais s'afficher, quel que soit le travail fait côté frontend. Garder uniquement `{ count: 'exact' }`.
  - [x] Une fois ce correctif appliqué, `conversationIds` sera réellement peuplé et l'appel `.group('conversation_id')` (ligne 131) sera exécuté — **cette méthode n'existe pas** sur le client Supabase JS (confirmé : `npx tsc --noEmit` échoue déjà sur cette ligne avec `TS2339: Property 'group' does not exist`). Remplacer le bloc lignes 126-143 par un comptage côté JS : récupérer `conversation_id` pour tous les messages des conversations concernées (`.select('conversation_id').in('conversation_id', conversationIds)`, sans `.group()`), puis tallier les occurrences par `conversation_id` dans une simple boucle/`reduce`.
  - [x] Ajouter/ajuster un test pour `GET /api/chat/history` qui couvre ce chemin (au moins une conversation avec messages) — le test existant `src/app/api/chat/history/__tests__/route.test.ts` importe déjà `getChatHistory` (voir avertissement ci-dessous) : vérifier qu'il ne casse pas avec ce correctif, ajouter un cas manquant si besoin.
  - [x] **Supprimer les fonctions `sendChatMessage` (fin de `message/route.ts`) et `getChatHistory` (fin de `history/route.ts`)** : ce sont des helpers `fetch()` non utilisés ailleurs dans le code (seul le test de `getChatHistory` l'importe) et **dangereux à réutiliser tels quels** — voir avertissement critique dans Dev Notes ci-dessous. Adapter le test qui importe `getChatHistory` en conséquence (le fonctionnalité testée doit migrer vers le nouveau client fetch côté frontend, Task 2).
  - [x] Ne pas toucher au reste du fichier (auth, pagination, validation limit/offset) — déjà correct.

- [x] **Task 1 — Composants Chat** (AC: #1, #2, #5, #11, #12)
  - [x] Créer `src/components/Chat/index.tsx` (barrel export, pattern identique à `src/components/Auth/index.tsx`)
  - [x] Créer `src/components/Chat/ChatInput.tsx` : `textarea` auto-grandissante (1 à ~6 lignes visibles avant scroll interne) + bouton d'envoi circulaire ; `Entrée` seule soumet, `Shift+Entrée` insère un saut de ligne ; bouton désactivé si texte vide ou `loading` — tokens exacts dans `DESIGN.md.components.chat-input`/`send-button` (voir Dev Notes)
  - [x] Créer `src/components/Chat/ChatMessage.tsx` : bulle utilisateur (fond corail, alignée à droite) vs bulle assistant (fond neutre + bordure, alignée à gauche, avatar rond 28px avec le logo `public/logo.svg`) ; `whitespace-pre-wrap` pour les sauts de ligne ; réserve un bloc vide (bordure pointillée, sans interaction) sous la bulle assistant pour les sources (AC #12) ; regrouper visuellement les bulles consécutives du même rôle (espace réduit, avatar affiché une seule fois par groupe) — tokens exacts dans `DESIGN.md.components.message-bubble-user`/`message-bubble-assistant`/`sources-placeholder`
  - [x] Créer `src/components/Chat/ChatMessageList.tsx` (ou équivalent) : liste des messages (`role="log"` `aria-live="polite"`) + scroll automatique vers le bas à l'ajout d'un message (`useRef` + `scrollIntoView`/`scrollTop`), sauf si l'utilisateur a manuellement remonté dans l'historique de la conversation en cours
  - [x] Créer un indicateur de saisie assistant (3 points qui pulsent, `prefers-reduced-motion` respecté) affiché à la place de la future bulle assistant pendant l'attente de réponse (AC #4) — tokens dans `DESIGN.md.components.typing-indicator`
  - [x] État vide (AC #11) : titre + 2-3 puces de suggestion cliquables (pilules, `DESIGN.md.components.suggested-prompt-chip`) qui envoient immédiatement le message au clic ; disparaissent dès le premier message envoyé
  - [x] Icônes (envoyer, points de l'indicateur) : **ne pas importer depuis `@/components/Auth/icons`** (couplage cross-feature à éviter, aucun autre composant du projet ne le fait) — créer un petit set d'icônes local dans `src/components/Chat/` ou utiliser des SVG inline, à l'identique du pattern déjà établi dans `Auth/icons.tsx` (SVG simples, props `size`/`className`)

- [x] **Task 2 — Page et état** (AC: #1, #3, #4, #6, #7, #8)
  - [x] Créer `src/app/chat/page.tsx` (`'use client'`) — pas de `layout.tsx` dédié nécessaire : la page hérite normalement de `Navbar`/`Footer`/`AuthProvider` du layout racine (contrairement aux pages `/auth/*` qui s'en excluent explicitement)
  - [x] Gérer l'état localement via `useState`/`useReducer` dans la page (React Context uniquement si l'état doit être partagé entre plusieurs pages — ce n'est pas le cas ici, donc pas de nouveau Context à créer ; ne pas installer Zustand, non utilisé ailleurs dans le projet malgré la mention dans `architecture.md`)
  - [x] Créer un petit client fetch côté frontend (ex. `src/components/Chat/api.ts` ou `src/lib/api/chat.ts`, fichier **sans** `'use server'`/dépendance serveur) avec deux fonctions : une pour `POST /api/chat/message` (body `{ message, conversationId? }`) et une pour `GET /api/chat/history` (query `conversationId?`, `limit`, `offset`) — reproduire le même contrat que les handlers existants (voir Dev Notes), mais **ne pas importer** les fonctions `sendChatMessage`/`getChatHistory` déjà présentes dans les fichiers `route.ts` (supprimées en Task 0 — voir avertissement critique ci-dessous)
  - [x] Au montage : appeler la fonction d'historique créée ci-dessus
  - [x] Menu historique : bouton dédié dans la zone de chat (pas dans la Navbar) ouvrant un panneau overlay (liste des conversations triées par activité récente) — même pattern d'ouverture/fermeture (clic extérieur, `Échap`) que `UserMenu` de `src/components/Auth/UserMenu.tsx`, pas de sidebar permanente ; cliquer une conversation remplace entièrement les messages affichés **(voir limitation découverte ci-dessous : recharge l'ID de conversation, pas le contenu des anciens messages)**
  - [x] À l'envoi d'un message : appeler la fonction de message créée ci-dessus ; ajouter le message utilisateur à la liste immédiatement (optimistic UI), puis la réponse assistant à réception
  - [x] État de chargement : désactiver le bouton d'envoi et afficher un indicateur pendant l'attente de la réponse (NF-001 : réponse attendue < 3s)
  - [x] Gestion d'erreur : faire lancer une `Error` par le client fetch créé ci-dessus en cas de réponse non-`ok` (reproduire le pattern des fonctions supprimées : lire `error` du corps JSON si possible, sinon `response.statusText`) — attraper ces erreurs et afficher une bannière factuelle (`role="alert"`), ne jamais laisser une exception non gérée casser la page
  - [x] La protection d'accès est déjà assurée par `src/proxy.ts` (redirection vers `/auth/login?redirect=%2Fchat` si non connecté) — ne pas dupliquer de vérification de session dans la page

- [x] **Task 3 — Navigation** (AC: #9)
  - [x] Ajouter `{ name: 'Chat', href: '/chat' }` dans `NAV_ITEMS` de `src/components/Navbar/Navbar.tsx:31-36`

- [x] **Task 4 — Accessibilité** (AC: #10)
  - [x] `<label>` (visible ou `sr-only`) ou `aria-label` explicite sur le champ de saisie
  - [x] `aria-label` sur le bouton d'envoi si son contenu est une icône seule
  - [x] Bannière d'erreur avec `role="alert"`
  - [x] Liste de messages en `role="log"` + `aria-live="polite"` (annonce les nouveaux messages sans interrompre, contrairement à la bannière d'erreur)
  - [x] Avatar assistant décoratif : `aria-hidden="true"`
  - [x] Focus clavier visible sur tous les éléments interactifs (pas de `outline-none` sans remplacement) — `focus-visible:ring-2 focus-visible:ring-chat-ring` ajouté sur le bouton d'envoi, les puces de suggestion, et les deux boutons du menu historique

- [x] **Task 5 — Tests** (tous les AC)
  - [x] Tests de comportement réel (pas de smoke tests `typeof X === 'function'` — leçon tirée de la revue de code ST-302 : ces tests ne valident rien) : `render` + `fireEvent`/`userEvent` + assertions sur le DOM
  - [x] `ChatInput` : le bouton est désactivé si le champ est vide ; taper du texte l'active ; soumettre déclenche le callback avec le contenu ; le champ se vide après envoi
  - [x] `ChatMessage` : le rendu diffère visuellement selon `role` (ex. classes CSS différentes, testables via `data-testid` ou attributs) ; les retours à la ligne sont préservés
  - [x] Page `/chat` : mock le client fetch créé en Task 2 (`vi.mock`, ou mock global de `fetch`) — envoyer un message affiche la réponse assistant ; une erreur affiche la bannière ; l'historique se charge au montage sans crasher
  - [x] `GET /api/chat/history` (Task 0) : au moins un test qui couvre le cas où des conversations existent réellement et vérifie que `conversations` n'est pas vide

## Dev Notes

- ⚠️ **NE PAS importer `sendChatMessage`/`getChatHistory` depuis les fichiers `route.ts`, même si elles semblent réutilisables.** Ces deux fonctions existent en fin de `message/route.ts` et `history/route.ts` (à supprimer, voir Task 0) mais elles vivent dans des fichiers de **Route Handler** Next.js qui importent `next/server` (`NextRequest`/`NextResponse`, non bundlable côté client) et initialisent un client Supabase avec des variables d'env **serveur uniquement** (`SUPABASE_URL`/`SUPABASE_ANON_KEY`, sans préfixe `NEXT_PUBLIC_`) via un `throw` au chargement du module si absentes. Importer quoi que ce soit de ces fichiers dans un composant `'use client'` embarquerait ce code serveur dans le bundle navigateur et **plantera immédiatement** au chargement de la page (le `throw` s'exécute dès l'import, avec des variables d'env qui seront `undefined` côté client). Ni l'une ni l'autre de ces fonctions n'est d'ailleurs utilisée aujourd'hui ailleurs dans le code (seul le test de `getChatHistory` l'importe) — code mort à supprimer, pas à réutiliser. Écrire un client `fetch()` neuf côté frontend (Task 2) qui reproduit le même contrat de requête/réponse.
- **Contrat `POST /api/chat/message`** : body `{ message: string, conversationId?: string, options?: { temperature?, maxTokens?, model? } }` → réponse `{ id, conversationId, role: 'assistant', content, formattedContent?, citations?, metadata: { model, tokensUsed, processingTime, timestamp } }`. `citations` (voir `Citation` dans `src/lib/rag/formatter.ts`) et l'affichage des sources sont **hors périmètre** de ST-303 (couvert par ST-305) — ignorer ces champs pour l'instant, ne pas les afficher.
- **Contrat `GET /api/chat/history`** : query `conversationId?`, `limit` (1-100, défaut 50), `offset` (défaut 0) → réponse `{ conversations: [{ id, title, createdAt, updatedAt, messageCount }], total, offset, limit }`.
- ⚠️ **Aucun endpoint ne renvoie le contenu des messages d'une conversation passée** — `GET /api/chat/history` ne renvoie que des résumés (titre, dates, nombre de messages), jamais les messages eux-mêmes ; `POST /api/chat/message` ne fait que lire l'historique en interne pour construire le contexte, sans jamais l'exposer au client. Sélectionner une conversation dans le menu historique reprend donc son `conversationId` (les nouveaux messages s'y rattachent côté serveur) et vide la liste de messages affichée, **sans pouvoir réafficher les anciens messages** — conforme à la clause de périmètre de l'AC #6 ("ST-303 doit uniquement prouver que l'historique se charge et s'affiche sans erreur"), mais à signaler explicitement : un endpoint `GET /api/chat/messages?conversationId=` serait nécessaire pour un vrai rechargement, hors périmètre de cette story.
- **Authentification transparente** : `src/proxy.ts` (protégé depuis la revue de code ST-302) injecte un header `x-user-id` vérifié pour tout `/api/chat/*` — le frontend n'a rien à faire côté auth, `fetch` avec les cookies de session suffit (mode `credentials` par défaut du navigateur inclut déjà les cookies same-origin).
- **Pas de streaming** : la réponse de `/api/chat/message` est un unique JSON, pas du SSE/streaming — l'indicateur de chargement doit donc couvrir toute la durée de la requête (jusqu'à ~3s selon NF-001), pas un affichage progressif token par token.
- **Design system du chat** : `_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md` (tokens visuels) et `EXPERIENCE.md` (comportement, états, accessibilité) — dossier séparé du spine auth (`ux-nexiamind-ai-2026-07-04/`, qui reste scopé aux 4 pages `/auth/*`). Hérite des mêmes valeurs de couleur/typo/radius que l'auth (corail `#EF6C4D`, encre `#1E2A3B`, Geist Sans, radius 8/10/16px) mais définit ses propres tokens de composants (bulles, indicateur de saisie, puces de suggestion, menu historique, espace sources). Maquette de référence : `.../ux-nexiamind-ai-2026-07-04-chat/mockups/chat.html`. **Ne pas réutiliser les tokens `auth-*` de `tailwind.config.ts`** (réservés à `/auth/*`) — ajouter les nouvelles valeurs nécessaires (probablement sous un token `chat-*` ou en réutilisant les valeurs `primary`/`secondary` déjà génériques du config), ou utiliser des classes Tailwind arbitraires directement si l'ajout au config n'est pas jugé nécessaire pour une seule page.
- **`react-markdown` n'est pas installé** (`package.json` ne le liste pas, malgré sa mention dans `architecture.md`) — ne pas l'installer pour ST-303 ; le rendu Markdown complet est explicitement le périmètre de ST-307. Utiliser `whitespace-pre-wrap` en attendant.
- **`i18next` n'est pas utilisé** dans le projet malgré sa mention dans `architecture.md` — toutes les pages existantes (Auth, Navbar, Footer) utilisent des chaînes françaises codées en dur. Suivre cette convention réelle, ne pas introduire i18next.
- **Zustand n'est pas installé** — l'état d'authentification utilise React Context (`AuthProvider`). Pour ST-303, l'état de chat est local à la page (`useState`), aucun Context global n'est nécessaire (pas de partage cross-page requis par les AC de cette story).

### Project Structure Notes

- Page : `src/app/chat/page.tsx` (pas de dossier `src/app/chat/[conversationId]/`, ni de `layout.tsx` — hors périmètre, voir ST-306)
- Composants : `src/components/Chat/` — un seul dossier regroupant `ChatInput.tsx`, `ChatMessage.tsx`, `ChatMessageList.tsx`, `index.tsx` (barrel), à l'image de `src/components/Auth/` (composants d'une même feature, état partagé) plutôt qu'un dossier par composant (pattern `Navbar/`, `Footer/`, `RefreshButton/` — composants indépendants sans état partagé).
- Fichier à corriger (pas à recréer) : `src/app/api/chat/history/route.ts` (Task 0 uniquement, ne pas toucher au reste).
- Fichier à modifier : `src/components/Navbar/Navbar.tsx` (ajout d'une entrée `NAV_ITEMS`).
- Aucun nouveau fichier `layout.tsx`, `middleware`/`proxy`, ou modification de `src/proxy.ts` n'est nécessaire — la protection de route est déjà générique (toute page non listée dans `PUBLIC_PAGE_ROUTES` de `src/proxy.ts` est protégée).

### References

- [Source: _bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md#ST-303] — AC et tâches d'origine
- [Source: _bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md#3️⃣ Base de Données (Supabase)] — schéma `conversations`/`messages`
- [Source: _bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md#POST /api/chat/message] et `#GET /api/chat/history` — contrats API documentés
- [Source: _bmad-output/planning-artifacts/prd-nexiamind-ai/prd.md#NF-001, #NF-032, #NF-033] — temps de réponse < 3s, interface intuitive, WCAG 2.1 AA
- [Source: src/app/api/chat/message/route.ts] et [Source: src/app/api/chat/history/route.ts] — implémentation réelle des endpoints (source de vérité, prime sur l'architecture doc en cas d'écart)
- [Source: _bmad-output/implementation-artifacts/4-302-implementer-authentification.md] — story précédente (ST-302), conventions établies et revue de code (voir Previous Story Intelligence ci-dessous)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md] — tokens visuels du chat (couleurs, radius, composants bulles/indicateur/puces/historique/sources)
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md] — comportement, états, accessibilité, parcours utilisateur
- [Source: _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/mockups/chat.html] — maquette de référence (état vide, conversation active, erreur d'envoi)

## Previous Story Intelligence (ST-302 — Authentification)

- **Tests réels, pas des smoke tests** : la revue de code de ST-302 a explicitement sanctionné les tests `expect(typeof X).toBe('function')` comme n'apportant aucune couverture réelle. Pour ST-303, chaque test doit `render` + interagir (`fireEvent`/`userEvent`) + asserter sur le DOM/l'état.
- **`data-testid`** : convention déjà en place sur tous les éléments interactifs des formulaires Auth (`data-testid="email-input"`, etc.) — l'appliquer aussi aux éléments du chat (champ de saisie, bouton d'envoi, messages) pour faciliter les tests et un futur travail QA/E2E.
- **`proxy.ts` protège déjà `/chat`** : toute page hors de `PUBLIC_PAGE_ROUTES` redirige automatiquement vers `/auth/login?redirect=<chemin>` si non authentifié — confirmé par test manuel (`curl` sans session → 307 vers `/auth/login?redirect=%2Fprofile`) lors de la revue ST-302. Le paramètre `redirect` est validé côté `AuthProvider` (chemin relatif uniquement, anti open-redirect) — aucune action requise côté ST-303.
- **`useAuth()`** (`@/components/Auth`) expose `user`, `session`, `loading` — utilisable si besoin d'afficher l'email de l'utilisateur ou de personnaliser l'état vide du chat, mais pas obligatoire pour les AC de cette story.
- **Messages d'erreur Supabase non traduits** : un gap connu et non résolu (les erreurs brutes de Supabase restent en anglais). Sans rapport direct avec ST-303 (pas d'appel Supabase Auth ici), mais garder la même exigence de messages d'erreur "factuels et actionnables" pour les erreurs du client fetch chat.
- **Aucun exemple de composant "liste + scroll auto"** n'existe encore dans le projet — c'est un pattern nouveau pour ST-303, pas de code existant à réutiliser au-delà des conventions générales (Tailwind, `useRef`, `useEffect`).

## Git Intelligence Summary

Derniers commits (aucun ne concerne le chat) : layout principal (ST-301, Navbar/Footer), bouton Rafraîchir (ST-205), intégration GitLab (ST-202). Le travail ST-302 (authentification, `src/proxy.ts`, `src/components/Auth/*`) est complet mais **encore non commité** dans l'arbre de travail au moment de la création de cette story — les fichiers existent et sont fonctionnels (vérifiés par tests + navigateur réel), mais aucune trace dans `git log`. Ne pas supposer que `git log`/`git blame` reflète l'état réel du code pour la feature Auth.

## Project Context Reference

Aucun fichier `project-context.md` n'existe dans le repo à ce jour — pas de règles projet supplémentaires à charger au-delà de ce qui est documenté ici et dans `AGENTS.md`/`CLAUDE.md` (Next.js 16, breaking changes vs. les connaissances d'entraînement — consulter `node_modules/next/dist/docs/` avant d'utiliser une API Next.js incertaine, ex. confirmé cette session : `proxy.ts` remplace bien `middleware.ts` depuis Next.js 16, cf. `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-07-04 | Amelia (Claude) | Implémentation ST-303 : fix bloquant `GET /api/chat/history` (Task 0), composants Chat (Task 1), page `/chat` + client fetch + menu historique (Task 2), lien Navbar (Task 3), accessibilité (Task 4), tests (Task 5) |
| 2026-07-07 | Sally + Amelia (Claude) | Reprise visuelle : pivot vers le thème sombre de `docs/Maquette-ux-NexiaMind AI.html` — DESIGN.md/EXPERIENCE.md du chat réécrits (voir `ux-nexiamind-ai-2026-07-04-chat`), composants Chat/Navbar/RefreshButton restylés, `Footer` masqué sur `/chat`, panneau de chat recentré (`chat-panel`, max-width 880px). Aucune logique métier modifiée. |

## Dev Agent Record

### Agent Model Used

Claude Sonnet 5 (create-story workflow, dev-story workflow)

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- Bloqueur critique identifié et documenté (Task 0) : `GET /api/chat/history` ne peut aujourd'hui renvoyer aucune conversation (`head: true` mal utilisé) et plantera dès que ce premier bug sera corrigé (`.group()` inexistant sur le client Supabase JS) — les deux corrections sont nécessaires ensemble pour que l'AC #6 soit satisfiable.
- Second piège évité : les fonctions `sendChatMessage`/`getChatHistory` déjà exportées par les `route.ts` existants semblaient réutilisables au premier abord, mais elles vivent dans des modules serveur (`next/server`, variables d'env non préfixées `NEXT_PUBLIC_`) — les importer côté client aurait fait planter la page au chargement. Story corrigée pour prescrire leur suppression et l'écriture d'un client fetch neuf côté frontend.
- Aucune spec UX dédiée au chat n'existe (contrairement à l'auth) — signalé comme question ouverte pour le PM/UX avant les stories suivantes (ST-304 à ST-307).
- **2026-07-04, mise à jour post-création** : Sally (UX) a produit le spine dédié au chat (`ux-nexiamind-ai-2026-07-04-chat/DESIGN.md` + `EXPERIENCE.md` + maquette). Story mise à jour en conséquence : AC #2 précisé (bulles corail/neutre + avatar), AC #11/#12 ajoutés (état vide avec suggestions, espace sources réservé), Task 1/2/4 enrichies avec les tokens et patterns concrets du spine (indicateur de saisie animé, menu historique en overlay façon `UserMenu`, `role="log"`/`aria-live="polite"`). La question ouverte ci-dessus est résolue.
- **2026-07-04, implémentation complète (dev-story)** : toutes les tâches (0 à 5) terminées. Points clés :
  - Task 0 (bloquant) : `GET /api/chat/history` corrigé et vérifié — nouveau test confirme un comptage de messages correct (`conv_1: 5`, `conv_2: 3`) sans `.group()`.
  - Namespace Tailwind `chat-*` ajouté (couleurs + radius), séparé de `auth-*`, valeurs identiques au DESIGN.md du chat.
  - Nouveau gap découvert en implémentant Task 2 : **aucun endpoint n'expose le contenu des messages d'une conversation passée** (`GET /api/chat/history` ne renvoie que des résumés). Sélectionner une conversation dans l'historique reprend son `conversationId` (les nouveaux messages s'y rattachent) mais n'affiche pas les anciens messages — conforme à la clause de périmètre de l'AC #6, documenté en Dev Notes avec la piste de résolution (`GET /api/chat/messages?conversationId=`, hors périmètre ST-303).
  - Vérification : `npx vitest run` → 355/380 passent (25 échecs pré-existants hors périmètre, identiques à avant cette session) ; 28 nouveaux tests tous verts (Chat ×20, page `/chat` ×5, Navbar ×2 additionnels, historique ×1). `npx tsc --noEmit` : aucune nouvelle erreur. `npx eslint` sur les fichiers touchés : 4 problèmes, tous pré-existants sur des lignes non modifiées. `npx next build` : phase de bundling réussie pour toutes les routes (dont `/chat`) — confirme qu'aucun code serveur n'a fui dans le bundle client ; l'échec de type-check qui suit porte sur `scripts/test-pdf-manual.ts`, sans rapport avec ST-303.
  - Vérification manuelle : `/chat` sans session → 307 vers `/auth/login?redirect=%2Fchat` (protection héritée de `src/proxy.ts` confirmée pour la nouvelle route). Pas de compte de test Supabase confirmé disponible pour une vérification en session authentifiée réelle (la confirmation email est activée sur ce projet) — la couverture de tests de composants (rendu réel, interactions, mocks du client fetch) sert de filet de sécurité en son absence.
- **2026-07-07, reprise visuelle thème sombre (rework, pas une nouvelle story)** : à la demande utilisateur, Sally (UX) a d'abord réécrit `DESIGN.md`/`EXPERIENCE.md` (auth + chat) pour adopter fidèlement le thème sombre de `docs/Maquette-ux-NexiaMind AI.html`, puis l'implémentation a suivi directement sur le code existant (pas de nouvelle story créée, décision utilisateur explicite). Changements : palette `tailwind.config.ts` (`auth-*`/`chat-*`) repointée sur les valeurs sombres, police Newsreader ajoutée (titres uniquement), `Navbar` restylé en app-shell sombre (actif via `usePathname`), `Footer` masqué sur `/chat`, bulle assistant conservée volontairement claire sur fond sombre (rupture de contraste voulue), bouton d'envoi carré (plus circulaire), panneau de chat recentré à 880px. Tests des surfaces touchées (Auth/Navbar/Footer/Chat/layout) : 52/52 verts. `npx next build` : bundling Turbopack réussi ; le typecheck global échoue sur `scripts/test-pdf-manual.ts` (pré-existant, sans rapport). Échecs pré-existants et hors périmètre confirmés inchangés (indexer, routes `chat/filters`+`chat/refresh`, suite `Filters/__tests__` — contrat de props `FilterBarProps` déjà désaligné avec ses tests avant cette session).

### File List

**Nouveaux fichiers**
- `src/components/Chat/index.tsx` - barrel export
- `src/components/Chat/ChatInput.tsx` - textarea auto-grandissante + bouton d'envoi
- `src/components/Chat/ChatMessage.tsx` - bulle utilisateur/assistant, avatar, espace sources réservé
- `src/components/Chat/ChatMessageList.tsx` - liste de messages, état vide + suggestions, groupement, scroll auto
- `src/components/Chat/TypingIndicator.tsx` - indicateur de saisie animé (points)
- `src/components/Chat/HistoryMenu.tsx` - menu historique en overlay (pattern `UserMenu`)
- `src/components/Chat/icons.tsx` - icônes locales (Send, History)
- `src/components/Chat/types.ts` - `ChatMessageData`, `ConversationSummary`
- `src/components/Chat/api.ts` - client fetch frontend (`sendMessage`, `getHistory`)
- `src/components/Chat/__tests__/ChatInput.test.tsx`
- `src/components/Chat/__tests__/ChatMessage.test.tsx`
- `src/components/Chat/__tests__/ChatMessageList.test.tsx`
- `src/components/Chat/__tests__/TypingIndicator.test.tsx`
- `src/components/Chat/__tests__/HistoryMenu.test.tsx`
- `src/app/chat/page.tsx` - page `/chat`
- `src/app/chat/__tests__/page.test.tsx`

**Fichiers modifiés**
- `src/app/api/chat/history/route.ts` - retrait de `head: true` (bloquait tout retour de conversations), remplacement de `.group()` (inexistant sur le client Supabase JS) par un comptage JS, suppression de la fonction morte `getChatHistory`
- `src/app/api/chat/history/__tests__/route.test.ts` - mock aligné sur le nouveau comptage JS, import `getChatHistory` retiré, nouveau test de tally des messages
- `src/app/api/chat/message/route.ts` - suppression de la fonction morte `sendChatMessage`
- `src/components/Navbar/Navbar.tsx` - ajout de l'entrée `{ name: 'Chat', href: '/chat' }`
- `src/components/Navbar/__tests__/Navbar.test.tsx` - tests pour le nouveau lien Chat
- `tailwind.config.ts` - namespace de tokens `chat` (couleurs) et `chat-sm/md/lg` (radius), indépendant du namespace `auth`

**Reprise visuelle thème sombre (2026-07-07)**
- `tailwind.config.ts` - tokens `auth-*`/`chat-*` repointés sur la palette sombre, ajout `font-display` (Newsreader), keyframes blobs
- `src/app/globals.css` - fond/texte par défaut sombres, scrollbar `.nm-scroll`
- `src/app/layout.tsx` - chargement `next/font/google` Newsreader
- `src/app/MainContent.tsx` *(nouveau)* - conteneur client qui retire le `container mx-auto px-4 py-8` sur `/auth/*`
- `src/app/chat/page.tsx` - restylage `chat-panel` (carte centrée 880px, en-tête de panneau, bandeau légal)
- `src/components/Navbar/Navbar.tsx` - restylage app-shell sombre, état actif via `usePathname`
- `src/components/Navbar/__tests__/Navbar.test.tsx` - assertions de classes mises à jour
- `src/components/Auth/UserMenu.tsx` - avatar dégradé, dropdown sombre
- `src/components/RefreshButton/RefreshButton.tsx` - sélecteur de source + bouton restylés
- `src/components/RefreshButton/__tests__/RefreshButton.test.tsx` - assertion de classe mise à jour
- `src/components/Footer/Footer.tsx` - masqué sur `/chat` (`usePathname`)
- `src/components/Chat/ChatInput.tsx`, `ChatMessage.tsx`, `ChatMessageList.tsx`, `TypingIndicator.tsx`, `HistoryMenu.tsx` - restylage complet (bulle assistant claire volontaire, bouton d'envoi carré, coins de bulle asymétriques)
- `src/components/Filters/FilterBar.tsx`, `FilterDropdown.tsx` - palette inline recolorée en sombre
- `src/components/Filters/__tests__/FilterBar.test.tsx`, `FilterDropdown.test.tsx` - assertions de couleur mises à jour (échecs de contrat de props pré-existants non traités, hors périmètre)
- `src/app/__tests__/layout.test.tsx` - assertions de classes mises à jour
- `test/setup.ts` - mock `next/font/google` étendu à `Newsreader`
