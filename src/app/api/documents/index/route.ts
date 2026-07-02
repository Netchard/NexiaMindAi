import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const { documentId, content, metadata } = await request.json();
    
    if (!documentId || !content) {
      logger.warn('documentId ou content manquant');
      return NextResponse.json(
        { error: 'documentId and content are required' },
        { status: 400 }
      );
    }
    
    logger.info(`Indexation du document: ${documentId}`, {
      contentLength: content.length,
      metadata,
    });
    
    // TODO: Intégrer avec le service de chunking et embeddings
    // Pour l'instant, simuler l'indexation
    const result = {
      documentId,
      chunksCreated: Math.ceil(content.length / 512),
      embeddingsCreated: Math.ceil(content.length / 512),
      status: 'indexed',
    };
    
    logger.info('Document indexé avec succès', result);
    
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans documents/index', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to list documents
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    logger.info(`Liste des documents demandée`, { source, limit, offset });
    
    // TODO: Récupérer la liste depuis Supabase
    // Pour l'instant, retourner une liste vide
    const documents = [];
    
    logger.info(`Liste des documents retournée (${documents.length} documents)`);
    
    return NextResponse.json({
      documents,
      total: 0,
      limit,
      offset,
    }, { status: 200 });
  } catch (error: any) {
    logger.error('Erreur dans documents/index GET', {
      error: error.message,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
