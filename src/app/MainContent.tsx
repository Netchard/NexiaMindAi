'use client';

import { usePathname } from 'next/navigation';

/**
 * Les pages /auth/* portent leur propre composition plein écran
 * (AuthSplitShell) — le conteneur/padding du layout racine ne doit pas
 * s'y appliquer, sinon la carte flottante sur fond radial (DESIGN.md
 * Auth > Layout & Spacing) est contrainte par le `container mx-auto px-4 py-8`.
 *
 * Les pages /chat/* gèrent elles-mêmes leur pleine hauteur (sidebar +
 * panneau de chat en `h-full`, zone de saisie toujours visible en bas —
 * voir EXPERIENCE.md > Layout & Spacing) : le `container`/padding du
 * layout racine empêcherait ce panneau de remplir l'espace restant sous
 * la Navbar, et `overflow-hidden` évite que la page entière ne défile au
 * lieu de laisser le panneau de chat gérer son propre scroll interne.
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth');
  const isChatRoute = pathname?.startsWith('/chat');

  if (isAuthRoute) {
    return <main className="flex-1">{children}</main>;
  }

  if (isChatRoute) {
    return <main className="flex-1 overflow-hidden min-h-0">{children}</main>;
  }

  return <main className="flex-1 container mx-auto px-4 py-8">{children}</main>;
}

export default MainContent;
