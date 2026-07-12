/**
 * Fonctions utilitaires pour les statistiques admin
 * Fait partie de l'API admin
 */

interface UsageStats {
  conversations: number;
  messages: number;
  tokensUsed: number;
}

interface StatsResponse {
  general: {
    totalUsers: number;
    totalConversations: number;
    totalMessages: number;
    totalTokensUsed: number;
  };
  byPeriod: {
    today: UsageStats;
    last7Days: UsageStats;
    last30Days: UsageStats;
  };
  byClient?: Record<string, UsageStats>;
}

/**
 * Fonction utilitaire pour appeler l'endpoint /api/admin/stats depuis le frontend
 */
export async function getAdminStats(): Promise<StatsResponse> {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
  const url = new URL('/api/admin/stats', baseUrl);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
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

export type { StatsResponse, UsageStats };
