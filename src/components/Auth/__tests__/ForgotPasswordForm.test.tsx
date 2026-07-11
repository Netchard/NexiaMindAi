import { expect, test, describe } from 'vitest'

describe('ForgotPasswordForm', () => {
  test('should export ForgotPasswordForm component', async () => {
    const { default: ForgotPasswordForm } = await import('../ForgotPasswordForm')
    expect(typeof ForgotPasswordForm).toBe('function')
  })
})
