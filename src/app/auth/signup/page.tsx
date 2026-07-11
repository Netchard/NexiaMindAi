'use client'

import Link from 'next/link'
import { SignupForm } from '@/components/Auth'

/**
 * Signup Page Component
 * User registration page with email/password form (authentification par email uniquement)
 *
 * La composition split-screen (panneau d'illustration + centrage de la carte)
 * est portée par src/app/auth/signup/layout.tsx (AuthSplitShell).
 */
export default function SignupPage() {
  return (
    <>
      <SignupForm />

      <div className="mt-6 text-center">
        <p className="text-sm text-auth-ink-subtle">
          Déjà un compte ?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-auth-primary hover:text-auth-primary-hover"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </>
  )
}
