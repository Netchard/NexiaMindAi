'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from './useAuth'
import { Eye, EyeOff, Loader2 } from './icons'

/**
 * LoginForm Component
 * Reusable form for user login
 */
export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    // Redirection handled by AuthProvider
  }

  /**
   * Clear error when user starts typing
   */
  useEffect(() => {
    if (email || password) {
      setError(null)
    }
  }, [email, password])

  return (
    <>
      <div className="text-center mb-7">
        <h1 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-auth-ink-strong">
          Connexion
        </h1>
        <p className="text-sm text-auth-ink-subtle mt-2">
          Connectez-vous pour accéder à votre espace personnel
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
              aria-describedby="email-help"
              data-testid="email-input"
            />
            <p id="email-help" className="text-xs text-auth-ink-faint mt-1">
              Nous ne partagerons jamais votre email avec qui que ce soit.
            </p>
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
                className="w-full px-4 py-2.5 pr-12 border border-auth-border rounded-auth-md bg-auth-surface-card text-auth-ink placeholder-auth-ink-ghost focus:outline-none focus:border-auth-primary focus:ring-4 focus:ring-auth-ring"
                placeholder="••••••••"
                autoComplete="current-password"
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
          </div>

          <div className="-mt-2 text-right">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-semibold text-auth-primary hover:text-auth-primary-hover"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full flex items-center justify-center gap-2 h-[52px] px-4 rounded-auth-md text-[15px] font-semibold text-auth-on-primary bg-gradient-to-br from-auth-primary to-auth-primary-active shadow-[0_14px_30px_-10px_rgba(244,105,63,.55)] hover:shadow-[0_18px_36px_-10px_rgba(244,105,63,.65)] hover:-translate-y-px focus:outline-none focus:ring-4 focus:ring-auth-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            data-testid="submit-button"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
    </>
  )
}
