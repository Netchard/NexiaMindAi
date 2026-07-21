---
title: 'Page Documents — upload et indexation manuelle RAG'
type: 'feature'
created: '2026-07-19'
status: 'done'
context: []
baseline_commit: '991ca828c0b1bf4456342f0031f65f48d69915f9'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le lien « Documents » du menu principal (`Navbar.tsx`) pointe vers `/documents`, qui n'existe pas encore. Il n'existe aujourd'hui aucun moyen, depuis l'UI, de déposer un document dans Supabase Storage puis de déclencher son indexation dans le pipeline RAG — seuls des scripts et endpoints stub (TODO) existent.

**Approach:** Créer `/documents` avec une zone glisser-déposer + liste des fichiers sélectionnés, une action « Télécharger » qui les envoie vers le bucket Supabase Storage `documents` sous un préfixe dédié à la session d'upload, puis une action distincte « Lancer l'indexation » qui indexe uniquement ce préfixe via le pipeline existant et affiche un résumé final.

## Boundaries & Constraints

**Always:**
- Réutiliser les tokens de design existants (classes `chat-*`, mêmes patterns de bouton/spinner/message succès-erreur que `RefreshButton.tsx`, mêmes conventions de page que `src/app/page.tsx`) — aucun nouveau système visuel.
- Limiter les types de fichiers acceptés à ceux que `src/lib/supabase/storage/ocr.ts` sait extraire (pdf, docx/doc/pptx/ppt/xlsx/xls, texte/markdown/csv/json/etc.) — refuser les autres dès le dépôt, avec message explicite.
- Page accessible à tout utilisateur connecté : redirection vers `/auth/login?redirect=%2Fdocuments` pour tout visiteur non connecté. Assurée par la garde middleware existante `src/proxy.ts` (`/documents` hors `PUBLIC_PAGE_ROUTES`, `/api/documents/*` dans `PROTECTED_API_PREFIXES`) — pas de code d'auth supplémentaire à écrire dans la page ou les routes.
- L'indexation déclenchée depuis cette page ne porte que sur les fichiers de la session d'upload courante (préfixe dédié, ex. `uploads/{slug}/`), jamais sur tout le bucket.
- Upload et indexation restent deux actions manuelles et séquentielles décidées par l'utilisateur — jamais automatiques au dépôt ou à la sélection.

**Ask First:** Si le bucket `documents` nécessite une policy RLS non couverte par les policies existantes (ST-401) pour autoriser l'upload utilisateur, HALT et demander confirmation avant de modifier les policies.

**Never:** Pas d'OCR image (`ocr.ts` lève une erreur sur les images) — exclure les images du filtre d'acceptation. Pas de ré-indexation globale du bucket depuis cette page (le bouton « Rafraîchir » existant s'en charge déjà).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Dépôt fichiers valides | 3 PDF/DOCX glissés | Liste affichée (nom + taille), bouton « Télécharger » actif | N/A |
| Dépôt type non supporté | fichier `.png` glissé | Fichier rejeté immédiatement, message explicite, non ajouté à la liste | Affiché en ligne dans la zone de dépôt |
| Téléchargement en cours | clic « Télécharger » | Upload vers `documents/uploads/{prefix}/`, spinner, bouton désactivé | Échec réseau global → message erreur générique |
| Téléchargement partiel | 2/3 fichiers OK, 1 échoue | Les 2 réussis passent « prêt à indexer », le 3e affiche son erreur, reste retryable | Erreur par fichier affichée individuellement |
| Indexation lancée | clic « Lancer l'indexation » après upload | Appel indexation sur le préfixe, spinner, résumé final : noms déposés, nb indexé succès, nb en échec | Erreur globale → message générique, résumé partiel si dispo |
| Utilisateur non connecté | accès direct à `/documents` sans session | Redirection vers `/auth/login?redirect=%2Fdocuments` | N/A |

</frozen-after-approval>

## Code Map

- `src/app/documents/page.tsx` -- nouvelle page : dropzone, liste, actions Télécharger/Lancer l'indexation, résumé
- `src/components/Navbar/Navbar.tsx` -- lien « Documents » déjà présent vers `/documents`, aucune modification requise
- `src/app/api/documents/upload/route.ts` -- nouvelle route POST (FormData), upload vers le bucket `documents` sous `uploads/{slug}/`
- `src/app/api/documents/index/route.ts` -- à réécrire : accepter `{ prefix }`, appeler `storageIndexer.indexAll({ prefix })` au lieu de la simulation actuelle
- `src/lib/supabase/storage/indexer.ts` -- `storageIndexer.indexAll({ prefix })` réutilisé tel quel (chunking + embeddings + comptage succès/échec déjà implémentés)
- `src/lib/supabase/storage/client.ts` -- `SupabaseStorageClient` n'a pas de méthode d'upload : en ajouter une
- `src/components/RefreshButton/RefreshButton.tsx` -- référence de style (bouton, spinner, messages succès/erreur)
- `src/proxy.ts` -- protège déjà `/documents` (page) et `/api/documents/*` (API) : redirection auto vers `/auth/login` si non connecté, injection de `x-user-id`/`x-user-email` sur les routes API — aucun code d'auth supplémentaire à écrire dans la page ou les routes
- `src/app/api/sources/supabase/sync/route.ts` -- référence de convention pour une route déclenchant `storageIndexer.indexAll()` (lecture de `x-user-id`, gestion d'erreurs, structure de réponse) ; NE PAS copier son admin-check (`AuthService.isAdminByUserId`) ni son mode fire-and-forget 202 — la route `index` de cette spec doit `await` `indexAll()` et renvoyer le résultat final synchrone, car l'utilisateur doit voir le résumé immédiatement

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/supabase/storage/client.ts` -- ajouter `uploadFile(path, buffer, contentType)` -- centraliser l'upload Storage comme les autres méthodes du client
- [x] `src/app/api/documents/upload/route.ts` -- POST FormData multi-fichiers, valider l'extension via la même liste que `ocr.ts`, uploader sous `uploads/{slug}/{filename}`, retourner chemins/erreurs par fichier
- [x] `src/app/api/documents/index/route.ts` -- remplacer la simulation par `storageIndexer.indexAll({ prefix })`, retourner l'`IndexationResult`
- [x] `src/app/documents/page.tsx` -- page cliente : dropzone (drag&drop + input file), liste des fichiers avec statut, bouton Télécharger, bouton Lancer l'indexation (actif après upload), bloc résumé final
- [x] `src/app/documents/__tests__/page.test.tsx` -- tests du flux : dépôt, rejet type invalide, upload, indexation, résumé
- [x] `src/app/api/documents/upload/__tests__/route.test.ts` -- tests route upload (succès, type rejeté, échec partiel)
- [x] `src/app/api/documents/index/__tests__/route.test.ts` -- tests route index (prefix manquant, succès, erreurs storageIndexer)

**Acceptance Criteria:**
- Given des fichiers glissés dans la zone, when ils sont de types supportés, then ils apparaissent dans la liste avec l'action « Télécharger » disponible
- Given des fichiers téléchargés avec succès, when l'utilisateur clique « Lancer l'indexation », then le résumé final affiche les noms des documents déposés, le nombre indexé avec succès et le nombre non indexé
- Given un utilisateur non connecté, when il accède à `/documents`, then il est redirigé vers `/auth/login?redirect=%2Fdocuments`

## Spec Change Log

- **2026-07-19** — Finding (acceptance auditor, intent_gap) : le bullet « Always » sur l'auth affirmait à tort qu'il n'existe pas de garde middleware dans ce projet ; `src/proxy.ts` en fournit une (redirection page + injection `x-user-id` sur `/api/documents/*`). Amendé pour refléter la réalité. Aucun changement de code : le comportement attendu (redirection si non connecté) était déjà satisfait via `proxy.ts`, conformément aux Design Notes déjà présentes avant implémentation. KEEP : ne pas dupliquer de logique d'auth dans `documents/page.tsx` ou les routes `/api/documents/*` — s'appuyer sur `proxy.ts`.

## Design Notes

Réutiliser exactement les classes utilitaires `chat-*` (`bg-chat-surface-panel`, `border-chat-border-soft`, `rounded-chat-md`/`sm`, `text-chat-ink-*`, `chat-error-surface`/`border`, spinner `animate-spin` de `RefreshButton.tsx`) pour que la page soit visuellement indissociable du reste de l'app. Dropzone : état « survol » avec bordure accent (dégradé `auth-accent-blue-from/to` comme le logo Navbar), état vide avec icône + texte d'instruction, état « fichiers présents » avec liste scrollable et statut par fichier (en attente / téléchargé / erreur).

Auth : ne rien coder côté page/route pour la protection d'accès — `src/proxy.ts` redirige déjà toute page hors `PUBLIC_PAGE_ROUTES` (dont `/documents`) vers `/auth/login?redirect=...`, et injecte `x-user-id` sur les requêtes vers `/api/documents/*`. Les routes API lisent ce header défensivement (même pattern que `sources/supabase/sync/route.ts`) pour le logging, sans re-vérifier la session.

## Verification

**Commands:**
- `npm run lint` -- expected: aucune erreur ESLint
- `npm test -- documents` -- expected: tests de la page et des deux routes passent
- `npm run build` -- expected: build Next.js réussi (nouvelles route/page compilent)

**Manual checks (if no CLI):**
- `npm run dev`, se connecter, aller sur `/documents`, glisser 2-3 fichiers PDF/DOCX, cliquer Télécharger puis Lancer l'indexation, vérifier le résumé affiché et la présence des fichiers dans le bucket Supabase `documents`.

## Suggested Review Order

**Point d'entrée — flux de la page**

- Composant client complet : dropzone, liste, actions Télécharger/Lancer l'indexation, résumé.
  [`documents/page.tsx:1`](../../src/app/documents/page.tsx#L1)

- `handleUpload` envoie le `prefix` déjà connu (le cas échéant) pour que deux lots successifs partagent la même session d'indexation.
  [`documents/page.tsx:148`](../../src/app/documents/page.tsx#L148)

- Résultats matchés par position (`idToIndex`), pas par nom de fichier — corrige la collision de noms dupliqués.
  [`documents/page.tsx:166`](../../src/app/documents/page.tsx#L166)

- `handleIndex` déclenche l'indexation sur le préfixe de session et construit le résumé final.
  [`documents/page.tsx:218`](../../src/app/documents/page.tsx#L218)

**Validation de sécurité (correctifs issus de la revue)**

- `isValidUploadPrefix`/`generateUploadPrefix` : format `uploads/{slug}/` strict, rejette tout préfixe hors-session (bloque l'indexation croisée entre utilisateurs).
  [`upload-prefix.ts:1`](../../src/lib/supabase/storage/upload-prefix.ts#L1)

- `sanitizeFileName` : neutralise `../` et les séparateurs de chemin avant de construire le chemin Storage (bloque le path traversal).
  [`upload/route.ts:32`](../../src/app/api/documents/upload/route.ts#L32)

- `index/route.ts` rejette tout préfixe qui ne matche pas le format attendu avant d'appeler `indexAll`.
  [`index/route.ts:60`](../../src/app/api/documents/index/route.ts#L60)

- Chemin de stockage préfixé par l'index de boucle pour dédupliquer les noms de fichiers identiques dans un même lot.
  [`upload/route.ts:113`](../../src/app/api/documents/upload/route.ts#L113)

**Routes API**

- Upload multi-fichiers (FormData), whitelist d'extensions, réutilisation/génération du préfixe de session, 401 défensif.
  [`upload/route.ts:39`](../../src/app/api/documents/upload/route.ts#L39)

- Indexation synchrone (pas de mode fire-and-forget) : `await storageIndexer.indexAll({ prefix })`, résultat renvoyé directement.
  [`index/route.ts:70`](../../src/app/api/documents/index/route.ts#L70)

- `uploadFile` : nouvelle méthode du client Storage, même style que les méthodes existantes du fichier.
  [`storage/client.ts:142`](../../src/lib/supabase/storage/client.ts#L142)

**Peripherals**

- Liste d'extensions partagée entre la page et la route (élimine la duplication client/serveur).
  [`allowed-extensions.ts:1`](../../src/lib/supabase/storage/allowed-extensions.ts#L1)

- Tests de la page (flux complet, rejets, résumé).
  [`documents/__tests__/page.test.tsx:1`](../../src/app/documents/__tests__/page.test.tsx#L1)

- Tests de la route upload (dédoublonnage, traversal, réutilisation de préfixe, 401).
  [`upload/__tests__/route.test.ts:1`](../../src/app/api/documents/upload/__tests__/route.test.ts#L1)

- Tests de la route index (validation de format, appel synchrone, erreurs).
  [`index/__tests__/route.test.ts:1`](../../src/app/api/documents/index/__tests__/route.test.ts#L1)
