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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Échec de la synchronisation');
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
      console.error('Refresh failed:', error);
      setError(error.message || 'La synchronisation a échoué. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Sélecteur de source */}
      <div className="flex items-center gap-2">
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Bouton Rafraîchir */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isLoading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              Synchronisation...
            </>
          ) : (
            'Rafraîchir'
          )}
        </button>
      </div>

      {/* Messages de feedback */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          ❌ {error}
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
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