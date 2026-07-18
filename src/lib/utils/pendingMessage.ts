/**
 * Handoff d'un message en attente entre l'accueil (`/`, puces de suggestion —
 * voir src/app/page.tsx) et une conversation nouvellement créée sans passer
 * par ConversationsProvider (non monté sur `/`). Le message est écrit avant
 * la navigation puis lu/consommé une fois par chat/[conversationId]/page.tsx.
 */

const KEY_PREFIX = 'nexiamind:pending-message:'
const MAX_AGE_MS = 60_000

interface PendingMessagePayload {
  text: string
  ts: number
}

function key(conversationId: string): string {
  return `${KEY_PREFIX}${conversationId}`
}

/** Stocke un message en attente pour la conversation donnée. Échec silencieux (quota/storage désactivé). */
export function writePendingMessage(conversationId: string, text: string): void {
  try {
    const payload: PendingMessagePayload = { text, ts: Date.now() }
    sessionStorage.setItem(key(conversationId), JSON.stringify(payload))
  } catch {
    // Le message en attente est un confort (évite de retaper la question) —
    // son échec ne doit jamais bloquer la navigation déjà décidée par l'appelant.
  }
}

/**
 * Lit et retire le message en attente pour la conversation donnée, s'il existe
 * et n'est pas trop ancien (navigation interrompue puis conversation rouverte
 * bien plus tard — évite un renvoi surprise d'un message périmé).
 */
export function readAndClearPendingMessage(conversationId: string): string | null {
  const k = key(conversationId)
  try {
    const raw = sessionStorage.getItem(k)
    if (!raw) return null
    sessionStorage.removeItem(k)
    const payload = JSON.parse(raw) as PendingMessagePayload
    if (Date.now() - payload.ts > MAX_AGE_MS) return null
    return payload.text
  } catch {
    return null
  }
}
