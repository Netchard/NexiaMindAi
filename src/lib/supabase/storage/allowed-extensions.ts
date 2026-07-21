/**
 * Extensions de fichiers acceptées pour l'upload manuel de documents
 * (`/documents`, `/api/documents/upload`).
 *
 * Synchronisées avec les catégories supportées par `detectContentType()`
 * (privée) dans `src/lib/supabase/storage/ocr.ts` : pdf, office
 * (docx/doc/pptx/ppt/xlsx/xls) et texte. Les images sont volontairement
 * exclues : `extractTextFromImage()` lève toujours une erreur (pas d'OCR
 * implémenté), l'indexation échouerait systématiquement.
 *
 * Module partagé entre le client (src/app/documents/page.tsx) et la route
 * d'upload (src/app/api/documents/upload/route.ts) pour éviter la
 * duplication de cette liste.
 */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls',
  'txt', 'md', 'markdown', 'csv', 'json', 'xml', 'html', 'htm',
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
  'sh', 'bash', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf',
  'sql', 'log', 'rst',
] as const;

export function getExtension(fileName: string): string {
  return fileName.toLowerCase().split('.').pop() || '';
}

export function isAllowedFile(fileName: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getExtension(fileName) as (typeof ALLOWED_EXTENSIONS)[number]);
}
