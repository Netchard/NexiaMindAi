/**
 * Composant RefreshButton - Bouton pour déclencher la synchronisation des sources
 * 
 * Fait partie de ST-205 - Implémenter le Bouton "Rafraîchir" dans l'UI
 * 
 * Utilisation:
 *   <RefreshButton />
 *   <RefreshButton className="custom-class" />
 *   <RefreshButton onRefresh={(sourceId) => console.log(sourceId)} />
 */

import React, { useState } from 'react';
import { RefreshButtonProps, SourceOption } from './types';

// Options de source disponibles
const SOURCE_OPTIONS: SourceOption[] = [
  { value: 'all', label: 'Toutes les sources' },
  { value: 'supabase', label: 'Supabase Storage' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'nexia', label: 'Nexia GED' },
];

/**
 * Composant principal RefreshButton
 * @param props - Props du composant
 * @returns JSX.Element
 */
export const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Déclenche la synchronisation de la source sélectionnée
   */
  const GENERIC_ERROR = 'La synchronisation a échoué. Veuillez réessayer.';

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      // Appel à l'API backend
      const response = await fetch('/api/chat/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceId: selectedSource }),
        credentials: 'include',
      });

      if (!response.ok) {
        // Si le serveur renvoie un message exploitable, on l'affiche ;
        // sinon (réponse non-JSON, etc.) on retombe sur le message générique.
        const errorData = await response.json().catch(() => null);
        setError(errorData?.error || GENERIC_ERROR);
        return;
      }

      const data = await response.json();

      // Afficher le message de succès
      setSuccessMessage(data.message || 'Synchronisation lancée avec succès!');

      // Appeler le callback si fourni
      if (onRefresh) {
        await onRefresh(selectedSource);
      }

      // Masquer le message de succès après 5 secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);

    } catch (error: any) {
      // Erreurs inattendues (réseau, etc.) : ne pas exposer le message technique.
      console.error('Refresh failed:', error);
      setError(GENERIC_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Sélecteur de source + bouton Rafraîchir */}
      <div className="flex items-center gap-2">
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          disabled={isLoading}
          aria-label="Sélectionner la source à synchroniser"
          className="h-9 px-3 rounded-chat-sm border border-chat-border-soft bg-chat-surface-panel text-chat-ink-muted text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-chat-ring disabled:opacity-50"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-9 px-3.5 rounded-chat-sm border border-chat-border-soft text-[13px] font-medium text-chat-ink-muted transition-colors hover:text-chat-ink-strong disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2 align-[-2px]"></span>
              Synchronisation...
            </>
          ) : (
            'Rafraîchir'
          )}
        </button>
      </div>

      {/* Messages de feedback */}
      {error && (
        <div className="p-3 rounded-chat-md border border-chat-error-border bg-chat-error-surface text-sm text-chat-error-soft">
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-chat-md border border-[rgba(47,158,106,.4)] bg-[rgba(47,158,106,.1)] text-sm text-[#C9E6D8]">
          ✅ {successMessage}
        </div>
      )}
    </div>
  );
};

// Export par défaut pour une importation plus simple
const RefreshButtonWrapper: React.FC<RefreshButtonProps> = (props) => (
  <RefreshButton {...props} />
);

export default RefreshButtonWrapper;