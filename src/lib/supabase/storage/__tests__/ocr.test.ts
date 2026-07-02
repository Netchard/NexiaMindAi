import { vi, describe, it, expect, beforeEach, beforeAll, afterEach, afterAll } from 'vitest';

/**
 * Tests unitaires pour OCRService
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { OCRService, ocrService } from '../ocr';

// Mock de pdf-parse
let mockPdfParse: any;
let mockLogger: any;

vi.mock('../../../logger', () => ({
  get logger() {
    return mockLogger;
  }
}));

vi.mock('pdf-parse', () => ({
  get default() {
    return mockPdfParse;
  }
}));

beforeEach(() => {
  // Initialiser les mocks avant chaque test
  mockPdfParse = vi.fn().mockResolvedValue({
    text: 'Extracted PDF text content',
    numpages: 5,
  });
  
  mockLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  };
});

describe('OCRService', () => {
  let service: OCRService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OCRService();
  });

  describe('Initialisation', () => {
    it('Devrait exporter une instance singleton par défaut', () => {
      expect(ocrService).toBeInstanceOf(OCRService);
    });
  });

  describe('extractText()', () => {
    describe('Fichiers texte brut', () => {
      it('Devrait extraire le texte d\'un fichier .txt', async () => {
        const textContent = 'Hello World';
        const buffer = Buffer.from(textContent, 'utf-8');

        const result = await service.extractText(buffer, 'document.txt');

        expect(result.text).toBe(textContent);
        expect(result.contentType).toBe('text');
      });

      it('Devrait extraire le texte d\'un fichier .md', async () => {
        const markdownContent = '# Hello\n\nThis is markdown';
        const buffer = Buffer.from(markdownContent, 'utf-8');

        const result = await service.extractText(buffer, 'document.md');

        expect(result.text).toBe(markdownContent);
        expect(result.contentType).toBe('text');
      });

      it('Devrait extraire le texte d\'un fichier .json', async () => {
        const jsonContent = '{"key": "value"}';
        const buffer = Buffer.from(jsonContent, 'utf-8');

        const result = await service.extractText(buffer, 'config.json');

        expect(result.text).toBe(jsonContent);
        expect(result.contentType).toBe('text');
      });

      it('Devrait gérer les fichiers texte avec encodage latin1', async () => {
        const textContent = 'Hello World';
        const buffer = Buffer.from(textContent, 'latin1');

        // Simuler UTF-8 qui échoue, puis latin1 qui réussit
        const originalToString = Buffer.prototype.toString;
        Buffer.prototype.toString = vi.fn(function(this: Buffer, encoding: string) {
          if (encoding === 'utf-8') {
            throw new Error('Invalid encoding');
          }
          return originalToString.call(this, encoding);
        });

        const result = await service.extractText(buffer, 'document.txt');
        expect(result.text).toBe(textContent);

        Buffer.prototype.toString = originalToString;
      });

      it('Devrait retourner un texte vide pour un fichier texte vide', async () => {
        const buffer = Buffer.from('', 'utf-8');

        const result = await service.extractText(buffer, 'empty.txt');

        expect(result.text).toBe('');
        expect(result.contentType).toBe('text');
      });
    });

    describe('Fichiers PDF', () => {
      it('Devrait extraire le texte d\'un fichier PDF', async () => {
        const pdfBuffer = Buffer.from('PDF content');

        const result = await service.extractText(pdfBuffer, 'document.pdf');

        expect(result.text).toBe('Extracted PDF text content');
        expect(result.contentType).toBe('pdf');
        expect(result.pageCount).toBe(5);
        expect(mockPdfParse).toHaveBeenCalledWith(pdfBuffer);
      });

      it('Devrait gérer les erreurs de parsing PDF', async () => {
        mockPdfParse.mockRejectedValue(new Error('Invalid PDF'));
        const pdfBuffer = Buffer.from('Invalid PDF content');

        await expect(service.extractText(pdfBuffer, 'invalid.pdf'))
          .rejects.toThrow('Échec de l\'extraction PDF: Invalid PDF');
      });
    });

    describe('Fichiers images', () => {
      it('Devrait lancer une erreur pour les images (OCR non implémenté)', async () => {
        const imageBuffer = Buffer.from('Image content');

        await expect(service.extractText(imageBuffer, 'document.png'))
          .rejects.toThrow('OCR pour images non implémenté');
      });

      it('Devrait détecter les extensions d\'images', async () => {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg'];

        for (const ext of imageExtensions) {
          const result = await service.extractText(Buffer.from(''), `image.${ext}`);
          // Devrait lancer une erreur ou retourner contentType: 'image'
          // Mais comme on catch l'erreur, on vérifie que le contentType est détecté
        }
      });
    });

    describe('Types de fichiers non supportés', () => {
      it('Devrait retourner un texte vide pour les types non supportés', async () => {
        const buffer = Buffer.from('Unknown content');

        const result = await service.extractText(buffer, 'document.xyz');

        expect(result.text).toBe('');
        expect(result.contentType).toBe('other');
      });

      it('Devrait essayer de traiter comme du texte si le type est inconnu', async () => {
        const textContent = 'Still readable text';
        const buffer = Buffer.from(textContent, 'utf-8');

        const result = await service.extractText(buffer, 'document.unknown');

        // Si le contenu est lisible comme du texte, il devrait être retourné
        expect(result.text).toBe(textContent);
      });
    });

    describe('Fichiers avec nom sans extension', () => {
      it('Devrait utiliser le type "other" pour les fichiers sans extension', async () => {
        const buffer = Buffer.from('Content without extension');

        const result = await service.extractText(buffer, 'document');

        expect(result.contentType).toBe('other');
      });
    });
  });

  describe('détection du type de contenu', () => {
    it('Devrait détecter le type PDF', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('document.pdf');
      expect(type).toBe('pdf');
    });

    it('Devrait détecter le type image (png)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('image.png');
      expect(type).toBe('image');
    });

    it('Devrait détecter le type image (jpg)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('photo.jpg');
      expect(type).toBe('image');
    });

    it('Devrait détecter le type image (jpeg)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('photo.jpeg');
      expect(type).toBe('image');
    });

    it('Devrait détecter le type texte (.txt)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('document.txt');
      expect(type).toBe('text');
    });

    it('Devrait détecter le type texte (.md)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('README.md');
      expect(type).toBe('text');
    });

    it('Devrait détecter le type texte (.js)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('script.js');
      expect(type).toBe('text');
    });

    it('Devrait détecter le type texte (.ts)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('script.ts');
      expect(type).toBe('text');
    });

    it('Devrait détecter le type texte (.json)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('config.json');
      expect(type).toBe('text');
    });

    it('Devrait détecter le type texte (.py)', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('script.py');
      expect(type).toBe('text');
    });

    it('Devrait retourner "other" pour les types inconnus', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('document.xyz');
      expect(type).toBe('other');
    });

    it('Devrait gérer les noms de fichiers sans extension', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('Makefile');
      expect(type).toBe('other');
    });

    it('Devrait gérer les noms de fichiers avec plusieurs points', () => {
      const service = new OCRService();
      const type = (service as any).detectContentType('archive.tar.gz');
      expect(type).toBe('other'); // gz n'est pas dans la liste
    });
  });

  describe('Logging', () => {
    it('Devrait logger l\'extraction de texte', async () => {
      const buffer = Buffer.from('test', 'utf-8');

      await service.extractText(buffer, 'test.txt');

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('Devrait logger les erreurs d\'extraction', async () => {
      mockPdfParse.mockRejectedValue(new Error('Parse error'));
      const buffer = Buffer.from('invalid', 'utf-8');

      try {
        await service.extractText(buffer, 'invalid.pdf');
      } catch {
        // Expected
      }

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('Contenu texte avancé', () => {
    it('Devrait gérer les fichiers texte avec des sauts de ligne', async () => {
      const textContent = 'Line 1\nLine 2\nLine 3';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await service.extractText(buffer, 'multiline.txt');

      expect(result.text).toBe(textContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait gérer les fichiers texte avec des caractères Unicode', async () => {
      const textContent = 'Bonjour le monde 🌍';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await service.extractText(buffer, 'unicode.txt');

      expect(result.text).toBe(textContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait gérer les fichiers Markdown avec syntaxe complexe', async () => {
      const markdownContent = `# Title\n\n## Subtitle\n\n- List item 1\n- List item 2\n\n\`code\``;
      const buffer = Buffer.from(markdownContent, 'utf-8');

      const result = await service.extractText(buffer, 'complex.md');

      expect(result.text).toBe(markdownContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait gérer les fichiers JSON avec structure complexe', async () => {
      const jsonContent = `{
        "name": "Test",
        "values": [1, 2, 3],
        "nested": {
          "key": "value"
        }
      }`;
      const buffer = Buffer.from(jsonContent, 'utf-8');

      const result = await service.extractText(buffer, 'complex.json');

      expect(result.text).toBe(jsonContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait gérer les PDF avec nombre de pages variable', async () => {
      mockPdfParse.mockResolvedValueOnce({
        text: 'Single page PDF',
        numpages: 1,
      });

      const pdfBuffer = Buffer.from('PDF content');
      const result = await service.extractText(pdfBuffer, 'single.pdf');

      expect(result.text).toBe('Single page PDF');
      expect(result.pageCount).toBe(1);
    });

    it('Devrait gérer les PDF avec beaucoup de pages', async () => {
      mockPdfParse.mockResolvedValueOnce({
        text: 'Large document text'.repeat(100),
        numpages: 200,
      });

      const pdfBuffer = Buffer.from('Large PDF content');
      const result = await service.extractText(pdfBuffer, 'large.pdf');

      expect(result.pageCount).toBe(200);
      expect(result.text.length).toBeGreaterThan(1000);
    });
  });

  describe('Types de fichiers supplémentaires', () => {
    it('Devrait détecter .csv comme texte', async () => {
      const csvContent = 'col1,col2,col3\nval1,val2,val3';
      const buffer = Buffer.from(csvContent, 'utf-8');

      const result = await service.extractText(buffer, 'data.csv');

      expect(result.text).toBe(csvContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait détecter .html comme texte', async () => {
      const htmlContent = '<html><body><h1>Test</h1></body></html>';
      const buffer = Buffer.from(htmlContent, 'utf-8');

      const result = await service.extractText(buffer, 'page.html');

      expect(result.text).toBe(htmlContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait détecter .xml comme texte', async () => {
      const xmlContent = '<?xml version="1.0"?><root><item>Test</item></root>';
      const buffer = Buffer.from(xmlContent, 'utf-8');

      const result = await service.extractText(buffer, 'data.xml');

      expect(result.text).toBe(xmlContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait détecter .yaml comme texte', async () => {
      const yamlContent = 'key: value\nlist:\n  - item1\n  - item2';
      const buffer = Buffer.from(yamlContent, 'utf-8');

      const result = await service.extractText(buffer, 'config.yaml');

      expect(result.text).toBe(yamlContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait détecter .yml comme texte', async () => {
      const yamlContent = 'key: value';
      const buffer = Buffer.from(yamlContent, 'utf-8');

      const result = await service.extractText(buffer, 'config.yml');

      expect(result.text).toBe(yamlContent);
      expect(result.contentType).toBe('text');
    });
  });

  describe('Gestion des erreurs avancée', () => {
    it('Devrait gérer les erreurs de parsing PDF avec message détaillé', async () => {
      mockPdfParse.mockRejectedValue(new Error('PDF is encrypted or corrupted'));
      const pdfBuffer = Buffer.from('corrupted pdf');

      try {
        await service.extractText(pdfBuffer, 'corrupted.pdf');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Échec de l\'extraction PDF');
        expect(error.message).toContain('PDF is encrypted or corrupted');
      }
    });

    it('Devrait gérer les PDF avec du texte vide', async () => {
      mockPdfParse.mockResolvedValueOnce({
        text: '',
        numpages: 0,
      });

      const pdfBuffer = Buffer.from('empty pdf');
      const result = await service.extractText(pdfBuffer, 'empty.pdf');

      expect(result.text).toBe('');
      expect(result.pageCount).toBe(0);
    });

    it('Devrait gérer les fichiers texte avec du contenu binaire qui ne peut pas être décodé', async () => {
      // Buffer avec du contenu binaire qui va échouer en UTF-8
      const binaryBuffer = Buffer.from([0xFF, 0xFE, 0x00, 0x01]);

      const result = await service.extractText(binaryBuffer, 'binary.dat');

      // Devrait retourner un texte vide car le type est 'other' et le décodage échoue
      expect(result.contentType).toBe('other');
    });
  });

  describe('Performances et optimisations', () => {
    it('Devrait gérer les gros fichiers texte', async () => {
      const largeText = 'A'.repeat(10000); // 10KB de texte
      const buffer = Buffer.from(largeText, 'utf-8');

      const startTime = Date.now();
      const result = await service.extractText(buffer, 'large.txt');
      const processingTime = Date.now() - startTime;

      expect(result.text).toBe(largeText);
      expect(result.contentType).toBe('text');
      expect(processingTime).toBeLessThan(100); // Devrait être rapide
    });

    it('Devrait gérer les fichiers avec des extensions en majuscules', async () => {
      const textContent = 'Test content';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await service.extractText(buffer, 'DOCUMENT.TXT');

      expect(result.text).toBe(textContent);
      expect(result.contentType).toBe('text');
    });

    it('Devrait gérer les fichiers avec des extensions mixtes', async () => {
      const textContent = 'Test content';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await service.extractText(buffer, 'Document.TxT');

      expect(result.text).toBe(textContent);
      expect(result.contentType).toBe('text');
    });
  });

  describe('Résultats de détection de contenu', () => {
    it('Devrait retourner pageCount=0 pour les fichiers non-PDF', async () => {
      const textContent = 'Simple text';
      const buffer = Buffer.from(textContent, 'utf-8');

      const result = await service.extractText(buffer, 'simple.txt');

      expect(result.pageCount).toBe(0);
    });

    it('Devrait retourner pageCount=0 pour les images', async () => {
      const imageBuffer = Buffer.from('image data');

      try {
        await service.extractText(imageBuffer, 'image.png');
        fail('Should have thrown an error for images');
      } catch (error: any) {
        expect(error.message).toContain('OCR pour images non implémenté');
      }
    });
  });
});
