import { NextResponse } from 'next/server';

/**
 * Endpoint de debug pour vérifier les variables d'environnement
 * GET /api/debug/env
 */
export async function GET() {
  return NextResponse.json({
    // Mistral
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY ? '*** (defined)' : 'undefined',
    MISTRAL_API_KEY_LENGTH: process.env.MISTRAL_API_KEY?.length || 0,
    MISTRAL_API_BASE_URL: process.env.MISTRAL_API_BASE_URL,
    MISTRAL_EMBEDDING_MODEL: process.env.MISTRAL_EMBEDDING_MODEL,
    MISTRAL_CHAT_MODEL: process.env.MISTRAL_CHAT_MODEL,
    
    // Supabase
    SUPABASE_URL: process.env.SUPABASE_URL ? '*** (defined)' : 'undefined',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '*** (defined)' : 'undefined',
    
    // Next.js
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '*** (defined)' : 'undefined',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '*** (defined)' : 'undefined',
    
    // Node env
    NODE_ENV: process.env.NODE_ENV,
  });
}
