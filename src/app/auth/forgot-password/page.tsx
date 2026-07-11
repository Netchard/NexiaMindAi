'use client'

import { ForgotPasswordForm } from '@/components/Auth'

/**
 * Forgot Password Page Component
 * Page for requesting password reset
 *
 * La composition split-screen (panneau d'illustration + centrage de la carte)
 * est portée par src/app/auth/forgot-password/layout.tsx (AuthSplitShell).
 */
export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
