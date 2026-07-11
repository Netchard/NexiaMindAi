import { expect, test, describe } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '../LoginForm'
import { AuthProvider } from '../AuthProvider'

describe('LoginForm', () => {
  test('should export LoginForm component', async () => {
    const { default: LoginForm } = await import('../LoginForm')
    expect(typeof LoginForm).toBe('function')
  })

  test('clicking the eye icon reveals the password', () => {
    render(<LoginForm />, { wrapper: AuthProvider })

    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    fireEvent.click(screen.getByTestId('toggle-password'))
    expect(passwordInput.type).toBe('text')

    fireEvent.click(screen.getByTestId('toggle-password'))
    expect(passwordInput.type).toBe('password')
  })
})
