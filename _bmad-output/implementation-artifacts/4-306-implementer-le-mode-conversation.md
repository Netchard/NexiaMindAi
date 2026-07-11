---
story_id: ST-306
sprint_id: 4
sprint_name: "Sprint 4 - Interface Utilisateur"
epic_id: EPIC-4
epic_name: "Frontend (Interface Utilisateur)"
priority: high
status: in-progress
assignee: "Dday"
baseline_commit: "fe4bb2f64eaa1316b98f4a83bf4264d922e032e5"
tags:
  - frontend
  - chat
  - conversation
  - ui
  - nextjs
  - rag
---

# Story 4.306: Implémenter le Mode Conversation

Status: in-progress

## Story

En tant que **développeur frontend**,
je veux **gérer le contexte des conversations (historique des messages) avec bascule entre conversations**,
afin de **permettre des échanges multi-tours persistants avec l'IA où l'utilisateur peut reprendre une discussion précédente**.

## Acceptance Criteria

1. **Création automatique de conversation** : Si aucun `conversationId` n'est présent dans l'URL ou la session, une nouvelle conversation est automatiquement créée lors du premier message, et l'URL est mise à jour avec le nouvel `conversationId` (sans recharge de page)
2. **Affichage de l'historique des messages** : Tous les messages d'une conversation (utilisateur + assistant) sont affichés dans l'ordre chronologique au chargement de la page, avec leur contenu exact et leurs citations si présentes (ST-305)
3. **Liste des conversations précédentes** : Un panneau latéral ou menu overlay affiche toutes les conversations de l'utilisateur (titre, date de dernière activité, nombre de messages), triées par activité récente
4. **Bascule entre conversations** : Cliquer sur une conversation dans la liste charge ses messages **avec leur contenu complet** (pas seulement le résumé comme en ST-303) et met à jour l'URL avec le `conversationId` correspondant
5. **Renommage de conversation** : Bouton ou action « Renommer » disponible pour chaque conversation permettant de modifier son titre personnalisé
6. **Suppression de conversation** : Bouton ou action « Supprimer » avec confirmation, qui supprime la conversation et ses messages de la base de données
7. **URL persistante** : L'URL reflète toujours la conversation active (ex: `/chat/c123e456-7890-1234-5678-9abcdef01234`) ; partager ce lien permet à un autre utilisateur **authentifié** d'accéder à la même conversation si autorisé
8. **Nouvelle conversation** : Bouton « Nouvelle conversation » visible et fonctionnel, qui vide la zone de chat et crée un nouvel `conversationId` sans perdre les filtres actifs (ST-304)
9. **Intégration avec ST-304** : Les filtres de recherche persistent **par conversation** — changer de conversation conserve les filtres de la conversation précédente, mais une nouvelle conversation démarre avec les filtres par défaut
10. **Intégration avec ST-305** : Les citations de sources s'affichent correctement pour chaque message assistant dans toutes les conversations, avec les bons liens vers les documents
11. **Accessibilité** : Tous les éléments respectent WCAG 2.1 AA — labels visibles ou `aria-label` sur les boutons d'action, `role="list"`/`role="listitem"` pour la liste des conversations, focus visible sur tous les éléments interactifs
12. **Responsive design** : La liste des conversations et la zone de chat s'adaptent correctement sur mobile (menu overlay ou sidebar collapsible), tablette et desktop
13. **Gestion d'erreur** : Toute erreur (chargement d'une conversation inexistante, suppression échouée, etc.) affiche un message clair (`role="alert"`) sans casser l'interface
14. **État de chargement** : Indicateur visuel pendant le chargement des messages d'une conversation ou des actions (renommage, suppression)

## Tasks / Subtasks

- [ ] **Task 0 — Prérequis bloquant : Vérifier et étendre les endpoints backend**
  - [ ] Vérifier que `GET /api/chat/history` retourne bien la liste des conversations avec leurs métadonnées (`id`, `title`, `createdAt`, `updatedAt`, `messageCount`)
  - [ ] **Créer `GET /api/chat/messages?conversationId=...`** : endpoint pour récupérer **tous les messages** (contenu complet) d'une conversation donnée — cet endpoint **n'existe pas encore** (découvert lors de ST-303, voir Dev Notes)
  - [ ] Vérifier que `POST /api/chat/message` accepte bien `conversationId` dans le body et l'associe correctement au message
  - [ ] **Étendre `POST /api/chat/message`** : Si aucun `conversationId` n'est fourni, en créer un nouveau côté serveur et le retourner dans la réponse
  - [ ] **Créer `PATCH /api/conversations/{id}/rename`** : endpoint pour renommer une conversation (champ `title`)
  - [ ] **Créer `DELETE /api/conversations/{id}`** : endpoint pour supprimer une conversation et ses messages (cascade)
  - [ ] Valider que `GET /api/chat/history` et les nouveaux endpoints acceptent l'authentification via `x-user-id` header (déjà géré par `proxy.ts`)
  - [ ] Ajouter des tests unitaires pour les nouveaux endpoints

- [ ] **Task 1 — Type Conversation** (AC: #1, #2, #3, #4, #7)
  - [ ] Créer ou étendre `src/types/conversations.ts` (ou ajouter dans un fichier existant)
  - [ ] Définir l'interface `Conversation` : `{ id: string, title: string, createdAt: Date, updatedAt: Date, messageCount: number }`
  - [ ] Définir l'interface `ConversationMessage` : `{ id: string, conversationId: string, content: string, role: 'user' | 'assistant', sources?: SourceCitation[], createdAt: Date }`
  - [ ] Définir le type pour l'état des conversations dans le frontend
  - [ ] Exporter tous les types depuis l'index du dossier types

- [ ] **Task 2 — Client API pour les conversations** (AC: #2, #3, #4, #5, #6, #7, #13)
  - [ ] Étendre `src/lib/api/chat.ts` (créé dans ST-303) avec de nouvelles fonctions :
    - `getConversations()` : appelle `GET /api/chat/history` pour récupérer la liste des conversations
    - `getConversationMessages(conversationId: string)` : appelle `GET /api/chat/messages?conversationId=...` pour récupérer tous les messages d'une conversation
    - `renameConversation(conversationId: string, newTitle: string)` : appelle `PATCH /api/conversations/{id}/rename`
    - `deleteConversation(conversationId: string)` : appelle `DELETE /api/conversations/{id}` avec confirmation
  - [ ] Gérer les erreurs de manière cohérente (lancer des exceptions avec messages descriptifs)
  - [ ] Ajouter des timeouts (10s) sur tous les appels fetch
  - [ ] Implémenter un cache simple (1 minute) pour `getConversations()` pour éviter les recharges inutiles
  - [ ] Ajouter des tests unitaires pour toutes les nouvelles fonctions

- [ ] **Task 3 — Structure de routage** (AC: #1, #2, #4, #7)
  - [ ] **Créer `src/app/chat/[conversationId]/page.tsx`** : page dynamique pour afficher une conversation spécifique
  - [ ] Créer `src/app/chat/layout.tsx` : layout partagé entre `/chat` et `/chat/[conversationId]` pour éviter la duplication de code
  - [ ] Migrer la logique existante de `src/app/chat/page.tsx` vers le layout ou un composant partagé
  - [ ] Gérer la redirection : si `/chat` est accédé sans `conversationId`, rediriger vers `/chat/new` ou créer automatiquement une nouvelle conversation
  - [ ] Vérifier que le middleware (`proxy.ts`) protège bien les routes `/chat/*` (déjà le cas)

- [ ] **Task 4 — Composant ConversationList** (AC: #3, #4, #5, #6, #11, #12)
  - [ ] Créer `src/components/ConversationList/index.tsx` (barrel export)
  - [ ] Créer `src/components/ConversationList/ConversationList.tsx` : liste des conversations avec :
    - Affichage du titre (ou « Nouvelle conversation » si vide)
    - Date de dernière activité formatée
    - Nombre de messages
    - Icône ou indicateur visuel pour la conversation active
  - [ ] Créer `src/components/ConversationList/ConversationItem.tsx` : item individuel de la liste
  - [ ] Créer `src/components/ConversationList/ConversationActions.tsx` : boutons Renommer et Supprimer avec menu contextuel ou icônes
  - [ ] Implémenter le pattern overlay pour mobile (comme `UserMenu` de ST-302) ou sidebar pour desktop
  - [ ] Accessibilité : `role="list"`, `role="listitem"`, labels sur les boutons d'action
  - [ ] Responsive : overlay sur mobile (< 768px), sidebar collapsible sur desktop
  - [ ] Styles : cohérents avec le design system (corail #EF6C4D, encre #1E2A3B)

- [ ] **Task 5 — Composant ConversationHeader** (AC: #2, #5, #6, #7)
  - [ ] Créer `src/components/Conversation/ConversationHeader.tsx` : titre de la conversation avec boutons d'action
  - [ ] Afficher le titre editable (cliquer pour renommer)
  - [ ] Bouton « Renommer » : ouvre un champ de texte inline ou une modale
  - [ ] Bouton « Supprimer » : ouvre une modale de confirmation
  - [ ] Bouton « Nouvelle conversation » : dans le header ou à côté
  - [ ] Indicateur de chargement pendant les actions
  - [ ] Accessibilité : focus visible, `aria-label` sur les boutons

- [ ] **Task 6 — Gestion d'état des conversations** (AC: #1, #2, #3, #4, #7, #8, #9)
  - [ ] Gérer l'état local dans le layout `/chat/` avec `useState`/`useReducer` (pas de Context global nécessaire pour l'instant)
  - [ ] État à gérer :
    - `conversations: Conversation[]` — liste des conversations de l'utilisateur
    - `currentConversationId: string | null` — conversation active
    - `messages: ConversationMessage[]` — messages de la conversation active
    - `loading: boolean` — état de chargement
    - `error: string | null` — erreur éventuelle
    - `filters: Filters` — filtres persistés par conversation (ST-304)
  - [ ] Charger les conversations au montage initial
  - [ ] Charger les messages de la conversation active lors du changement de `conversationId`
  - [ ] Persister les filtres **par conversation** : stocker dans un objet `{ [conversationId]: Filters }`
  - [ ] Synchroniser l'URL avec l'état : mettre à jour l'URL lors du changement de conversation, et charger la conversation depuis l'URL au montage
  - [ ] Gérer les cas edge : conversation supprimée, conversation inexistante, erreur de chargement

- [ ] **Task 7 — Navigation et routage** (AC: #1, #2, #4, #7, #8)
  - [ ] Utiliser Next.js `useRouter` pour la navigation sans recharge
  - [ ] Mettre à jour l'URL avec `router.push`/`router.replace` lors du changement de conversation
  - [ ] Gérer la navigation « Retour » du navigateur (bouton back)
  - [ ] Vérifier que le partage d'URL fonctionne (copier/coller le lien d'une conversation)
  - [ ] Gérer le cas où l'utilisateur accède directement à une URL `/chat/{invalidId}`

- [ ] **Task 8 — Actions sur les conversations** (AC: #5, #6, #7, #13)
  - [ ] Implémenter le renommage : modale ou champ inline avec validation (titre non vide)
  - [ ] Implémenter la suppression : modale de confirmation avec message « Êtes-vous sûr de vouloir supprimer cette conversation ? Cette action est irréversible. »
  - [ ] Après suppression : rediriger vers `/chat` ou la conversation la plus récente
  - [ ] Après renommage : mettre à jour la liste des conversations et le header
  - [ ] Gérer les erreurs (conversation déjà supprimée, titre trop long, etc.)
  - [ ] Afficher des notifications de succès/échec

- [ ] **Task 9 — Intégration avec ST-303** (AC: #10, #14)
  - [ ] Vérifier que l'interface de chat existante (ChatInput, ChatMessage, ChatMessageList) fonctionne sans modification
  - [ ] Passer les messages de la conversation active au composant ChatMessageList
  - [ ] S'assurer que les citations (ST-305) s'affichent correctement pour chaque message
  - [ ] Conserver le comportement existant : scroll automatique, indicateur de typage, etc.

- [ ] **Task 10 — Intégration avec ST-304** (AC: #9)
  - [ ] Persister les filtres **par conversation** : chaque conversation a ses propres filtres
  - [ ] Sauvegarder les filtres dans l'état de la conversation (pas dans un état global)
  - [ ] Restaurer les filtres lors de la bascule vers une conversation
  - [ ] Réinitialiser les filtres uniquement pour les **nouvelles** conversations, pas pour les existantes
  - [ ] Vérifier que les filtres sont appliqués correctement aux messages de chaque conversation

- [ ] **Task 11 — Expérience utilisateur** (AC: #2, #3, #4, #5, #6, #8, #12, #14)
  - [ ] État vide : message « Aucune conversation. Commencez une nouvelle discussion. » si aucune conversation n'existe
  - [ ] Indicateur visuel pour la conversation active dans la liste (fond différent, bordure)
  - [ ] Tooltips ou infobulles pour expliquer les actions (Renommer, Supprimer)
  - [ ] Confirmation visuelle après les actions (notification toast ou bannière)
  - [ ] Feedback visuel pendant le chargement (skeleton ou spinner)
  - [ ] Animation de transition douce lors du changement de conversation

- [ ] **Task 12 — Accessibilité** (AC: #11)
  - [ ] `role="list"` sur le conteneur de la liste des conversations
  - [ ] `role="listitem"` sur chaque item de conversation
  - [ ] `aria-label` descriptif sur tous les boutons d'action
  - [ ] Gestion du focus : `focus-visible:ring-2` sur tous les éléments interactifs
  - [ ] Annonces ARIA pour les changements de conversation (`aria-live="polite"`)
  - [ ] Navigation au clavier : flèches pour naviguer dans la liste, Entrée pour sélectionner
  - [ ] Respect de `prefers-reduced-motion` pour les animations

- [ ] **Task 13 — Responsive design** (AC: #12)
  - [ ] Mobile (< 768px) : menu overlay pour la liste des conversations (comme UserMenu de ST-302)
  - [ ] Tablette (768px - 1024px) : sidebar collapsible ou overlay
  - [ ] Desktop (> 1024px) : sidebar permanente à gauche, zone de chat à droite
  - [ ] Points de rupture : utiliser les breakpoints Tailwind (`sm`, `md`, `lg`, `xl`)
  - [ ] Tester le rendu sur toutes les tailles d'écran

- [ ] **Task 14 — Tests** (tous les AC)
  - [ ] Tests unitaires pour `ConversationList` : rendu, sélection, navigation
  - [ ] Tests unitaires pour `ConversationItem` : affichage, actions
  - [ ] Tests unitaires pour `ConversationHeader` : affichage du titre, actions
  - [ ] Tests unitaires pour le client API : `getConversations`, `getConversationMessages`, `renameConversation`, `deleteConversation`
  - [ ] Tests d'intégration pour la page `/chat/[conversationId]` : chargement d'une conversation, bascule entre conversations
  - [ ] Tests d'intégration pour le layout : gestion de l'état, persistance des filtres
  - [ ] Tests des nouveaux endpoints backend : `GET /api/chat/messages`, `PATCH /api/conversations/{id}/rename`, `DELETE /api/conversations/{id}`
  - [ ] Tests E2E : parcours utilisateur complet (création, bascule, renommage, suppression) — optionnel, nécessite environnement complet

## Dev Notes

### 🏗️ Contexte Architecture et Contraintes

- **Backend partiellement prêt** : Les tables `conversations` et `messages` existent dans Supabase (voir architecture.md:256-282), et `POST /api/chat/message` peut déjà associer un message à une conversation via `conversationId` dans le body
- **Endpoint manquant critique** : `GET /api/chat/history` (ST-303) ne retourne que les **résumés** des conversations (`id`, `title`, `createdAt`, `updatedAt`, `messageCount`), **pas le contenu des messages** — un nouvel endpoint `GET /api/chat/messages?conversationId=` est **obligatoire** pour cette story
- **Nouvelles routes nécessaires** : `PATCH /api/conversations/{id}/rename` et `DELETE /api/conversations/{id}` n'existent pas encore
- **Contrat API existant** : `POST /api/chat/message` accepte déjà `{ message: string, conversationId?: string, filters?: Filters, options?: { temperature?, maxTokens?, model? } }` (voir ST-303 Dev Notes)
- **Authentification** : `src/proxy.ts` injecte déjà `x-user-id` pour tout `/api/chat/*` — le frontend n'a rien à faire côté auth, `fetch` avec les cookies de session suffit
- **Database schema** : `conversations.user_id` est une clé étrangère vers `auth.users(id)` — les requêtes doivent filtrer par `user_id` côté backend
- **Cascade delete** : La suppression d'une conversation doit supprimer tous ses messages (contrainte `messages_conversation_id_fkey` dans architecture.md:281)

### 📁 Structure du Projet et Emplacements

**Nouveaux fichiers à créer :**
```
src/
├── app/
│   ├── chat/
│   │   ├── layout.tsx          # Layout partagé pour toutes les routes /chat/*
│   │   ├── page.tsx            # Page par défaut (redirige ou crée nouvelle conversation)
│   │   └── [conversationId]/
│   │       └── page.tsx        # Page pour une conversation spécifique
├── components/
│   ├── ConversationList/        # Liste des conversations
│   │   ├── index.tsx           # Barrel export
│   │   ├── ConversationList.tsx # Liste complète
│   │   ├── ConversationItem.tsx # Item individuel
│   │   └── ConversationActions.tsx # Actions (Renommer, Supprimer)
│   └── Conversation/
│       └── ConversationHeader.tsx # Header avec titre et actions
└── lib/
    └── api/
        └── conversations.ts      # Client API pour les opérations de conversation
```

**Fichiers existants à modifier :**
```
src/
├── app/
│   └── chat/
│       └── page.tsx            # À migrer vers le layout ou à adapter
├── components/
│   └── Chat/
│       ├── ChatMessageList.tsx # Reçoit maintenant les messages de la conversation
│       └── api.ts              # Étendre avec les nouvelles fonctions conversations
├── lib/
│   └── api/
│       └── chat.ts             # Étendre avec les nouvelles fonctions
└── components/
    └── Navbar/Navbar.tsx       # Peut nécessiter un lien vers /chat (déjà fait en ST-303)
```

### ⚠️ Contraintes Critiques et Pièges à Éviter

- **❌ NE PAS utiliser React Query ou SWR** : Ces libraries ne sont **pas installées** dans le projet (voir ST-303 Dev Notes #99) — utiliser `useState`/`useEffect` + `fetch` natif
- **❌ NE PAS utiliser Zustand** : Non installé et non utilisé ailleurs dans le projet — l'état local à la page/layout suffit
- **❌ NE PAS importer depuis les Route Handlers** : Comme découvert dans ST-303 et ST-304, n'importer **rien** depuis `src/app/api/*/route.ts` dans les composants `'use client'` — écrire des clients fetch côté frontend
- **❌ NE PAS supposer que `GET /api/chat/history` retourne les messages** : Cet endpoint retourne uniquement les **résumés** des conversations, pas leur contenu — un nouvel endpoint `GET /api/chat/messages` est obligatoire
- **❌ NE PAS casser l'existant** : La page `/chat` existante (ST-303) doit continuer à fonctionner pendant la migration — utiliser un layout partagé pour éviter la duplication
- **⚠️ Gestion des erreurs 404** : Si une conversation n'existe pas ou a été supprimée, afficher un message clair et proposer de revenir à la liste
- **⚠️ Synchronisation URL/état** : L'URL doit **toujours** refléter l'état — ne pas se fier uniquement à l'état local
- **⚠️ Performance du chargement** : Charger les conversations et les messages en parallèle pour minimiser le temps d'attente
- **⚠️ Persistance des filtres par conversation** : Chaque conversation a ses propres filtres (ST-304) — ne pas utiliser un état global

### 🎨 Design System et Intégration Visuelle

**Héritage de ST-303/304/305 :**
- Couleurs : Corail `#EF6C4D` (primary), Encre `#1E2A3B` (secondary), Fond sombre `#0F172A` (background), Texte clair `#F8FAFC` (text)
- Typographie : Geist Sans (déjà configuré dans `tailwind.config.ts`)
- Border radius : 8px (sm), 10px (md), 16px (lg) — voir tokens `chat-*` dans `tailwind.config.ts`
- Design tokens : Voir `_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md`

**Emplacement et disposition :**
- **Desktop** : Sidebar à gauche (largeur ~280px), zone de chat à droite (max-width 880px, comme ST-303)
- **Mobile** : Bouton « ☰ Conversations » en haut à gauche, ouvre un overlay full-screen
- **Conversation active** : Fond `#1E2A3B` (encre) avec bordure gauche corail `#EF6C4D` (2px)
- **Conversation inactive** : Fond transparent, texte `#94A3B8` (gris clair)
- **Header** : Titre editable (cliquable), boutons d'action à droite (Renommer, Supprimer, Nouvelle conversation)

**Comportement :**
- La liste des conversations défile indépendamment de la zone de chat
- Cliquer sur une conversation : charge ses messages sans recharge de page
- Nouvel message : reste dans la conversation active, scroll automatique vers le bas
- Nouvelle conversation : bouton dédié ou raccourci clavier (Ctrl/Cmd + N)

### 📡 Contrat API pour les Nouveaux Endpoints

**GET /api/chat/messages?conversationId=...**
```typescript
// Request
// GET /api/chat/messages?conversationId=uuid&limit=50&offset=0
// Headers: x-user-id (injected par proxy.ts)

// Response 200
{
  messages: [
    {
      id: string;
      conversationId: string;
      content: string;
      role: 'user' | 'assistant';
      sources?: Array<{
        path: string;
        type: 'supabase' | 'gitlab' | 'nexia' | 'upload';
        relevance?: number;
      }>;
      createdAt: string; // ISO 8601
    }
  ];
  total: number;
  offset: number;
  limit: number;
}

// Response 404
{ error: "Conversation not found" }

// Response 401
{ error: "Unauthorized" }
```

**PATCH /api/conversations/{id}/rename**
```typescript
// Request
// PATCH /api/conversations/c123e456-7890-1234-5678-9abcdef01234
// Headers: x-user-id (injected par proxy.ts)
// Body: { title: string }

// Response 200
{
  conversation: {
    id: string;
    title: string;
    updatedAt: string; // ISO 8601
  }
}

// Response 400
{ error: "Title cannot be empty" }

// Response 404
{ error: "Conversation not found" }

// Response 401
{ error: "Unauthorized" }

// Response 403
{ error: "Not authorized to rename this conversation" }
```

**DELETE /api/conversations/{id}**
```typescript
// Request
// DELETE /api/conversations/c123e456-7890-1234-5678-9abcdef01234
// Headers: x-user-id (injected par proxy.ts)

// Response 200
{
  message: "Conversation deleted successfully"
}

// Response 404
{ error: "Conversation not found" }

// Response 401
{ error: "Unauthorized" }

// Response 403
{ error: "Not authorized to delete this conversation" }
```

### 🔗 Intégration avec les Autres Stories

**ST-303 (Créer l'Interface de Chat) :**
- ✅ **Héritage** : Toute la logique de ChatInput, ChatMessage, ChatMessageList, TypingIndicator est **réutilisée sans modification**
- ✅ **Compatibilité** : La zone de chat doit continuer à fonctionner exactement comme avant pour une conversation simple
- ⚠️ **Migration** : La page `/chat` existante doit être migrée vers le layout partagé

**ST-304 (Filtres de Recherche) :**
- ✅ **Persistance par conversation** : Les filtres sont stockés **par conversationId**, pas globalement
- ✅ **Intégration** : Les filtres sélectionnés sont envoyés avec chaque message via `POST /api/chat/message`
- ✅ **Réinitialisation** : Une nouvelle conversation démarre avec les filtres par défaut (Tous les thèmes, Tous les formats)

**ST-305 (Citations de Sources) :**
- ✅ **Affichage** : Les citations s'affichent correctement pour chaque message assistant dans toutes les conversations
- ✅ **Intégration** : Le champ `sources` des messages est passé au composant ChatMessage
- ✅ **Génération d'URL** : Utiliser `getSourceUrl()` (déjà implémenté dans ST-305) pour chaque citation

## Previous Story Intelligence (ST-303, ST-304, ST-305)

- **Pattern de client API** : ST-303 a créé `src/components/Chat/api.ts` avec des fonctions `fetch` pures côté frontend — suivre ce pattern pour les nouveaux endpoints conversations (Task 2)
- **Gestion d'état local** : ST-303 utilise `useState`/`useReducer` dans la page sans Context global — même approche pour ST-306 (Task 6)
- **Pattern de menu overlay** : ST-302 (`UserMenu`) et ST-303 (`HistoryMenu`) utilisent un pattern overlay avec `useRef` + `useEffect` pour la détection des clics extérieurs — réutiliser ce pattern pour la liste des conversations sur mobile (Task 4)
- **Design system du chat** : ST-303 a défini des tokens `chat-*` dans `tailwind.config.ts` — réutiliser ces mêmes valeurs pour ST-306 (couleurs, radius, typographie)
- **Tests réels** : ST-303, ST-304, ST-305 ont tous été critiqués pour leurs tests initiaux trop superficiels — **chaque test doit** : `render` + interagir (`fireEvent`/`userEvent`) + asserter sur le DOM ou l'état
- **`data-testid` convention** : ST-303 a introduit `data-testid` sur tous les éléments interactifs — appliquer la même convention pour les nouveaux composants (ConversationList, ConversationItem, etc.)
- **Gestion d'erreur API** : ST-303 et ST-304 gèrent les erreurs API en affichant des bannières (`role="alert"`) — même approche pour ST-306
- **Endpoint `/api/chat/history` limitation** : ST-303 a découvert que cet endpoint ne retourne pas le contenu des messages — cette limitation est **résolue** dans ST-306 par la création de `GET /api/chat/messages`

## Git Intelligence Summary

Derniers commits pertinents :
- `fe4bb2f` : ST-305 - Implémentation des citations de sources (SourceCitation components, api/sources.ts)
- `c98bee6` : ST-305 - Correctifs et code review
- `53585c5` : ST-304 - Filtres de recherche (Fix Winston logger)
- `004f53a` : Documentation diverse

Le travail ST-303 (ChatInput, ChatMessage, ChatMessageList, page /chat) et ST-304 (Filters) est complet et fonctionnel. ST-305 (Citations) vient d'être mergée.

## Project Context Reference

- **Next.js 16** : Utiliser App Router, `proxy.ts` pour la protection des routes (remplace `middleware.ts`)
- **Next.js breaking changes** : Consulter `node_modules/next/dist/docs/` avant d'utiliser une API incertaine
- **AGENTS.md** : Respecter les règles Next.js 16 spécifiques au projet
- **No new libraries** : Ne pas introduire de nouvelles dépendances (React Query, SWR, Zustand, i18next, react-markdown) — utiliser ce qui est déjà dans package.json

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2026-07-08 | Mistral Vibe | Story ST-306 créée - Ultimate context engine analysis completed |

## Dev Agent Record

### Agent Model Used
Mistral Vibe (create-story workflow)

### Debug Log References

### Completion Notes List

- Ultimate context engine analysis completed - comprehensive developer guide created
- **Gap critique identifié** : Aucun endpoint n'existe pour récupérer le contenu des messages d'une conversation — `GET /api/chat/messages?conversationId=...` doit être implémenté en Task 0
- **Gap critique identifié** : Les endpoints de renommage et suppression de conversation n'existent pas — `PATCH /api/conversations/{id}/rename` et `DELETE /api/conversations/{id}` doivent être implémentés en Task 0
- **Décision d'architecture** : Utiliser un layout partagé (`src/app/chat/layout.tsx`) pour éviter la duplication entre `/chat` et `/chat/[conversationId]`
- **Décision de design** : Sidebar permanente sur desktop, overlay sur mobile — pattern déjà établi dans l'UI existante
- **Décision de persistance** : Filtres persistés par conversation, pas globalement — cohérent avec l'expérience utilisateur attendue

## File List (Cible)

**Nouveaux fichiers à créer :**
- `src/app/chat/layout.tsx` - Layout partagé
- `src/app/chat/page.tsx` - Page par défaut (redirige ou crée nouvelle conversation)
- `src/app/chat/[conversationId]/page.tsx` - Page conversation spécifique
- `src/components/ConversationList/index.tsx` - Barrel export
- `src/components/ConversationList/ConversationList.tsx` - Liste des conversations
- `src/components/ConversationList/ConversationItem.tsx` - Item de conversation
- `src/components/ConversationList/ConversationActions.tsx` - Actions
- `src/components/Conversation/ConversationHeader.tsx` - Header avec titre
- `src/lib/api/conversations.ts` - Client API conversations
- `src/types/conversations.ts` - Types conversations
- Tests unitaires et d'intégration associés

**Fichiers existants à modifier :**
- `src/components/Chat/api.ts` - Étendre avec fonctions conversations
- `src/components/Chat/ChatMessageList.tsx` - Recevoir les messages de la conversation
- `src/lib/api/chat.ts` - Mettre à jour avec nouveaux endpoints
- `tailwind.config.ts` - Ajouter tokens si nécessaire

**Fichiers backend à créer :**
- `src/app/api/chat/messages/route.ts` - GET /api/chat/messages
- `src/app/api/conversations/[id]/rename/route.ts` - PATCH /api/conversations/{id}/rename
- `src/app/api/conversations/[id]/route.ts` - DELETE /api/conversations/{id}

---

**✅ ULTIMATE BMad Method STORY CONTEXT CREATED!**

The developer now has everything needed for flawless implementation of ST-306:
- Complete acceptance criteria (14 ACs)
- Organized tasks (14 tasks with subtasks)
- Technical context and constraints
- Integration details with ST-303, ST-304, ST-305
- Previous story intelligence and lessons learned
- Design system and UX guidelines
- File structure and location guidance
- Critical pitfalls to avoid
- API contracts for new endpoints

**Next Steps:**
1. Review the comprehensive story in `4-306-implementer-le-mode-conversation.md`
2. Run `bmad-dev-story ST-306` for optimized implementation
3. Run `code-review` when complete (auto-marks done)

*Generated by Mistral Vibe. Co-Authored-By: Mistral Vibe <vibe@mistral.ai>*
