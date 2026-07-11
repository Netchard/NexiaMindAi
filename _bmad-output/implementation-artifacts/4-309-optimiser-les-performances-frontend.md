---
story_id: ST-309
sprint_id: 4
sprint_name: "Sprint 4 - Interface Utilisateur"
epic_id: EPIC-4
epic_name: "Frontend (Interface Utilisateur)"
priority: high
status: in-progress
assignee: "Mistral Vibe"
baseline_commit: "68dfaef68dfa21e4eaa1316b98f4a83bf4264d922e032e5"
tags:
  - frontend
  - performance
  - optimization
  - react-query
  - lazy-loading
  - lighthouse
  - bundle-analyzer
dependencies:
  - ST-303
  - ST-307
  - ST-308
related_artifacts:
  - _bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md
  - _bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md
  - _bmad-output/implementation-artifacts/sprint-status.yaml
---

# Story 4.309: Optimiser les Performances Frontend

Status: in-progress

## Story

En tant que **développeur frontend**,
Je veux **une interface réactive et performante**,
Afin d'**offrir une bonne expérience utilisateur**.

---

## Acceptance Criteria

### 🚀 Performance de Chargement

1. **Chargement paresseux des composants** :
   - Tous les composants lourds (MarkdownRenderer, CodeBlock, ExportButton) sont chargés dynamiquement
   - Utilisation de `next/dynamic` avec `loading={() => <Spinner />}`
   - Pas de blocage du rendu initial

2. **Cache des requêtes API** :
   - Implémentation de React Query ou SWR pour le caching
   - Les conversations sont cachées et réutilisées
   - Les messages ne sont pas re-fetchés inutilement
   - Cache invalidé correctement lors des mises à jour

3. **Optimisation des images** :
   - Toutes les images utilisent `next/image` avec optimisation automatique
   - Tailles adaptatives selon le viewport
   - Format WebP pour les navigateurs supportés

### 📊 Métriques de Performance

4. **Bundle Size** :
   - Bundle principal < 5MB (mesuré avec `@next/bundle-analyzer`)
   - Bundle des pages critiques < 1MB
   - Pas de dépendances dupliquées

5. **Lighthouse Score** :
   - Score global > 80
   - Performance > 80
   - Accessibilité > 90 (déjà conforme avec ST-307)
   - SEO > 80
   - Best Practices > 80

6. **Time to Interactive** :
   - TTI < 3.5 secondes sur mobile (3G)
   - TTI < 1.5 secondes sur desktop

7. **First Contentful Paint** :
   - FCP < 2.0 secondes sur mobile
   - FCP < 1.0 secondes sur desktop

### 🔧 Optimisations Techniques

8. **Code Splitting** :
   - Séparation du code par route
   - Les dépendances lourdes (highlight.js, react-markdown) sont chargées à la demande

9. **Pré-chargement** :
   - Pré-chargement des assets critiques (fonts, CSS)
   - Pré-connexion aux API externes

10. **Minification et Compression** :
    - Minification du CSS et JavaScript
    - Compression Gzip/Brotli activée

---

## Tasks / Subtasks

### Task 0 - Analyse de Performance Initiale
- [x] Exécuter `next build` et analyser la sortie (compilation réussie, erreurs TypeScript pré-existantes identifiées)
- [x] Configurer `next.config.js` avec bundle-analyzer
- [x] Créer `BUNDLE_ANALYSIS.md` avec analyse initiale
- [ ] Mesurer le bundle size actuel avec `ANALYZE=true npm run build` (bloqué par erreurs TS)
- [ ] Exécuter Lighthouse audit sur la page de chat (à faire après build)
- [ ] Identifier les principaux goulots d'étranglement (documenté dans BUNDLE_ANALYSIS.md)
- [ ] Documenter les métriques de base (avant optimisation)

### Task 1 - Configuration de React Query ✅ DONE
- [x] Installer `@tanstack/react-query` : déjà installé
- [x] Créer `src/providers/QueryClientProvider.tsx` pour envelopper l'application
- [x] Configurer le QueryClient avec les options par défaut (staleTime: 5min, gcTime: 10min)
- [x] Ajouter le provider dans `src/app/layout.tsx`
- [x] Créer `src/lib/api/queries.ts` avec hooks personnalisés
- [x] Créer des hooks : `useConversationsQuery`, `useConversationQuery`, `useMessagesQuery`, `useSendMessageMutation`, etc.
- [x] Configurer le cache time (5 minutes pour les conversations, 1 minute pour les messages)
- [x] Implémenter la gestion des erreurs globales

### Task 2 - Implémentation du Lazy Loading ✅ DONE
- [x] Identifier les composants lourds à charger paresseusement (MarkdownRenderer, CodeBlock, ExportButton, CopyConversationButton)
- [x] Créer `src/components/common/LoadingSpinner.tsx` pour le fallback
- [x] Créer `src/components/common/index.ts` (barrel export)
- [x] Charger dynamiquement `MarkdownRenderer` dans `ChatMessage.tsx` avec Suspense
- [x] Charger dynamiquement `ExportButton` dans `ChatMessage.tsx`
- [x] Charger dynamiquement `CopyConversationButton` dans `ConversationHeader.tsx`
- [x] Vérifier qu'aucun composant critique n'est lazy-loaded (pour éviter le FOUC)

### Task 3 - Optimisation des Images
- [ ] Remplacer toutes les `<img>` par `<Image />` de Next.js
- [x] Configurer `next.config.js` pour l'optimisation des images
- [x] Ajouter les domaines autorisés pour les images externes (Supabase)
- [x] Configurer les tailles et qualités adaptatives
- [x] Vérifier le support WebP

### Task 4 - Analyse du Bundle
- [ ] Installer `@next/bundle-analyzer` : `npm install --save-dev @next/bundle-analyzer`
- [ ] Configurer dans `next.config.js` :
  ```javascript
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  })
  ```
- [ ] Exécuter `ANALYZE=true npm run build`
- [ ] Identifier les dépendances les plus lourdes
- [ ] Documenter les résultats dans `BUNDLE_ANALYSIS.md`

### Task 5 - Optimisation du Code
- [ ] Supprimer les dépendances inutilisées (`npm prune`)
- [ ] Remplacer les imports lourds par des imports dynamiques
- [ ] Optimiser les treeshaking (vérifier les sideEffects dans package.json)
- [ ] Minifier les assets statiques

### Task 6 - Optimisation des Requêtes API
- [ ] Implémenter la pagination pour les conversations longues
- [ ] Ajouter le debounce sur la recherche
- [ ] Optimiser les payloads (ne pas envoyer de données inutiles)
- [ ] Implémenter la compression des réponses

### Task 7 - Tests de Performance
- [ ] Créer des tests Lighthouse automatisés
- [ ] Configurer des alerts si les scores descendent sous 80
- [ ] Tester sur différents devices (mobile, tablette, desktop)
- [ ] Tester sur différentes connections (3G, 4G, WiFi)

### Task 8 - Documentation
- [ ] Créer `PERFORMANCE_OPTIMIZATION.md` avec :
  - Les optimisations appliquées
  - Les métriques avant/après
  - Les bonnes pratiques à suivre
  - Les outils utilisés
- [ ] Mettre à jour le README principal

---

## Dev Notes

### Architecture Frontend

**Pattern de fichiers :**
```
src/
├── providers/
│   └── QueryClientProvider.tsx          # NOUVEAU : Provider React Query
├── components/
│   ├── common/
│   │   └── LoadingSpinner.tsx           # NOUVEAU : Spinner de chargement
│   └── Chat/
│       ├── ChatMessage.tsx              # MODIFIER : Lazy loading de MarkdownRenderer
├── lib/
│   ├── api/
│   │   └── queries.ts                   # NOUVEAU : Hooks React Query personnalisés
│   └── utils/
│       └── performance.ts               # NOUVEAU : Utilitaires de performance
└── app/
    └── layout.tsx                       # MODIFIER : Ajouter QueryClientProvider
```

### Dépendances sur ST-303
- **Composant `ChatMessage`** : ST-303 a créé la structure de base. ST-309 **modifie** le chargement des composants enfants (MarkdownRenderer) pour utiliser le lazy loading
- **Types** : Utiliser les types existants de `src/types/`

### Dépendances sur ST-307
- **MarkdownRenderer** : ST-307 a créé ce composant lourd. ST-309 **l'optimise** en le chargeant dynamiquement
- **CodeBlock** : Même optimisation que MarkdownRenderer
- **highlight.js** : Déjà chargé, mais ST-309 vérifie qu'il est chargé efficacement

### Dépendances sur ST-308
- **ExportButton** et **CopyConversationButton** : Composants lourds qui doivent être lazy-loaded

### Intégration avec React Query
- **Version** : `@tanstack/react-query@^5.0.0` (dernière version stable)
- **Configuration** : QueryClient avec cache par défaut
- **Patterns** :
  ```typescript
  // Exemple de hook personnalisé
  export function useConversationsQuery(userId: string) {
    return useQuery({
      queryKey: ['conversations', userId],
      queryFn: () => fetchConversations(userId),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    })
  }
  ```

### Configuration TypeScript
- Ajouter les types pour React Query dans tsconfig.json si nécessaire

### Configuration Next.js
- **Bundle Analyzer** : `
  ```javascript
  // next.config.js
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
    openAnalyzer: true,
  })
  
  module.exports = withBundleAnalyzer({/* config existant */})
  ```

### Configuration Lighthouse
- **CI Integration** : Ajouter Lighthouse dans les workflows GitHub Actions
- **Thresholds** : Définir des seuils minimums dans `.lighthouserc.js`
  ```javascript
  module.exports = {
    ci: {
      collect: {
        url: ['http://localhost:3000/chat'],
        startServerCommand: 'npm run dev',
      },
      assert: {
        preset: 'lighthouse:recommended',
        assertions: {
          'performance': ['error', {minScore: 0.8}],
          'accessibility': ['error', {minScore: 0.9}],
        },
      },
    },
  }
  ```

### Performance
- **Budget Bundle** : 5MB max pour le bundle principal
- **Cache Strategy** : Cache-first pour les données statiques, network-first pour les données en temps réel
- **Lazy Loading** : Tous les composants sous le fold doivent être lazy-loaded

### Design System
- **Loading States** : Utiliser les tokens du design system pour les spinners
  - Couleur primaire : corail #EF6C4D
  - Couleur surface : encre #1E2A3B

### Contrat Backend
- Les endpoints API doivent supporter la pagination
- Les réponses doivent être compressées (gzip par défaut)
- ST-309 **ne modifie pas** le backend, seulement l'optimisation frontend

### Libraries à installer
```bash
npm install @tanstack/react-query@^5.0.0
npm install --save-dev @next/bundle-analyzer
npm install --save-dev lighthouse
```

### Tests
- Utiliser Lighthouse CI pour les tests de performance
- Tester avec `@testing-library/react` pour les composants lazy-loaded
- Vérifier que le lazy loading ne casse pas l'accessibilité

---

## References

- [Source: architecture.md - Frontend Stack](_bmad-output/planning-artifacts/architecture-nexiamind-ai/architecture.md:80-132)
- [Source: epics-and-stories.md - ST-309](_bmad-output/planning-artifacts/epics-and-stories-nexiamind-ai/epics-and-stories.md:879-900)
- [Source: sprint-status.yaml](_bmad-output/implementation-artifacts/sprint-status.yaml:89)
- [Source: ST-307 - Markdown Support](_bmad-output/implementation-artifacts/4-307-ajouter-le-support-du-markdown.md)
- [Source: ST-308 - Export Responses](_bmad-output/implementation-artifacts/4-308-implementer-l-export-des-reponses.md)

---

## Dev Agent Record

### Implementation Plan
- **Approche** : Optimisation progressive avec mesure avant/après
- **Décision clé** : Utilisation de React Query pour la gestion du cache (plus flexible que SWR)
- **Pattern** : Lazy loading + React Query + Bundle optimization
- **Sécurité** : Aucune vulnérabilité introduite par les optimisations
- **Accessibilité** : Les optimisations ne doivent pas dégrader l'accessibilité

### Debug Log
- **Task 0**: Build bloquée par erreurs TypeScript pré-existantes dans `scripts/test-pdf-manual.ts` et `src/app/api/admin/stats/route.ts` - corrigé `test-pdf-manual.ts` ligne 147 (guard sur pageCount)
- **Task 0**: bundle-analyzer configuré dans next.config.js, BUNDLE_ANALYSIS.md créé
- **Task 1**: @tanstack/react-query déjà installé, QueryClientProvider créé avec staleTime: 5min, gcTime: 10min
- **Task 1**: 11 hooks React Query créés dans queries.ts (conversations, conversation, messages, sendMessage, etc.)
- **Task 2**: LoadingSpinner créé avec 3 variantes (default, MarkdownLoadingSpinner, ButtonLoadingSpinner)
- **Task 2**: Lazy loading appliqué à MarkdownRenderer, ExportButton, CopyConversationButton
- **Task 2**: ssr: false utilisé pour éviter les erreurs de hydration avec Next.js 16
- **Task 3**: Optimisation des images configurée dans next.config.js (WebP/AVIF, deviceSizes, imageSizes)

### Completion Notes
- **Task 1 (100% complété)**: React Query intégré avec QueryClientProvider et 11 hooks personnalisés
- **Task 2 (100% complété)**: Lazy loading implémenté pour tous les composants lourds identifiés
- **Task 3 (80% complété)**: Configuration images terminée, reste le remplacement des <img> par <Image />
- **Task 0 (60% complété)**: Analyse initiale documentée, build bloquée par erreurs TS externes
- **Prochaines étapes**: Terminer Task 0 (build + Lighthouse), Task 3 (remplacement <img>), puis Tasks 4-8

---

## File List

### Nouveaux Fichiers Créés ✅
- `src/providers/QueryClientProvider.tsx` - Provider React Query
- `src/providers/index.ts` - Barrel export des providers
- `src/components/common/LoadingSpinner.tsx` - Composant de chargement avec variantes
- `src/components/common/index.ts` - Barrel export des composants communs
- `src/lib/api/queries.ts` - Hooks React Query personnalisés (11 hooks)
- `src/lib/utils/performance.ts` - Utilitaires de performance
- `.lighthouserc.js` - Configuration Lighthouse CI
- `BUNDLE_ANALYSIS.md` - Rapport d'analyse du bundle

### Fichiers Modifiés ✅
- `src/app/layout.tsx` - Ajout de QueryClientProvider autour de AuthProvider
- `src/components/Chat/ChatMessage.tsx` - Lazy loading de MarkdownRenderer et ExportButton
- `src/components/Conversation/ConversationHeader.tsx` - Lazy loading de CopyConversationButton
- `src/lib/api/index.ts` - Ajout des exports pour queries.ts
- `next.config.js` - Configuration de bundle-analyzer et optimisation des images

### Fichiers à Créer/Modifier (Restants)
- `PERFORMANCE_OPTIMIZATION.md` - Documentation des optimisations
- Remplacer `<img>` par `<Image />` dans les composants existants

---

## Change Log

| Date | Changement | Auteur | Type |
|------|------------|--------|------|
| 2026-07-11 | Création de la story ST-309 | Mistral Vibe | NEW |
| 2026-07-11 | Définition des tâches et critères | Mistral Vibe | NEW |
| 2026-07-11 | Task 1: Configuration React Query (QueryClientProvider, 11 hooks) | Mistral Vibe | NEW |
| 2026-07-11 | Task 1: Intégration QueryClientProvider dans layout.tsx | Mistral Vibe | MOD |
| 2026-07-11 | Task 2: Création LoadingSpinner avec variantes | Mistral Vibe | NEW |
| 2026-07-11 | Task 2: Lazy loading MarkdownRenderer dans ChatMessage.tsx | Mistral Vibe | MOD |
| 2026-07-11 | Task 2: Lazy loading ExportButton dans ChatMessage.tsx | Mistral Vibe | MOD |
| 2026-07-11 | Task 2: Lazy loading CopyConversationButton dans ConversationHeader.tsx | Mistral Vibe | MOD |
| 2026-07-11 | Task 3: Optimisation images dans next.config.js | Mistral Vibe | MOD |
| 2026-07-11 | Task 0: Configuration bundle-analyzer | Mistral Vibe | MOD |
| 2026-07-11 | Création BUNDLE_ANALYSIS.md et .lighthouserc.js | Mistral Vibe | NEW |

---

## Status

**Status:** ready-for-dev
**Story prête pour l'implémentation !**

**Prochaines étapes :**
1. Exécuter `bmad-dev-story` avec cette story
2. Installer les dépendances : `npm install @tanstack/react-query @next/bundle-analyzer`
3. Exécuter l'analyse initiale : `ANALYZE=true npm run build`
4. Passer en `in-progress` quand le développement commence

---
*Story generated from epics-and-stories.md using bmad-create-story workflow*
*Dependencies: ST-303 (done), ST-307 (done), ST-308 (done)*
*Ready for Dev Agent implementation*
