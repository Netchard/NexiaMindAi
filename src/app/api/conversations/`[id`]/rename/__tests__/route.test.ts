/**
 * Tests unitaires pour PATCH /api/conversations/[id]/rename
 * Fait partie de ST-306
 */

import { PATCH } from '../route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

const mockSupabase = {
  from: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  single: vi.fn(),
  update: vi.fn(),
}

vi.mock('@/lib/supabase/admin-client', () => ({
  supabase: mockSupabase,
}))

describe('PATCH /api/conversations/[id]/rename', () => {
  const mockParams = Promise.resolve({ id: 'conv-123' })
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.update.mockReturnValue(mockSupabase)
  })
  it('AC #5 - 401 si non authentifie', async () => {
    const request = {
      headers: { get: vi.fn() },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockRejectedValue(new Error('Not JSON'))
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(401)
  })
  it('AC #5 - 400 si titre manquant', async () => {
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockResolvedValue({})
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('title est obligatoire')
  })
  it('AC #5 - 400 si titre vide', async () => {
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockResolvedValue({ title: '   ' })
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('etre vide')
  })
  it('AC #5 - 400 si titre trop long', async () => {
    const longTitle = 'a'.repeat(201)
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockResolvedValue({ title: longTitle })
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('200 caracteres')
  })
  it('AC #5 - 404 si conversation non trouvee', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockResolvedValue({ title: 'Nouveau titre' })
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('non trouvee')
  })
  it('AC #5 - 200 et renommer', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: { id: 'conv-123', user_id: 'user-123', title: 'Ancien titre' }, error: null })
    mockSupabase.update.mockReturnValueOnce(mockSupabase)
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/conversations/conv-123/rename' },
      json: vi.fn().mockResolvedValue({ title: 'Nouveau titre' })
    } as unknown as NextRequest
    const response = await PATCH(request, { params: mockParams })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.conversation.title).toBe('Nouveau titre')
  })
})
