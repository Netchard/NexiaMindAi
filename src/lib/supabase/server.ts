/**
 * Client Supabase pour l'application
 * Fait partie de l'infrastructure Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export { createClient } from '@supabase/supabase-js';
