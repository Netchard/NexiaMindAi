/**
 * Endpoint API pour l'upload manuel de documents vers Supabase Storage
 * Fait partie de la spec "Page Documents — upload et indexation manuelle RAG"
 * (_bmad-output/implementation-artifacts/spec-documents-upload-indexation.md)
 *
 * POST /api/documents/upload
 * Protégé par src/proxy.ts (préfixe /api/documents) : x-user-id est déjà
 * injecté et revalidé côté serveur. On le revérifie ici aussi (défense en
 * profondeur, même pattern que src/app/api/sources/supabase/sync/route.ts).
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { storageClient } from '@/lib/supabase/storage/client';
import { ALLOWED_EXTENSIONS, getExtension } from '@/lib/supabase/storage/allowed-extensions';
import { isValidUploadPrefix, generateUploadPrefix } from '@/lib/supabase/storage/upload-prefix';

interface UploadFileResult {
  fileName: string;
  success: boolean;
  path?: string;
  error?: string;
}

/**
 * Ne garde que le nom de base d'un nom de fichier fourni par le client
 * (retire tout ce qui précède un `/` ou `\`) et neutralise les segments
 * `..`, pour empêcher un client qui forge sa requête d'utiliser `file.name`
 * (non fiable) pour sortir du préfixe `uploads/{slug}/` et écraser des
 * objets arbitraires du bucket (uploadFile fait un upsert).
 */
function sanitizeFileName(rawName: string): string {
  const baseName = rawName.split(/[/\\]/).pop() || 'fichier';
  const cleaned = baseName.replace(/\.\.+/g, '.').trim();
  return cleaned.length > 0 ? cleaned : 'fichier';
}

export async function POST(request: Request) {
  const startTime = Date.now();
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    logger.warn('Tentative d\'accès à /api/documents/upload sans utilisateur authentifié', {
      path: '/api/documents/upload',
    });
    return NextResponse.json(
      { error: 'Non autorisé - utilisateur non authentifié' },
      { status: 401 }
    );
  }

  try {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch (parseError: unknown) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      logger.error('Échec du parsing du FormData de la requête', {
        error: errorMessage,
        userId,
      });
      return NextResponse.json(
        { error: 'Requête invalide - FormData mal formée' },
        { status: 400 }
      );
    }

    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      logger.warn('Aucun fichier fourni pour /api/documents/upload', { userId });
      return NextResponse.json(
        { error: 'Aucun fichier fourni (champ "files" requis)' },
        { status: 400 }
      );
    }

    // Un préfixe dédié par session d'upload — l'indexation déclenchée
    // ensuite ne porte jamais que sur ce préfixe (jamais tout le bucket).
    // Si le client fournit déjà un préfixe valide (uploads successifs dans
    // la même visite de page, avant le clic "Lancer l'indexation"), on le
    // réutilise pour que tous les lots partagent la même session — sinon on
    // en génère un nouveau (première fois, ou préfixe invalide/forgé).
    const requestedPrefix = formData.get('prefix');
    const prefix = isValidUploadPrefix(requestedPrefix) ? requestedPrefix : generateUploadPrefix();

    logger.info(`Début de l'upload de documents`, {
      userId,
      prefix,
      fileCount: files.length,
    });

    const results: UploadFileResult[] = [];

    // Index de boucle utilisé pour garantir un chemin unique par fichier
    // même en cas de noms dupliqués dans le même lot (sinon le second
    // écraserait silencieusement le premier via l'upsert de uploadFile).
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const safeName = sanitizeFileName(file.name);
      const ext = getExtension(safeName);

      if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
        results.push({
          fileName: file.name,
          success: false,
          error: `Type de fichier non supporté: .${ext || '?'}`,
        });
        continue;
      }

      const path = `${prefix}${i}-${safeName}`;

      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await storageClient.uploadFile(path, buffer, file.type || 'application/octet-stream');

        results.push({ fileName: file.name, success: true, path });
      } catch (uploadError: unknown) {
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        logger.error(`Échec de l'upload du fichier: ${file.name}`, {
          error: errorMessage,
          userId,
          path,
        });
        results.push({
          fileName: file.name,
          success: false,
          error: errorMessage || 'Échec du téléchargement',
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    logger.info('Upload de documents terminé', {
      userId,
      prefix,
      succeeded,
      failed,
      processingTime: `${Date.now() - startTime}ms`,
    });

    return NextResponse.json(
      { prefix, results, succeeded, failed },
      { status: 200 }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error('Erreur dans documents/upload', {
      error: errorMessage,
      stack: errorStack,
      userId,
    });
    return NextResponse.json(
      { error: 'Erreur serveur interne', details: errorMessage },
      { status: 500 }
    );
  }
}
