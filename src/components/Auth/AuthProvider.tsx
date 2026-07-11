'use client'

import { createContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { invalidateFiltersCache } from '@/lib/api/filters'
import type { User, Session } from '@supabase/supabase-js'
import type { AuthContextType } from '@/lib/auth/types'

/**
 * Auth Context
 * React context for managing authentication state
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

const GENERIC_ERROR = 'Une erreur est survenue. Veuillez réessayer.'

/**
 * Only ever redirect to a same-origin relative path — a bare `?redirect=`
 * pulled from the URL must never be handed to router.push() as-is (open redirect).
 */
function getSafeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return '/'
  }
  return raw
}

/**
 * Auth Provider Component
 * Wraps the application with authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  /**
   * Effect for handling auth state changes
   * Subscribes to Supabase auth state changes and updates context.
   * onAuthStateChange emits an INITIAL_SESSION event on subscribe, so no
   * separate getSession() call is needed to resolve the initial state.
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Redirect to the originally requested page (?redirect=) on sign in,
        // or home if none — /dashboard n'existe pas encore (Epic 4 backlog).
        // Skip on /auth/reset-password: exchanging the recovery code there
        // also fires SIGNED_IN, and the page needs to stay put to let the
        // user set their new password instead of being bounced to '/'.
        if (event === 'SIGNED_IN' && !window.location.pathname.startsWith('/auth/reset-password')) {
          const redirectTo = getSafeRedirect(new URLSearchParams(window.location.search).get('redirect'))
          router.push(redirectTo)
        }

        // Redirect to login on sign out (covers explicit signOut() calls,
        // session expiry, and sign-out from another tab).
        if (event === 'SIGNED_OUT') {
          // Le cache des filtres n'est pas scopé par utilisateur (revue de code
          // ST-304) — l'invalider pour ne pas exposer les valeurs d'une session
          // précédente à la prochaine connexion dans le même onglet.
          invalidateFiltersCache()
          router.push('/auth/login')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  /**
   * Sign in user with email and password
   */
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch {
      return { error: GENERIC_ERROR }
    }
  }

  /**
   * Sign up new user with email and password
   */
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
            created_at: new Date().toISOString(),
          },
        },
      })

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch {
      return { error: GENERIC_ERROR }
    }
  }

  /**
   * Sign out current user
   * Navigation to /auth/login is handled by the SIGNED_OUT event above.
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      router.push('/auth/login')
    }
  }

  /**
   * Request password reset email
   */
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch {
      return { error: GENERIC_ERROR }
    }
  }

  /**
   * Exchange the `code` from a password-recovery email link for a session
   * Required before calling updatePassword() (PKCE flow)
   */
  const exchangeRecoveryCode = async (code: string) => {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch {
      return { error: GENERIC_ERROR }
    }
  }

  /**
   * Update the password of the currently authenticated (recovery) session
   */
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        return { error: error.message }
      }
      return {}
    } catch {
      return { error: GENERIC_ERROR }
    }
  }

  /**
   * Context value
   */
  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    exchangeRecoveryCode,
    updatePassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
