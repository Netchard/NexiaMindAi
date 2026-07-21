/**
 * Préfixe de session d'upload manuel (`uploads/{slug}/`) — module partagé
 * entre `src/app/api/documents/upload/route.ts` (génère/valide/réutilise le
 * préfixe) et `src/app/api/documents/index/route.ts` (valide le préfixe reçu
 * avant de lancer `storageIndexer.indexAll({ prefix })`).
 *
 * Format strict : un seul segment de slug entre `uploads/` et le `/` final
 * — pas de sous-dossiers, pas de `..`. Sans cette validation, un client qui
 * forge sa requête pourrait envoyer un préfixe trop large (ex. `uploads/`)
 * et déclencher l'indexation de TOUS les uploads de TOUS les utilisateurs en
 * une fois, ce qui viole la contrainte "jamais de ré-indexation globale du
 * bucket depuis cette page" de la spec.
 */

// Un segment de slug : au moins un caractère, jamais `/` ni `..` seul.
const UPLOAD_PREFIX_PATTERN = /^uploads\/(?!\.\.\/)[^/]+\/$/;

export function isValidUploadPrefix(prefix: unknown): prefix is string {
  return typeof prefix === 'string' && UPLOAD_PREFIX_PATTERN.test(prefix);
}

export function generateUploadPrefix(): string {
  const slug = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `uploads/${slug}/`;
}
