import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    // Get access token from headers (Bearer token)
    const authHeader = request.headers.get('authorization');
    const access_token = authHeader?.replace('Bearer ', '');
    
    if (!access_token) {
      logger.warn('access_token manquant pour stats');
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est admin
    // TODO: Intégrer avec la vérification des rôles
    // Pour l'instant, on suppose que le middleware d'auth a déjà vérifié
    logger.info('Récupération des statistiques admin');
    
    // Statistiques simulées
    const stats = {
      totalUsers: 42,
      totalConversations: 156,
      totalMessages: 892,
      totalDocuments: 234,
      totalChunks: 12450,
      totalEmbeddings: 12450,
      storageUsed: '2.4 GB',
      lastSync: new Date().toISOString(),
    };
    
    logger.info('Statistiques admin retournées');
    
    return NextResponse.json(stats, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans admin/stats', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
