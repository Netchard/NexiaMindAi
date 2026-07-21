/**
 * Tests unitaires pour l'endpoint API /api/documents/upload
 * Fait partie de la spec "Page Documents — upload et indexation manuelle RAG"
 */

import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest'
import { POST } from '../route'
import { storageClient } from '@/lib/supabase/storage/client'

vi.mock('@/lib/supabase/storage/client', () => ({
  storageClient: { uploadFile: vi.fn() },
}))

// jsdom (environnement de test) n'implémente pas Blob/File.arrayBuffer() —
// le runtime Next.js/Node réel (undici) le supporte nativement, donc la
// route elle-même n'a pas besoin d'adaptation. Polyfill local via
// FileReader (implémenté par jsdom), scopé à ce fichier de test uniquement.
beforeAll(() => {
  if (!File.prototype.arrayBuffer) {
    File.prototype.arrayBuffer = function (this: File): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(this);
      });
    };
  }
});

function makeFile(name: string, content = 'hello', type = 'text/plain') {
  return new File([content], name, { type })
}

function uploadFileResult(overrides: Partial<{ name: string; path: string }> = {}) {
  return {
    name: overrides.name ?? 'a.pdf',
    path: overrides.path ?? 'uploads/x/0-a.pdf',
    contentType: 'text/plain',
    size: 5,
    updatedAt: new Date().toISOString(),
  }
}

interface UploadFileResult {
  fileName: string
  success: boolean
  path?: string
  error?: string
}

// x-user-id présent par défaut (comme injecté par src/proxy.ts en usage
// réel) — le test dédié à la vérification défensive du userId l'omet
// explicitement.
function makeRequest(formData: FormData, headers: Record<string, string> = { 'x-user-id': 'user-1' }) {
  return {
    formData: vi.fn().mockResolvedValue(formData),
    headers: { get: (key: string) => headers[key] ?? null },
  } as unknown as Request
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/documents/upload', () => {
  test('rejects requests without x-user-id (401)', async () => {
    const formData = new FormData()
    formData.append('files', makeFile('a.pdf'))

    const response = await POST(makeRequest(formData, {}))

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toContain('Non autorisé')
    expect(storageClient.uploadFile).not.toHaveBeenCalled()
  })

  test('uploads valid files under a dedicated uploads/{slug}/ prefix and returns per-file results', async () => {
    vi.mocked(storageClient.uploadFile).mockResolvedValue(uploadFileResult())

    const formData = new FormData()
    formData.append('files', makeFile('a.pdf'))

    const response = await POST(makeRequest(formData, { 'x-user-id': 'user-1' }))
    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.prefix).toMatch(/^uploads\/[^/]+\/$/)
    expect(data.succeeded).toBe(1)
    expect(data.failed).toBe(0)
    expect(data.results).toEqual([{ fileName: 'a.pdf', success: true, path: `${data.prefix}0-a.pdf` }])
    expect(storageClient.uploadFile).toHaveBeenCalledWith(`${data.prefix}0-a.pdf`, expect.any(Buffer), 'text/plain')
  })

  test('rejects unsupported file types (e.g. images) without ever calling uploadFile', async () => {
    const formData = new FormData()
    formData.append('files', makeFile('photo.png', 'x', 'image/png'))

    const response = await POST(makeRequest(formData))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.succeeded).toBe(0)
    expect(data.failed).toBe(1)
    expect(data.results[0]).toMatchObject({ fileName: 'photo.png', success: false })
    expect(data.results[0].error).toMatch(/non supporté/)
    expect(storageClient.uploadFile).not.toHaveBeenCalled()
  })

  test('reports a per-file error when one upload succeeds and another fails (partial failure)', async () => {
    vi.mocked(storageClient.uploadFile)
      .mockResolvedValueOnce(uploadFileResult())
      .mockRejectedValueOnce(new Error('Échec du stockage'))

    const formData = new FormData()
    formData.append('files', makeFile('a.pdf'))
    formData.append('files', makeFile('b.docx'))

    const response = await POST(makeRequest(formData))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.succeeded).toBe(1)
    expect(data.failed).toBe(1)
    expect(data.results.find((r: UploadFileResult) => r.fileName === 'a.pdf')).toMatchObject({ success: true })
    expect(data.results.find((r: UploadFileResult) => r.fileName === 'b.docx')).toMatchObject({
      success: false,
      error: 'Échec du stockage',
    })
  })

  // Régression HIGH : file.name est fourni par le client et n'est pas fiable
  // — sans sanitization, "../../secret.pdf" pourrait sortir du préfixe
  // uploads/{slug}/ et écraser un objet arbitraire du bucket (upsert:true).
  test('sanitizes file.name to prevent path traversal outside the upload prefix', async () => {
    vi.mocked(storageClient.uploadFile).mockResolvedValue(uploadFileResult())

    const formData = new FormData()
    formData.append('files', makeFile('../../secret.pdf'))

    const response = await POST(makeRequest(formData))
    expect(response.status).toBe(200)

    const [calledPath] = vi.mocked(storageClient.uploadFile).mock.calls[0]
    expect(calledPath).not.toContain('..')
    expect(calledPath.endsWith('secret.pdf')).toBe(true)
  })

  // Régression HIGH : deux fichiers du même lot portant le même nom ne
  // doivent jamais partager le même chemin de stockage (upsert:true
  // écraserait silencieusement le premier).
  test('gives each file in a batch a unique storage path even when names collide', async () => {
    vi.mocked(storageClient.uploadFile).mockResolvedValue(uploadFileResult())

    const formData = new FormData()
    formData.append('files', makeFile('dup.txt', 'first'))
    formData.append('files', makeFile('dup.txt', 'second'))

    const response = await POST(makeRequest(formData))
    expect(response.status).toBe(200)

    const calledPaths = vi.mocked(storageClient.uploadFile).mock.calls.map(([path]) => path)
    expect(calledPaths).toHaveLength(2)
    expect(new Set(calledPaths).size).toBe(2)
  })

  // Régression HIGH : plusieurs lots déposés avant le clic "Lancer
  // l'indexation" doivent finir dans le même préfixe de session, sinon
  // seul le dernier lot uploadé serait couvert par l'indexation finale.
  test('reuses a valid prefix supplied by the client instead of generating a new one', async () => {
    vi.mocked(storageClient.uploadFile).mockResolvedValue(uploadFileResult())

    const formData = new FormData()
    formData.append('prefix', 'uploads/existing-session/')
    formData.append('files', makeFile('a.pdf'))

    const response = await POST(makeRequest(formData))
    const data = await response.json()

    expect(data.prefix).toBe('uploads/existing-session/')
    expect(storageClient.uploadFile).toHaveBeenCalledWith(
      'uploads/existing-session/0-a.pdf',
      expect.any(Buffer),
      'text/plain'
    )
  })

  test('ignores a malformed/forged prefix supplied by the client and generates a fresh one', async () => {
    vi.mocked(storageClient.uploadFile).mockResolvedValue(uploadFileResult())

    const formData = new FormData()
    formData.append('prefix', 'uploads/') // trop large — rejeté, cf. index/route.ts
    formData.append('files', makeFile('a.pdf'))

    const response = await POST(makeRequest(formData))
    const data = await response.json()

    expect(data.prefix).not.toBe('uploads/')
    expect(data.prefix).toMatch(/^uploads\/[^/]+\/$/)
  })

  test('rejects requests with no files (400)', async () => {
    const formData = new FormData()
    const response = await POST(makeRequest(formData))

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('fichier')
    expect(storageClient.uploadFile).not.toHaveBeenCalled()
  })

  test('returns 400 when the FormData body is malformed', async () => {
    const request = {
      formData: vi.fn().mockRejectedValue(new Error('bad body')),
      headers: { get: (key: string) => (key === 'x-user-id' ? 'user-1' : null) },
    } as unknown as Request

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
