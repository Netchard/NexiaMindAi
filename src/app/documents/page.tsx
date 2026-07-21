'use client'

/**
 * Page Documents (`/documents`) — dropzone d'upload manuel vers Supabase
 * Storage puis déclenchement de l'indexation RAG sur le préfixe déposé.
 *
 * Voir _bmad-output/implementation-artifacts/spec-documents-upload-indexation.md
 *
 * Auth : `/documents` est protégée par src/proxy.ts (hors de
 * PUBLIC_PAGE_ROUTES, redirection automatique vers /auth/login?redirect=...
 * pour tout visiteur non connecté) — aucune garde d'authentification
 * supplémentaire n'est codée ici (voir Design Notes du spec).
 */

import { useCallback, useRef, useState } from 'react'
import { getExtension, isAllowedFile } from '@/lib/supabase/storage/allowed-extensions'

type FileStatus = 'pending' | 'uploading' | 'uploaded' | 'error'

interface ManagedFile {
  id: string
  file: File
  status: FileStatus
  error?: string
}

interface UploadFileResult {
  fileName: string
  success: boolean
  path?: string
  error?: string
}

interface IndexationSummary {
  processed: number
  succeeded: number
  failed: number
  errors: Array<{ file: string; error: string }>
}

const UPLOAD_GENERIC_ERROR = 'Le téléchargement a échoué. Veuillez réessayer.'
const INDEX_GENERIC_ERROR = "L'indexation a échoué. Veuillez réessayer."

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function statusLabel(status: FileStatus): string {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'uploading':
      return 'Téléchargement...'
    case 'uploaded':
      return 'Prêt à indexer'
    case 'error':
      return 'Erreur'
  }
}

function statusColorClass(status: FileStatus): string {
  switch (status) {
    case 'uploaded':
      return 'text-[#8FD9B6]'
    case 'error':
      return 'text-chat-error-soft'
    default:
      return 'text-chat-ink-subtle'
  }
}

let fileIdCounter = 0
function nextFileId(): string {
  fileIdCounter += 1
  return `f-${fileIdCounter}-${Date.now()}`
}

export default function DocumentsPage() {
  const [files, setFiles] = useState<ManagedFile[]>([])
  const [rejectedMessages, setRejectedMessages] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [indexError, setIndexError] = useState<string | null>(null)
  const [uploadPrefix, setUploadPrefix] = useState<string | null>(null)
  const [indexSummary, setIndexSummary] = useState<IndexationSummary | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const accepted: ManagedFile[] = []
    const rejected: string[] = []

    Array.from(incoming).forEach((file) => {
      if (isAllowedFile(file.name)) {
        accepted.push({ id: nextFileId(), file, status: 'pending' })
      } else {
        rejected.push(`« ${file.name} » : type de fichier non supporté (.${getExtension(file.name) || '?'})`)
      }
    })

    if (accepted.length > 0) {
      setFiles((prev) => [...prev, ...accepted])
    }
    setRejectedMessages(rejected)
  }, [])

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files?.length) {
      addFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }

  // Un fichier déjà téléchargé ("uploaded") est déjà committé côté Supabase
  // Storage : le retirer de la liste locale sans le supprimer du stockage
  // créerait un décalage entre ce qui est affiché et ce qui sera réellement
  // indexé (tout le préfixe est traité). Seuls pending/error/uploading
  // restent retirables avant tout envoi effectif. Garde redondante avec le
  // masquage du bouton "✕" (défense en profondeur).
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id || f.status === 'uploaded'))
  }

  const hasUploadableFiles = files.some((f) => f.status === 'pending' || f.status === 'error')
  const hasReadyFiles = files.some((f) => f.status === 'uploaded')

  const handleUpload = async () => {
    const toUpload = files.filter((f) => f.status === 'pending' || f.status === 'error')
    if (toUpload.length === 0) return

    setIsUploading(true)
    setUploadError(null)
    const uploadingIds = new Set(toUpload.map((f) => f.id))
    setFiles((prev) =>
      prev.map((f) => (uploadingIds.has(f.id) ? { ...f, status: 'uploading', error: undefined } : f))
    )

    // Position de chaque fichier envoyé dans `toUpload` — le serveur répond
    // avec les résultats dans le même ordre que les fichiers reçus
    // (FormData.getAll('files') préserve l'ordre d'ajout). On mappe par
    // INDEX plutôt que par nom : deux fichiers du même lot peuvent porter le
    // même nom, et un matching par nom renverrait toujours la première
    // correspondance pour les deux, affichant le mauvais statut sur le
    // mauvais fichier.
    const idToIndex = new Map(toUpload.map((f, idx) => [f.id, idx]))

    try {
      const formData = new FormData()
      // Réutilise le préfixe de la session en cours (s'il existe déjà) pour
      // que plusieurs lots déposés avant un même clic "Lancer l'indexation"
      // finissent tous dans le même préfixe — sinon seul le dernier lot
      // uploadé serait couvert par l'indexation finale.
      if (uploadPrefix) {
        formData.append('prefix', uploadPrefix)
      }
      toUpload.forEach((f) => formData.append('files', f.file, f.file.name))

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setUploadError(errorData?.error || UPLOAD_GENERIC_ERROR)
        setFiles((prev) =>
          prev.map((f) => (uploadingIds.has(f.id) ? { ...f, status: 'error', error: 'Échec du téléchargement' } : f))
        )
        return
      }

      const data: { prefix: string; results: UploadFileResult[] } = await response.json()
      setUploadPrefix(data.prefix)

      setFiles((prev) =>
        prev.map((f) => {
          const index = idToIndex.get(f.id)
          if (index === undefined) return f
          const result = data.results[index]
          if (result?.success) {
            return { ...f, status: 'uploaded', error: undefined }
          }
          return { ...f, status: 'error', error: result?.error || 'Échec du téléchargement' }
        })
      )
    } catch {
      setUploadError(UPLOAD_GENERIC_ERROR)
      setFiles((prev) =>
        prev.map((f) => (uploadingIds.has(f.id) ? { ...f, status: 'error', error: 'Échec du téléchargement' } : f))
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleIndex = async () => {
    if (!uploadPrefix) return

    setIsIndexing(true)
    setIndexError(null)

    try {
      const response = await fetch('/api/documents/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: uploadPrefix }),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setIndexError(errorData?.error || INDEX_GENERIC_ERROR)
        return
      }

      const data = await response.json()
      setIndexSummary({
        processed: data.processed ?? 0,
        succeeded: data.succeeded ?? 0,
        failed: data.failed ?? 0,
        errors: data.errors ?? [],
      })
    } catch {
      setIndexError(INDEX_GENERIC_ERROR)
    } finally {
      setIsIndexing(false)
    }
  }

  const readyFileNames = files.filter((f) => f.status === 'uploaded').map((f) => f.file.name)

  return (
    <div className="flex flex-1 flex-col bg-chat-surface">
      <section className="mx-auto w-full max-w-[860px] px-6 py-16 sm:px-10">
        <h1 className="font-display text-[32px] font-semibold text-chat-ink-strong sm:text-[38px]">
          Documents
        </h1>
        <p className="mt-3 text-base text-chat-ink-muted">
          Déposez vos fichiers, téléchargez-les vers le stockage, puis lancez leur indexation dans le
          pipeline RAG.
        </p>

        {/* Dropzone */}
        <div
          data-testid="documents-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`mt-8 flex flex-col items-center justify-center gap-3 rounded-chat-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
            isDragOver
              ? 'border-transparent bg-gradient-to-br from-auth-accent-blue-from/10 to-auth-accent-blue-to/10 ring-2 ring-auth-accent-blue-to'
              : 'border-chat-border-soft bg-chat-surface-panel'
          }`}
        >
          <span aria-hidden="true" className="text-3xl">
            📄
          </span>
          <p className="text-sm font-medium text-chat-ink-strong">
            Glissez-déposez vos fichiers ici, ou
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-chat-sm border border-chat-border-soft px-3.5 py-2 text-[13px] font-medium text-chat-ink-muted transition-colors hover:text-chat-ink-strong"
          >
            Parcourir vos fichiers
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleInputChange}
            aria-label="Sélectionner des fichiers à déposer"
          />
          <p className="text-xs text-chat-ink-subtle">
            Formats acceptés : PDF, Word, Excel, PowerPoint, texte, markdown, csv, json...
          </p>
        </div>

        {rejectedMessages.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {rejectedMessages.map((msg) => (
              <div
                key={msg}
                className="rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2 text-sm text-chat-error-soft"
              >
                ❌ {msg}
              </div>
            ))}
          </div>
        )}

        {/* Liste des fichiers */}
        {files.length > 0 && (
          <div className="mt-6 rounded-chat-lg border border-chat-border-soft bg-chat-surface-panel">
            <ul className="nm-scroll max-h-[320px] divide-y divide-chat-border-soft overflow-y-auto">
              {files.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-chat-ink-strong">{f.file.name}</p>
                    <p className="text-xs text-chat-ink-subtle">
                      {formatFileSize(f.file.size)}
                      {f.status === 'error' && f.error ? ` · ${f.error}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-3">
                    <span className={`text-xs font-medium ${statusColorClass(f.status)}`}>
                      {statusLabel(f.status)}
                    </span>
                    {(f.status === 'pending' || f.status === 'error') && (
                      <button
                        type="button"
                        onClick={() => removeFile(f.id)}
                        aria-label={`Retirer ${f.file.name}`}
                        className="text-chat-ink-subtle transition-colors hover:text-chat-ink-strong"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || !hasUploadableFiles}
            className="h-10 rounded-chat-sm border border-chat-border-soft px-4 text-[13px] font-medium text-chat-ink-muted transition-colors hover:text-chat-ink-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" />
                Téléchargement...
              </>
            ) : (
              'Télécharger'
            )}
          </button>

          <button
            type="button"
            onClick={handleIndex}
            disabled={isIndexing || !uploadPrefix || !hasReadyFiles}
            className="h-10 rounded-chat-sm bg-gradient-to-br from-chat-primary to-chat-primary-active px-4 text-[13px] font-semibold text-chat-on-primary transition-[filter] hover:brightness-[1.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isIndexing ? (
              <>
                <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]" />
                Indexation...
              </>
            ) : (
              "Lancer l'indexation"
            )}
          </button>
        </div>

        {uploadError && (
          <div className="mt-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft">
            ❌ {uploadError}
          </div>
        )}

        {indexError && (
          <div className="mt-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface px-3.5 py-2.5 text-sm text-chat-error-soft">
            ❌ {indexError}
          </div>
        )}

        {/* Résumé final */}
        {indexSummary && (
          <div className="mt-6 rounded-chat-lg border border-[rgba(47,158,106,.4)] bg-[rgba(47,158,106,.1)] px-5 py-4">
            <h2 className="text-sm font-semibold text-[#C9E6D8]">Résumé de l&apos;indexation</h2>
            <p className="mt-1 text-sm text-[#C9E6D8]">
              {readyFileNames.length} document(s) déposé(s) : {readyFileNames.join(', ')}
            </p>
            <p className="mt-1 text-sm text-[#C9E6D8]">
              {indexSummary.succeeded} indexé(s) avec succès, {indexSummary.failed} en échec.
            </p>
            {indexSummary.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-chat-error-soft">
                {indexSummary.errors.map((e) => (
                  <li key={e.file}>
                    {e.file} : {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
