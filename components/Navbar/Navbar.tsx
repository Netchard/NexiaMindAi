/**
 * Composant Navbar - Barre de navigation principale
 * 
 * Fait partie de ST-301 - Créer le Layout Principal
 * 
 * Ce composant fournit une barre de navigation responsive avec :
 * - Logo de l'application avec lien vers la page d'accueil
 * - Menu de navigation avec liens vers les principales sections
 * - Intégration du bouton Rafraîchir (ST-205)
 * - Support du thème sombre/clair
 * - Design responsive pour mobile, tablette et desktop
 * 
 * Utilisation:
 *   <Navbar />
 * 
 * @returns {JSX.Element} Le composant Navbar rendu
 */

import Link from 'next/link';
import Image from 'next/image';
import { RefreshButton } from '../RefreshButton';

/**
 * Liste des éléments de navigation
 * @type {Array<{name: string, href: string}>}
 */
const NAV_ITEMS = [
  { name: 'Accueil', href: '/' },
  { name: 'Recherche', href: '/search' },
  { name: 'Documents', href: '/documents' },
  { name: 'Admin', href: '/admin' },
];

/**
 * Composant Navbar principal
 * @returns {JSX.Element} La barre de navigation complète
 */
export const Navbar = () => {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.svg"
                alt="NexiaMind AI Logo"
                width={32}
                height={32}
                priority
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                NexiaMind AI
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Bouton Rafraîchir */}
          <div className="flex items-center gap-4">
            <RefreshButton />
            {/* Future: User menu */}
          </div>
        </div>
      </div>
    </nav>
  );
};