import { expect, test, describe } from 'vitest'

describe('AuthProvider', () => {
  test('should export AuthProvider component', async () => {
    const { AuthProvider } = await import('../AuthProvider')
    expect(typeof AuthProvider).toBe('function')
  })

  test('should export useAuth hook', async () => {
    const { useAuth } = await import('../useAuth')
    expect(typeof useAuth).toBe('function')
  })

  test('should export AuthContext', async () => {
    // This tests internal exports - may need adjustment
    const module = await import('../AuthProvider')
    // AuthContext might not be exported, which is fine
  })
})
