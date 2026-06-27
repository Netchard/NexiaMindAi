import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    // Get access token from headers (Bearer token)
    const authHeader = request.headers.get('authorization');
    const access_token = authHeader?.replace('Bearer ', '');
    
    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error) {
      logger.error('Récupération user échouée', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to get user' },
        { status: 500 }
      );
    }
    
    logger.info(`User info récupérée pour: ${user?.email}`);
    
    return NextResponse.json({ user });
  } catch (error: any) {
    logger.error('Erreur me endpoint', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
