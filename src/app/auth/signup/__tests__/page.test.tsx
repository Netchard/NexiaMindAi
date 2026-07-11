import { expect, test, describe } from 'vitest'
import { render, screen } from '@testing-library/react'
import SignupPage from '../page'
import { AuthProvider } from '@/components/Auth'

describe('SignupPage - email-only authentication', () => {
  test('does not render OAuth provider buttons', () => {
    render(<SignupPage />, { wrapper: AuthProvider })

    expect(screen.queryByTestId('google-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('github-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('gitlab-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
  })
})
