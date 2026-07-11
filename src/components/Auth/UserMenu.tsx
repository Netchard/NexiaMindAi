'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut, Settings, UserIcon, History } from './icons'
import { useAuth } from './useAuth'
import Link from 'next/link'
import Image from 'next/image'

/**
 * UserMenu Component
 * Dropdown menu for authenticated users in Navbar
 */
export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { user, signOut } = useAuth()

  /**
   * Close menu when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Close menu when pressing Escape
   */
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  /**
   * Handle user logout
   */
  const handleSignOut = async () => {
    await signOut()
    setIsOpen(false)
  }

  /**
   * Get user initials for avatar fallback
   */
  const getInitials = () => {
    if (user?.email) {
      const name = user.email.split('@')[0]
      return name.charAt(0).toUpperCase()
    }
    return 'U'
  }

  /**
   * Get avatar URL or use placeholder
   */
  const avatarUrl = user?.user_metadata?.avatar_url || null

  if (!user) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-auth-border-panel py-1 pl-1 pr-2.5 hover:bg-auth-surface transition-colors"
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
        data-testid="user-menu-button"
      >
        <div className="relative w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-auth-primary to-auth-primary-active text-auth-on-primary flex items-center justify-center">
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt="Avatar"
              width={28}
              height={28}
              className="object-cover"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span className="font-bold text-xs">{getInitials()}</span>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-start">
          <span className="text-[13px] font-medium text-auth-ink-muted">
            {user.email || 'Utilisateur'}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-auth-ink-faint transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-auth-surface rounded-auth-md shadow-lg border border-auth-border-panel py-1 z-50">
          <div className="px-4 py-2 border-b border-auth-border">
            <p className="text-sm text-auth-ink-subtle">Connecté en tant que</p>
            <p className="text-sm font-medium text-auth-ink truncate">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-auth-ink hover:bg-auth-surface-card"
              onClick={() => setIsOpen(false)}
              data-testid="profile-link"
            >
              <UserIcon size={16} />
              Mon profil
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-auth-ink hover:bg-auth-surface-card"
              onClick={() => setIsOpen(false)}
              data-testid="settings-link"
            >
              <Settings size={16} />
              Paramètres
            </Link>
            <Link
              href="/chat-history"
              className="flex items-center gap-2 px-4 py-2 text-sm text-auth-ink hover:bg-auth-surface-card"
              onClick={() => setIsOpen(false)}
              data-testid="history-link"
            >
              <History size={16} />
              Historique des chats
            </Link>
          </div>

          <div className="border-t border-auth-border pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-auth-error-soft hover:bg-auth-error-surface"
              data-testid="logout-button"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
