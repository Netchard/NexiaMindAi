/**
 * Service OCR pour l'extraction de texte
 * Fait partie de ST-201 - Intégrer Supabase Storage
 */

import { logger } from '../../logger';
import { ExtractedText } from './types';

/**
 * Service pour extraire du texte de différents types de fichiers
 * Prend en charge : texte brut, PDF, images (via service externe)
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
        default:
          logger.warn(`Type de fichier non supporté: ${contentType}`, {
            fileName,
          });
          // Essayer quand même de le traiter comme du texte
          try {
            const text = fileBuffer.toString('utf-8');
            if (text.trim().length > 0) {
              return { text, contentType: 'text' };
            }
          } catch {
            // Ignorer et retourner vide
          }
          return { text: '', contentType: 'other' };
      }
    } catch (error: any) {
      logger.error('Échec de l\'extraction de texte', {
        error: error.message,
        stack: error.stack,
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
  private detectContentType(fileName: string): 'pdf' | 'image' | 'text' | 'other' {
    const ext = fileName.toLowerCase().split('.').pop() || '';

    // Extensions PDF
    if (ext === 'pdf') {
      return 'pdf';
    }

    // Extensions images
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp', 'svg'];
    if (imageExtensions.includes(ext)) {
      return 'image';
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
      // Charger dynamiquement pdf-parse pour éviter les erreurs si non installé
      const { default: pdfParse } = await import('pdf-parse');

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
    } catch (error: any) {
      logger.error('Échec du parsing PDF', {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Échec de l'extraction PDF: ${error.message}`);
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

    // Pour l'instant, on lance une erreur pour indiquer que l'OCR n'est pas implémenté
    // En production, on pourrait appeler une API externe comme :
    // - Google Cloud Vision
    // - Azure Computer Vision
    // - Service Nexia OCR
    // - Tesseract.js (mais lourd pour le serveur)
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
      return { text, contentType: 'text' };
    } catch {
      // Essayer d'autres encodages si nécessaire
      try {
        const text = buffer.toString('latin1');
        return { text, contentType: 'text' };
      } catch {
        return { text: '', contentType: 'text' };
      }
    }
  }
}

// Instance singleton par défaut
export const ocrService = new OCRService();
