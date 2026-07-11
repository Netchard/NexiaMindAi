import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoginPage from '../page'
import { AuthProvider } from '@/components/Auth'

describe('LoginPage - email-only authentication', () => {
  test('does not render OAuth provider buttons', () => {
    render(<LoginPage />, { wrapper: AuthProvider })

    expect(screen.queryByTestId('google-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('github-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gitlab-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
  })
})
