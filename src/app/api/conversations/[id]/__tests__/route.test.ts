/**
 * Tests unitaires pour DELETE /api/conversations/[id]
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { DELETE } from '../route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

// Mock de supabase admin client - utiliser vi.hoisted pour éviter le hoisting issue
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
}))

vi.mock('@/lib/supabase/admin-client', () => ({
  supabase: mockSupabase,
}))

describe('DELETE /api/conversations/[id]', () => {
  const mockParams = Promise.resolve({ id: 'conv-123' })

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mocks
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.delete.mockReturnValue(mockSupabase)
    mockSupabase.limit.mockReturnValue(mockSupabase)
  })

  it('AC #6 - devrait retourner 401 si utilisateur non authentifié', async () => {
    const request = {
      headers: { get: vi.fn() },
      nextUrl: { pathname: '/api/conversations/conv-123' },
    } as unknown as NextRequest

    const response = await DELETE(request, { params: mockParams })
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Non autorise')
  })

  it('AC #6 - devrait retourner 400 si conversationId manquant', async () => {
    const request = {
      headers: { get: vi.fn((key: string) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/' },
    } as unknown as NextRequest

    const response = await DELETE(request, { params: Promise.resolve({ id: '' }) })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('L ID de la conversation est obligatoire')
  })

  it('AC #6 - devrait retourner 404 si conversation non trouvée', async () => {
    // Mock: conversation non trouvée
    mockSupabase.single.mockResolvedValue({ data: null, error: null })

    const request = {
      headers: { get: vi.fn((key: string) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123' },
    } as unknown as NextRequest

    const response = await DELETE(request, { params: mockParams })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Conversation non trouvee ou acces non autorise')
  })

  it('AC #6 - devrait retourner 200 et supprimer la conversation', async () => {
    // Mock: conversation existe et suppression réussie
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'conv-123', user_id: 'user-123' }, error: null })
    mockSupabase.delete.mockReturnValueOnce(mockSupabase)
    mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null })

    const request = {
      headers: { get: vi.fn((key: string) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123' },
    } as unknown as NextRequest

    const response = await DELETE(request, { params: mockParams })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toContain('Conversation deleted successfully')
  })
})
