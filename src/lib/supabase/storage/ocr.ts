/**
 * Service OCR pour l'extraction de texte
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { logger } from '../../logger';
import { ExtractedText } from './types';

/**
 * Service pour extraire du texte de différents types de fichiers
 * Prend en charge : texte brut, PDF, images (via service externe), fichiers Office (DOCX, XLSX, PPTX, DOC, PPT, XLS)
 */
export class OCRService {
  /**
   * Extrait le texte d'un fichier
   * Détecte automatiquement le type et utilise la méthode appropriée
   * @param fileBuffer Contenu binaire du fichier
   * @param fileName Nom du fichier (utilisé pour la détection du type)
   * @returns Promise avec le texte extrait et les métadonnées
   */
  async extractText(fileBuffer: Buffer, fileName: string): Promise<ExtractedText> {
    const startTime = Date.now();
    const contentType = this.detectContentType(fileName);

    logger.info(`Extraction de texte - type détecté: ${contentType}`, {
      fileName,
      fileSize: fileBuffer.length,
    });

    try {
      switch (contentType) {
        case 'pdf':
          return await this.extractTextFromPDF(fileBuffer);
        case 'image':
          return await this.extractTextFromImage(fileBuffer, fileName);
        case 'text':
          return this.extractTextFromText(fileBuffer);
        case 'office':
          return await this.extractTextFromOffice(fileBuffer, fileName);
        default:
          logger.warn(`Type de fichier non supporté: ${contentType}`, {
            fileName,
          });
          return { text: '', contentType: 'other', pageCount: 0 };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Échec de l\'extraction de texte', {
        error: errorMessage,
        stack: errorStack,
        fileName,
        contentType,
      });
      throw error;
    } finally {
      logger.info(`Extraction de texte terminée`, {
        fileName,
        contentType,
        processingTime: `${Date.now() - startTime}ms`,
      });
    }
  }

  /**
   * Détecte le type de contenu à partir du nom de fichier
   * @param fileName Nom du fichier
   * @returns Type de contenu détecté
   */
  private detectContentType(fileName: string): 'pdf' | 'image' | 'text' | 'office' | 'other' {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    if (!ext) {
      return 'other';
    }

    // Extensions PDF
    if (ext === 'pdf') {
      return 'pdf';
    }

    // Extensions images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg'];
    if (imageExtensions.includes(ext)) {
      return 'image';
    }

    // Extensions Office
    const officeExtensions = ['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls'];
    if (officeExtensions.includes(ext)) {
      return 'office';
    }

    // Extensions texte
    const textExtensions = [
      'txt', 'md', 'markdown', 'csv', 'json', 'xml', 'html', 'htm',
      'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
      'sh', 'bash', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf',
      'sql', 'log', 'rst',
    ];
    if (textExtensions.includes(ext)) {
      return 'text';
    }

    if (ext === 'unknown') {
      return 'text';
    }

    return 'other';
  }

  /**
   * Extrait le texte d'un fichier PDF
   * Utilise la librairie pdf-parse
   * @param buffer Contenu binaire du PDF
   * @returns Promise avec le texte extrait
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<ExtractedText> {
    const startTime = Date.now();

    try {
      // Importer pdf-parse avec gestion d'erreur améliorée
      let pdfParse: any;
      try {
        const pdfParseModule = await import('pdf-parse');
        pdfParse = pdfParseModule.default;
      } catch (importError: unknown) {
        const errorMessage = importError instanceof Error ? importError.message : String(importError);
        logger.error('Échec de l\'import de pdf-parse', {
          error: errorMessage,
        });
        throw new Error('Module pdf-parse non disponible. Installer avec: npm install pdf-parse');
      }

      const data = await pdfParse(buffer);

      logger.info(`PDF parsed avec succès`, {
        numPages: data.numpages,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return {
        text: data.text,
        contentType: 'pdf',
        pageCount: data.numpages,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Échec du parsing PDF', {
        error: errorMessage,
        stack: errorStack,
      });
      throw new Error(`Échec de l'extraction PDF: ${errorMessage}`);
    }
  }

  /**
   * Extrait le texte d'une image
   * Pour les images, on utilise un placeholder car l'OCR nécessite un service externe
   * @param buffer Contenu binaire de l'image
   * @param fileName Nom du fichier image
   * @returns Promise avec le texte extrait
   */
  private async extractTextFromImage(buffer: Buffer, fileName: string): Promise<ExtractedText> {
    logger.warn(`OCR pour images nécessite un service externe`, {
      fileName,
      fileSize: buffer.length,
    });

    if (buffer.length === 0) {
      return { text: '', contentType: 'image' };
    }

    throw new Error(
      `OCR pour images non implémenté. ` +
      `Utiliser un service externe (Google Cloud Vision, Azure, ou Nexia) pour le fichier: ${fileName}`
    );
  }

  /**
   * Extrait le texte d'un fichier texte brut
   * @param buffer Contenu binaire du fichier
   * @returns Texte extrait
   */
  private extractTextFromText(buffer: Buffer): ExtractedText {
    try {
      // Essayer UTF-8
      const text = buffer.toString('utf-8');
      return { text, contentType: 'text', pageCount: 0 };
    } catch {
      // Essayer d'autres encodages si nécessaire
      try {
        const text = buffer.toString('latin1');
        return { text, contentType: 'text', pageCount: 0 };
      } catch {
        return { text: '', contentType: 'text', pageCount: 0 };
      }
    }
  }

  /**
   * Extrait le texte des fichiers Office (DOCX, DOC, PPTX, PPT, XLSX, XLS)
   * Utilise différentes bibliothèques selon le format
   * @param buffer Contenu binaire du fichier Office
   * @param fileName Nom du fichier (utilisé pour déterminer le type spécifique)
   * @returns Promise avec le texte extrait
   */
  private async extractTextFromOffice(buffer: Buffer, fileName: string): Promise<ExtractedText> {
    const startTime = Date.now();
    const ext = fileName.toLowerCase().split('.').pop() || '';

    try {
      let text = '';
      let pageCount = 0;

      switch (ext) {
        case 'docx':
          // Utiliser mammoth pour DOCX
          try {
            const mammothModule = await import('mammoth');
            const mammoth = mammothModule;
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de mammoth pour DOCX", {
              error: errorMessage,
            });
            throw new Error("Module mammoth non disponible. Installer avec: npm install mammoth");
          }
          break;

        case 'xlsx':
          // Utiliser xlsx pour XLSX
          try {
            const XLSXModule = await import('xlsx');
            const XLSX = XLSXModule;
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            const sheetNames = workbook.SheetNames;
            text = sheetNames.map(sheetName => {
              const sheet = workbook.Sheets[sheetName];
              return XLSX.utils.sheet_to_txt(sheet);
            }).join('\n\n');
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de xlsx pour XLSX", {
              error: errorMessage,
            });
            throw new Error("Module xlsx non disponible. Installer avec: npm install xlsx");
          }
          break;

        case 'pptx':
          // Utiliser officeparser pour PPTX
          try {
            // @ts-ignore - Contourner les problèmes de typage avec officeparser
            const officeparser = await import('officeparser');
            // @ts-ignore
            const result = await new Promise((resolve, reject) => {
              officeparser.parseOffice(buffer, (err: Error | null, data: any) => {
                if (err) reject(err);
                else resolve(data);
              });
            });
            // @ts-ignore
            text = result?.text || result?.content || result?.data || result?.value || String(result) || '';
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de officeparser pour PPTX", {
              error: errorMessage,
            });
            throw new Error("Module officeparser non disponible ou API incompatible. Installer avec: npm install officeparser");
          }
          break;

        case 'xls':
          // Utiliser officeparser pour XLS
          try {
            // @ts-ignore - Contourner les problèmes de typage avec officeparser
            const officeparser = await import('officeparser');
            // @ts-ignore
            const result = await new Promise((resolve, reject) => {
              officeparser.parseOffice(buffer, (err: Error | null, data: any) => {
                if (err) reject(err);
                else resolve(data);
              });
            });
            // @ts-ignore
            text = result?.text || result?.content || result?.data || result?.value || String(result) || '';
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de officeparser pour XLS", {
              error: errorMessage,
            });
            throw new Error("Module officeparser non disponible ou API incompatible. Installer avec: npm install officeparser");
          }
          break;

        case 'doc':
          // Utiliser officeparser pour DOC
          try {
            // @ts-ignore - Contourner les problèmes de typage avec officeparser
            const officeparser = await import('officeparser');
            // @ts-ignore
            const result = await new Promise((resolve, reject) => {
              officeparser.parseOffice(buffer, (err: Error | null, data: any) => {
                if (err) reject(err);
                else resolve(data);
              });
            });
            // @ts-ignore
            text = result?.text || result?.content || result?.data || result?.value || String(result) || '';
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de officeparser pour DOC", {
              error: errorMessage,
            });
            throw new Error("Module officeparser non disponible ou API incompatible. Installer avec: npm install officeparser");
          }
          break;

        case 'ppt':
          // Utiliser officeparser pour PPT
          try {
            // @ts-ignore - Contourner les problèmes de typage avec officeparser
            const officeparser = await import('officeparser');
            // @ts-ignore
            const result = await new Promise((resolve, reject) => {
              officeparser.parseOffice(buffer, (err: Error | null, data: any) => {
                if (err) reject(err);
                else resolve(data);
              });
            });
            // @ts-ignore
            text = result?.text || result?.content || result?.data || result?.value || String(result) || '';
          } catch (importError: unknown) {
            const errorMessage = importError instanceof Error ? importError.message : String(importError);
            logger.error("Échec de l'import de officeparser pour PPT", {
              error: errorMessage,
            });
            throw new Error("Module officeparser non disponible ou API incompatible. Installer avec: npm install officeparser");
          }
          break;

        default:
          throw new Error(`Format Office non supporté: ${ext}`);
      }

      logger.info(`Fichier Office traité avec succès`, {
        fileName,
        fileType: ext,
        processingTime: `${Date.now() - startTime}ms`,
      });

      return {
        text,
        contentType: 'office',
        pageCount,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Échec de l\'extraction de texte Office', {
        error: errorMessage,
        stack: errorStack,
        fileName,
        fileType: ext,
      });
      throw new Error(`Échec de l'extraction Office: ${errorMessage}`);
    }
  }
}

// Instance singleton par défaut
export const ocrService = new OCRService();
