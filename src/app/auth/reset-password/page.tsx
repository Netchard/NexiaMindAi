'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth, Loader2, Eye, EyeOff } from '@/components/Auth'

/**
 * Reset Password Page Component
 * Échange le `code` de récupération (lien envoyé par email, flux PKCE) contre
 * une session, puis permet de définir un nouveau mot de passe.
 *
 * La composition split-screen (panneau hero + centrage de la carte)
 * est portée par src/app/auth/reset-password/layout.tsx (AuthSplitShell).
 *
 * État "Chargement initial (vérification du lien)" (EXPERIENCE.md > State Patterns) :
 * un simple message centré, sans formulaire, tant que la vérification n'est pas
 * résolue — pour éviter un flash de formulaire invalide.
 */
export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkInvalid, setLinkInvalid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { exchangeRecoveryCode, updatePassword } = useAuth()
  const codeExchangeAttempted = useRef(false)

  const code = searchParams.get('code')

  useEffect(() => {
    if (!code) {
      router.push('/auth/forgot-password')
      return
    }

    // Recovery codes are single-use (PKCE) — guard against a second call from
    // a remount (e.g. React Strict Mode), which would burn a still-valid code.
    if (codeExchangeAttempted.current) {
      return
    }
    codeExchangeAttempted.current = true

    exchangeRecoveryCode(code).then(({ error }) => {
      if (error) {
        setLinkInvalid(true)
      }
      setVerifying(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  /**
   * Efface l'erreur dès que l'utilisateur retape un champ (harmonisé avec
   * Login/Signup, cf. EXPERIENCE.md > Component Patterns "Bannière d'erreur").
   */
  useEffect(() => {
    if (newPassword || confirmPassword) {
      setError(null)
    }
  }, [newPassword, confirmPassword])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    const { error } = await updatePassword(newPassword)

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (verifying) {
    return (
      <p className="text-center text-auth-ink-subtle">
        Vérification du lien...
      </p>
    )
  }

  if (success) {
    return (
      <div className="w-full text-center">
        <h1 className="mb-3 font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Mot de passe réinitialisé
        </h1>
        <p className="text-auth-ink-subtle">
          Votre mot de passe a été réinitialisé avec succès.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/login"
            className="font-semibold text-auth-primary hover:text-auth-primary-hover"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  if (linkInvalid) {
    return (
      <div className="w-full text-center">
        <h1 className="mb-3 font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Lien invalide
        </h1>
        <p className="text-auth-ink-subtle">
          Ce lien de réinitialisation est invalide ou a expiré.
        </p>
        <div className="mt-6">
          <Link
            href="/auth/forgot-password"
            className="font-semibold text-auth-primary hover:text-auth-primary-hover"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-7 text-center">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Réinitialiser le mot de passe
        </h1>
        <p className="mt-2 text-sm text-auth-ink-subtle">
          Entrez votre nouveau mot de passe
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-auth-lg border border-auth-error-border bg-auth-error-surface p-3.5 text-sm text-auth-error-soft"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-auth-ink-muted">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-auth-md border border-auth-border bg-auth-surface-card px-4 py-2.5 pr-12 text-auth-ink placeholder-auth-ink-ghost focus:border-auth-primary focus:outline-none focus:ring-4 focus:ring-auth-ring"
              placeholder="••••••••"
              autoComplete="new-password"
              data-testid="new-password-input"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-ink-faint hover:text-auth-ink"
              aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              data-testid="toggle-new-password"
            >
              {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p className="mt-1 text-xs text-auth-ink-faint">
            Doit contenir au moins 8 caractères
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-auth-ink-muted">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-auth-md border border-auth-border bg-auth-surface-card px-4 py-2.5 pr-12 text-auth-ink placeholder-auth-ink-ghost focus:border-auth-primary focus:outline-none focus:ring-4 focus:ring-auth-ring"
              placeholder="••••••••"
              autoComplete="new-password"
              data-testid="confirm-new-password-input"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-ink-faint hover:text-auth-ink"
              aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
              data-testid="toggle-confirm-new-password"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !newPassword || newPassword !== confirmPassword}
          className="flex w-full items-center justify-center gap-2 h-[52px] rounded-auth-md text-[15px] font-semibold text-auth-on-primary bg-gradient-to-br from-auth-primary to-auth-primary-active shadow-[0_14px_30px_-10px_rgba(244,105,63,.55)] hover:shadow-[0_18px_36px_-10px_rgba(244,105,63,.65)] hover:-translate-y-px focus:outline-none focus:ring-4 focus:ring-auth-ring disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Réinitialisation en cours...
            </>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-auth-ink-subtle hover:text-auth-ink"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}
