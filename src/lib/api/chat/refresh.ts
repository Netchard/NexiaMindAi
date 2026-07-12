/**
 * Fonctions utilitaires pour le rafraîchissement des sources
 * Fait partie de l'API chat/refresh
 */

interface RefreshRequest {
  sourceId: string;
  client?: string;
  documentType?: string;
}

interface RefreshResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  taskId: string;
  message: string;
  documentsProcessed?: number;
  errors?: string[];
}

/**
 * Fonction utilitaire pour appeler l'endpoint /api/chat/refresh depuis le frontend
 */
export async function triggerRefresh(
  sourceId: string,
  client?: string,
  documentType?: string
): Promise<RefreshResponse> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL('/api/chat/refresh', baseUrl);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, client, documentType }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Erreur ${response.status}: ${errorData.error || response.statusText}`
    );
  }

  return response.json();
}

export type { RefreshRequest, RefreshResponse };
