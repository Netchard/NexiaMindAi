/**
 * Tests unitaires pour le service de formatage
 * Fait partie du pipeline RAG de NexiaMind AI
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Importer après les mocks
import {
  ResponseFormatter,
  FormatOptions,
  Citation,
  FormattedResponse,
  formatResponse,
  FormattingError,
} from '../formatter';
import { Chunk } from '../types';

describe('ResponseFormatter', () => {
  let formatter: ResponseFormatter;

  beforeEach(() => {
    vi.clearAllMocks();
    formatter = new ResponseFormatter();
  });

  describe('Initialisation', () => {
    it('devrait initialiser avec une configuration par défaut', () => {
      expect(formatter).toBeDefined();
      expect(formatter).toBeInstanceOf(ResponseFormatter);
    });

    it('devrait accepter une configuration personnalisée', () => {
      const options: FormatOptions = {
        citationStyle: 'alphanumeric',
        includeMetadata: true,
      };
      const customFormatter = new ResponseFormatter(options);
      expect(customFormatter).toBeDefined();
    });

    it('devrait détecter si bien configuré', () => {
      expect(formatter.isConfigured()).toBe(true);
    });
  });

  describe('formatResponse', () => {
    const mockChunks: Chunk[] = [
      {
        id: '1',
        content: 'Contenu du premier document',
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          contentType: 'text',
          documentPath: 'documents/document1.pdf',
          source: 'supabase',
          tokenCount: 100,
          createdAt: '2026-01-01',
        },
      },
      {
        id: '2',
        content: 'Contenu du deuxième document',
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          contentType: 'markdown',
          documentPath: 'docs/guide.md',
          source: 'gitlab',
          client: 'nexia',
          language: 'fr',
          tokenCount: 150,
          createdAt: '2026-01-02',
        },
      },
    ];

    it('devrait formater une réponse simple sans citations', async () => {
      const rawResponse = 'Ceci est une réponse simple sans citations.';
      
      const result = await formatter.formatResponse(rawResponse, []);
      
      expect(result).toBeDefined();
      expect(result.formattedContent).toContain('Ceci est une réponse simple sans citations.');
      expect(result.citations).toHaveLength(0);
      expect(result.citationCount).toBe(0);
      expect(result.formatTime).toBeDefined();
    });

    it('devrait formater une réponse avec citations au format --- Source: ... ---', async () => {
      const rawResponse = `Voici la réponse basée sur les documents.

---
Source: documents/document1.pdf
---

Contenu pertinent ici.

---
Source: docs/guide.md
---

Autre contenu.`;

      const result = await formatter.formatResponse(rawResponse, mockChunks);

      expect(result).toBeDefined();
      expect(result.citations).toHaveLength(2);
      expect(result.citationCount).toBe(2);
      expect(result.formattedContent).toContain('[1]');
      expect(result.formattedContent).toContain('[2]');
      expect(result.formattedContent).toContain('**Sources :**');
      expect(result.formattedContent).toContain('documents/document1.pdf');
      expect(result.formattedContent).toContain('docs/guide.md');
    });

    it('devrait formater une réponse avec citations au format [Source: ...]', async () => {
      const rawResponse = `Réponse avec [Source: documents/document1.pdf] et [Source: docs/guide.md].`;

      const result = await formatter.formatResponse(rawResponse, mockChunks);

      expect(result).toBeDefined();
      expect(result.citations).toHaveLength(2);
      expect(result.formattedContent).toContain('[1]');
      expect(result.formattedContent).toContain('[2]');
    });

    it('devrait formater avec style de citation alphanumérique', async () => {
      const options: FormatOptions = { citationStyle: 'alphanumeric' };
      const customFormatter = new ResponseFormatter(options);
      
      const rawResponse = `Réponse avec --- Source: documents/document1.pdf ---`;

      const result = await customFormatter.formatResponse(rawResponse, mockChunks);

      expect(result.formattedContent).toContain('[a]');
      expect(result.citations[0].index).toBe(0);
    });

    it('devrait formater avec style de citation personnalisé', async () => {
      const options: FormatOptions = { 
        citationStyle: 'custom', 
        citationPrefix: 'SRC' 
      };
      const customFormatter = new ResponseFormatter(options);
      
      const rawResponse = `Réponse avec --- Source: documents/document1.pdf ---`;

      const result = await customFormatter.formatResponse(rawResponse, mockChunks);

      expect(result.formattedContent).toContain('[SRC_1]');
    });

    it('devrait gérer les réponses vides', async () => {
      const result = await formatter.formatResponse('', []);
      
      expect(result.formattedContent).toBe('');
      expect(result.citations).toHaveLength(0);
    });

    it('devrait gérer les chunks vides', async () => {
      const rawResponse = 'Réponse avec --- Source: unknown.pdf ---';
      
      const result = await formatter.formatResponse(rawResponse, []);
      
      expect(result).toBeDefined();
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].sourcePath).toBe('unknown.pdf');
    });

    it('devrait inclure les métadonnées quand includeMetadata est true', async () => {
      const options: FormatOptions = { includeMetadata: true };
      const customFormatter = new ResponseFormatter(options);
      
      const rawResponse = `--- Source: docs/guide.md ---`;

      const result = await customFormatter.formatResponse(rawResponse, mockChunks);

      expect(result.formattedContent).toContain('Client: nexia');
      expect(result.formattedContent).toContain('Language: fr');
    });

    it('devrait nettoyer les artifacts de formatage', async () => {
      const rawResponse = `Réponse avec   plusieurs   espaces  


  et des  

 lignes   vides.`;

      const result = await formatter.formatResponse(rawResponse, []);

      expect(result.formattedContent).not.toContain('  ');
      expect(result.formattedContent).not.toMatch(/\n{3,}/);
    });
  });

  describe('extractAndReplaceCitations', () => {
    const mockChunks: Chunk[] = [
      {
        id: '1',
        content: 'Test',
        metadata: {
          chunkIndex: 0,
          totalChunks: 1,
          contentType: 'text',
          documentPath: 'doc1.pdf',
          source: 'test',
          tokenCount: 10,
        },
      },
    ];

    it('devrait extraire les citations au format --- Source: ... ---', async () => {
      const rawResponse = '--- Source: doc1.pdf ---';
      
      const result = await formatter.formatResponse(rawResponse, mockChunks);
      
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].sourcePath).toBe('doc1.pdf');
      expect(result.citations[0].documentType).toBe('text');
      expect(result.citations[0].client).toBeUndefined();
    });

    it('devrait extraire les citations au format [Source: ...]', async () => {
      const rawResponse = '[Source: doc1.pdf]';
      
      const result = await formatter.formatResponse(rawResponse, mockChunks);
      
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].sourcePath).toBe('doc1.pdf');
    });

    it('devrait remplacer les citations par des placeholders', async () => {
      const rawResponse = 'Texte [Source: doc1.pdf] texte';
      
      const result = await formatter.formatResponse(rawResponse, mockChunks);
      
      expect(result.formattedContent).toContain('[1]');
      expect(result.formattedContent).not.toContain('[Source: doc1.pdf]');
    });

    it('devrait gérer les sources non trouvées dans les chunks', async () => {
      const rawResponse = '--- Source: unknown.pdf ---';
      
      const result = await formatter.formatResponse(rawResponse, []);
      
      expect(result.citations).toHaveLength(1);
      expect(result.citations[0].sourcePath).toBe('unknown.pdf');
      expect(result.citations[0].documentType).toBeUndefined();
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de parsing', async () => {
      // Un cas où le parsing pourrait échouer
      const rawResponse = 'Réponse avec citation mal formatée --- Source:';
      
      // Ne devrait pas planter
      const result = await formatter.formatResponse(rawResponse, []);
      expect(result).toBeDefined();
    });

    it('devrait gérer les chunks invalides', async () => {
      const invalidChunks = [
        { content: 'test' }, // Pas de metadata
        { content: 'test', metadata: {} }, // metadata vide
      ] as any[] as Chunk[];
      
      const result = await formatter.formatResponse('test', invalidChunks);
      expect(result).toBeDefined();
    });

    it('devrait gérer les options invalides', async () => {
      const invalidOptions = { citationStyle: 'invalid' } as any;
      const customFormatter = new ResponseFormatter(invalidOptions);
      
      const result = await customFormatter.formatResponse('test --- Source: doc.pdf ---', []);
      expect(result).toBeDefined();
      // Devrait utiliser le style par défaut (numeric) malgré l'option invalide
      expect(result.formattedContent).toContain('[1]');
      expect(result.citations).toHaveLength(1);
    });
  });

  describe('Fonctions exportées', () => {
    it('devrait exporter formatResponse', async () => {
      const result = await formatResponse('test', []);
      expect(result).toBeDefined();
    });

    it('devrait exporter ResponseFormatter', () => {
      const f = new ResponseFormatter();
      expect(f).toBeInstanceOf(ResponseFormatter);
    });
  });
});

describe('Citation', () => {
  it('devrait créer une citation avec toutes les propriétés', () => {
    const citation: Citation = {
      index: 0,
      sourcePath: 'doc.pdf',
      documentType: 'pdf',
      client: 'nexia',
      language: 'fr',
    };

    expect(citation.index).toBe(0);
    expect(citation.sourcePath).toBe('doc.pdf');
    expect(citation.documentType).toBe('pdf');
    expect(citation.client).toBe('nexia');
    expect(citation.language).toBe('fr');
  });

  it('devrait créer une citation avec des propriétés partielles', () => {
    const citation: Citation = {
      index: 1,
      sourcePath: 'doc.md',
    };

    expect(citation.index).toBe(1);
    expect(citation.sourcePath).toBe('doc.md');
    expect(citation.documentType).toBeUndefined();
    expect(citation.client).toBeUndefined();
  });

  it('devrait avoir un index', () => {
    const citation: Citation = { index: 0, sourcePath: 'test.pdf' };
    expect(citation.index).toBe(0);
  });

  it('devrait avoir un sourcePath', () => {
    const citation: Citation = { index: 0, sourcePath: 'test.pdf' };
    expect(citation.sourcePath).toBe('test.pdf');
  });
});

describe('FormattedResponse', () => {
  it('devrait créer une réponse formatée avec toutes les propriétés', () => {
    const response: FormattedResponse = {
      formattedContent: 'Réponse formatée',
      citations: [{ index: 0, sourcePath: 'doc.pdf' }],
      citationCount: 1,
      formatTime: 10,
      rawResponse: 'Réponse brute',
    };

    expect(response.formattedContent).toBe('Réponse formatée');
    expect(response.citations).toHaveLength(1);
    expect(response.citationCount).toBe(1);
    expect(response.formatTime).toBe(10);
    expect(response.rawResponse).toBe('Réponse brute');
  });
});

describe('FormattingError', () => {
  it('devrait créer une erreur avec toutes les propriétés', () => {
    const error = new FormattingError('Test error', 400, 'test_type', true);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.errorType).toBe('test_type');
    expect(error.retryable).toBe(true);
    expect(error.name).toBe('FormattingError');
  });

  it('devrait créer une erreur par défaut', () => {
    const error = new FormattingError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBeUndefined();
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur avec message et code', () => {
    const error = new FormattingError('Test error', 500);

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(500);
    expect(error.errorType).toBeUndefined();
    expect(error.retryable).toBe(false);
  });

  it('devrait créer une erreur retryable', () => {
    const error = new FormattingError('Test error', 500, 'server_error', true);
    expect(error.retryable).toBe(true);
  });

  it('devrait hériter de Error', () => {
    const error = new FormattingError('Test error');
    expect(error).toBeInstanceOf(Error);
  });
});
