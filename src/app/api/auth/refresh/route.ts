import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { refresh_token } = await request.json();
    
    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      );
    }
    
    // Note: Supabase v2 uses refreshSession with the refresh token
    // The refresh token is typically stored in cookies or local storage
    const { data, error } = await supabase.auth.refreshSession({ 
      refresh_token 
    } as any);
    
    if (error) {
      logger.error('Refresh token échoué', { error: error.message });
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 500 }
      );
    }
    
    logger.info('Token rafraîchi avec succès');
    
    return NextResponse.json({
      session: data.session,
      user: data.user,
    });
  } catch (error: any) {
    logger.error('Erreur refresh token', { error: error.message });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
