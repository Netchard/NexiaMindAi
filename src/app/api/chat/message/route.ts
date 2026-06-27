import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { message, conversationId, userId } = await request.json();
    
    if (!message || !userId) {
      logger.warn('Message ou userId manquant');
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }
    
    logger.info(`Nouveau message de ${userId}`, {
      messageLength: message.length,
      conversationId,
    });
    
    // TODO: Intégrer avec le pipeline RAG
    // Pour l'instant, retourner un message de confirmation
    const response = {
      id: Date.now().toString(),
      content: `Message reçu: ${message.substring(0, 50)}...`,
      role: 'assistant',
      conversationId: conversationId || 'new',
      createdAt: new Date().toISOString(),
    };
    
    logger.info('Message traité avec succès');
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans chat/message', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
