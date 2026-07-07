/**
 * Service de Retrieval pour le pipeline RAG
 * Récupère les chunks pertinents via pgvector et Supabase
 * 
 * Utilise le client SERVEUR (pas le client navigateur)
 */

import { supabase as supabaseServer } from '../supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Chunk } from './types';
// Utilise console au lieu de logger (winston) pour éviter les problèmes
// avec fs dans Next.js 16 + Turbopack
import { generateEmbedding, EmbeddingService } from './embeddings';

/**
 * Options de filtre pour la recherche
 */
export interface RetrievalFilters {
  /** Filtre par thème */
  theme?: string | string[];
  /** Filtre par format de document */
  documentFormat?: string | string[];
  /** Filtre par rôle */
  role?: string | string[];
  /** Filtre par source */
  source?: string | string[];
  /** Nombre maximum de chunks à retourner */
  limit?: number;
  /** Seuil de similarité minimum */
  similarityThreshold?: number;
}

/**
 * Résultat de la recherche
 */
export interface RetrievalResult {
  /** Chunks pertinents trouvés */
  chunks: Chunk[];
  /** Score de similarité moyen */
  averageSimilarity?: number;
  /** Temps de recherche en ms */
  searchTime?: number;
  /** Nombre total de chunks consultés */
  totalChunksScanned?: number;
}

/**
 * Erreur spécifique au retrieval
 */
export class RetrievalError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly errorType?: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'RetrievalError';
  }
}

/**
 * Service principal de retrieval
 */
export class RetrievalService {
  private supabase: SupabaseClient;
  private embeddingService: EmbeddingService;
  
  /**
   * Créer une nouvelle instance du RetrievalService
   * @param supabaseClient Client Supabase
   * @param embeddingService Service d'embeddings
   */
  constructor(
    supabaseClient?: SupabaseClient,
    embeddingService?: EmbeddingService
  ) {
    // Utilise le client serveur par défaut (déjà validé dans server.ts)
    this.supabase = supabaseClient || supabaseServer;
    this.embeddingService = embeddingService || new EmbeddingService();
    
    // La validation du client Supabase est déjà faite dans server.ts
    // La validation de l'embedding service est faite dans son constructeur
    
    console.info('RetrievalService initialisé', {
      supabaseUrlDefined: true,
      supabaseAnonKeyDefined: true,
      embeddingServiceConfigured: this.embeddingService.isConfigured(),
    });
  }

  /**
   * Récupérer les chunks pertinents pour une requête
   * @param query Requête utilisateur
   * @param filters Filtres de recherche
   * @returns Résultat avec les chunks pertinents
   */
  async retrieveRelevantChunks(
    query: string,
    filters: RetrievalFilters = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    if (!query || query.trim().length === 0) {
      throw new RetrievalError(
        'Requête vide fournie',
        400,
        'empty_query',
        false
      );
    }

    if (!this.supabase) {
      throw new RetrievalError(
        'Client Supabase non configuré',
        500,
        'supabase_not_configured',
        false
      );
    }

    if (!this.embeddingService.isConfigured()) {
      throw new RetrievalError(
        'Service d\'embeddings non configuré',
        500,
        'embedding_service_not_configured',
        false
      );
    }

    try {
      // 1. Générer l'embedding de la requête
      const startEmbeddingTime = Date.now();
      const queryEmbeddingResult = await this.embeddingService.generateEmbedding(query);
      const queryEmbedding = this.normalizeEmbedding(queryEmbeddingResult);
      const embeddingTime = Date.now() - startEmbeddingTime;
      
      console.info('Embedding de la requête généré', {
        queryLength: query.length,
        embeddingTime: `${embeddingTime}ms`,
        embeddingLength: queryEmbedding.length,
      });

      // 2. Construire la requête Supabase avec pgvector
      const limit = filters.limit || 5;
      const candidateLimit = Math.max(limit * 5, 20);

      // ⭐ CORRIGÉ : Ajout de l'ordre vectoriel pour pgvector
      // Mistral Embeddings (mistral-embed) génère des vecteurs de 1024 dimensions
      // La syntaxe 'vector <=> query_embedding' ne fonctionne pas car Supabase JS
      // ne connaît pas la variable TypeScript. On utilise JSON.stringify pour passer
      // l'embedding comme valeur littérale, avec cast explicite vers vector(1024)
      // Note: JSON.stringify gère correctement les arrays de numbers
      const EMBEDDING_DIMENSION = 1024; // Dimension pour mistral-embed
      const embeddingString = JSON.stringify(queryEmbedding);
      //const embeddingString = `{${queryEmbedding.join(',')}}`;
      
      /*
      let supabaseQuery = this.supabase
        .from('embeddings')
        .select(`
          id,
          chunk_id,
          vector,
          chunks!inner(
            id,
            document_id,
            content,
            chunk_index,
            token_count,
            metadata,
            documents!inner(
              id,
              name,
              file_path,
              type,
              source,
              client_id,
              language,
              mime_type,
              created_at
            )
          )
        `)
        // ⭐ NOUVEAU : Tri par similarité vectorielle (distance cosinus, ascending=false = plus similaire en premier)
        // Syntaxe: vector <=> '[...]'::vector(1024) - pgvector calcule la distance cosinus
        .order(`vector <=> ${embeddingString}::vector(${EMBEDDING_DIMENSION})`, { ascending: false })
        .limit(candidateLimit);
            

      
      console.info('Requête vectorielle construite', {
        candidateLimit,
        embeddingVectorLength: queryEmbedding.length,
        embeddingDimension: EMBEDDING_DIMENSION,
      });
      

      // 3. Appliquer les filtres
      supabaseQuery = this.applyFilters(supabaseQuery, filters);

      // 4. Exécuter la requête
      const { data, error, count } = await supabaseQuery;
      */

      const { data, error } = await this.supabase.rpc('match_chunks', {
        query_embedding: queryEmbedding, // tableau de nombres, PAS une string formatée
        match_count: EMBEDDING_DIMENSION
      });
      
      
      if (error) {
        console.error('Erreur de requête Supabase', {
          error: error.message || 'Erreur Supabase',
          queryLength: query.length,
        });
        throw new RetrievalError(
          `Erreur de recherche: ${error.message || 'Erreur Supabase'}`,
          (error as any).status || 500,
          'supabase_query_error',
          true
        );
      }

      // 5. Formater les résultats
      if (!data || !Array.isArray(data)) {
        return {
          chunks: [],
          averageSimilarity: 0,
          searchTime: Date.now() - startTime,
          totalChunksScanned: 0,
        };
      }

      const scoredRows = data
        .map((item: any, index: number) => {
          // La RPC match_chunks retourne une structure PLATE, pas imbriquée
          // item.chunk_content, item.chunk_index, etc. sont au niveau racine
          const chunkData = {
            id: item.chunk_id,
            content: item.chunk_content,
            chunk_index: item.chunk_index,
            token_count: item.token_count,
            metadata: item.chunk_metadata,
            document_id: item.document_id,
          };

          const documentData = {
            id: item.document_id,
            name: item.document_name,
            file_path: item.file_path,
            type: item.doc_type,
            source: item.source,
            client_id: item.client_id,
            language: item.language,
            mime_type: item.mime_type,
            created_at: item.created_at,
          };

          if (!this.matchesFilters(chunkData, documentData, filters)) {
            return null;
          }

          const similarity = item.similarity || this.getSimilarityScore(item, queryEmbedding);

          if (filters.similarityThreshold != null && similarity < filters.similarityThreshold) {
            return null;
          }

          return {
            chunk: this.buildChunkFromRow(chunkData, documentData, item, index, similarity),
            similarity,
          };
        })
        .filter((row): row is { chunk: Chunk; similarity: number } => Boolean(row));

      scoredRows.sort((a, b) => b.similarity - a.similarity);
      const chunks: Chunk[] = scoredRows.slice(0, limit).map((row) => row.chunk);

      const searchTime = Date.now() - startTime;
      const averageSimilarity = chunks.length > 0
        ? chunks.reduce((sum, chunk) => sum + (chunk.metadata.similarity || 0), 0) / chunks.length
        : 0;

      console.info('Recherche terminée avec succès', {
        queryLength: query.length,
        chunksFound: chunks.length,
        averageSimilarity,
        searchTime: `${searchTime}ms`,
      });

      return {
        chunks,
        averageSimilarity: Math.round(averageSimilarity * 100) / 100,
        searchTime,
        //totalChunksScanned: count ?? undefined,
      };
    } catch (error: any) {
      const retrievalError = this.handleError(error);
      console.error('Échec de la récupération des chunks', {
        error: retrievalError.message,
        errorType: retrievalError.errorType,
        queryLength: query.length,
      });
      throw retrievalError;
    }
  }

  /**
   * Récupérer les chunks similaires à un embedding existant
   * @param embedding Embedding de référence
   * @param filters Filtres de recherche
   * @returns Résultat avec les chunks similaires
   */
  async retrieveSimilarChunks(
    embedding: number[],
    filters: RetrievalFilters = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    if (!embedding || embedding.length === 0) {
      throw new RetrievalError(
        'Embedding vide fourni',
        400,
        'empty_embedding',
        false
      );
    }

    try {
      const limit = filters.limit || 5;
      const candidateLimit = Math.max(limit * 5, 20);
      
      // ⭐ CORRIGÉ : Ajout de l'ordre vectoriel pour pgvector
      // Mistral Embeddings (mistral-embed) génère des vecteurs de 1024 dimensions
      const EMBEDDING_DIMENSION = 1024; // Dimension pour mistral-embed
      const embeddingString = JSON.stringify(embedding);
      //const embeddingString = `{${embedding.join(',')}}`;
      /*
      let supabaseQuery = this.supabase
        .from('embeddings')
        .select(`
          id,
          chunk_id,
          vector,
          chunks!inner(
            id,
            document_id,
            content,
            chunk_index,
            token_count,
            metadata,
            documents!inner(
              id,
              name,
              file_path,
              type,
              source,
              client_id,
              language,
              mime_type,
              created_at
            )
          )
        `)      
        .order(`vector <=> ${embeddingString}::vector(${EMBEDDING_DIMENSION})`, { ascending: false })
        .limit(candidateLimit);

      supabaseQuery = this.applyFilters(supabaseQuery, filters);
      const { data, error, count } = await supabaseQuery;
      */


      // Test par fonciton rpc
      /*
      create or replace function match_chunks(
        query_embedding vector(1024),
        match_count int
      )
      returns table (
        id uuid,
        chunk_id uuid,
        similarity float,
        chunk_content text,
        chunk_index int,
        token_count int,
        chunk_metadata jsonb,
        document_id uuid,
        document_name text,
        file_path text,
        doc_type text,
        source text,
        client_id text,
        language text,
        mime_type text,
        created_at timestamptz
      )
      language sql stable
      as $$
        select
          e.id,
          e.chunk_id,
          1 - (e.vector <=> query_embedding) as similarity,
          c.content as chunk_content,
          c.chunk_index,
          c.token_count,
          c.metadata as chunk_metadata,
          d.id as document_id,
          d.name as document_name,
          d.file_path,
          d.type as doc_type,
          d.source,
          d.client_id,
          d.language,
          d.mime_type,
          d.created_at
        from embeddings e
        inner join chunks c on c.id = e.chunk_id
        inner join documents d on d.id = c.document_id
        order by e.vector <=> query_embedding
        limit match_count;
      $$;
      +>  Créée dans éditeur sql de supabase
      */
     
      const { data, error } = await this.supabase.rpc('match_chunks', {
        query_embedding: embedding, // tableau de nombres, PAS une string formatée
        match_count: EMBEDDING_DIMENSION
      });

      
      
      if (error) {
        throw new RetrievalError(
          `Erreur de recherche: ${error.message || 'Erreur Supabase'}`,
          (error as any).status || 500,
          'supabase_query_error',
          true
        );
      }

      if (!data || !Array.isArray(data)) {
        return {
          chunks: [],
          averageSimilarity: 0,
          searchTime: Date.now() - startTime,
          totalChunksScanned: 0,
        };
      }

      const scoredRows = data
        .map((item: any, index: number) => {
          // La RPC retourne une structure PLATE, pas imbriquée
          const chunkData = {
            id: item.chunk_id,
            content: item.chunk_content,
            chunk_index: item.chunk_index,
            token_count: item.token_count,
            metadata: item.chunk_metadata,
            document_id: item.document_id,
          };
          
          const documentData = {
            id: item.document_id,
            name: item.document_name,
            file_path: item.file_path,
            type: item.doc_type,
            source: item.source,
            client_id: item.client_id,
            language: item.language,
            mime_type: item.mime_type,
            created_at: item.created_at,
          };
          
          const similarity = item.similarity || this.getSimilarityScore(item, embedding);

          if (filters.similarityThreshold != null && similarity < filters.similarityThreshold) {
            return null;
          }

          return {
            chunk: this.buildChunkFromRow(chunkData, documentData, item, index, similarity),
            similarity,
          };
        })
        .filter((row): row is { chunk: Chunk; similarity: number } => Boolean(row));

      scoredRows.sort((a, b) => b.similarity - a.similarity);
      const chunks: Chunk[] = scoredRows.slice(0, limit).map((row) => row.chunk);

      const searchTime = Date.now() - startTime;
      const averageSimilarity = chunks.length > 0
        ? chunks.reduce((sum, chunk) => sum + (chunk.metadata.similarity || 0), 0) / chunks.length
        : 0;

      return {
        chunks,
        averageSimilarity: Math.round(averageSimilarity * 100) / 100,
        searchTime,
        //totalChunksScanned: count ?? undefined,
      };
    } catch (error: any) {
      const retrievalError = this.handleError(error);
      throw retrievalError;
    }
  }

  /**
   * Construire un chunk à partir du résultat de la requête Supabase
   */
  private buildChunkFromRow(
    chunkData: any,
    documentData: any,
    item: any,
    index: number,
    similarity: number = 0
  ): Chunk {
    const metadata = chunkData?.metadata || {};
    const documentPath = documentData?.file_path
      || metadata.documentPath
      || metadata.document_path
      || chunkData?.document_path
      || chunkData?.documentPath;
    const source = documentData?.source
      || metadata.source
      || chunkData?.source
      || 'unknown';
    const documentType = documentData?.type
      || metadata.documentType
      || metadata.document_type
      || chunkData?.document_type
      || chunkData?.documentType
      || 'text';
    const contentType = metadata.contentType
      || metadata.content_type
      || chunkData?.content_type
      || chunkData?.contentType
      || 'text';
    const client = metadata.client
      || documentData?.client_id
      || chunkData?.client
      || 'default';
    const language = documentData?.language
      || metadata.language
      || chunkData?.language
      || 'unknown';
    const chunkIndex = Number(chunkData?.chunk_index ?? metadata.chunkIndex ?? index);
    const totalChunks = Number(chunkData?.total_chunks ?? metadata.totalChunks ?? 1);
    const createdAt = chunkData?.created_at || documentData?.created_at || metadata.createdAt;
    const tokenCount = Number(chunkData?.token_count ?? metadata.tokenCount ?? 0);
    const documentId = chunkData?.document_id || documentData?.id || metadata.documentId;

    return {
      id: chunkData?.id || item?.chunk_id || `${index}`,
      content: chunkData?.content || '',
      metadata: {
        documentPath,
        source,
        documentType,
        contentType,
        client,
        language,
        chunkIndex,
        totalChunks,
        createdAt,
        tokenCount,
        similarity,
        documentId,
      },
    };
  }

  /**
   * Extraire ou calculer la similarité à partir d'un résultat Supabase
   */
  private getSimilarityScore(item: any, embedding?: number[]): number {
    if (typeof item?.similarity === 'number') {
      return item.similarity;
    }

    return this.calculateSimilarity(embedding, item?.vector);
  }

  /**
   * Normaliser un embedding retourné sous forme d'objet ou de tableau brut
   */
  private normalizeEmbedding(embedding: any): number[] {
    if (Array.isArray(embedding)) {
      return embedding;
    }

    if (embedding && Array.isArray(embedding.embedding)) {
      return embedding.embedding;
    }

    return [];
  }

  /**
   * Calculer la similarité cosinus entre deux embeddings
   */
  private calculateSimilarity(embeddingA?: number[], embeddingB?: number[]): number {
    if (!Array.isArray(embeddingA) || !Array.isArray(embeddingB)) {
      return 0;
    }

    const length = Math.min(embeddingA.length, embeddingB.length);
    if (length === 0) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      const a = embeddingA[i] || 0;
      const b = embeddingB[i] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Appliquer les filtres à la requête Supabase
   * @param query Requête Supabase
   * @param filters Filtres à appliquer
   * @returns Requête Supabase avec filtres
   */
  private applyFilters(
    query: any,
    filters: RetrievalFilters
  ): any {
    // Filtre par thème (colonne réelle de la table documents ou chunks)
    if (filters.theme) {
      const themeValues = Array.isArray(filters.theme) 
        ? filters.theme 
        : [filters.theme];
      query = query.in('chunks.metadata->>theme', themeValues);
    }

    // Filtre par format de document (colonne réelle de la table documents)
    if (filters.documentFormat) {
      const formatValues = Array.isArray(filters.documentFormat) 
        ? filters.documentFormat 
        : [filters.documentFormat];
      query = query.in('documents.type', formatValues);
    }

    // Filtre par rôle (métadonnée JSON stockée dans chunks.metadata)
    if (filters.role) {
      const roleValues = Array.isArray(filters.role) 
        ? filters.role 
        : [filters.role];
      query = query.in('chunks.metadata->>role', roleValues);
    }

    // Filtre par source (colonne réelle de la table documents ou métadonnée JSON)
    if (filters.source) {
      const sourceValues = Array.isArray(filters.source) 
        ? filters.source 
        : [filters.source];
      query = query.in('documents.source', sourceValues);
    }

    return query;
  }

  /**
   * Vérifier si un chunk candidat correspond aux filtres demandés.
   *
   * `match_chunks` (RPC pgvector) ne prend pas de paramètres de filtre — elle
   * retourne un ensemble de candidats déjà triés par similarité. Les filtres
   * sont donc appliqués ici, côté application, sur cet ensemble de candidats
   * avant tri/troncature finale (voir ST-304 review — les filtres n'avaient
   * auparavant aucun effet car `applyFilters()` n'était câblé que sur
   * l'ancienne requête `.from('embeddings')` désormais commentée/inutilisée).
   *
   * [NOTE 2026-07-08] Le filtre `theme` lit `metadata.client`, pas
   * `metadata.theme` : ce dernier n'est écrit nulle part par le pipeline
   * d'indexation (`src/lib/supabase/storage/indexer.ts`). Décision
   * utilisateur : rebrancher "Thème" sur le champ `client` réellement
   * indexé plutôt que d'attendre une future story de tagging par thème
   * métier — voir `src/app/api/chat/filters/route.ts` (même mapping).
   */
  private matchesFilters(
    chunkData: { metadata?: { client?: string; role?: string; [key: string]: unknown } },
    documentData: { type?: string; source?: string },
    filters: RetrievalFilters
  ): boolean {
    const metadata = chunkData.metadata || {};

    const matchesOneOf = (value: string | undefined, expected?: string | string[]): boolean => {
      if (!expected) return true;
      if (!value) return false;
      const expectedValues = Array.isArray(expected) ? expected : [expected];
      return expectedValues.includes(value);
    };

    if (!matchesOneOf(metadata.client, filters.theme)) return false;
    if (!matchesOneOf(documentData.type, filters.documentFormat)) return false;
    if (!matchesOneOf(metadata.role, filters.role)) return false;
    if (!matchesOneOf(documentData.source, filters.source)) return false;

    return true;
  }

  /**
   * Gérer les erreurs
   * @param error Erreur
   * @returns RetrievalError formaté
   */
  private handleError(error: any): RetrievalError {
    if (error instanceof RetrievalError) {
      return error;
    }

    const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
    const errorType = error?.code || error?.errorType || 'unknown_error';
    const errorStatus = error?.status || error?.statusCode;
    
    // Erreurs Supabase
    if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      return new RetrievalError(
        'Erreur de connexion à la base de données',
        503,
        'database_connection_error',
        true
      );
    }

    if (errorMessage.includes('timeout')) {
      return new RetrievalError(
        'Requête timeout',
        408,
        'request_timeout',
        true
      );
    }

    // Erreurs 400-599
    const statusCode = errorStatus;
    if (statusCode >= 400 && statusCode < 500) {
      return new RetrievalError(
        errorMessage,
        statusCode,
        errorType,
        false
      );
    }

    if (statusCode >= 500) {
      return new RetrievalError(
        errorMessage,
        statusCode,
        errorType,
        true
      );
    }

    return new RetrievalError(
      errorMessage,
      undefined,
      errorType
    );
  }

  /**
   * Vérifier si le service est configuré
   */
  isConfigured(): boolean {
    return !!(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      this.embeddingService.isConfigured()
    );
  }

  /**
   * Vérifier la santé de la base de données
   */
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('embeddings')
        .select('count', { head: true, count: 'exact' });
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Re-indexer une source spécifique
   * @param sourceId ID de la source à re-indexer
   * @param options Options de re-indexation (client, documentType)
   * @returns Nombre de documents traités
   */
  async reindexSource(
    sourceId: string,
    options: { client?: string; documentType?: string; userId?: string } = {}
  ): Promise<{ documentsProcessed: number; errors: string[] }> {
    const startTime = Date.now();
    const errors: string[] = [];
    let documentsProcessed = 0;

    console.info(`Début de la re-indexation de la source: ${sourceId}`, {
      client: options.client,
      documentType: options.documentType,
      userId: options.userId,
    });

    try {
      // 1. Récupérer les documents de la source depuis Supabase Storage
      // TODO: Implémenter la connexion à Supabase Storage
      // Pour l'instant, simuler avec la table documents
      
      let query = this.supabase
        .from('documents')
        .select('id, file_path, name, metadata, created_at, updated_at, source')
        .or(`file_path.eq.${sourceId},metadata->>source.eq.${sourceId}`);

      // Filtrer par client si fourni
      if (options.client) {
        query = query.eq('metadata->>client', options.client);
      }

      // Filtrer par documentType si fourni
      if (options.documentType) {
        query = query.eq('metadata->>documentType', options.documentType);
      }

      const { data: documents, error: docError } = await query;

      if (docError) {
        throw new RetrievalError(
          `Échec de récupération des documents: ${docError.message}`,
          500,
          'document_retrieval_error',
          true
        );
      }

      if (!documents || documents.length === 0) {
        console.warn(`Aucun document trouvé pour la source: ${sourceId}`);
        return { documentsProcessed: 0, errors: [] };
      }

      // 2. Pour chaque document, extraire le texte, chunker, embedder, stocker
      for (const doc of documents) {
        try {
          // TODO: Implémenter:
          // 1. Récupérer le contenu du document depuis Storage
          // 2. Extraire le texte (OCR si nécessaire)
          // 3. Chunk le texte
          // 4. Générer les embeddings
          // 5. Stocker dans la table embeddings
          
          // Simulation pour l'instant
          console.info(`Traitement du document: ${doc.name}`, {
            documentId: doc.id,
            path: doc.file_path,
          });
          
          // Incrementer le compteur
          documentsProcessed++;
          
          // Simuler un petit délai
          await new Promise(resolve => setTimeout(resolve, 10));
          
        } catch (docError: any) {
          console.error(`Échec du traitement du document: ${doc.name}`, {
            error: docError.message,
            documentId: doc.id,
          });
          errors.push(`Document ${doc.name} (${doc.id}): ${docError.message}`);
        }
      }

      const processingTime = Date.now() - startTime;
      
      console.info(`Re-indexation terminée pour la source: ${sourceId}`, {
        documentsProcessed,
        errorsCount: errors.length,
        processingTime: `${processingTime}ms`,
      });

      return { documentsProcessed, errors };
      
    } catch (error: any) {
      console.error(`Échec global de la re-indexation pour source: ${sourceId} - ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
      
      throw new RetrievalError(
        `Échec de la re-indexation: ${error.message}`,
        500,
        'reindex_failed',
        true
      );
    }
  }
}

// Instance singleton par défaut (initialisation paresseuse)
let retrievalServiceInstance: RetrievalService | null = null;

function getRetrievalService(): RetrievalService {
  if (!retrievalServiceInstance) {
    retrievalServiceInstance = new RetrievalService();
  }
  return retrievalServiceInstance;
}

/**
 * Fonction principale de retrieval (wrapper)
 * @param query Requête utilisateur
 * @param filters Filtres de recherche
 * @returns Résultat avec les chunks pertinents
 */
export async function retrieveRelevantChunks(
  query: string,
  filters: RetrievalFilters = {}
): Promise<RetrievalResult> {
  return getRetrievalService().retrieveRelevantChunks(query, filters);
}

/**
 * Fonction pour récupérer les chunks similaires (wrapper)
 * @param embedding Embedding de référence
 * @param filters Filtres de recherche
 * @returns Résultat avec les chunks similaires
 */
export async function retrieveSimilarChunks(
  embedding: number[],
  filters: RetrievalFilters = {}
): Promise<RetrievalResult> {
  return getRetrievalService().retrieveSimilarChunks(embedding, filters);
}

/**
 * Re-indexer une source spécifique (wrapper)
 * @param sourceId ID de la source à re-indexer
 * @param options Options de re-indexation
 * @returns Résultat de la re-indexation
 */
export async function reindexSource(
  sourceId: string,
  options: { client?: string; documentType?: string; userId?: string } = {}
): Promise<{ documentsProcessed: number; errors: string[] }> {
  return getRetrievalService().reindexSource(sourceId, options);
}

// Exporter l'instance pour la compatibilité (désapprouvé - utiliser les fonctions wrappers)
export const retrievalService = getRetrievalService();
