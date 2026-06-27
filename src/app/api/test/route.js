import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  logger.info('Test de requête API');
  return NextResponse.json({ message: 'Test successful' });
}