/**
 * Tests unitaires pour POST /api/conversations
 * Fait partie de ST-306: Implémenter le Mode Conversation
 */

import { POST } from '../route'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

// Utiliser vi.hoisted pour éviter les problèmes de hoisting avec vi.mock
const mockAdminSupabase = vi.hoisted(() => ({
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
}))

vi.mock('@/lib/supabase/admin-client', () => ({
  supabase: mockAdminSupabase,
}))

describe('POST /api/conversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC #1 - Création de conversation', () => {
    it('AC #1 - devrait créer une nouvelle conversation avec succès', async () => {
      // Mock de la requête avec utilisateur authentifié
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ title: 'Test Conversation' }),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      // Mock de supabase pour réussir l'insertion
      mockAdminSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.conversation).toBeDefined()
      expect(data.conversation.title).toBe('Test Conversation')
      expect(data.conversation.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      )
    })

    it('AC #1 - devrait utiliser le titre par défaut si non fourni', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({}),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      mockAdminSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.conversation.title).toBe('Nouvelle conversation')
    })
  })

  describe('Authentification', () => {
    it('devrait retourner 401 si x-user-id manquant', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ title: 'Test' }),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Non autorisé - utilisateur non authentifié')
    })
  })

  describe('Validation', () => {
    it('devrait retourner 400 si le body JSON est invalide', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Requête invalide - JSON mal formaté')
    })

    it('devrait retourner 400 si le titre est vide', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ title: '   ' }),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le titre ne peut pas être vide')
    })

    it('devrait retourner 400 si le titre dépasse 200 caractères', async () => {
      const longTitle = 'a'.repeat(201)
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ title: longTitle }),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Le titre ne peut pas dépasser 200 caractères')
    })
  })

  describe('Erreurs serveur', () => {
    it('devrait retourner 500 si l\'insertion Supabase échoue', async () => {
      const mockRequest = {
        method: 'POST',
        headers: new Headers({
          'x-user-id': 'user-123',
          'Content-Type': 'application/json',
        }),
        json: vi.fn().mockResolvedValue({ title: 'Test' }),
        nextUrl: { pathname: '/api/conversations' },
      } as unknown as NextRequest

      mockAdminSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'Database error' } }),
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Échec de la création de la conversation')
    })
  })
})
