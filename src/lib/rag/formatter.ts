/**
 * Service de formatage pour le pipeline RAG
 * Formate les réponses IA avec les citations de sources
 */

import { Chunk } from './types';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack

/**
 * Options de formatage pour les réponses
 */
export interface FormatOptions {
  /** Format de sortie (markdown, html, text) */
  outputFormat?: 'markdown' | 'html' | 'text';
  /** Style des citations (numeric, alphanumeric, custom) */
  citationStyle?: 'numeric' | 'alphanumeric' | 'custom';
  /** Préfixe pour les citations */
  citationPrefix?: string;
  /** Inclure les métadonnées des sources */
  includeMetadata?: boolean;
  /** Max length pour le préambule */
  maxPreambleLength?: number;
}

/**
 * Représente une citation de source
 */
export interface Citation {
  /** Index de la citation */
  index: number;
  /** Chemin de la source */
  sourcePath: string;
  /** Type de document */
  documentType?: string;
  /** Client */
  client?: string;
  /** Langage */
  language?: string;
  /** Source (supabase, gitlab, nexia) */
  source?: string;
}

/**
 * Résultat du formatage
 */
export interface FormattedResponse {
  /** Réponse formatée */
  formattedContent: string;
  /** Liste des citations */
  citations: Citation[];
  /** Nombre de citations */
  citationCount: number;
  /** Temps de formatage en ms */
  formatTime?: number;
  /** Réponse originale (optionnelle) */
  rawResponse?: string;
}

/**
 * Erreur spécifique au formatage
 */
export class FormattingError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'FormattingError';
  }
}

/**
 * Service principal de formatage de réponses
 */
export class ResponseFormatter {
  private options: FormatOptions;

  /**
   * Créer une nouvelle instance du ResponseFormatter
   * @param options Options de formatage
   */
  constructor(options: FormatOptions = {}) {
    this.options = options;
    console.info('ResponseFormatter initialisé');
  }

  /**
   * Formater une réponse avec citations
   * @param rawResponse Réponse brute du LLM
   * @param chunks Chunks utilisés pour le contexte
   * @returns Résultat du formatage
   */
  async formatResponse(
    rawResponse: string,
    chunks: Chunk[] = []
  ): Promise<FormattedResponse> {
    const startTime = Date.now();

    try {
      // 1. Extraire les citations de la réponse brute
      const { formattedContent, citations } = this.extractAndReplaceCitations(
        rawResponse,
        chunks
      );

      // 2. Nettoyer les artifacts
      const cleanedContent = this.cleanArtifacts(formattedContent);

      // 3. Ajouter la section des sources
      const withSources = this.addSourcesSection(cleanedContent, citations);

      return {
        formattedContent: withSources,
        citations,
        citationCount: citations.length,
        formatTime: Date.now() - startTime,
        rawResponse,
      };
    } catch (error: any) {
      console.error('Échec du formatage de la réponse', {
        error: error.message,
        responseLength: rawResponse?.length || 0,
      });
      throw this.handleError(error);
    }
  }

  /**
   * Extraire et remplacer les citations par des placeholders
   * @param rawResponse Réponse brute
   * @param chunks Chunks pour trouver les métadonnées
   * @returns Contenu formaté et liste des citations
   */
  private extractAndReplaceCitations(
    rawResponse: string,
    chunks: Chunk[]
  ): { formattedContent: string; citations: Citation[] } {
    const citations: Citation[] = [];
    let formattedContent = rawResponse;

    // Pattern pour détecter les citations dans différents formats
    // Format 1: --- Source: document.pdf ---
    // Format 2: [Source: document.pdf]
    const citationRegex = /(?:---\s*Source:\s*([^\n]+)\s*---|\[Source:\s*([^\]]+)\])/g;

    formattedContent = formattedContent.replace(citationRegex, (match, sourcePath, bracketSource) => {
      // Prendre la source du premier groupe capturé ou du second
      const cleanSource = (sourcePath || bracketSource || '').trim();

      // Trouver le chunk correspondant pour les métadonnées
      const chunk = chunks.find(c =>
        c.metadata.documentPath?.includes(cleanSource) ||
        c.metadata.source === cleanSource ||
        c.content.includes(cleanSource)
      );

      const index = citations.length;
      citations.push({
        index,
        sourcePath: cleanSource,
        documentType: chunk?.metadata.contentType,
        client: chunk?.metadata.client,
        language: chunk?.metadata.language,
        source: chunk?.metadata.source,
      });

      return this.getCitationPlaceholder(index);
    });

    return { formattedContent, citations };
  }

  /**
   * Obtenir le placeholder pour une citation
   * @param index Index de la citation
   * @returns Placeholder formaté
   */
  private getCitationPlaceholder(index: number): string {
    switch (this.options.citationStyle) {
      case 'alphanumeric':
        return `[${String.fromCharCode(97 + index)}]`; // [a], [b], [c]...
      case 'custom':
        return `[[${this.options.citationPrefix || 'CIT'}_${index + 1}]]`;
      case 'numeric':
      default:
        return `[${index + 1}]`; // [1], [2], [3]...
    }
  }

  /**
   * Obtenir le nom d'affichage d'une source
   * @param citation Citation
   * @returns Nom de la source
   */
  private getSourceDisplayName(citation: Citation): string {
    return citation.sourcePath || `Source ${citation.index + 1}`;
  }

  /**
   * Obtenir les métadonnées formatées d'une source
   * @param citation Citation
   * @returns Métadonnées formatées
   */
  private getSourceMetadata(citation: Citation): string {
    if (!this.options.includeMetadata) {
      return '';
    }

    const parts = [];
    if (citation.documentType) {
      parts.push(`Type: ${citation.documentType}`);
    }
    if (citation.client) {
      parts.push(`Client: ${citation.client}`);
    }
    if (citation.language) {
      parts.push(`Language: ${citation.language}`);
    }
    if (citation.source) {
      parts.push(`Source: ${citation.source}`);
    }

    return parts.length > 0 ? ` - ${parts.join(', ')}` : '';
  }

  /**
   * Ajouter la section des sources
   * @param content Contenu formaté
   * @param citations Liste des citations
   * @returns Contenu avec section des sources
   */
  private addSourcesSection(content: string, citations: Citation[]): string {
    if (citations.length === 0) {
      return content;
    }

    const sourcesSection = '\n\n---\n\n**Sources :**' +
      citations.map(cit => {
        const sourceName = this.getSourceDisplayName(cit);
        const metadata = this.getSourceMetadata(cit);
        return `\n[${cit.index + 1}]: ${sourceName}${metadata}`;
      }).join('');

    return content + sourcesSection;
  }

  /**
   * Nettoyer les artifacts de formatage
   * @param content Contenu à nettoyer
   * @returns Contenu nettoyé
   */
  private cleanArtifacts(content: string): string {
    // Nettoyer les doubles espaces, lignes vides, etc.
    return content
      .replace(/[ \t]+/g, ' ')       // Multiples espaces → un espace
      .replace(/\n{3,}/g, '\n\n')   // Plus de 2 lignes vides → 2 lignes
      .replace(/\n\s+\n/g, '\n\n') // Lignes avec espaces vides
      .trim();
  }

  /**
   * Gérer les erreurs
   * @param error Erreur
   * @returns FormattingError formatée
   */
  private handleError(error: any): FormattingError {
    if (error instanceof FormattingError) {
      return error;
    }

    const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
    const errorType = error?.code || error?.errorType || 'unknown_error';
    const errorStatus = error?.status || error?.statusCode;

    // Erreurs de parsing
    if (errorMessage.includes('parse') || errorMessage.includes('regex')) {
      return new FormattingError(
        'Erreur de parsing de la réponse',
        undefined,
        'parsing_error',
        false
      );
    }

    return new FormattingError(
      errorMessage,
      errorStatus,
      errorType
    );
  }

  /**
   * Vérifier si le service est configuré
   */
  isConfigured(): boolean {
    return true; // Toujours configuré car pas de dépendances externes
  }
}

// Instance singleton par défaut
export const responseFormatter = new ResponseFormatter();

/**
 * Fonction principale de formatage (wrapper)
 * @param rawResponse Réponse brute
 * @param chunks Chunks utilisés
 * @param options Options de formatage
 * @returns Résultat du formatage
 */
export async function formatResponse(
  rawResponse: string,
  chunks: Chunk[] = [],
  options?: FormatOptions
): Promise<FormattedResponse> {
  const formatter = new ResponseFormatter(options);
  return formatter.formatResponse(rawResponse, chunks);
}
