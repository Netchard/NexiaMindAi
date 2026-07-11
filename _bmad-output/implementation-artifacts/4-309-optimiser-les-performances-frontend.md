---
story_id: ST-309
sprint_id: 4
sprint_name: "Sprint 4 - Interface Utilisateur"
epic_id: EPIC-4
epic_name: "Frontend (Interface Utilisateur)"
priority: high
status: ready-for-dev
assignee: ""
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

Status: ready-for-dev

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
- [ ] Exécuter `next build` et analyser la sortie
- [ ] Mesurer le bundle size actuel avec `npx @next/bundle-analyzer`
- [ ] Exécuter Lighthouse audit sur la page de chat
- [ ] Identifier les principaux goulots d'étranglement
- [ ] Documenter les métriques de base (avant optimisation)

### Task 1 - Configuration de React Query
- [ ] Installer `@tanstack/react-query` : `npm install @tanstack/react-query@^5.0.0`
- [ ] Créer `src/providers/QueryClientProvider.tsx` pour envelopper l'application
- [ ] Configurer le QueryClient avec les options par défaut
- [ ] Ajouter le provider dans `src/app/layout.tsx`
- [ ] Créer des hooks personnalisés : `useConversationsQuery`, `useMessagesQuery`
- [ ] Configurer le cache time (5 minutes pour les conversations, 1 minute pour les messages)
- [ ] Implémenter la gestion des erreurs globales

### Task 2 - Implémentation du Lazy Loading
- [ ] Identifier les composants lourds à charger paresseusement
- [ ] Créer `src/components/common/LoadingSpinner.tsx` pour le fallback
- [ ] Charger dynamiquement `MarkdownRenderer` dans `ChatMessage.tsx`
- [ ] Charger dynamiquement `CodeBlock` (déjà intégré dans MarkdownRenderer)
- [ ] Charger dynamiquement `ExportButton` et `CopyConversationButton`
- [ ] Vérifier qu'aucun composant critique n'est lazy-loaded (pour éviter le FOUC)

### Task 3 - Optimisation des Images
- [ ] Remplacer toutes les `<img>` par `<Image />` de Next.js
- [ ] Configurer `next.config.js` pour l'optimisation des images
- [ ] Ajouter les domaines autorisés pour les images externes
- [ ] Configurer les tailles et qualités adaptatives
- [ ] Vérifier le support WebP

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
- **To be populated during implementation**

### Completion Notes
- **To be populated during implementation**

---

## File List

### Nouveaux Fichiers à Créer
- `src/providers/QueryClientProvider.tsx` - Provider React Query
- `src/components/common/LoadingSpinner.tsx` - Composant de chargement
- `src/lib/api/queries.ts` - Hooks React Query personnalisés
- `src/lib/utils/performance.ts` - Utilitaires de performance
- `.lighthouserc.js` - Configuration Lighthouse
- `BUNDLE_ANALYSIS.md` - Rapport d'analyse du bundle
- `PERFORMANCE_OPTIMIZATION.md` - Documentation des optimisations

### Fichiers Modifiés
- `src/app/layout.tsx` - Ajout de QueryClientProvider
- `src/components/Chat/ChatMessage.tsx` - Lazy loading de MarkdownRenderer
- `next.config.js` - Configuration de bundle-analyzer
- `package.json` - Ajout des dépendances

---

## Change Log

| Date | Changement | Auteur | Type |
|------|------------|--------|------|
| 2026-07-11 | Création de la story ST-309 | Mistral Vibe | NEW |
| 2026-07-11 | Définition des tâches et critères | Mistral Vibe | NEW |

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
