# Guide de Test - ST-301 Layout Principal

## 📋 Configuration des Tests

### Dépendances de Test

Le projet utilise **Vitest** pour les tests unitaires et d'intégration.

**Dependencies installées:**
- `vitest` - Framework de test (déjà installé)
- `jsdom` - Environnement de test DOM (déjà installé via vitest)
- `@testing-library/react` - Utilitaires de test React (à installer)
- `@testing-library/jest-dom` - Assertions DOM (à installer)

### Installation des Dependencies Manquantes

Pour installer les dependencies manquantes, exécutez:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

**Note:** Si vous rencontrez des erreurs de permissions, vous pouvez:
1. Utiliser `sudo` (non recommandé)
2. Corriger les permissions du dossier node_modules
3. Attendre que les permissions soient résolues

---

## 🧪 Exécution des Tests

### Tests avec Vitest

**Exécuter tous les tests:**
```bash
npm test
# ou
npx vitest
```

**Exécuter les tests du layout:**
```bash
npx vitest src/app/__tests__/layout.test.tsx
```

**Exécuter les tests du Navbar:**
```bash
npx vitest components/Navbar/__tests__/Navbar.test.tsx
```

**Exécuter les tests du Footer:**
```bash
npx vitest components/Footer/__tests__/Footer.test.tsx
```

**Mode watch (développement):**
```bash
npx vitest watch
```

**Tests avec couverture:**
```bash
npx vitest run --coverage
```

---

## 📁 Structure des Tests

```
project/
├── src/
│   ├── app/
│   │   ├── __tests__/
│   │   │   └── layout.test.tsx      # Tests d'intégration du layout
│   │
├── components/
│   ├── Navbar/
│   │   ├── __tests__/
│   │   │   └── Navbar.test.tsx     # Tests unitaires Navbar
│   │
│   ├── Footer/
│   │   ├── __tests__/
│   │   │   └── Footer.test.tsx     # Tests unitaires Footer
│   │
│   └── RefreshButton/
│       ├── __tests__/
│       │   └── RefreshButton.test.tsx  # Tests existants
```

---

## 🔧 Configuration

### Configuration Vitest

Le projet utilise la configuration par défaut de Vitest. Pour une configuration personnalisée, créez un fichier `vite.config.ts` ou `vitest.config.ts`.

**Configuration minimale recommandée:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './setupTests.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Fichier de Setup (Optionnel)

Créez un fichier `setupTests.ts` pour configurer l'environnement de test:

```typescript
// setupTests.ts
import '@testing-library/jest-dom/vitest';
```

---

## 📖 Tests Disponibles

### 1. Layout Tests (8 tests)

**Fichier:** `src/app/__tests__/layout.test.tsx`

Tests couverts:
- Rendu des enfants
- Intégration Navbar/Footer
- Métadonnées
- Responsive design
- Thème sombre
- Contraste suffisant
- Accessibilité
- Gestion des erreurs

### 2. Navbar Tests (8 tests)

**Fichier:** `components/Navbar/__tests__/Navbar.test.tsx`

Tests couverts:
- Rendu du logo
- Liens de navigation
- Bouton Rafraîchir
- Responsive design
- Thème sombre
- Contraste suffisant
- Accessibilité
- Gestion des erreurs

### 3. Footer Tests (8 tests)

**Fichier:** `components/Footer/__tests__/Footer.test.tsx`

Tests couverts:
- Informations légales
- Liens utiles
- Année courante dynamique
- Responsive design
- Accessibilité
- Thème sombre
- Contraste suffisant
- Gestion des erreurs

---

## 🚀 Exécution Alternative (sans installation)

Si vous ne pouvez pas installer les dependencies, vous pouvez:

### 1. Utiliser le script d'intégration

```bash
node test-layout-integration.js
```

Ce script vérifie:
- L'existence de tous les fichiers
- L'intégration des composants
- La syntaxe basique
- Les fonctionnalités clés

### 2. Vérification manuelle

Vous pouvez vérifier manuellement:

```javascript
// Dans un fichier temporaire ou console
const fs = require('fs');

// Vérifier que les fichiers existent
console.log('Layout:', fs.existsSync('src/app/layout.tsx'));
console.log('Navbar:', fs.existsSync('components/Navbar/Navbar.tsx'));
console.log('Footer:', fs.existsSync('components/Footer/Footer.tsx'));

// Vérifier le contenu
const layoutContent = fs.readFileSync('src/app/layout.tsx', 'utf8');
console.log('Intègre Navbar:', layoutContent.includes('Navbar'));
console.log('Intègre Footer:', layoutContent.includes('Footer'));
```

---

## 🐛 Dépannage

### Problème: "Cannot find module '@testing-library/react'"

**Solution:** Installez le module:
```bash
npm install --save-dev @testing-library/react
```

### Problème: "Error: EPERM: operation not permitted"

**Solution:** Corriger les permissions:
```bash
sudo chown -R $(whoami) node_modules/
# ou
npm install --no-optional
```

### Problème: "Vitest not found"

**Solution:** Installez Vitest:
```bash
npm install --save-dev vitest
```

### Problème: "JSX not supported"

**Solution:** Assurez-vous que votre fichier a l'extension `.tsx` et que `jsx` est configuré dans `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

---

## 📋 Checklist avant Exécution

- [ ] Node.js >= v18 (v20 recommandé pour Next.js 16)
- [ ] Dependencies installées (`npm install`)
- [ ] Dependencies de test installées
- [ ] Fichiers de configuration présents
- [ ] Environnement propre (pas de conflits)

---

## 🎯 Bonnes Pratiques

### Écrire des tests efficaces

```typescript
// ✅ Bonne pratique
describe('Component', () => {
  it('devrait faire quelque chose', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});

// ❌ À éviter
describe('Component', () => {
  it('devrait faire quelque chose', () => {
    // Test trop vague
    expect(true).toBe(true);
  });
});
```

### Organisation des tests

```
✅ Bonne structure:
component/
├── Component.tsx
└── __tests__/
    └── Component.test.tsx

❌ À éviter:
component/
├── Component.tsx
└── Component.test.tsx  # Mélangé avec le code source
```

---

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM](https://github.com/testing-library/jest-dom)
- [Next.js Testing](https://nextjs.org/docs/testing)

---

*Guide de test généré pour ST-301 - Layout Principal © 2026 NexiaMind AI*