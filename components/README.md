# Composants NexiaMind AI

Ce dossier contient les composants React réutilisables pour l'application NexiaMind AI.

## Structure

```
components/
├── Navbar/              # Barre de navigation principale
│   ├── Navbar.tsx       # Composant principal
│   ├── index.tsx        # Export
│   └── __tests__/       # Tests unitaires
│
├── Footer/              # Pied de page principal
│   ├── Footer.tsx       # Composant principal
│   ├── index.tsx        # Export
│   └── __tests__/       # Tests unitaires
│
└── RefreshButton/       # Bouton Rafraîchir (ST-205)
    ├── RefreshButton.tsx
    └── __tests__/
```

## Utilisation

### Navbar

```typescript
import { Navbar } from '../components/Navbar';

function MyPage() {
  return (
    <>
      <Navbar />
      {/* Contenu de la page */}
    </>
  );
}
```

**Fonctionnalités:**
- Logo avec lien vers l'accueil
- Menu de navigation (Accueil, Recherche, Documents, Admin)
- Intégration du bouton Rafraîchir (ST-205)
- Design responsive
- Support thème sombre/clair

### Footer

```typescript
import { Footer } from '../components/Footer';

function MyPage() {
  return (
    <>
      {/* Contenu de la page */}
      <Footer />
    </>
  );
}
```

**Fonctionnalités:**
- Informations sur l'application
- Liens utiles (Politique de confidentialité, Conditions, Contact)
- Section ressources (Documentation, API)
- Informations légales et copyright
- Design responsive en grille
- Support thème sombre/clair

## Tests

Pour exécuter les tests des composants :

```bash
# Tests du Navbar
npm test components/Navbar/__tests__/Navbar.test.tsx

# Tests du Footer
npm test components/Footer/__tests__/Footer.test.tsx

# Tous les tests
npm test
```

## Conventions

- **Nommage** : PascalCase pour les composants, camelCase pour les variables
- **Typage** : TypeScript strict avec interfaces
- **Styling** : Tailwind CSS pour le styling
- **Accessibilité** : Respect des standards WCAG 2.1 AA
- **Documentation** : JSDoc pour tous les composants et fonctions

## Intégration avec le Layout

Les composants Navbar et Footer sont automatiquement intégrés dans le layout principal (`src/app/layout.tsx`).

```typescript
// src/app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

## Dépendances

- Next.js 14+
- React 18+
- TypeScript 5+
- Tailwind CSS 3.4+

## Notes de Version

### ST-301 - Création initiale (03/07/2026)
- Ajout du composant Navbar avec intégration RefreshButton
- Ajout du composant Footer avec liens légaux
- Configuration Tailwind pour le support dark mode
- Tests unitaires complets (24 tests)
- Documentation JSDoc complète
