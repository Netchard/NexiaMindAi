"use strict";
/**
 * Service de chunking pour le pipeline RAG
 * Divise les documents en chunks de taille fixe pour l'indexation vectorielle
 * Fait partie de NexiaMind AI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.textChunker = exports.TextChunker = void 0;
exports.chunkText = chunkText;
exports.chunkCode = chunkCode;
exports.chunkDocument = chunkDocument;
const logger_1 = require("../logger");
const utils_1 = require("./utils");
// Importer dynamiquement langchain pour éviter les erreurs si non installé
let RecursiveCharacterTextSplitter = null;
async function importLangChain() {
    if (RecursiveCharacterTextSplitter === null) {
        try {
            const langchain = await Promise.resolve().then(() => require('langchain/text_splitter'));
            RecursiveCharacterTextSplitter = langchain.RecursiveCharacterTextSplitter;
            logger_1.logger.info('LangChain RecursiveCharacterTextSplitter chargé avec succès');
        }
        catch (error) {
            logger_1.logger.error('Erreur de chargement de LangChain', {
                error: error.message,
                message: 'Veuillez installer langchain avec: npm install langchain @langchain/community'
            });
            throw new Error('LangChain non disponible. Installez langchain avec: npm install langchain @langchain/community');
        }
    }
    return RecursiveCharacterTextSplitter;
}
/**
 * Service de chunking pour le pipeline RAG
 * Divise les documents en chunks de taille fixe pour l'indexation vectorielle
 */
class TextChunker {
    /**
     * Créer une nouvelle instance du TextChunker
     * @param options Options de chunking
     */
    constructor(options = {}) {
        this.options = {
            chunkSize: options.chunkSize ?? 512,
            chunkOverlap: options.chunkOverlap ?? 50,
            separators: options.separators ?? ['\n\n', '\n', '. ', ' ', '']
        };
        logger_1.logger.info('TextChunker initialisé', {
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
    async chunkText(text, metadata = {}, customOptions) {
        const startTime = Date.now();
        if (!text || text.trim().length === 0) {
            logger_1.logger.warn('Texte vide fourni au chunker');
            return {
                chunks: [],
                totalChunks: 0,
                totalTokens: 0,
                avgChunkSize: 0,
                processingTime: Date.now() - startTime
            };
        }
        logger_1.logger.info('Début du chunking', {
            textLength: text.length,
            estimatedTokens: (0, utils_1.estimateTokenCount)(text)
        });
        try {
            // Charger LangChain
            const TextSplitter = await importLangChain();
            // Détecter le type de contenu
            const contentType = metadata.contentType ?? (0, utils_1.detectContentType)(text);
            const language = metadata.language ?? (contentType === 'code' ? (0, utils_1.detectCodeLanguage)(text) : undefined);
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
            const chunks = [];
            let totalTokens = 0;
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                const chunkContent = doc.pageContent;
                const tokenCount = (0, utils_1.estimateTokenCount)(chunkContent);
                totalTokens += tokenCount;
                // Créer les métadonnées du chunk
                const chunkMetadata = {
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
                if ((0, utils_1.isValidChunk)(chunkContent, 10)) {
                    chunks.push({
                        id: metadata.documentId
                            ? (0, utils_1.generateChunkId)(metadata.documentId, i)
                            : undefined,
                        content: chunkContent,
                        metadata: chunkMetadata
                    });
                }
                else {
                    logger_1.logger.warn('Chunk trop petit généré, ignoré', {
                        chunkIndex: i,
                        contentLength: chunkContent.length,
                        tokenCount
                    });
                }
            }
            const processingTime = Date.now() - startTime;
            const avgChunkSize = chunks.length > 0 ? totalTokens / chunks.length : 0;
            logger_1.logger.info('Chunking terminé avec succès', {
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
        }
        catch (error) {
            logger_1.logger.error('Erreur lors du chunking', {
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
    async chunkCode(code, language, metadata = {}) {
        // Pour le code, on peut utiliser des séparateurs spécifiques
        const codeSeparators = this.getCodeSeparators(language);
        const customOptions = {
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
    getCodeSeparators(language) {
        const baseSeparators = ['\n\n', '\n', '. ', ' ', ''];
        switch (language) {
            case 'javascript':
            case 'typescript':
                return [
                    '\n\n', // Classes, fonctions
                    '\n}', // Fin de bloc
                    'function ', // Déclaration de fonction
                    'class ', // Déclaration de classe
                    'const ', // Déclaration const
                    'let ', // Déclaration let
                    '\n', // Ligne
                    ';', // Instruction
                    '{', '}', // Blocs
                    ' ', // Espace
                    ''
                ];
            case 'python':
                return [
                    '\n\n',
                    'def ', // Déclaration de fonction
                    'class ', // Déclaration de classe
                    ':\n', // Après un deux-points
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
                    ';', // Fin de requête
                    '\n\n',
                    'SELECT ', 'FROM ', 'WHERE ', 'JOIN ', 'GROUP BY ',
                    '\n',
                    ',', // Séparateur de colonnes
                    ' ', ''
                ];
            case 'bash':
                return [
                    '\n', // Chaque commande sur une nouvelle ligne
                    '|', // Pipe
                    ';', // Séparateur de commandes
                    ' && ', // AND logique
                    ' || ', // OR logique
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
    async chunkDocument(document, options) {
        const result = await this.chunkText(document.content, document.metadata, options);
        // Validation supplémentaire
        if (result.chunks.length === 0) {
            logger_1.logger.warn('Aucun chunk valide généré', {
                documentId: document.metadata.documentId,
                documentPath: document.metadata.documentPath
            });
            // Essayer avec une taille de chunk plus petite
            return this.chunkText(document.content, document.metadata, {
                ...options,
                chunkSize: Math.floor((options?.chunkSize ?? 512) / 2)
            });
        }
        return result;
    }
    /**
     * Obtenir les statistiques du chunker
     */
    getStats() {
        return {
            chunkSize: this.options.chunkSize,
            chunkOverlap: this.options.chunkOverlap,
            separators: this.options.separators
        };
    }
}
exports.TextChunker = TextChunker;
// Instance singleton par défaut
exports.textChunker = new TextChunker();
/**
 * Fonction principale de chunking (wrapper)
 * @param text Texte à diviser
 * @param metadata Métadonnées
 * @param options Options de chunking
 * @returns Résultat du chunking
 */
async function chunkText(text, metadata = {}, options) {
    return exports.textChunker.chunkText(text, metadata, options);
}
/**
 * Fonction de chunking pour le code
 * @param code Code à diviser
 * @param language Langage
 * @param metadata Métadonnées
 * @returns Résultat du chunking
 */
async function chunkCode(code, language, metadata = {}) {
    return exports.textChunker.chunkCode(code, language, metadata);
}
/**
 * Fonction de chunking pour un document
 * @param document Document à diviser
 * @param options Options
 * @returns Résultat du chunking
 */
async function chunkDocument(document, options) {
    return exports.textChunker.chunkDocument(document, options);
}
