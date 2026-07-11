# Markdown Renderer Component

> **Fait partie de ST-307: Ajouter le Support du Markdown**

Composant React pour rendre le contenu Markdown avec support complet pour les réponses IA.

## Installation

Les dépendances sont déjà listées dans `package.json` (voir architecture.md). Si elles ne sont pas installées :

```bash
npm install react-markdown remark-gfm highlight.js
npm install --save-dev @types/react-markdown @types/highlight.js
```

## Utilisation

### Utilisation de base

```typescript
import { MarkdownRenderer } from '@/components/Markdown';

function MyComponent() {
  return (
    <MarkdownRenderer content="**Hello** _world_!" />
  );
}
```

### Avec une classe personnalisée

```typescript
<MarkdownRenderer 
  content="# Titre\n\nContenu en markdown"
  className="custom-markdown"
/>
```

## Fonctionnalités Supportées

### Textes
- **Gras** : `**gras**` ou `__gras__`
- **Italique** : `*italique*` ou `_italique_`
- **Barré** : `~~barré~~`
- **Citations** : `> texte de citation`

### Listes
- Listes non ordonnées : `- item` ou `* item`
- Listes ordonnées : `1. item`
- Listes de tâches : `- [x] tâche complète`

### Code
- Code inline : `` `code` ``
- Blocs de code : ```` ```javascript
const x = 1;
``` ````
- Coloration syntaxique automatique
- Bouton "Copier" avec feedback visuel

### Tableaux
```markdown
| En-tête 1 | En-tête 2 |
|----------|----------|
| Cellule 1 | Cellule 2 |
```

### Liens
```markdown
[Texte du lien](https://example.com)
```
*Les liens s'ouvrent dans un nouvel onglet avec `target="_blank" rel="noopener noreferrer"` pour la sécurité*

### Images
```markdown
![Alt text](https://example.com/image.png)
```

### Titres
```markdown
# Titre 1
## Titre 2
### Titre 3
```

### Séparateurs
```markdown
---
```

## Langages Supportés pour la Coloration Syntaxique

- JavaScript / TypeScript
- Python
- SQL
- Bash / Shell
- JSON
- YAML
- XML / HTML
- CSS / SCSS / Less
- Java
- C / C++
- C#
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Dart
- Markdown
- Diff
- Dockerfile
- Nginx
- Makefile
- Vim

## Structure des Fichiers

```
src/components/Markdown/
├── index.ts              # Exports principaux
├── MarkdownRenderer.tsx  # Composant principal de rendu
├── CodeBlock.tsx         # Composant pour les blocs de code
├── MarkdownErrorBoundary.tsx # Boundary d'erreur
├── Markdown.module.css  # Styles CSS
└── README.md            # Documentation (ce fichier)

src/lib/markdown/
├── index.ts              # Barrel export
└── highlightConfig.ts    # Configuration de highlight.js
```

## Composants Exportés

### MarkdownRenderer
Composant principal pour rendre le contenu Markdown.

**Props :**
- `content: string` (requis) - Contenu Markdown à rendre
- `className?: string` - Classe CSS supplémentaire

### CodeBlock
Composant pour afficher les blocs de code (utilisé interne par MarkdownRenderer).

**Props :**
- `language: string` - Langage du code
- `code: string` - Code à afficher
- `highlightedHtml?: string` - HTML déjà highlighté
- `lineCount?: number` - Nombre de lignes
- `showCopyButton?: boolean` - Afficher le bouton Copier (défaut: true)
- `showLineNumbers?: boolean` - Afficher la numérotation des lignes pour >5 lignes (défaut: true)

### MarkdownErrorBoundary
Boundary d'erreur pour capturer les erreurs de rendu Markdown.

**Props :**
- `children: React.ReactNode` (requis)
- `fallback?: React.ReactNode` - Fallback personnalisé
- `onError?: (error: Error, errorInfo: React.ErrorInfo) => void` - Callback d'erreur

### withMarkdownErrorBoundary
HOC pour envelopper un composant avec MarkdownErrorBoundary.

```typescript
import { withMarkdownErrorBoundary } from '@/components/Markdown';

const SafeComponent = withMarkdownErrorBoundary(MyComponent);
```

## Sécurité

- ✅ Tous les liens externes ont `target="_blank" rel="noopener noreferrer"`
- ✅ Le HTML généré est safe (react-markdown échappe par défaut)
- ✅ Pas d'utilisation de `dangerouslySetInnerHTML` sans sanitization
- ✅ Fallback graceux en cas d'erreur

## Accessibilité

- ✅ Les blocs de code ont `aria-label` avec le langage
- ✅ Les tableaux ont `scope="col"` sur les en-têtes
- ✅ Les liens ont un texte descriptif
- ✅ Respecte `prefers-reduced-motion`
- ✅ Contraste des couleurs conforme WCAG 2.1 AA

## Performance

- ✅ Lazy loading possible avec `React.lazy`
- ✅ Memoization des composants
- ✅ Hydratation progressive (ne bloque pas le rendu initial)

## Personnalisation

### Ajouter un langage à highlight.js

Modifier `src/lib/markdown/highlightConfig.ts` :

```typescript
const SUPPORTED_LANGUAGES = [
  // ... langages existants
  'nouveau-langage',
];
```

### Personnaliser les styles

Modifier `src/components/Markdown/Markdown.module.css`. Les tokens de couleur du design system sont :
- Primaire (corail) : `#EF6C4D`
- Surface : `#1E2A3B`
- Border : `#4A5568`
- Text : `#E2E8F0`
- Text mute : `#A0AEC0`

## Exemples

### Exemple complet

```typescript
import { MarkdownRenderer } from '@/components/Markdown';

const content = `
# Bienvenue sur NexiaMind AI

Voici un exemple de réponse avec du **Markdown** :

## Fonctionnalités
- Rendu des listes
- Coloration syntaxique des blocs de code
- Support des tableaux

## Exemple de code

\`\`\`javascript
function hello() {
  return 'Hello, World!';
}
\`\`\`

## Tableau

| Fonctionnalité | Statut |
|--------------|--------|
| Markdown | ✅ |
| Code | ✅ |
| Tableaux | ✅ |
`;

function App() {
  return <MarkdownRenderer content={content} />;
}
```

### Avec gestion d'erreur

```typescript
import { MarkdownErrorBoundary, MarkdownRenderer } from '@/components/Markdown';

function SafeMarkdown({ content }: { content: string }) {
  return (
    <MarkdownErrorBoundary>
      <MarkdownRenderer content={content} />
    </MarkdownErrorBoundary>
  );
}
```

## Tests

Les tests unitaires se trouvent dans `src/components/Markdown/__tests__/` :
- `MarkdownRenderer.test.tsx`
- `CodeBlock.test.tsx`
- `MarkdownErrorBoundary.test.tsx`

Pour exécuter les tests :

```bash
npm test -- --testPathPattern="Markdown"
```

## Intégration avec ST-303 et ST-306

- **ST-303** : Ce composant est intégré dans `ChatMessage.tsx` pour rendre les messages de l'assistant
- **ST-306** : Fonctionne avec le mode conversation, le contenu est déjà en Markdown depuis le backend
- **ST-305** : Les citations de sources sont affichées sous le message Markdown

## Problèmes Connus

- La coloration syntaxique nécessite que le langage soit spécifié dans le bloc de code (ex: ```javascript)
- Sans langage spécifié, le code est affiché sans coloration (langage par défaut: text)
- Les très grands blocs de code (>1000 lignes) peuvent impacter les performances

## Contribution

Pour ajouter une nouvelle fonctionnalité :
1. Créer un test d'abord (TDD)
2. Implémenter la fonctionnalité
3. Mettre à jour la documentation
4. Vérifier que tous les tests passent

## License

Fait partie de NexiaMind AI - Tous droits réservés.
