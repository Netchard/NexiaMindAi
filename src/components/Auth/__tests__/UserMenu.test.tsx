import { expect, test, describe } from 'vitest'

describe('UserMenu', () => {
  test('should export UserMenu component', async () => {
    const { default: UserMenu } = await import('../UserMenu')
    expect(typeof UserMenu).toBe('function')
  })
})
