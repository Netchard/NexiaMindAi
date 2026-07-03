"use strict";
/**
 * Types pour le service Supabase Storage
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingError = exports.ChunkError = exports.DocumentError = exports.IndexationError = void 0;
exports.handleSupabaseError = handleSupabaseError;
/**
 * Type pour les erreurs d'indexation spécifiques
 */
class IndexationError extends Error {
    constructor(message, errorType, originalError, context) {
        super(message);
        this.errorType = errorType;
        this.originalError = originalError;
        this.context = context;
        this.name = 'IndexationError';
    }
}
exports.IndexationError = IndexationError;
/**
 * Type pour les erreurs de document
 */
class DocumentError extends Error {
    constructor(message, documentPath, operation, originalError) {
        super(message);
        this.documentPath = documentPath;
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'DocumentError';
    }
}
exports.DocumentError = DocumentError;
/**
 * Type pour les erreurs de chunk
 */
class ChunkError extends Error {
    constructor(message, chunkIndex, documentPath, operation, originalError) {
        super(message);
        this.chunkIndex = chunkIndex;
        this.documentPath = documentPath;
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'ChunkError';
    }
}
exports.ChunkError = ChunkError;
/**
 * Type pour les erreurs d'embedding
 */
class EmbeddingError extends Error {
    constructor(message, chunkId, operation, originalError) {
        super(message);
        this.chunkId = chunkId;
        this.operation = operation;
        this.originalError = originalError;
        this.name = 'EmbeddingError';
    }
}
exports.EmbeddingError = EmbeddingError;
/**
 * Utilitaire pour la gestion des erreurs typées
 */
function handleSupabaseError(error, context, additionalData) {
    if (error instanceof Error) {
        return new IndexationError(error.message, 'supabase_error', error, { context, ...additionalData });
    }
    if (typeof error === 'string') {
        return new IndexationError(error, 'string_error', undefined, { context, ...additionalData });
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return new IndexationError(String(error.message), 'object_error', undefined, { context, ...additionalData });
    }
    return new IndexationError('Unknown error occurred', 'unknown_error', undefined, { context, originalError: error, ...additionalData });
}
