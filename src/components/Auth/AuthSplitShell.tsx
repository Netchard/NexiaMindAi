/**
 * AuthSplitShell Component
 *
 * Composition split-screen partagée par les 4 pages d'authentification :
 * panneau hero (AuthIllustration) + panneau formulaire, réunis dans une carte
 * flottante sur fond radial marine (DESIGN.md > Layout & Spacing) — largeur de
 * contenu du formulaire plafonnée à {spacing.form-max-width} (400px).
 *
 * Voir DESIGN.md > Layout & Spacing :
 * - `≥ lg` : panneau hero ~52% / formulaire sur le reste, carte pleine hauteur (min 760px).
 * - `< lg` : panneau hero devient un bandeau compact, formulaire pleine largeur.
 */

import { AuthIllustration } from './AuthIllustration'

interface AuthSplitShellProps {
  heroTitle: string
  heroSubtitle: string
  children: React.ReactNode
}

export function AuthSplitShell({ heroTitle, heroSubtitle, children }: AuthSplitShellProps) {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center p-4 sm:p-7"
      style={{ background: 'radial-gradient(130% 130% at 100% 0%, #12233D 0%, #0A1524 58%)' }}
    >
      <div className="flex w-full max-w-[1240px] flex-col overflow-hidden rounded-auth-xl border border-auth-border-panel shadow-[0_40px_120px_-30px_rgba(0,0,0,.85)] lg:min-h-[760px] lg:flex-row">
        <AuthIllustration title={heroTitle} subtitle={heroSubtitle} />
        <div className="flex flex-1 items-center justify-center bg-auth-surface px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default AuthSplitShell
