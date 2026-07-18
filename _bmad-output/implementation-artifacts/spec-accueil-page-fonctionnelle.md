---
title: 'Page d''accueil fonctionnelle NexiaMind AI'
type: 'feature'
created: '2026-07-18'
status: 'done'
baseline_commit: '00df7b229106ecc67d481bc5815d81822f9d0043'
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-18-accueil/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-18-accueil/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `src/app/page.tsx` est encore le template Next.js par défaut. Les 6 actions de la nouvelle page d'accueil (spec UX finalisée ci-dessus) n'existent nulle part et ne mènent à rien.

**Approche:** Remplacer `src/app/page.tsx` par le hero, les 2 CTA, les 4 puces de suggestion et l'explicatif "3 étapes" spécifiés dans DESIGN.md/EXPERIENCE.md, avec garde d'authentification par action et logique de correspondance "Codexia".

## Boundaries & Constraints

**Always:**
- Suivre DESIGN.md/EXPERIENCE.md (`ux-nexiamind-ai-2026-07-18-accueil`, status final) pour visuel et comportement ; spine gagne sur la maquette importée en cas de conflit.
- `useAuth()` pour la garde par action (pas de redirection au niveau route — `/` reste publique). Statut indéterminé (`loading`) → traiter comme non connecté.
- Appeler `src/lib/api/conversations.ts` directement (`getConversations`, `createNewConversation`) — **pas** de `ConversationsProvider` sur `/` (son mount déclenche 3 fetches réseau, confirmé par investigation, coût inacceptable sur une route publique).
- CTA primaire "Discuter avec Nexia" et CTA de clôture "Commencer une conversation" → `router.push('/chat')` uniquement (l'état vide de `/chat/page.tsx` gère déjà la création à la première frappe) — pas de `createNewConversation` ici.
- 3 puces génériques + fallback Codexia → `createNewConversation('Nouvelle conversation')`, stocker le texte en attente dans `sessionStorage` (`nexiamind:pending-message:{conversationId}`), puis `router.push('/chat/{id}')`. Le message réel est envoyé par un effet ajouté à `chat/[conversationId]/page.tsx` qui consomme ce texte via `onSendMessage` du contexte existant (réutilise l'UI optimiste déjà là) puis nettoie l'entrée `sessionStorage`.
- Puce Codexia → `getConversations()`, recherche `title.toLowerCase().includes('codexia')` ; match → `router.push('/chat/{id}')` direct (pas de création).
- CTA "Explorer les documents" → `<button type="button" aria-disabled="true">`, jamais un `<a>` ; nœud de tooltip toujours monté dans le DOM (masqué via CSS) ; dismissible Échap sans perte de focus.
- Newsreader uniquement pour les titres (déjà chargée dans `layout.tsx`) — pas de nouvelle police. Sémantique : hero=`<h1>`, section=`<h2>`, step-title=`<h3>`.
- `prefers-reduced-motion` pour le point pulsant du badge et les transitions hover.

**Ask First:** aucune décision restante identifiée — toutes tranchées par la spec UX ou par l'investigation du code existant.

**Never:** implémenter la zone "avatar 3D" de la maquette ; recréer un header/footer propre à l'accueil (réutiliser `Navbar`/`Footer` du layout racine) ; corriger le contraste du dégradé CTA sur les bulles de chat déjà en prod (dette actée hors périmètre) ; monter `ConversationsProvider` au layout racine.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| CTA/puce, non connecté | `useAuth().loading === false`, `user === null` | `router.push('/auth/login?redirect=%2Fchat')`, aucune autre action | N/A |
| CTA/puce, statut indéterminé | `useAuth().loading === true` | Traité comme non connecté (même redirect) | N/A |
| CTA primaire/clôture, connecté | clic | `router.push('/chat')` | N/A |
| Puce générique, connectée | clic sur une des 3 puces | `createNewConversation` → pending message en sessionStorage → `router.push('/chat/{id}')` | Échec création → message d'erreur bref sur l'accueil, pas de navigation |
| Puce Codexia, match existant | conversation avec "codexia" dans le titre (insensible casse) | `router.push('/chat/{id}')` direct, aucune création | Échec recherche → message d'erreur bref, pas de navigation |
| Puce Codexia, aucun match | aucune conversation "codexia" | Même flux que puce générique | idem |
| CTA "Explorer les documents" | clic ou Entrée/Espace | Aucune action, tooltip visible au survol/focus | N/A |
| Arrivée sur `/chat/{id}` avec message en attente | `sessionStorage` contient une entrée pour cet id | `onSendMessage(id, texte, {})` appelé une fois au montage, entrée supprimée | Échec envoi → géré par l'UI d'erreur déjà existante du contexte chat |

</frozen-after-approval>

## Code Map

- `src/app/page.tsx` — réécriture complète : hero, 2 CTA, 4 puces, section 3 étapes, garde d'auth, logique Codexia.
- `src/app/chat/[conversationId]/page.tsx` — ajout d'un effet au montage consommant le message en attente (`sessionStorage`) via `onSendMessage` du contexte déjà injecté (ligne ~38-50).
- `src/lib/api/conversations.ts` — consommé tel quel (`getConversations`, `createNewConversation`), aucune modification.
- `src/components/Auth/useAuth.ts` — consommé tel quel (`user`, `loading`).
- `src/components/Navbar/Navbar.tsx:31` — lien "Accueil" déjà câblé vers `/`, aucune modification.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/page.tsx` — implémenter le hero (`h1`+badge+sous-titre), CTA primaire + CTA secondaire désactivé (bouton natif, tooltip DOM permanente, Échap), 4 puces (dont logique Codexia), section 3 étapes (`h2`+3 `h3`), CTA de clôture, garde d'auth par action, état d'erreur local -- suit DESIGN.md/EXPERIENCE.md pour tokens visuels et comportement exact.
- [x] `src/app/chat/[conversationId]/page.tsx` — ajouter l'effet de consommation du message en attente -- ferme la boucle ouverte par les puces de l'accueil sans dupliquer la logique d'envoi déjà correcte du contexte.
- [x] `src/app/__tests__/page.test.tsx` — tests RTL : rendu des CTA/puces, redirection non connecté, clic puce générique (mocks `lib/api/conversations`), correspondance Codexia (match et non-match), attributs a11y du CTA désactivé -- valide la matrice I/O ci-dessus.

**Acceptance Criteria:**
- Given un visiteur non connecté sur `/`, when il clique sur un CTA ou une puce, then il est redirigé vers `/auth/login?redirect=%2Fchat` sans navigation ni création de conversation.
- Given un utilisateur connecté sans conversation "codexia", when il clique sur la puce Codexia, then une nouvelle conversation est créée et il atterrit sur `/chat/{id}` avec sa question envoyée.
- Given un utilisateur connecté avec une conversation "Que fait Codexia ?" existante, when il clique sur la puce Codexia, then il atterrit directement sur `/chat/{id}` de cette conversation sans doublon.
- Given le CTA "Explorer les documents", when il reçoit le focus clavier, then la tooltip "Bientôt disponible" devient visible et le clic/Entrée/Espace ne déclenche aucune action.

## Design Notes

Décision d'implémentation (résout le point d'architecture laissé ouvert par EXPERIENCE.md) : `ConversationsProvider` n'est **pas** remonté au layout racine — son montage déclenche `getFilterValues()` + `getConversations()` (+ potentiellement `getConversationMessages()`), soit jusqu'à 3 fetches réseau, inacceptable sur une route publique visitée par des utilisateurs non connectés. L'accueil appelle `src/lib/api/conversations.ts` directement (fonctions `fetch` pures, sans dépendance React/contexte). Le "envoi différé" via `sessionStorage` + effet dans `chat/[conversationId]/page.tsx` permet de réutiliser l'UI optimiste/erreur déjà correcte du contexte plutôt que de la dupliquer sur l'accueil.

## Verification

**Commands:**
- `npm run test` -- tous les tests passent, y compris les nouveaux
- `npm run lint` -- aucune erreur
- `npm run build` -- build réussit sans erreur TypeScript

**Manual checks (if no CLI):**
- `npm run dev`, ouvrir `/` déconnecté puis connecté, vérifier visuellement contre `imports/maquette-nexiamind-ai-accueil-2026-07-18.html` et tester chaque action au clavier (Tab, Entrée, Échap sur la tooltip).

## Suggested Review Order

**Garde d'authentification et navigation par action**

- Point d'entrée : `loading` traité comme non connecté, décide de la garde pour toute action.
  [`page.tsx:92`](../../src/app/page.tsx#L92)

- Puce cliquée → garde, puis branchement Codexia vs. flux générique.
  [`page.tsx:102`](../../src/app/page.tsx#L102)

**Recherche puis repli "Codexia"**

- Recherche par titre avec une limite relevée (200) pour ne pas manquer une conversation ancienne.
  [`page.tsx:115`](../../src/app/page.tsx#L115)
  [`page.tsx:29`](../../src/app/page.tsx#L29)

**Handoff du message en attente vers `/chat/{id}`**

- Écriture différée du message avant navigation, échec silencieux (voir helper).
  [`page.tsx:136`](../../src/app/page.tsx#L136)

- Helper partagé : payload horodaté (TTL 60s), lecture/écriture protégées.
  [`pendingMessage.ts`](../../src/lib/utils/pendingMessage.ts#L1)

- Consommation au montage, différée tant que le chargement initial n'est pas réglé — évite la course avec `loadConversationMessages` qui écrase l'état par remplacement complet.
  [`[conversationId]/page.tsx:69`](../../src/app/chat/[conversationId]/page.tsx#L69)

**CTA secondaire désactivé (accessibilité)**

- Bouton natif `aria-disabled`, jamais un lien ; gestionnaire clic/clavier no-op.
  [`page.tsx:147`](../../src/app/page.tsx#L147)

**Garde anti double-clic**

- Un deuxième clic pendant une requête en cours est ignoré ; puces désactivées visuellement le temps de la requête.
  [`page.tsx:111`](../../src/app/page.tsx#L111)
  [`page.tsx:276`](../../src/app/page.tsx#L276)

**Tests**

- Envoi, garde d'auth, double-clic, limite de recherche Codexia, contrat a11y du CTA désactivé.
  [`__tests__/page.test.tsx`](../../src/app/__tests__/page.test.tsx#L1)

- Consommation du message en attente, séquencement avec `isLoading`, expiration TTL.
  [`[conversationId]/__tests__/page.test.tsx`](../../src/app/chat/[conversationId]/__tests__/page.test.tsx#L1)
