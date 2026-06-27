import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { access_token } = await request.json();
    
    if (!access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }
    
    const { error } = await supabase.auth.signOut(access_token);
    
    if (error) {
      logger.error('Logout échoué', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to logout' },
        { status: 500 }
      );
    }
    
    logger.info('Logout réussi');
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error('Erreur de logout', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
