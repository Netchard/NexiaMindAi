'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Loader2 } from './icons'
import { useAuth } from './useAuth'

/**
 * SignupForm Component
 * Reusable form for user registration
 */
export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate password match
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    // Validate password strength (doit correspondre au texte d'aide affiché ci-dessous)
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      setLoading(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Le mot de passe doit contenir au moins une majuscule')
      setLoading(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Le mot de passe doit contenir au moins un chiffre')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password, name)

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
   */
  useEffect(() => {
    if (email || password || confirmPassword || name) {
      setError(null)
    }
  }, [email, password, confirmPassword, name])

  /**
   * Success message component
   */
  if (success) {
    return (
      <div className="w-full text-center">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-auth-ink-strong mb-5">
          Créer un compte
        </h1>
        <div className="flex gap-3 items-start p-4 rounded-auth-lg bg-auth-success-surface border border-auth-success-border text-left">
          <div className="flex-none w-[26px] h-[26px] rounded-full bg-auth-success text-white flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <p className="text-sm leading-relaxed text-[#C9E6D8]">
            Un lien de confirmation a été envoyé à <span className="font-semibold text-white">{email}</span>.
            Cliquez sur le lien pour activer votre compte.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="text-center mb-6">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Créer un compte
        </h1>
        <p className="text-sm text-auth-ink-subtle mt-2">
          Rejoignez-nous et commencez à utiliser notre assistant IA
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
          <label htmlFor="name" className="block text-sm font-semibold text-auth-ink-muted mb-1.5">
            Nom complet <span className="text-auth-ink-faint font-medium">(optionnel)</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-auth-border rounded-auth-md bg-auth-surface-card text-auth-ink placeholder-auth-ink-ghost focus:outline-none focus:border-auth-primary focus:ring-4 focus:ring-auth-ring"
            placeholder="Jean Dupont"
            autoComplete="name"
            data-testid="name-input"
          />
        </div>

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
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-auth-ink-muted mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 pr-12 border border-auth-border rounded-auth-md bg-auth-surface-card text-auth-ink placeholder-auth-ink-ghost focus:outline-none focus:border-auth-primary focus:ring-4 focus:ring-auth-ring"
              placeholder="••••••••"
              autoComplete="new-password"
              aria-describedby="password-help"
              data-testid="password-input"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-ink-faint hover:text-auth-ink"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              data-testid="toggle-password"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <p id="password-help" className="text-xs text-auth-ink-faint mt-1">
            Doit contenir au moins 8 caractères, une majuscule et un chiffre
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-auth-ink-muted mb-1.5">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 pr-12 border border-auth-border rounded-auth-md bg-auth-surface-card text-auth-ink placeholder-auth-ink-ghost focus:outline-none focus:border-auth-primary focus:ring-4 focus:ring-auth-ring"
              placeholder="••••••••"
              autoComplete="new-password"
              data-testid="confirm-password-input"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-ink-faint hover:text-auth-ink"
              aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
              data-testid="toggle-confirm-password"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password || password !== confirmPassword}
          className="w-full flex items-center justify-center gap-2 h-[52px] px-4 rounded-auth-md text-[15px] font-semibold text-auth-on-primary bg-gradient-to-br from-auth-primary to-auth-primary-active shadow-[0_14px_30px_-10px_rgba(244,105,63,.55)] hover:shadow-[0_18px_36px_-10px_rgba(244,105,63,.65)] hover:-translate-y-px focus:outline-none focus:ring-4 focus:ring-auth-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          data-testid="submit-button"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Création en cours...
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
      </form>
    </>
  )
}
