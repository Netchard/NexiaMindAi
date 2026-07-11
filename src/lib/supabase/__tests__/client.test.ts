import { expect, test, describe, vi, beforeEach } from 'vitest'

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  test('should export supabase client', async () => {
    // Set environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-url.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key'
    
    const { supabase } = await import('../client')
    
    expect(supabase).toBeDefined()
    expect(supabase).toBeTruthy()
    expect(typeof supabase).toBe('object')
  })

  test('should use empty strings when environment variables are missing', async () => {
    // Clear environment variables
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    const { supabase } = await import('../client')
    
    // Should still export a client, even with empty strings
    expect(supabase).toBeDefined()
  })
})
