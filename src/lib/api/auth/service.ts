import { supabase as supabaseServer } from '@/lib/supabase/server';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack

// Utilise le client serveur standardisé
// La validation est déjà faite dans server.ts

/**
 * Service d'authentification
 * Gère toutes les opérations liées à l'authentification des utilisateurs
 */
export class AuthService {
  /**
   * Connexion avec email et mot de passe
   */
  static async login(email: string, password: string) {
    console.info(`Tentative de login pour: ${email}`);
    
    const { data, error } = await supabaseServer.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Login échoué', { email, error: error.message });
      throw new Error('Invalid credentials');
    }
    
    console.info(`Login réussi pour: ${email}`);
    return { user: data.user, session: data.session };
  }
  
  /**
   * Déconnexion
   */
  static async logout(_accessToken: string) {
    console.info('Tentative de logout');

    const { error } = await supabaseServer.auth.signOut();
    
    if (error) {
      console.error('Logout échoué', { error: error.message });
      throw new Error('Failed to logout');
    }
    
    console.info('Logout réussi');
    return { success: true };
  }
  
  /**
   * Récupérer les informations de l'utilisateur
   */
  static async getUser(accessToken: string) {
    console.info('Récupération des informations utilisateur');
    
    const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken);
    
    if (error) {
      console.error('Récupération user échouée', { error: error.message });
      throw new Error('Failed to get user');
    }
    
    console.info(`User info récupérée pour: ${user?.email}`);
    return { user };
  }
  
  /**
   * Rafraîchir le token
   */
  static async refreshToken(refreshToken: string) {
    console.info('Tentative de rafraîchissement du token');
    
    const { data, error } = await supabaseServer.auth.refreshSession({
      refresh_token: refreshToken
    } as any);
    
    if (error) {
      console.error('Refresh token échoué', { error: error.message });
      throw new Error('Failed to refresh token');
    }
    
    console.info('Token rafraîchi avec succès');
    return { session: data.session, user: data.user };
  }
  
  /**
   * Vérifier si l'utilisateur a le rôle admin (via accessToken)
   */
  static async isAdmin(accessToken: string): Promise<boolean> {
    try {
      const { data: { user }, error } = await supabaseServer.auth.getUser(accessToken);
      
      if (error || !user) {
        return false;
      }
      
      return await this.checkUserRole(user.id);
    } catch (error: any) {
      console.error('Erreur vérification rôle admin', { error: error.message });
      return false;
    }
  }

  /**
   * Vérifier si l'utilisateur a le rôle admin (via userId)
   * Utilisé par les endpoints qui reçoivent userId via middleware
   */
  static async isAdminByUserId(userId: string): Promise<boolean> {
    try {
      console.info(`Vérification rôle admin pour userId: ${userId}`);
      return await this.checkUserRole(userId);
    } catch (error: any) {
      console.error('Erreur vérification rôle admin', { error: error.message });
      return false;
    }
  }

  /**
   * Vérifier le rôle de l'utilisateur depuis la table profiles
   * @param userId ID de l'utilisateur
   * @returns true si admin, false sinon
   */
  private static async checkUserRole(userId: string): Promise<boolean> {
    try {
      // Vérifier dans la table profiles si l'utilisateur a le rôle admin
      const { data: profile, error } = await supabaseServer
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error || !profile) {
        console.warn(`Profil non trouvé pour userId: ${userId}`);
        return false;
      }
      
      // Vérifier si le rôle est admin
      const adminRoles = ['admin', 'super_admin', 'administrator'];
      const userRole = profile.role?.toLowerCase() || '';
      
      if (adminRoles.includes(userRole)) {
        console.info(`Utilisateur ${userId} a le rôle admin: ${profile.role}`);
        return true;
      }
      
      console.warn(`Utilisateur ${userId} n'a pas le rôle admin (rôle: ${profile.role})`);
      return false;
    } catch (error: any) {
      console.error('Erreur vérification rôle utilisateur', {
        error: error.message,
        userId,
      });
      return false;
    }
  }
}
