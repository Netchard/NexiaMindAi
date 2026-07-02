/**
 * Service de chunking pour le pipeline RAG
 * Divise les documents en chunks de taille fixe pour l'indexation vectorielle
 * Fait partie de NexiaMind AI
 */

import { logger } from '../logger';
import {
  Chunk,
  ChunkMetadata,
  ChunkingOptions,
  ChunkingResult,
  ContentType,
  CodeLanguage
} from './types';

export type { ChunkingResult };
import {
  estimateTokenCount,
  detectContentType,
  detectCodeLanguage,
  generateChunkId,
  isValidChunk
} from './utils';

// Importer dynamiquement langchain pour éviter les erreurs si non installé
let RecursiveCharacterTextSplitter: any = null;

class SimpleTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: { chunkSize: number; chunkOverlap: number; separators: string[] }) {
    this.chunkSize = options.chunkSize;
    this.chunkOverlap = options.chunkOverlap;
    this.separators = options.separators;
  }

  async createDocuments(texts: string[]) {
    const text = texts[0] ?? '';
    if (!text) {
      return [];
    }

    const normalizedText = text.replace(/\r\n/g, '\n');
    const chunks = this.splitText(normalizedText);
    return chunks.map((pageContent) => ({ pageContent }));
  }

  private splitText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(text.length, start + this.chunkSize);

      if (end < text.length) {
        const breakIndex = this.findBreakIndex(text, start, end);
        if (breakIndex > start) {
          end = breakIndex;
        }
      }

      const chunk = text.slice(start, end).trim();
      if (chunk) {
        chunks.push(chunk);
      }

      if (end >= text.length) {
        break;
      }

      start = Math.max(start + 1, end - this.chunkOverlap);
    }

    return chunks;
  }

  private findBreakIndex(text: string, start: number, end: number): number {
    const slice = text.slice(start, end);
    let bestIndex = end;

    for (const separator of this.separators) {
      if (!separator) {
        continue;
      }

      const index = slice.lastIndexOf(separator);
      if (index > 0 && start + index < bestIndex) {
        bestIndex = start + index;
      }
    }

    return bestIndex;
  }
}

async function importLangChain() {
  if (RecursiveCharacterTextSplitter === null) {
    try {
      const importModule = new Function('specifier', 'return import(specifier);');
      const langchain = await importModule('langchain/text_splitter');
      RecursiveCharacterTextSplitter = langchain.RecursiveCharacterTextSplitter;
      logger.info('LangChain RecursiveCharacterTextSplitter chargé avec succès');
    } catch (_error) {
      RecursiveCharacterTextSplitter = SimpleTextSplitter;
      logger.warn('LangChain non disponible, utilisation du splitter local de secours');
    }
  }
  return RecursiveCharacterTextSplitter;
}

/**
 * Service de chunking pour le pipeline RAG
 * Divise les documents en chunks de taille fixe pour l'indexation vectorielle
 */
export class TextChunker {
  private textSplitter: any;
  private options: Required<ChunkingOptions>;

  /**
   * Créer une nouvelle instance du TextChunker
   * @param options Options de chunking
   */
  constructor(options: ChunkingOptions = {}) {
    this.options = {
      chunkSize: options.chunkSize ?? 512,
      chunkOverlap: options.chunkOverlap ?? 50,
      separators: options.separators ?? ['\n\n', '\n', '. ', ' ', '']
    };

    logger.info('TextChunker initialisé', {
      chunkSize: this.options.chunkSize,
      chunkOverlap: this.options.chunkOverlap
    });
  }

  /**
   * Diviser du texte en chunks
   * @param text Texte à diviser
   * @param metadata Métadonnées à associer au document
   * @param customOptions Options spécifiques pour ce chunking
   * @returns Résultat du chunking avec tous les chunks
   */
  async chunkText(
    text: string,
    metadata: Partial<ChunkMetadata> = {},
    customOptions?: ChunkingOptions
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    
    if (!text || text.trim().length === 0) {
      logger.warn('Texte vide fourni au chunker');
      return {
        chunks: [],
        totalChunks: 0,
        totalTokens: 0,
        avgChunkSize: 0,
        processingTime: Date.now() - startTime
      };
    }

    logger.info('Début du chunking', {
      textLength: text.length,
      estimatedTokens: estimateTokenCount(text)
    });

    try {
      // Charger LangChain
      const TextSplitter = await importLangChain();
      
      // Détecter le type de contenu
      const contentType = metadata.contentType ?? detectContentType(text);
      const language = metadata.language ?? (contentType === 'code' ? detectCodeLanguage(text) : undefined);

      // Utiliser les options personnalisées ou celles de l'instance
      const effectiveOptions = customOptions ? {
        ...this.options,
        ...customOptions
      } : this.options;

      // Créer un splitter avec les options effectives
      const splitter = new TextSplitter({
        chunkSize: effectiveOptions.chunkSize,
        chunkOverlap: effectiveOptions.chunkOverlap,
        separators: effectiveOptions.separators
      });

      // Diviser le texte
      const documents = await splitter.createDocuments([text]);

      // Convertir en chunks avec métadonnées
      const chunks: Chunk[] = [];
      let totalTokens = 0;

      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        const chunkContent = doc.pageContent;
        const tokenCount = estimateTokenCount(chunkContent);
        totalTokens += tokenCount;

        // Créer les métadonnées du chunk
        const chunkMetadata: ChunkMetadata = {
          chunkIndex: i,
          totalChunks: documents.length,
          contentType,
          language,
          tokenCount,
          documentPath: metadata.documentPath,
          documentId: metadata.documentId,
          source: metadata.source,
          createdAt: new Date().toISOString(),
          ...metadata
        };

        // Vérifier si le chunk est valide
        if (isValidChunk(chunkContent, 5)) {
          chunks.push({
            id: metadata.documentId 
              ? generateChunkId(metadata.documentId, i)
              : undefined,
            content: chunkContent,
            metadata: chunkMetadata
          });
        } else {
          logger.warn('Chunk trop petit généré, ignoré', {
            chunkIndex: i,
            contentLength: chunkContent.length,
            tokenCount
          });
        }
      }

      const processingTime = Date.now() - startTime;
      const avgChunkSize = chunks.length > 0 ? totalTokens / chunks.length : 0;

      logger.info('Chunking terminé avec succès', {
        totalChunks: chunks.length,
        totalTokens,
        avgChunkSize: Math.round(avgChunkSize),
        processingTime: `${processingTime}ms`,
        contentType
      });

      return {
        chunks,
        totalChunks: chunks.length,
        totalTokens,
        avgChunkSize: Math.round(avgChunkSize),
        processingTime
      };
    } catch (error: any) {
      logger.error('Erreur lors du chunking', {
        error: error.message,
        stack: error.stack,
        textLength: text.length
      });
      
      throw new Error(`Chunking échoué: ${error.message}`);
    }
  }

  /**
   * Diviser un document en chunks avec un chunking optimisé pour le code
   * @param code Code source à diviser
   * @param language Langage du code
   * @param metadata Métadonnées
   * @returns Résultat du chunking
   */
  async chunkCode(
    code: string,
    language: CodeLanguage,
    metadata: Partial<ChunkMetadata> = {}
  ): Promise<ChunkingResult> {
    // Pour le code, on peut utiliser des séparateurs spécifiques
    const codeSeparators = this.getCodeSeparators(language);
    
    const customOptions: ChunkingOptions = {
      ...this.options,
      separators: codeSeparators
    };

    return this.chunkText(code, {
      ...metadata,
      contentType: 'code',
      language
    }, customOptions);
  }

  /**
   * Obtenir les séparateurs optimaux pour un langage de code
   * @param language Langage du code
   * @returns Liste de séparateurs par ordre de priorité
   */
  private getCodeSeparators(language: CodeLanguage): string[] {
    const baseSeparators = ['\n\n', '\n', '. ', ' ', ''];
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        return [
          '\n\n',     // Classes, fonctions
          '\n}',      // Fin de bloc
          'function ', // Déclaration de fonction
          'class ',   // Déclaration de classe
          'const ',   // Déclaration const
          'let ',     // Déclaration let
          '\n',       // Ligne
          ';',        // Instruction
          '{', '}',   // Blocs
          ' ',        // Espace
          ''
        ];
      
      case 'python':
        return [
          '\n\n',
          'def ',     // Déclaration de fonction
          'class ',   // Déclaration de classe
          ':\n',     // Après un deux-points
          '\n',
          ' ', ''
        ];
      
      case 'java':
      case 'csharp':
        return [
          '\n\n',
          'public ', 'private ', 'protected ',
          'class ', 'interface ',
          '{', '}',
          ';',
          '\n',
          ' ', ''
        ];
      
      case 'sql':
        return [
          ';',        // Fin de requête
          '\n\n',
          'SELECT ', 'FROM ', 'WHERE ', 'JOIN ', 'GROUP BY ',
          '\n',
          ',',        // Séparateur de colonnes
          ' ', ''
        ];
      
      case 'bash':
        return [
          '\n',       // Chaque commande sur une nouvelle ligne
          '|',        // Pipe
          ';',        // Séparateur de commandes
          ' && ',     // AND logique
          ' || ',     // OR logique
          ' '
        ];
      
      default:
        return baseSeparators;
    }
  }

  /**
   * Diviser un document en chunks avec validation
   * @param document Contenu du document complet
   * @param options Options de chunking
   * @returns Résultat du chunking validé
   */
  async chunkDocument(
    document: { content: string; metadata: Partial<ChunkMetadata> },
    options?: ChunkingOptions
  ): Promise<ChunkingResult> {
    const result = await this.chunkText(document.content, document.metadata, options);
    
    // Validation supplémentaire
    if (result.chunks.length === 0) {
      // Essayer avec une taille de chunk plus petite
      return this.chunkText(document.content, document.metadata, {
        ...options,
        chunkSize: Math.min(256, options?.chunkSize ?? 512) // Minimum 256
      });
    }
    
    return result;
  }

  /**
   * Obtenir les statistiques du chunker
   */
  getStats(): { chunkSize: number; chunkOverlap: number; separators: string[] } {
    return {
      chunkSize: this.options.chunkSize,
      chunkOverlap: this.options.chunkOverlap,
      separators: this.options.separators
    };
  }
}

// Instance singleton par défaut
export const textChunker = new TextChunker();

/**
 * Fonction principale de chunking (wrapper)
 * @param text Texte à diviser
 * @param metadata Métadonnées
 * @param options Options de chunking
 * @returns Résultat du chunking
 */
export async function chunkText(
  text: string,
  metadata: Partial<ChunkMetadata> = {},
  options?: ChunkingOptions
): Promise<ChunkingResult> {
  return textChunker.chunkText(text, metadata, options);
}

/**
 * Fonction de chunking pour le code
 * @param code Code à diviser
 * @param language Langage
 * @param metadata Métadonnées
 * @returns Résultat du chunking
 */
export async function chunkCode(
  code: string,
  language: CodeLanguage,
  metadata: Partial<ChunkMetadata> = {}
): Promise<ChunkingResult> {
  return textChunker.chunkCode(code, language, metadata);
}

/**
 * Fonction de chunking pour un document
 * @param document Document à diviser
 * @param options Options
 * @returns Résultat du chunking
 */
export async function chunkDocument(
  document: { content: string; metadata: Partial<ChunkMetadata> },
  options?: ChunkingOptions
): Promise<ChunkingResult> {
  return textChunker.chunkDocument(document, options);
}
