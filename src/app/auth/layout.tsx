/**
 * Auth Layout Component
 * Layout wrapper for all authentication pages
 *
 * Ce layout ne fait plus que porter les métadonnées communes aux 4 pages
 * d'authentification (login, signup, forgot-password, reset-password) : la
 * composition visuelle split-screen (panneau d'illustration + carte formulaire)
 * est portée par un layout par segment pour chaque route (voir
 * src/app/auth/login/layout.tsx et consorts), car le titre `hero` du panneau
 * d'illustration varie par page (cf. AuthSplitShell / AuthIllustration).
 *
 * Navbar et Footer sont exclus de ces pages : Navbar/Footer se masquent
 * eux-mêmes sur les routes `/auth/*` via `usePathname` (voir
 * src/components/Navbar/Navbar.tsx et src/components/Footer/Footer.tsx).
 */

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Authentification - NexiaMind AI',
  description: 'Connectez-vous ou créez un compte pour accéder à NexiaMind AI',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // AuthProvider est fourni globalement par le layout racine (src/app/layout.tsx)
  return <>{children}</>
}
