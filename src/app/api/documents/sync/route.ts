import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { source, sourceId } = await request.json();
    
    if (!source) {
      logger.warn('Source manquante');
      return NextResponse.json(
        { error: 'Source is required' },
        { status: 400 }
      );
    }
    
    logger.info(`Synchronisation de la source: ${source}`, { sourceId });
    
    // TODO: Intégrer avec les services d'indexation
    // Pour l'instant, simuler une synchronisation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = {
      source,
      sourceId,
      documentsProcessed: 10,
      chunksCreated: 45,
      embeddingsCreated: 45,
      status: 'completed',
    };
    
    logger.info('Synchronisation terminée avec succès', result);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans documents/sync', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
