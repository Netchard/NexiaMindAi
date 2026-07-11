import { expect, test, describe, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ResetPasswordPage from '../page'
import { AuthProvider } from '@/components/Auth'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('code=test-recovery-code'),
  usePathname: () => '/auth/reset-password',
}))

describe('ResetPasswordPage - password visibility toggles', () => {
  test('both new-password and confirm-password fields expose a working show/hide toggle', async () => {
    render(<ResetPasswordPage />, { wrapper: AuthProvider })

    await waitFor(() => {
      expect(screen.getByTestId('new-password-input')).toBeInTheDocument()
    })

    const newPasswordInput = screen.getByTestId('new-password-input') as HTMLInputElement
    const confirmPasswordInput = screen.getByTestId('confirm-new-password-input') as HTMLInputElement

    expect(newPasswordInput.type).toBe('password')
    expect(confirmPasswordInput.type).toBe('password')

    fireEvent.click(screen.getByTestId('toggle-new-password'))
    expect(newPasswordInput.type).toBe('text')
    expect(confirmPasswordInput.type).toBe('password')

    fireEvent.click(screen.getByTestId('toggle-confirm-new-password'))
    expect(confirmPasswordInput.type).toBe('text')
  })
})
