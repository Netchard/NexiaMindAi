/**
 * AuthIllustration Component
 *
 * Panneau hero décoratif des 4 pages d'authentification (login, signup,
 * forgot-password, reset-password) — composition split-screen.
 *
 * Voir :
 * - DESIGN.md > Components > hero-panel (3 blobs radiaux animés : turquoise,
 *   orange, violet — scrim diagonal pour contraste du texte)
 * - EXPERIENCE.md > Accessibility Floor (purement décoratif → aria-hidden="true")
 * - EXPERIENCE.md > Responsive & Platform (bandeau compact sous `lg`, jamais masqué)
 *
 * Seul le titre `hero` (et son sous-titre) varie par page, cf. EXPERIENCE.md >
 * Component Patterns ("Panneau hero (blobs animés)").
 */

const SCRIM_BACKGROUND = 'linear-gradient(120deg, rgba(8,15,28,.35), rgba(8,15,28,.7))'

interface AuthIllustrationProps {
  /** Titre d'accroche court (≤ 5 mots), ex. "Bienvenue sur NexiaMind AI." */
  title: string
  /** Sous-titre d'accompagnement */
  subtitle: string
}

export function AuthIllustration({ title, subtitle }: AuthIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className="relative flex h-40 w-full shrink-0 flex-col justify-between overflow-hidden bg-[#080f1c] p-6 md:h-[220px] md:p-10 lg:h-auto lg:w-[52%] lg:p-11"
    >
      <div className="absolute -left-[8%] -top-[12%] h-[70%] w-[70%] animate-nmFloat1 rounded-full blur-[64px]"
        style={{ background: 'radial-gradient(circle, #2EE6D6, transparent 62%)' }}
      />
      <div className="absolute left-[22%] top-[18%] h-[78%] w-[78%] animate-nmFloat2 rounded-full blur-[66px]"
        style={{ background: 'radial-gradient(circle, #F4693F, transparent 60%)' }}
      />
      <div className="absolute -left-[6%] -bottom-[18%] h-[80%] w-[80%] animate-nmFloat3 rounded-full blur-[72px]"
        style={{ background: 'radial-gradient(circle, #7C3AED, transparent 62%)' }}
      />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: SCRIM_BACKGROUND }} />

      <div className="relative z-10 hidden items-center gap-3 lg:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-auth-accent-blue-from to-auth-accent-blue-to text-lg text-white shadow-[0_8px_24px_-6px_rgba(47,102,223,.7)]">
          ✦
        </div>
        <span className="text-lg font-semibold tracking-tight text-white">NexiaMind AI</span>
      </div>

      <div className="relative z-10 text-white">
        <p className="max-w-[13ch] font-display text-xl font-semibold leading-tight tracking-tight md:text-2xl lg:text-[44px] lg:leading-[1.05]">
          {title}
        </p>
        <p className="mt-1.5 max-w-[34ch] text-xs leading-relaxed opacity-90 md:mt-3.5 md:text-sm lg:text-lg">
          {subtitle}
        </p>
        <div className="mt-3 hidden gap-2 lg:flex">
          <span className="h-[5px] w-[34px] rounded-full bg-auth-primary" />
          <span className="h-[5px] w-3 rounded-full bg-white/28" />
          <span className="h-[5px] w-3 rounded-full bg-white/28" />
        </div>
      </div>
    </div>
  )
}

export default AuthIllustration
