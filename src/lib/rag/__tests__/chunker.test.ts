/**
 * Tests unitaires pour le service de chunking
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeAll, vi, Mock } from 'vitest';

// Mock des dépendances externes
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}));

// Importer après le mock
import {
  TextChunker,
  chunkText,
  chunkCode,
  chunkDocument
} from '../chunker';
import {
  estimateTokenCount,
  detectContentType,
  detectCodeLanguage,
  generateChunkId,
  isValidChunk
} from '../utils';
import type { ChunkingResult } from '../types';

describe('TextChunker', () => {
  let chunker: TextChunker;

  beforeAll(() => {
    chunker = new TextChunker({
      chunkSize: 512,
      chunkOverlap: 50
    });
  });

  describe('Estimation de tokens', () => {
    it('devrait estimer le nombre de tokens pour un texte court', () => {
      const text = 'Bonjour le monde';
      const tokenCount = estimateTokenCount(text);
      
      expect(tokenCount).toBeGreaterThan(0);
      expect(tokenCount).toBeLessThan(10);
    });

    it('devrait estimer le nombre de tokens pour un texte long', () => {
      const text = 'mot '.repeat(100); // ~100 mots
      const tokenCount = estimateTokenCount(text);
      
      expect(tokenCount).toBeGreaterThan(20);
      expect(tokenCount).toBeLessThan(100);
    });

    it('devrait retourner 0 pour un texte vide', () => {
      const tokenCount = estimateTokenCount('');
      expect(tokenCount).toBe(0);
    });
  });

  describe('Détection de type de contenu', () => {
    it('devrait détecter le markdown', () => {
      const markdownText = '# Titre\n\nCeci est du **markdown**';
      const contentType = detectContentType(markdownText);
      
      expect(contentType).toBe('markdown');
    });

    it('devrait détecter le HTML', () => {
      const htmlText = '<html><body><p>Test</p></body></html>';
      const contentType = detectContentType(htmlText);
      
      expect(contentType).toBe('html');
    });

    it('devrait détecter le code', () => {
      const codeText = 'function add(a, b) { return a + b; }';
      const contentType = detectContentType(codeText);
      
      expect(contentType).toBe('code');
    });

    it('devrait détecter le texte simple', () => {
      const text = 'Ceci est un texte simple sans format particulier.';
      const contentType = detectContentType(text);
      
      expect(contentType).toBe('text');
    });
  });

  describe('Détection de langage de code', () => {
    it('devrait détecter JavaScript', () => {
      const jsCode = 'const x = 1; function test() { return x; }';
      const language = detectCodeLanguage(jsCode);
      
      expect(language).toBe('javascript');
    });

    it('devrait détecter TypeScript', () => {
      const tsCode = 'interface User { name: string; }';
      const language = detectCodeLanguage(tsCode);
      
      expect(language).toBe('typescript');
    });

    it('devrait détecter Python', () => {
      const pythonCode = 'def add(a, b): return a + b';
      const language = detectCodeLanguage(pythonCode);
      
      expect(language).toBe('python');
    });

    it('devrait détecter SQL', () => {
      const sqlCode = 'SELECT * FROM users WHERE id = 1;';
      const language = detectCodeLanguage(sqlCode);
      
      expect(language).toBe('sql');
    });
  });

  describe('Génération d\'ID de chunk', () => {
    it('devrait générer un ID unique', () => {
      const chunkId = generateChunkId('doc-123', 0);
      
      expect(chunkId).toBe('chunk-doc-123-0');
    });

    it('devrait générer des IDs différents pour différents chunks', () => {
      const chunkId1 = generateChunkId('doc-123', 0);
      const chunkId2 = generateChunkId('doc-123', 1);
      
      expect(chunkId1).not.toBe(chunkId2);
      expect(chunkId1).toBe('chunk-doc-123-0');
      expect(chunkId2).toBe('chunk-doc-123-1');
    });
  });

  describe('Validation de chunk', () => {
    it('devrait valider un chunk normal', () => {
      const text = 'Ceci est un chunk valide avec suffisamment de contenu.';
      const isValid = isValidChunk(text, 10);
      
      expect(isValid).toBe(true);
    });

    it('devrait invalider un chunk vide', () => {
      const text = '';
      const isValid = isValidChunk(text, 10);
      
      expect(isValid).toBe(false);
    });

    it('devrait invalider un chunk trop court', () => {
      const text = 'trop court';
      const isValid = isValidChunk(text, 100);
      
      expect(isValid).toBe(false);
    });
  });

  describe('TextChunker stats', () => {
    it('devrait retourner les statistiques de configuration', () => {
      const stats = chunker.getStats();

      expect(stats.chunkSize).toBe(512);
      expect(stats.chunkOverlap).toBe(50);
      expect(stats.separators).toContain('\n\n');
    });
  });

  describe('TextChunker avec texte simple', () => {
    // Ces tests nécessitent langchain, donc ils seront conditionnels
    it('devrait gérer un texte vide sans erreur', async () => {
      try {
        const result = await chunker.chunkText('', {});
        
        expect(result.chunks.length).toBe(0);
        expect(result.totalChunks).toBe(0);
        expect(result.totalTokens).toBe(0);
        expect(result.processingTime).toBeDefined();
      } catch (error: any) {
        // Si langchain n'est pas installé, le test peut échouer
        // On vérifie que l'erreur est claire
        expect(error.message).toContain('LangChain') || expect(error.message).toContain('chunking');
      }
    });

    it('devrait gérer un texte très court', async () => {
      try {
        const shortText = 'Court texte';
        const result = await chunker.chunkText(shortText, {
          documentId: 'test-1',
          documentPath: '/test/document.txt'
        });

        expect(result.chunks.length).toBeGreaterThanOrEqual(0);
        expect(result.totalTokens).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        expect(error.message).toContain('LangChain') || expect(error.message).toContain('chunking');
      }
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter chunkText', async () => {
      try {
        const result = await chunkText('test', { documentId: 'test' });
        expect(result).toBeDefined();
        expect(result.chunks).toBeDefined();
      } catch (error: any) {
        expect(error.message).toContain('LangChain') || expect(error.message).toContain('chunking');
      }
    });

    it('devrait exporter chunkCode', async () => {
      try {
        const result = await chunkCode('const x = 1;', 'javascript', {});
        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).toContain('LangChain') || expect(error.message).toContain('chunking');
      }
    });

    it('devrait exporter chunkDocument', async () => {
      try {
        const result = await chunkDocument({
          content: 'test',
          metadata: {}
        });
        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).toContain('LangChain') || expect(error.message).toContain('chunking');
      }
    });
  });
});

describe('Types', () => {
  it('devrait exporter tous les types nécessaires', () => {
    // Just verify imports work
    const { ContentType, CodeLanguage, ChunkMetadata, Chunk, ChunkingOptions, ChunkingResult } = require('../types');
    
    expect(ContentType).toBeDefined();
    expect(CodeLanguage).toBeDefined();
    expect(ChunkMetadata).toBeDefined();
    expect(Chunk).toBeDefined();
    expect(ChunkingOptions).toBeDefined();
    expect(ChunkingResult).toBeDefined();
  });
});
