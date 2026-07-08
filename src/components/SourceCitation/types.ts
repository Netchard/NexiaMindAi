/**
 * Types spécifiques aux composants SourceCitation
 * Complémentaires aux types partagés dans src/types/citations.ts
 */

import { SourceCitation } from '@/types/citations';

/**
 * Props pour le composant SourceCitation
 */
export interface SourceCitationProps {
  /** Données de la citation à afficher */
  citation: SourceCitation;
  /** Si le composant est désactivé (pour l'aperçu) */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}

/**
 * Props pour le composant SourceCitationList
 */
export interface SourceCitationListProps {
  /** Liste des citations à afficher */
  citations: SourceCitation[];
  /** Titre de la section (par défaut: "📚 Sources :") */
  title?: string;
  /** Si la liste est désactivée */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
}
