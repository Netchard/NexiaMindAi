'use client'

import Link from 'next/link'
import { LoginForm } from '@/components/Auth'

/**
 * Login Page Component
 * Main login page with email/password form (authentification par email uniquement)
 * (la redirection post-connexion, y compris ?redirect=, est gérée par AuthProvider)
 *
 * La composition split-screen (panneau d'illustration + centrage de la carte)
 * est portée par src/app/auth/login/layout.tsx (AuthSplitShell).
 */
export default function LoginPage() {
  return (
    <>
      <LoginForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-auth-ink-subtle">
          Pas encore de compte ?{' '}
          <Link
            href="/auth/signup"
            className="font-semibold text-auth-primary hover:text-auth-primary-hover"
          >
            S'inscrire
          </Link>
        </p>
      </div>
    </>
  )
}
