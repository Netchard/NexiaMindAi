/**
 * Chat API client (frontend-only, no server-side deps).
 * Mirrors the request/response contracts of src/app/api/chat/{message,history}/route.ts —
 * do not import from those route.ts files directly (see story Dev Notes: they pull in
 * next/server + server-only env vars, which would crash a client bundle on load).
 */

export interface SendMessageResponse {
  id: string
  conversationId: string
  role: 'assistant'
  content: string
  formattedContent?: string
  citations?: unknown[]
  metadata: {
    model: string
    tokensUsed: number
    processingTime: number
    timestamp: string
  }
}

export interface ConversationHistoryItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messageCount: number
}

export interface HistoryResponse {
  conversations: ConversationHistoryItem[]
  total: number
  offset: number
  limit: number
}

async function parseErrorMessage(response: Response): Promise<string> {
  const errorData = await response.json().catch(() => ({}))
  return errorData.error || response.statusText
}

export async function sendMessage(
  message: string, 
  conversationId?: string,
  filters?: {
    theme?: string;
    documentFormat?: string;
    role?: string;
    source?: string;
  }
): Promise<SendMessageResponse> {
  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      message, 
      conversationId,
      filters: filters && Object.keys(filters).length > 0 ? filters : undefined,
    }),
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}

export async function getHistory(limit = 50, offset = 0): Promise<HistoryResponse> {
  const url = `/api/chat/history?limit=${limit}&offset=${offset}`
  
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return response.json()
}
