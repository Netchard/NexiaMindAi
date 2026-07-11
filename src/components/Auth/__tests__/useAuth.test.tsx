import { expect, test, describe } from 'vitest'

describe('useAuth Hook', () => {
  test('should export useAuth hook', async () => {
    const { useAuth } = await import('../useAuth')
    expect(typeof useAuth).toBe('function')
  })
})
