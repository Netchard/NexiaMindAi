import { supabase } from './src/lib/supabase/client';
import 'dotenv/config';


async function testConnection() {
  try {
    // Tester la connexion
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) throw error;

    console.log('✅ Connexion à Supabase réussie !');
    console.log('📊 Nombre de profils trouvés :', data?.length || 0);

    // Tester pgvector
    const { data: embeddingsData } = await supabase
      .from('embeddings')
      .select('*')
      .limit(1);

    console.log('✅ Accès à la table embeddings OK');

    return true;
  } catch (err) {
    console.error('❌ Erreur de connexion :', err);
    return false;
  }
}

testConnection();