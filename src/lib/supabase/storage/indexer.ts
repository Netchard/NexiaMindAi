/**
 * Service d'indexation Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { logger } from '../../logger';
import { storageClient } from './client';
import { ocrService } from './ocr';
import { chunkDocument, ChunkingResult } from '../../rag/chunker';
import { generateEmbeddings, EmbeddingResult, BatchEmbeddingResult } from '../../rag/embeddings';
import { reindexSource } from '../../rag/retriever';
import { supabase } from '../server';
import { StorageFileInfo, IndexationOptions, IndexationResult, IndexationError, DocumentError } from './types';
import { Chunk } from '../../rag/types';
import { estimateTokenCount } from '../../rag/utils';

// Configuration constants
const DEFAULT_BUCKET_NAME = 'documents';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
const MAX_CONCURRENT_CHUNKS = parseInt(process.env.MAX_CONCURRENT_CHUNKS || '10');
const DEFAULT_LANGUAGE = 'fr';

/**
 * Service principal pour l'indexation des fichiers depuis Supabase Storage
 * Gère le flux complet : téléchargement → OCR → Chunking → Embeddings → Sauvegarde
 */
export class SupabaseStorageIndexer {
  /** Nom du bucket à indexer */
  private bucketName: string;

  /**
   * Créer une nouvelle instance de l'indexeur
   * @param bucketName Nom du bucket (par défaut: 'documents')
   */
  constructor(bucketName: string = DEFAULT_BUCKET_NAME) {
    if (!bucketName || typeof bucketName !== 'string') {
      throw new IndexationError(
        'Bucket name must be a non-empty string',
        'validation_error',
        undefined,
        { bucketName }
      );
    }
    this.bucketName = bucketName;
    logger.info(`SupabaseStorageIndexer initialisé pour le bucket: ${bucketName}`);
  }

  /**
   * Valide les options d'indexation
   * @param options Options à valider
   * @throws IndexationError si les options sont invalides
   */
  private validateOptions(options: IndexationOptions): void {
    if (options.limit !== undefined && (options.limit <= 0 || !Number.isInteger(options.limit))) {
      throw new IndexationError(
        'Limit must be a positive integer or undefined',
        'validation_error',
        undefined,
        { limit: options.limit }
      );
    }
    if (options.prefix !== undefined && typeof options.prefix !== 'string') {
      throw new IndexationError(
        'Prefix must be a string or undefined',
        'validation_error',
        undefined,
        { prefix: options.prefix }
      );
    }
  }

  /**
   * Valide les informations du fichier
   * @param fileInfo Informations du fichier à valider
   * @throws DocumentError si le fichier est invalide
   */
  private validateFileInfo(fileInfo: StorageFileInfo): void {
    if (!fileInfo?.path) {
      throw new DocumentError(
        'File path is required',
        fileInfo?.path || 'unknown',
        'validation',
        new Error('Invalid file info')
      );
    }
    if (fileInfo.size > MAX_FILE_SIZE) {
      throw new DocumentError(
        `File too large (${fileInfo.size} > ${MAX_FILE_SIZE} bytes)`,
        fileInfo.path,
        'size_limit_exceeded',
        new Error('File size exceeds maximum')
      );
    }
    if (!fileInfo.name || !fileInfo.contentType) {
      throw new DocumentError(
        'File name and contentType are required',
        fileInfo.path,
        'missing_metadata',
        new Error('Invalid file metadata')
      );
    }
  }

  /**
   * Gère les erreurs Supabase de manière cohérente
   * @param error Erreur à traiter
   * @param context Contexte de l'erreur
   * @param filePath Chemin du fichier concerné
   * @throws IndexationError toujours
   */
  private handleSupabaseError(
    error: unknown,
    context: string,
    filePath?: string
  ): never {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const details = error instanceof Error && 'details' in error ? (error as any).details : undefined;
    const hint = error instanceof Error && 'hint' in error ? (error as any).hint : undefined;
    
    const indexationError = new IndexationError(
      `${context}: ${errorMessage}`,
      'supabase_error',
      error instanceof Error ? error : undefined,
      { filePath, context, details, hint }
    );
    
    logger.error(indexationError.message, {
      error: errorMessage,
      details,
      hint,
      filePath,
      context,
    });
    
    throw indexationError;
  }

  /**
   * Indexe tous les fichiers du bucket selon les options fournies
   * @param options Options d'indexation
   * @returns Promise avec le résultat de l'indexation
   */
  async indexAll(options: IndexationOptions = {}): Promise<IndexationResult> {
    const startTime = Date.now();
    const result: IndexationResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      chunksCreated: 0,
      embeddingsGenerated: 0,
    };

    // Validate options
    this.validateOptions(options);

    logger.info('Début de l\'indexation Supabase Storage', {
      bucket: this.bucketName,
      prefix: options.prefix,
      client: options.client,
      documentType: options.documentType,
      dryRun: options.dryRun,
      limit: options.limit,
      maxFileSize: MAX_FILE_SIZE,
    });

    try {
      // 1. Récupérer la liste des fichiers
      const files = await storageClient.listFiles(options.prefix, options.limit);

      logger.info(`Fichiers à indexer: ${files.length}`, {
        bucket: this.bucketName,
      });

      if (files.length === 0) {
        logger.info('Aucun fichier à indexer');
        logger.debug('Indexation terminée - aucun fichier', {
          processingTime: '0ms',
        });
        return result;
      }

      // 2. Traiter chaque fichier
      for (const file of files) {
        result.processed++;

        try {
          const fileResult = await this.indexFile(file, options);
          result.succeeded++;
          result.chunksCreated += fileResult.chunksCreated;
          result.embeddingsGenerated += fileResult.embeddingsGenerated;

          if (options.dryRun) {
            logger.info(`[DRY RUN] Fichier traité: ${file.path}`, {
              chunksCreated: fileResult.chunksCreated,
              embeddingsGenerated: fileResult.embeddingsGenerated,
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorType = error instanceof IndexationError ? error.errorType : 'unknown';
          
          result.failed++;
          result.errors.push({
            file: file.path,
            error: errorMessage,
          });
          logger.error(`Échec de l'indexation du fichier: ${file.path}`, {
            error: errorMessage,
            errorType,
          });
          // Continue with next file - consistent error handling strategy
        }
      }

      const processingTime = Date.now() - startTime;
      const avgTimePerFile = result.processed > 0 ? `${processingTime / result.processed}ms` : '0ms';
      logger.info('Indexation terminée', {
        result,
        processingTime: `${processingTime}ms`,
        avgTimePerFile,
      });

      return result;

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Échec global de l\'indexation Supabase Storage', {
        error: errorMessage,
        stack: errorStack,
      });
      throw error;
    }
  }

  /**
   * Indexe un fichier spécifique
   * @param fileInfo Informations sur le fichier à indexer
   * @param options Options d'indexation
   * @returns Promise avec le résultat pour ce fichier
   */
  private async indexFile(
    fileInfo: StorageFileInfo,
    options: IndexationOptions
  ): Promise<{ chunksCreated: number; embeddingsGenerated: number }> {
    const startTime = Date.now();
    let chunksCreated = 0;
    let embeddingsGenerated = 0;

    // Validate file info
    this.validateFileInfo(fileInfo);

    logger.info(`Indexation du fichier: ${fileInfo.path}`, {
      size: fileInfo.size,
      contentType: fileInfo.contentType,
      fileName: fileInfo.name,
    });

    try {
      // 1. Télécharger le fichier
      const { data: fileBuffer, fileInfo: actualFileInfo } = await storageClient.downloadFile(
        fileInfo.path
      );

      // 2. Extraire le texte
      const extractedText = await ocrService.extractText(fileBuffer, actualFileInfo.name);

      if (!extractedText.text || extractedText.text.trim().length === 0) {
        logger.warn(`Aucun texte extrait pour: ${fileInfo.path}`, {
          contentType: extractedText.contentType,
        });
        return { chunksCreated: 0, embeddingsGenerated: 0 };
      }

      // 3. Chunking du document
      const chunkResult: ChunkingResult = await chunkDocument({
        content: extractedText.text,
        metadata: {
          source: fileInfo.path,
          sourceType: 'supabase_storage',
          sourceBucket: this.bucketName,
          client: options.client || 'default',
          documentType: options.documentType || extractedText.contentType,
          fileName: fileInfo.name,
          fileSize: fileInfo.size,
          fileContentType: fileInfo.contentType,
          extractionMethod: extractedText.contentType,
        },
      });
      const chunks: Chunk[] = chunkResult.chunks;

      chunksCreated = chunks.length;

      if (!options.dryRun) {
        // 4. Sauvegarder les chunks et générer les embeddings
        const supabaseClient = supabase;

        // D'abord, créer le document parent s'il n'existe pas
        const { data: existingDocuments, error: docCheckError } = await supabaseClient
          .from('documents')
          .select('id')
          .eq('file_path', fileInfo.path)
          .limit(1);

        if (docCheckError) {
          this.handleSupabaseError(docCheckError, 'Document check failed', fileInfo.path);
        }

        let documentId: string;
        const existingDocument = existingDocuments?.[0];
        
        if (existingDocument) {
          documentId = existingDocument.id;
          logger.debug(`Document existant trouvé: ${fileInfo.path}`, {
            documentId,
          });
        } else {
          logger.info(`Aucun document existant trouvé pour: ${fileInfo.path}. Création d'un nouveau document.`);
          // Créer ou mettre à jour le document (upsert)
          // Use language from OCR if available, otherwise use extracted content type as hint, or default
          const documentLanguage = extractedText.language || DEFAULT_LANGUAGE;
          
          const { data: newDocuments, error: docCreateError } = await supabaseClient
            .from('documents')
            .upsert({
              name: fileInfo.name,
              type: extractedText.contentType || 'text',
              source: 'supabase',
              file_path: fileInfo.path,
              file_size: fileInfo.size,
              mime_type: fileInfo.contentType,
              language: documentLanguage,
              metadata: {
                client: options.client || 'default',
                documentType: options.documentType || extractedText.contentType,
                sourceBucket: this.bucketName,
              },
            }, { onConflict: 'file_path' })
            .select('id')
            .limit(1);

          if (docCreateError) {
            this.handleSupabaseError(docCreateError, 'Document upsert failed', fileInfo.path);
          }

          const newDocument = newDocuments?.[0];
          
          if (!newDocument?.id) {
            throw new DocumentError(
              'No document ID returned after upsert',
              fileInfo.path,
              'database_error',
              new Error('Missing document ID')
            );
          }

          documentId = newDocument.id;
          logger.info(`Nouveau document créé: ${fileInfo.path}`, {
            documentId,
          });
        }

        // Process chunks with batching for better performance
        const chunkResults: Array<{ 
          chunkIndex: number; 
          chunkId: string; 
          content: string 
        }> = [];
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          try {
            logger.debug(`Traitement du chunk ${i}/${chunks.length} pour ${fileInfo.path}`, {
              chunkLength: chunk.content.length,
            });

            // Sauvegarder le chunk dans la base
            const tokenCount = estimateTokenCount(chunk.content);
            
            const { data: savedChunks, error: saveError } = await supabaseClient
              .from('chunks')
              .insert({
                document_id: documentId,
                content: chunk.content,
                chunk_index: i,
                token_count: tokenCount,
                metadata: {
                  ...chunk.metadata,
                  chunk_index: i,
                  total_chunks: chunks.length,
                  source: fileInfo.path,
                  source_type: 'supabase_storage',
                  document_id: documentId,
                },
              })
              .select('id')
              .limit(1);

            if (saveError) {
              this.handleSupabaseError(saveError, 'Chunk save failed', fileInfo.path);
            }

            const savedChunk = savedChunks?.[0];
            
            if (!savedChunk?.id) {
              throw new DocumentError(
                `No chunk ID returned for chunk ${i}`,
                fileInfo.path,
                'database_error',
                new Error('Missing chunk ID')
              );
            }

            logger.debug(`Chunk sauvegardé avec succès`, {
              chunkId: savedChunk.id,
              chunkIndex: i,
              tokenCount,
            });

            chunkResults.push({
              chunkIndex: i,
              chunkId: savedChunk.id,
              content: chunk.content,
            });
            
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorType = error instanceof DocumentError ? error.name : 'unknown';
            
            logger.error(`Échec du traitement du chunk ${i} pour ${fileInfo.path}`, {
              error: errorMessage,
              errorType,
              chunkIndex: i,
              filePath: fileInfo.path,
            });
            // Continue with next chunk - don't fail entire file for one chunk
          }
        }
        
        // Batch generate embeddings for all successfully saved chunks
        if (chunkResults.length > 0) {
          const allContents = chunkResults.map(r => r.content);
          const batchEmbeddingsResult: BatchEmbeddingResult = await generateEmbeddings(allContents);
          
          // Save embeddings for each chunk
          for (let j = 0; j < chunkResults.length; j++) {
            const chunkResult = chunkResults[j];
            const embedding = batchEmbeddingsResult.embeddings[j];
            
            if (!embedding) {
              logger.error(`Aucun embedding généré pour le chunk ${chunkResult.chunkIndex}`, {
                chunkId: chunkResult.chunkId,
                filePath: fileInfo.path,
              });
              continue;
            }
            
            embeddingsGenerated++;
            
            logger.debug(`Embedding généré pour le chunk ${chunkResult.chunkIndex}`, {
              chunkId: chunkResult.chunkId,
              embeddingLength: embedding.embedding.length,
              tokenCount: embedding.tokenCount,
            });

            // Sauvegarder l'embedding
            const { error: embedError } = await supabaseClient
              .from('embeddings')
              .insert({
                chunk_id: chunkResult.chunkId,
                vector: embedding.embedding,
              });

            if (embedError) {
              logger.error(`Échec de la sauvegarde de l'embedding pour le chunk ${chunkResult.chunkIndex}`, {
                error: embedError instanceof Error ? embedError.message : String(embedError),
                details: embedError instanceof Error && 'details' in embedError ? (embedError as any).details : undefined,
                chunkId: chunkResult.chunkId,
                embeddingLength: embedding.embedding.length,
              });
              // Continue with next embedding - don't fail for embedding save errors
            } else {
              logger.debug(`Embedding sauvegardé avec succès pour le chunk ${chunkResult.chunkIndex}`, {
                chunkId: chunkResult.chunkId,
                embeddingLength: embedding.embedding.length,
              });
            }
          }
        }
        
        chunksCreated = chunkResults.length;

        // 7. Appeler reindexSource pour mettre à jour l'index vectoriel
        try {
          await reindexSource(fileInfo.path, {
            client: options.client,
            documentType: options.documentType,
            userId: 'system',
          });
          logger.info(`Re-indexation appelée pour: ${fileInfo.path}`);
        } catch (reindexError: unknown) {
          const errorMessage = reindexError instanceof Error ? reindexError.message : String(reindexError);
          
          logger.error(`Échec de la re-indexation pour: ${fileInfo.path}`, {
            error: errorMessage,
          });
          // Don't stop processing - reindex can be retried later
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info(`Fichier indexé avec succès: ${fileInfo.path}`, {
        chunks: chunksCreated,
        embeddings: embeddingsGenerated,
        processingTime: `${processingTime}ms`,
      });

      return { chunksCreated, embeddingsGenerated };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorType = error instanceof IndexationError || error instanceof DocumentError 
        ? (error as IndexationError | DocumentError).name 
        : 'unknown';
      
      logger.error(`Échec du traitement du fichier: ${fileInfo.path}`, {
        error: errorMessage,
        stack: errorStack,
        errorType,
      });
      throw error;
    }
  }

  /**
   * Récupère le nom du bucket
   * @returns Nom du bucket
   */
  getBucketName(): string {
    return this.bucketName;
  }

  /**
   * Récupère la taille maximale des fichiers autorisée
   * @returns Taille maximale en octets
   */
  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }
}

// Instance singleton par défaut avec le bucket 'documents'
export const storageIndexer = new SupabaseStorageIndexer();
