import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const validSources = ['supabase', 'gitlab', 'nexia', 'all'];

export async function POST(request: Request) {
  try {
    const { source } = await request.json();
    
    if (!source || !validSources.includes(source)) {
      logger.warn('Source invalide pour refresh');
      return NextResponse.json(
        { error: `Invalid source. Must be: ${validSources.join(', ')}` },
        { status: 400 }
      );
    }
    
    logger.info(`Début du rafraîchissement de la source: ${source}`);
    
    // TODO: Intégrer avec les scripts d'indexation
    // Pour l'instant, simuler un rafraîchissement
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    logger.info(`Rafraîchissement terminé pour: ${source}`);
    
    return NextResponse.json({
      success: true,
      source,
      message: `Rafraîchissement de ${source} terminé`,
    }, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans chat/refresh', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
