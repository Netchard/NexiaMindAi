/**
 * Composant Navbar - Barre de navigation principale
 *
 * Fait partie de ST-301 - Créer le Layout Principal
 * Restylée (thème sombre, docs/Maquette-ux-NexiaMind AI.html) pour ST-303/ST-304 —
 * voir _bmad-output/planning-artifacts/ux-designs/ux-nexiamind-ai-2026-07-04-chat/DESIGN.md
 * (Components: app-header, nav-item).
 *
 * Ce composant fournit une barre de navigation avec :
 * - Logo de l'application avec lien vers la page d'accueil
 * - Menu de navigation avec liens vers les principales sections
 * - Intégration du bouton Rafraîchir (ST-205)
 * - Design responsive pour mobile, tablette et desktop
 *
 * Utilisation:
 *   <Navbar />
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RefreshButton } from '../RefreshButton';
import { useAuth, UserMenu } from '@/components/Auth';

/**
 * Liste des éléments de navigation
 * @type {Array<{name: string, href: string}>}
 */
const NAV_ITEMS = [
  { name: 'Accueil', href: '/' },
  { name: 'Chat', href: '/chat' },
  { name: 'Recherche', href: '/search' },
  { name: 'Documents', href: '/documents' },
  { name: 'Admin', href: '/admin' },
];

/**
 * Composant Navbar principal
 * @returns {JSX.Element} La barre de navigation complète
 */
export const Navbar = () => {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Les pages d'authentification (/auth/*) utilisent un layout split-screen
  // plein écran sans Navbar ni Footer (voir src/app/auth/layout.tsx).
  if (pathname?.startsWith('/auth')) {
    return null;
  }

  return (
    <nav className="bg-chat-surface-header border-b border-chat-border-header" role="navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo + navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 flex-none">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-auth-accent-blue-from to-auth-accent-blue-to text-base text-white shadow-[0_6px_16px_-5px_rgba(47,102,223,.55)]">
                ✦
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-chat-ink-strong">
                NexiaMind AI
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`h-9 px-3.5 flex items-center rounded-chat-sm text-sm transition-colors ${
                      isActive
                        ? 'bg-chat-nav-active font-semibold text-chat-ink-strong'
                        : 'font-medium text-chat-ink-subtle hover:text-chat-ink-strong'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Sélecteur de source + Rafraîchir + menu utilisateur */}
          <div className="flex items-center gap-3">
            <RefreshButton />
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-chat-ink-subtle hover:text-chat-ink-strong transition-colors"
                >
                  Se connecter
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
