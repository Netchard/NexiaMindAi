/**
 * Tests unitaires pour GET /api/chat/messages
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { vi } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock de supabase admin client - éviter l'erreur de configuration manquante
const mockAdminSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/supabase/admin-client', () => ({
  supabase: mockAdminSupabase
}))

// Mock de supabase server client
const mockServerSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/supabase/server', () => ({
  supabase: mockServerSupabase
}))

describe('GET /api/chat/messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AC #2 - devrait retourner 401 si utilisateur non authentifié', async () => {
    const request = {
      headers: { get: vi.fn() },
      nextUrl: { pathname: '/api/chat/messages' },
      url: 'http://localhost:3000/api/chat/messages?conversationId=test-id',
    } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Non autorisé')
  })

  it('AC #2 - devrait retourner 400 si conversationId manquant', async () => {
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/chat/messages' },
      url: 'http://localhost:3000/api/chat/messages',
    } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('conversationId est obligatoire')
  })

  it('AC #2 - devrait retourner 400 si limite invalide', async () => {
    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/chat/messages' },
      url: 'http://localhost:3000/api/chat/messages?conversationId=conv-123&limit=200',
    } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('La limite doit être un nombre entre 1 et 100')
  })

  it('AC #2 - devrait retourner 404 si conversation non trouvée', async () => {
    // Mock: conversation non trouvée
    mockAdminSupabase.from.mockImplementation((table) => {
      if (table === 'conversations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }
      }
      return mockAdminSupabase
    })

    const request = {
      headers: { get: vi.fn((key) => key === 'x-user-id' ? 'user-123' : null) },
      nextUrl: { pathname: '/api/chat/messages' },
      url: 'http://localhost:3000/api/chat/messages?conversationId=invalid-id',
    } as unknown as NextRequest

    const response = await GET(request)
    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toContain('Conversation non trouvée')
  })
})
