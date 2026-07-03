# Documentation du Layout Principal - ST-301

## Aperçu

Le layout principal de NexiaMind AI fournit une structure cohérente pour toutes les pages de l'application. Il inclut :

- **Navbar** : Barre de navigation avec logo et menu
- **Zone de contenu principale** : Espace pour le contenu spécifique à chaque page
- **Footer** : Pied de page avec informations légales et liens utiles

## Structure

```
┌─────────────────────────────────────┐
│               Navbar                  │
├─────────────────────────────────────┤
│                                     │
│          Zone de Contenu Principal    │
│                                     │
├─────────────────────────────────────┤
│               Footer                  │
└─────────────────────────────────────┘
```

## Fichiers Principaux

### `src/app/layout.tsx`

```typescript
import { Navbar } from '../../../components/Navbar';
import { Footer } from '../../../components/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
```

**Caractéristiques clés:**
- **Langue** : Français (`lang="fr"`)
- **Hydratation** : `suppressHydrationWarning` pour éviter les avertissements
- **Structure** : Flexbox pour un layout fluide
- **Conteneur** : `container mx-auto` pour un contenu centré
- **Espacement** : Padding horizontal et vertical

## Composants Intégrés

### Navbar

**Fonctionnalités:**
- Logo NexiaMind AI avec lien vers l'accueil
- Menu de navigation (Accueil, Recherche, Documents, Admin)
- Bouton Rafraîchir (intégration ST-205)
- Design responsive (mobile, tablette, desktop)
- Support thème sombre/clair

**Structure:**
```
┌─────────────────────────────────────┐
│ Logo          Menu          Refresh  │
└─────────────────────────────────────┘
```

### Footer

**Fonctionnalités:**
- Informations sur l'application
- Liens utiles (Politique de confidentialité, Conditions, Contact)
- Section ressources (Documentation, API)
- Informations légales et copyright
- Grille responsive (1 colonne mobile → 4 colonnes desktop)

**Structure:**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Logo & Info  │ Liens Utiles │ Ressources   │ Légal        │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Responsive Design

### Points de rupture

- **Mobile** : `< 768px` (md:)
  - Navbar : Menu caché, logo centré
  - Footer : 1 colonne, empilé verticalement
  - Contenu : Pleine largeur avec padding

- **Tablette** : `768px - 1024px` (md: to lg:)
  - Navbar : Menu visible, logo à gauche
  - Footer : 2 colonnes
  - Contenu : Largeur limitée

- **Desktop** : `> 1024px` (lg:)
  - Navbar : Menu complet avec tous les éléments
  - Footer : 4 colonnes
  - Contenu : Largeur maximale (1280px)

## Thème Sombre/Clair

Le layout supporte les deux thèmes grâce à Tailwind CSS :

```javascript
// tailwind.config.ts
const config: Config = {
  darkMode: "class", // Active le support du thème sombre
  // ...
};
```

**Utilisation:**
```html
<!-- Thème clair (par défaut) -->
<html class="light">

<!-- Thème sombre -->
<html class="dark">
```

## Accessibilité

**Standards respectés:** WCAG 2.1 AA

**Fonctionnalités d'accessibilité:**
- Balises sémantiques (`<nav>`, `<main>`, `<footer>`)
- Contraste suffisant (texte/arrière-plan)
- Navigation au clavier
- Texte alternatif pour les images
- Structure logique du DOM

## SEO

**Métadonnées configurées:**
```typescript
export const metadata: Metadata = {
  title: "NexiaMind AI - Recherche Intelligente",
  description: "Système RAG pour la recherche et l'analyse de documents",
};
```

**Bonnes pratiques:**
- Titres de page descriptifs
- Meta description optimisée
- Langue spécifiée (`lang="fr"`)
- Structure sémantique HTML5

## Performance

**Optimisations implémentées:**
- SVG logo optimisé (410 bytes)
- Chargement différé des images
- CSS efficace avec Tailwind
- Minimal re-renders
- Bundle size optimisé

**Cibles de performance:**
- Temps de rendu : < 100ms
- Taille du bundle : < 20KB (minifié)
- Score Lighthouse : > 90

## Intégration avec d'autres Stories

### ST-205 (Bouton Rafraîchir)
- **Intégration** : Le bouton est inclus dans la Navbar
- **Fonctionnalité** : Permet de rafraîchir les sources de données
- **Emplacement** : Côté droit de la barre de navigation

### ST-302 (Authentification)
- **Préparation** : Espace réservé pour le menu utilisateur
- **Emplacement** : À côté du bouton Rafraîchir
- **Intégration future** : Ajout du composant UserMenu

## Tests

### Couverture de Test

**24 tests unitaires et d'intégration:**

- **Navbar** : 8 tests
  - Rendu du logo
  - Liens de navigation
  - Bouton Rafraîchir
  - Responsive design
  - Thème sombre
  - Contraste
  - Accessibilité
  - Gestion des erreurs

- **Footer** : 8 tests
  - Informations légales
  - Liens utiles
  - Année courante
  - Responsive design
  - Accessibilité
  - Thème sombre
  - Contraste
  - Gestion des erreurs

- **Layout** : 8 tests
  - Rendu des enfants
  - Intégration Navbar/Footer
  - Métadonnées
  - Responsive design
  - Thème sombre
  - Contraste
  - Accessibilité
  - Gestion des erreurs

### Exécution des Tests

```bash
# Tests spécifiques
npm test components/Navbar/__tests__/Navbar.test.tsx
npm test components/Footer/__tests__/Footer.test.tsx
npm test src/app/__tests__/layout.test.tsx

# Tous les tests
npm test
```

## Utilisation dans les Pages

### Page Basique

```typescript
// src/app/page.tsx
export default function Home() {
  return (
    <div>
      <h1>Bienvenue sur NexiaMind AI</h1>
      <p>Votre assistant de recherche intelligent.</p>
    </div>
  );
}

// Le layout est automatiquement appliqué
```

### Page avec Layout Personnalisé

```typescript
// src/app/admin/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navbar inclus automatiquement */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          {children}
        </div>
      </div>
      {/* Footer inclus automatiquement */}
    </div>
  );
}
```

## Bonnes Pratiques

### Structure des Pages

```typescript
// ✅ Bonne pratique
export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Titre</h1>
      <p className="text-gray-600">Contenu...</p>
    </div>
  );
}

// ❌ À éviter
export default function Page() {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Titre</h1>
    </div>
  );
}
```

### Utilisation des Composants

```typescript
// ✅ Utilisation correcte
import { Navbar, Footer } from '../../components';

function CustomLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

// ❌ À éviter - Ne pas dupliquer les composants
function BadLayout({ children }) {
  return (
    <>
      <div className="bg-white border-b">...</div> {/* Navbar dupliqué */}
      {children}
      <div className="bg-white border-t">...</div> {/* Footer dupliqué */}
    </>
  );
}
```

## Dépannage

### Problèmes Courants

**1. Le layout ne s'affiche pas**
- Vérifier que le fichier est nommé `layout.tsx` (pas `Layout.tsx`)
- Vérifier que le fichier est dans le dossier `app/`
- Vérifier les imports des composants

**2. Problèmes de styling**
- Vérifier que Tailwind est correctement configuré
- Vérifier que les classes sont correctement appliquées
- Vérifier les conflits de CSS

**3. Le bouton Rafraîchir ne fonctionne pas**
- Vérifier que le composant RefreshButton est correctement importé
- Vérifier que l'API `/api/chat/refresh` est disponible
- Vérifier les permissions CORS

### Debugging

```typescript
// Ajouter des logs de debug
console.log('Navbar rendered', { component: 'Navbar' });

// Vérifier les props
console.log('Layout props', { children: typeof children });

// Vérifier le thème
console.log('Current theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
```

## Évolutions Futures

### Améliorations Planifiées

1. **Thème dynamique** : Permettre à l'utilisateur de basculer entre thème sombre et clair
2. **Internationalisation** : Support multi-langues (français, anglais, espagnol)
3. **Menu mobile** : Hamburger menu pour les écrans mobiles
4. **Notifications** : Système de notifications dans la navbar
5. **Recherche globale** : Barre de recherche dans la navbar
6. **Analytics** : Suivi des clics sur les liens de navigation

### Intégrations Futures

- **ST-302** : Menu utilisateur avec authentification
- **ST-303** : Intégration avec l'interface de chat
- **ST-304** : Filtres de recherche dans la navbar
- **ST-307** : Support du markdown dans le footer (pour les liens)

## Documentation Complémentaire

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Standards WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibilité Web](https://developer.mozilla.org/fr/docs/Web/Accessibility)

## Support

Pour toute question ou problème concernant le layout :

1. Vérifier cette documentation
2. Consulter les tests unitaires
3. Vérifier les exemples dans le dossier `src/app/`
4. Contacter l'équipe frontend si le problème persiste

---

*Documentation générée pour ST-301 - Layout Principal © 2026 NexiaMind AI*