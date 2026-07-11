/**
 * Composant Footer - Pied de page principal
 * 
 * Fait partie de ST-301 - Créer le Layout Principal
 * 
 * Ce composant fournit un pied de page complet avec :
 * - Informations sur l'application et description
 * - Liens utiles (Politique de confidentialité, Conditions d'utilisation, Contact)
 * - Section ressources (Documentation, API)
 * - Informations légales et copyright
 * - Design responsive en grille (1 colonne mobile, 4 colonnes desktop)
 * - Support du thème sombre/clair
 * 
 * Utilisation:
 *   <Footer />
 * 
 * @returns {JSX.Element} Le composant Footer rendu
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Liste des liens du footer
 * @type {Array<{name: string, href: string}>}
 */
const FOOTER_LINKS = [
  { name: 'Politique de Confidentialité', href: '/privacy' },
  { name: 'Conditions d\'Utilisation', href: '/terms' },
  { name: 'Contact', href: '/contact' },
];

/**
 * Composant Footer principal
 * @returns {JSX.Element} Le pied de page complet
 */
export const Footer = () => {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Les pages d'authentification (/auth/*) utilisent un layout split-screen
  // plein écran sans Navbar ni Footer (voir src/app/auth/layout.tsx).
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  // /chat suit la maquette de référence (docs/Maquette-ux-NexiaMind AI.html) :
  // l'app-shell va jusqu'au bord bas de l'écran, sans pied de page (voir
  // _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/EXPERIENCE.md
  // > Foundation). Le sort du Footer sur les autres pages reste ouvert.
  if (pathname?.startsWith('/chat')) {
    return null;
  }

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              NexiaMind AI
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Système de recherche intelligente basé sur RAG pour l'analyse de documents techniques.
            </p>
          </div>

          {/* Liens utiles */}
          <div className="col-span-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Liens Utiles</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Ressources */}
          <div className="col-span-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Ressources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/docs"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/api"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors"
                >
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations légales */}
          <div className="col-span-1">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Légal</h4>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              © {currentYear} NexiaMind AI. Tous droits réservés.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-2">
              Développé par l'équipe NexiaMind
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};