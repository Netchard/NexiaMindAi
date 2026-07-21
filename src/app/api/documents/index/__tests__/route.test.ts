/**
 * Tests unitaires pour l'endpoint API /api/documents/index
 * Fait partie de la spec "Page Documents — upload et indexation manuelle RAG"
 */

import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { storageIndexer } from '@/lib/supabase/storage/indexer'

vi.mock('@/lib/supabase/storage/indexer', () => ({
  storageIndexer: { indexAll: vi.fn() },
}))

// x-user-id présent par défaut (comme injecté par src/proxy.ts en usage réel)
// — les tests dédiés à la vérification défensive du userId l'omettent
// explicitement.
function makeRequest(body: unknown, headers: Record<string, string> = { 'x-user-id': 'user-1' }) {
  return {
    json: vi.fn().mockResolvedValue(body),
    headers: { get: (key: string) => headers[key] ?? null },
  } as unknown as Request
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/documents/index', () => {
  test('rejects requests without x-user-id (401)', async () => {
    const response = await POST(makeRequest({ prefix: 'uploads/x/' }, {}))

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Non autorisé')
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects requests without a prefix (400)', async () => {
    const response = await POST(makeRequest({}))

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('prefix')
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects requests with an empty/blank prefix (400)', async () => {
    const response = await POST(makeRequest({ prefix: '   ' }))
    expect(response.status).toBe(400)
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects requests with a non-string prefix (400)', async () => {
    const response = await POST(makeRequest({ prefix: 42 }))
    expect(response.status).toBe(400)
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  // Régression CRITIQUE : sans validation stricte du format, un prefix trop
  // large comme "uploads/" déclencherait l'indexation de TOUS les uploads de
  // TOUS les utilisateurs (viole le "Never" de la spec : pas de
  // ré-indexation globale du bucket depuis cette page).
  test('rejects an overly broad prefix like "uploads/" (400) — must not index the whole bucket', async () => {
    const response = await POST(makeRequest({ prefix: 'uploads/' }))

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('uploads/{slug}/')
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects a prefix containing subfolders (400)', async () => {
    const response = await POST(makeRequest({ prefix: 'uploads/x/y/' }))
    expect(response.status).toBe(400)
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects a prefix attempting path traversal via ".." (400)', async () => {
    const response = await POST(makeRequest({ prefix: 'uploads/../' }))
    expect(response.status).toBe(400)
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('rejects a prefix without the mandatory trailing slash (400)', async () => {
    const response = await POST(makeRequest({ prefix: 'uploads/x' }))
    expect(response.status).toBe(400)
    expect(storageIndexer.indexAll).not.toHaveBeenCalled()
  })

  test('returns 400 on malformed JSON body', async () => {
    const request = {
      json: vi.fn().mockRejectedValue(new SyntaxError('bad json')),
      headers: { get: (key: string) => (key === 'x-user-id' ? 'user-1' : null) },
    } as unknown as Request

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  test('calls storageIndexer.indexAll with a well-formed prefix and returns the IndexationResult synchronously (200)', async () => {
    const result = {
      processed: 3,
      succeeded: 2,
      failed: 1,
      errors: [{ file: 'uploads/x/c.pdf', error: 'boom' }],
      chunksCreated: 12,
      embeddingsGenerated: 12,
    }
    vi.mocked(storageIndexer.indexAll).mockResolvedValue(result)

    const response = await POST(makeRequest({ prefix: 'uploads/x/' }, { 'x-user-id': 'user-1' }))

    expect(storageIndexer.indexAll).toHaveBeenCalledWith({ prefix: 'uploads/x/' })
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual(result)
  })

  test('returns 500 when storageIndexer.indexAll throws', async () => {
    vi.mocked(storageIndexer.indexAll).mockRejectedValue(new Error('Échec Supabase'))

    const response = await POST(makeRequest({ prefix: 'uploads/x/' }))

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toContain('Erreur serveur')
  })
})
