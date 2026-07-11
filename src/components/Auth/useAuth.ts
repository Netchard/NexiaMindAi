'use client'

import { useContext } from 'react'
import { AuthContext } from './AuthProvider'
import type { AuthContextType } from '@/lib/auth/types'

/**
 * useAuth Hook
 * Custom hook for accessing authentication context
 * 
 * @returns AuthContextType with user, session, loading, and auth methods
 * @throws Error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}
