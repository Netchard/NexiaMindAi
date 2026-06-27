import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');
    
    if (!userId) {
      logger.warn('userId manquant dans history');
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }
    
    logger.info(`Récupération historique pour user: ${userId}`, { conversationId });
    
    // TODO: Récupérer depuis Supabase
    // Pour l'instant, retourner un historique vide ou de test
    const history = conversationId
      ? []
      : [
          {
            id: '1',
            conversationId: 'conv-1',
            content: 'Bonjour, comment puis-je vous aider ?',
            role: 'assistant',
            createdAt: new Date().toISOString(),
          },
        ];
    
    logger.info(`Historique retourné (${history.length} messages)`);
    
    return NextResponse.json(history, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans chat/history', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
