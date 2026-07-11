'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Loader2 } from './icons'
import { useAuth } from './useAuth'

/**
 * ForgotPasswordForm Component
 * Form for requesting password reset
 */
export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { resetPassword } = useAuth()

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email) {
      setError('Veuillez entrer une adresse email')
      setLoading(false)
      return
    }

    const { error } = await resetPassword(email)

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    // Success - show confirmation message
    setSuccess(true)
    setLoading(false)
  }

  /**
   * Clear error when user starts typing
   * (harmonisé avec Login/Signup, cf. EXPERIENCE.md > Component Patterns "Bannière d'erreur")
   */
  useEffect(() => {
    if (email) {
      setError(null)
    }
  }, [email])

  /**
   * Success message component
   */
  if (success) {
    return (
      <div className="w-full text-center">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong mb-5">
          Mot de passe oublié
        </h1>
        <div className="flex gap-3 items-start p-4 rounded-auth-lg bg-auth-success-surface border border-auth-success-border text-left mb-6">
          <div className="flex-none w-[26px] h-[26px] rounded-full bg-auth-success text-white flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <p className="text-sm leading-relaxed text-[#C9E6D8]">
            Un lien de réinitialisation a été envoyé à <span className="font-semibold text-white">{email}</span>.
            Cliquez sur le lien pour créer un nouveau mot de passe.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center h-[52px] rounded-auth-md border border-auth-border text-auth-ink-muted font-semibold text-sm hover:border-auth-primary transition-colors"
        >
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-7">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Mot de passe oublié
        </h1>
        <p className="text-sm text-auth-ink-subtle mt-2">
          Entrez votre email et nous vous enverrons un lien de réinitialisation
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3.5 bg-auth-error-surface border border-auth-error-border text-auth-error-soft rounded-auth-lg text-sm"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-auth-ink-muted mb-1.5">
            Adresse email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2.5 border border-auth-border rounded-auth-md bg-auth-surface-card text-auth-ink placeholder-auth-ink-ghost focus:outline-none focus:border-auth-primary focus:ring-4 focus:ring-auth-ring"
            placeholder="votre@email.com"
            autoComplete="email"
            data-testid="email-input"
          />
          <p className="text-xs text-auth-ink-faint mt-1">
            Nous vous enverrons un lien pour réinitialiser votre mot de passe
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full flex items-center justify-center gap-2 h-[52px] px-4 rounded-auth-md text-[15px] font-semibold text-auth-on-primary bg-gradient-to-br from-auth-primary to-auth-primary-active shadow-[0_14px_30px_-10px_rgba(244,105,63,.55)] hover:shadow-[0_18px_36px_-10px_rgba(244,105,63,.65)] hover:-translate-y-px focus:outline-none focus:ring-4 focus:ring-auth-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-testid="submit-button"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Envoi en cours...
            </>
          ) : (
            'Envoyer le lien de réinitialisation'
          )}
        </button>
      </form>

      <div className="mt-5 text-center">
        <Link href="/auth/login" className="text-sm font-semibold text-auth-ink-subtle hover:text-auth-ink">
          Retour à la connexion
        </Link>
      </div>
    </>
  )
}
