/**
 * Types pour le composant RefreshButton
 * Fait partie de ST-205 - Implémenter le Bouton "Rafraîchir" dans l'UI
 */

export interface RefreshButtonProps {
  /**
   * Callback appelé lorsque le rafraîchissement est déclenché
   * @param sourceId - L'ID de la source à synchroniser ('supabase', 'gitlab', 'nexia', 'all')
   * @returns Promise<void>
   */
  onRefresh?: (sourceId: string) => Promise<void>;

  /**
   * Classes CSS supplémentaires pour le conteneur
   */
  className?: string;
}

export interface RefreshResponse {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  taskId: string;
  message: string;
  documentsProcessed?: number;
  errors?: string[];
}

export type SourceOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export interface RefreshButtonState {
  isLoading: boolean;
  selectedSource: string;
  error?: string;
  successMessage?: string;
}