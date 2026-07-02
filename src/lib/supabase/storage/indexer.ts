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
import { StorageFileInfo, IndexationOptions, IndexationResult } from './types';
import { Chunk } from '../../rag/types';

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
  constructor(bucketName: string = 'documents') {
    this.bucketName = bucketName;
    logger.info(`SupabaseStorageIndexer initialisé pour le bucket: ${bucketName}`);
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

    logger.info('Début de l\'indexation Supabase Storage', {
      bucket: this.bucketName,
      prefix: options.prefix,
      client: options.client,
      documentType: options.documentType,
      dryRun: options.dryRun,
      limit: options.limit,
    });

    try {
      // 1. Récupérer la liste des fichiers
      const files = await storageClient.listFiles(options.prefix, options.limit);

      logger.info(`Fichiers à indexer: ${files.length}`, {
        bucket: this.bucketName,
      });

      if (files.length === 0) {
        logger.info('Aucun fichier à indexer');
        logger.info('Indexation terminée', {
          result,
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
            });
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          const errorStack = error instanceof Error ? error.stack : undefined;
          
          result.failed++;
          result.errors.push({
            file: file.path,
            error: errorMessage,
          });
          logger.error(`Échec de l'indexation du fichier: ${file.path}`, {
            error: errorMessage,
            stack: errorStack,
          });
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
        const { data: existingDocument, error: docCheckError } = await supabaseClient
          .from('documents')
          .select('id')
          .eq('file_path', fileInfo.path)
          .single();

        let documentId: string;
        
        
        if (docCheckError && !docCheckError.message.includes('no rows')) {
          logger.error(`Erreur de vérification du document: ${docCheckError.message} ${fileInfo.path}`, {
            error: docCheckError.message,
          });
         // throw docCheckError;
        }

        if (existingDocument) {
          documentId = existingDocument.id;
          logger.info(`Document existant trouvé: ${fileInfo.path}`, {
            documentId,
          });
        } else {
          logger.info (`Aucun document existant trouvé pour: ${fileInfo.path}. Création d'un nouveau document.`);
          // Créer un nouveau document
          const { data: newDocument, error: docCreateError } = await supabaseClient
            .from('documents')
            .insert({
              name: fileInfo.name,
              type: extractedText.contentType || 'text',
              source: 'supabase',
              file_path: fileInfo.path,
              file_size: fileInfo.size,
              mime_type: fileInfo.contentType,
              language: 'fr', // Par défaut français
              metadata: {
                client: options.client || 'default',
                documentType: options.documentType || extractedText.contentType,
                sourceBucket: this.bucketName,
              },
            })
            .select('id')
            .single();

          if (docCreateError) {
            logger.error(`Échec de la création du document: ${fileInfo.path}`, {
              error: docCreateError.message,
              details: docCreateError.details,
            });
            throw docCreateError;
          }

          documentId = newDocument.id;
          logger.info(`Nouveau document créé: ${fileInfo.path}`, {
            documentId,
          });
        }

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];

          try {
            logger.info(`Traitement du chunk ${i}/${chunks.length} pour ${fileInfo.path}`, {
              chunkLength: chunk.content.length,
              metadata: chunk.metadata,
            });

            // Sauvegarder le chunk dans la base
            const { data: savedChunk, error: saveError } = await supabaseClient
              .from('chunks')
              .insert({
                document_id: documentId,
                content: chunk.content,
                chunk_index: i,
                token_count: chunk.content.split(' ').length, // Estimation simple
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
              .single();

            if (saveError) {
              logger.error(`Échec de la sauvegarde du chunk ${i} pour ${fileInfo.path} \n ${saveError.message}`, {
                error: saveError.message,
                details: saveError.details,
                chunkContentLength: chunk.content.length,
                chunkIndex: i,
              });
              throw saveError;
            }

            logger.info(`Chunk sauvegardé avec succès`, {
              chunkId: savedChunk?.id,
              chunkIndex: i,
              contentLength: chunk.content.length,
            });

            // 5. Générer l'embedding pour ce chunk
            logger.info(`Génération de l'embedding pour le chunk ${i}`, {
              chunkId: savedChunk?.id,
            });

            const embeddingsResult: BatchEmbeddingResult = await generateEmbeddings([chunk.content]);
            const embedding: EmbeddingResult = embeddingsResult.embeddings[0];
            embeddingsGenerated++;

            logger.info(`Embedding généré pour le chunk ${i}`, {
              embeddingLength: embedding.embedding.length,
              tokenCount: embedding.tokenCount,
            });

            // 6. Sauvegarder l'embedding
            const { error: embedError } = await supabaseClient
              .from('embeddings')
              .insert({
                chunk_id: savedChunk?.id,
                vector: embedding.embedding,
              });

            if (embedError) {
              logger.error(`Échec de la sauvegarde de l'embedding pour le chunk ${i} - ${embedError.message}`, {
                error: embedError.message,
                details: embedError.details,
                chunkId: savedChunk?.id,
                embeddingLength: embedding.embedding.length,
              });
              // Ne pas arrêter le traitement, continuer avec les autres chunks
            } else {
              logger.info(`Embedding sauvegardé avec succès pour le chunk ${i}`, {
                chunkId: savedChunk?.id,
                embeddingLength: embedding.embedding.length,
              });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;
            
            logger.error(`Échec du traitement du chunk ${i} pour ${fileInfo.path}`, {
              error: errorMessage,
              stack: errorStack,
              chunkIndex: i,
              filePath: fileInfo.path,
            });
            // Continuer avec les autres chunks
          }
        }

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
          // Ne pas arrêter le traitement
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
      
      logger.error(`Échec du traitement du fichier: ${fileInfo.path}`, {
        error: errorMessage,
        stack: errorStack,
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
}

// Instance singleton par défaut avec le bucket 'documents'
export const storageIndexer = new SupabaseStorageIndexer();
