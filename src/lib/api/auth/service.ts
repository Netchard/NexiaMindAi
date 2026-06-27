import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Service d'authentification
 * Gère toutes les opérations liées à l'authentification des utilisateurs
 */
export class AuthService {
  /**
   * Connexion avec email et mot de passe
   */
  static async login(email: string, password: string) {
    logger.info(`Tentative de login pour: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.error('Login échoué', { email, error: error.message });
      throw new Error('Invalid credentials');
    }
    
    logger.info(`Login réussi pour: ${email}`);
    return { user: data.user, session: data.session };
  }
  
  /**
   * Déconnexion
   */
  static async logout(accessToken: string) {
    logger.info('Tentative de logout');
    
    const { error } = await supabase.auth.signOut(accessToken);
    
    if (error) {
      logger.error('Logout échoué', { error: error.message });
      throw new Error('Failed to logout');
    }
    
    logger.info('Logout réussi');
    return { success: true };
  }
  
  /**
   * Récupérer les informations de l'utilisateur
   */
  static async getUser(accessToken: string) {
    logger.info('Récupération des informations utilisateur');
    
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      logger.error('Récupération user échouée', { error: error.message });
      throw new Error('Failed to get user');
    }
    
    logger.info(`User info récupérée pour: ${user?.email}`);
    return { user };
  }
  
  /**
   * Rafraîchir le token
   */
  static async refreshToken(refreshToken: string) {
    logger.info('Tentative de rafraîchissement du token');
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    } as any);
    
    if (error) {
      logger.error('Refresh token échoué', { error: error.message });
      throw new Error('Failed to refresh token');
    }
    
    logger.info('Token rafraîchi avec succès');
    return { session: data.session, user: data.user };
  }
  
  /**
   * Vérifier si l'utilisateur a le rôle admin
   */
  static async isAdmin(accessToken: string): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(accessToken);
      
      if (error || !user) {
        return false;
      }
      
      // TODO: Vérifier le rôle depuis la table profiles
      // Pour l'instant, retourner false par défaut
      logger.info(`Vérification rôle admin pour: ${user.email}`);
      return false;
    } catch (error: any) {
      logger.error('Erreur vérification rôle admin', { error: error.message });
      return false;
    }
  }
}
