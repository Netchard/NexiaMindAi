import { expect, test, describe } from 'vitest'

describe('SignupForm', () => {
  test('should export SignupForm component', async () => {
    const { default: SignupForm } = await import('../SignupForm')
    expect(typeof SignupForm).toBe('function')
  })
})
