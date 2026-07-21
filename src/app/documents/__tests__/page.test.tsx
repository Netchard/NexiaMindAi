import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import DocumentsPage from '../page'

function makeFile(name: string, content = 'hello', type = 'text/plain') {
  return new File([content], name, { type })
}

function dropFiles(dropzone: HTMLElement, files: File[]) {
  fireEvent.drop(dropzone, { dataTransfer: { files } })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('DocumentsPage (/documents)', () => {
  test('dropping supported files adds them to the list and enables "Télécharger"', () => {
    render(<DocumentsPage />)
    const dropzone = screen.getByTestId('documents-dropzone')

    dropFiles(dropzone, [makeFile('a.pdf'), makeFile('b.docx')])

    expect(screen.getByText('a.pdf')).toBeInTheDocument()
    expect(screen.getByText('b.docx')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger' })).toBeEnabled()
  })

  test('dropping an unsupported file type rejects it inline and never adds it to the list', () => {
    render(<DocumentsPage />)
    const dropzone = screen.getByTestId('documents-dropzone')

    dropFiles(dropzone, [makeFile('photo.png', 'x', 'image/png')])

    expect(screen.getByText(/photo\.png.*non supporté/)).toBeInTheDocument()
    expect(screen.queryByText('photo.png')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Télécharger' })).toBeDisabled()
  })

  test('uploading files calls the upload API and marks successful files "Prêt à indexer"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        prefix: 'uploads/abc/',
        results: [{ fileName: 'a.pdf', success: true, path: 'uploads/abc/a.pdf' }],
        succeeded: 1,
        failed: 0,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))

    await waitFor(() => expect(screen.getByText('Prêt à indexer')).toBeInTheDocument())

    expect(fetchMock).toHaveBeenCalledWith('/api/documents/upload', expect.objectContaining({ method: 'POST' }))
    expect(screen.getByRole('button', { name: "Lancer l'indexation" })).toBeEnabled()
  })

  test('partial upload failure keeps the successful file ready and leaves the failed one retryable', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        prefix: 'uploads/abc/',
        results: [
          { fileName: 'a.pdf', success: true, path: 'uploads/abc/a.pdf' },
          { fileName: 'b.docx', success: false, error: 'Échec réseau' },
        ],
        succeeded: 1,
        failed: 1,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf'), makeFile('b.docx')])

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))

    await waitFor(() => expect(screen.getByText('Prêt à indexer')).toBeInTheDocument())
    expect(screen.getByText('Erreur')).toBeInTheDocument()
    expect(screen.getByText(/Échec réseau/)).toBeInTheDocument()
    // Le fichier en erreur reste "retryable" : Télécharger redevient actif.
    expect(screen.getByRole('button', { name: 'Télécharger' })).toBeEnabled()
  })

  test('launching indexation after a successful upload shows the final summary', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prefix: 'uploads/abc/',
          results: [{ fileName: 'a.pdf', success: true, path: 'uploads/abc/a.pdf' }],
          succeeded: 1,
          failed: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          processed: 1,
          succeeded: 1,
          failed: 0,
          errors: [],
          chunksCreated: 3,
          embeddingsGenerated: 3,
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    await waitFor(() => expect(screen.getByRole('button', { name: "Lancer l'indexation" })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: "Lancer l'indexation" }))

    expect(await screen.findByText(/1 document\(s\) déposé\(s\) : a\.pdf/)).toBeInTheDocument()
    expect(screen.getByText(/1 indexé\(s\) avec succès, 0 en échec/)).toBeInTheDocument()
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/documents/index',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ prefix: 'uploads/abc/' }) })
    )
  })

  test('a global network failure during upload shows a generic error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))

    expect(await screen.findByText(/Le téléchargement a échoué\. Veuillez réessayer\./)).toBeInTheDocument()
  })

  // Régression HIGH : deux fichiers du même lot peuvent porter le même nom
  // affiché — le matching client doit se faire par position (ordre d'envoi),
  // pas par nom, sinon les deux lignes affichent le statut du premier match.
  test('matches upload results by position so duplicate filenames get their own status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        prefix: 'uploads/abc/',
        results: [
          { fileName: 'dup.txt', success: true, path: 'uploads/abc/0-dup.txt' },
          { fileName: 'dup.txt', success: false, error: 'Collision' },
        ],
        succeeded: 1,
        failed: 1,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('dup.txt', 'first'), makeFile('dup.txt', 'second')])

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))

    await waitFor(() => expect(screen.getAllByText('dup.txt')).toHaveLength(2))
    const items = screen.getAllByText('dup.txt').map((el) => el.closest('li') as HTMLElement)

    await waitFor(() => {
      expect(within(items[0]).getByText('Prêt à indexer')).toBeInTheDocument()
      expect(within(items[1]).getByText('Erreur')).toBeInTheDocument()
    })
  })

  // Régression HIGH : plusieurs lots déposés avant le clic "Lancer
  // l'indexation" doivent partager le même préfixe de session, sinon
  // l'indexation finale ne couvrirait que le dernier lot uploadé.
  test('reuses the same upload prefix across successive batches before indexation is launched', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prefix: 'uploads/session-1/',
          results: [{ fileName: 'a.pdf', success: true }],
          succeeded: 1,
          failed: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prefix: 'uploads/session-1/',
          results: [{ fileName: 'b.pdf', success: true }],
          succeeded: 1,
          failed: 0,
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    await waitFor(() => expect(screen.getByText('Prêt à indexer')).toBeInTheDocument())

    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('b.pdf')])
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const secondCallBody = fetchMock.mock.calls[1][1].body as FormData
    expect(secondCallBody.get('prefix')).toBe('uploads/session-1/')

    // Les deux lots restent "prêts à indexer" : le résumé final les couvrira tous les deux.
    expect(screen.getAllByText('Prêt à indexer')).toHaveLength(2)
  })

  // Régression edge-case : un fichier déjà uploadé est déjà committé côté
  // Storage — le retirer de la liste ne l'empêche pas d'être indexé (tout le
  // préfixe est traité), ce qui créerait un résumé trompeur.
  test('hides the remove button for files that have already been uploaded', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        prefix: 'uploads/abc/',
        results: [{ fileName: 'a.pdf', success: true }],
        succeeded: 1,
        failed: 0,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])
    expect(screen.getByRole('button', { name: 'Retirer a.pdf' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    await waitFor(() => expect(screen.getByText('Prêt à indexer')).toBeInTheDocument())

    expect(screen.queryByRole('button', { name: 'Retirer a.pdf' })).not.toBeInTheDocument()
  })

  test('a global failure during indexation shows a generic error message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          prefix: 'uploads/abc/',
          results: [{ fileName: 'a.pdf', success: true, path: 'uploads/abc/a.pdf' }],
          succeeded: 1,
          failed: 0,
        }),
      })
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) })
    vi.stubGlobal('fetch', fetchMock)

    render(<DocumentsPage />)
    dropFiles(screen.getByTestId('documents-dropzone'), [makeFile('a.pdf')])
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger' }))
    await waitFor(() => expect(screen.getByRole('button', { name: "Lancer l'indexation" })).toBeEnabled())

    fireEvent.click(screen.getByRole('button', { name: "Lancer l'indexation" }))

    expect(await screen.findByText(/L'indexation a échoué\. Veuillez réessayer\./)).toBeInTheDocument()
  })
})
