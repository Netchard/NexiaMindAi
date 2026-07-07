import { NextRequest, NextResponse } from 'next/server';
import { supabase as supabaseServer } from '@/lib/supabase/server';
import type { FiltersResponse } from '@/types/filters';

/**
 * Endpoint GET /api/chat/filters
 * Récupère les valeurs possibles pour les filtres de recherche
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Vérification de l'utilisateur (déjà authentifié par le middleware)
    // Le middleware ajoute x-user-id dans les headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      console.warn('Accès non autorisé - utilisateur non authentifié', {
        path: request.nextUrl.pathname,
        method: request.method,
      });

      return NextResponse.json(
        { error: 'Non autorisé - utilisateur non authentifié' },
        { status: 401 }
      );
    }

    console.info(`Récupération des valeurs de filtre pour l'utilisateur ${userId}`);

    // 2. Récupérer les thèmes distincts depuis les chunks
    // [NOTE] `metadata.theme` n'existe nulle part dans le pipeline d'indexation
    // (src/lib/supabase/storage/indexer.ts) — champ jamais renseigné, découvert
    // après la revue de code du 2026-07-07 (les dropdowns étaient vides même
    // avec la requête corrigée). Décision utilisateur (2026-07-08) : rebrancher
    // le filtre "Thème" sur `metadata.client` (le seul champ réellement indexé
    // qui s'en approche), en gardant le nom `theme`/"Thème" côté contrat/UI.
    let themes: string[] = [];
    try {
      // Alias explicite ('theme:...') : sans lui, PostgREST renvoie une clé
      // littérale `metadata->>client` au niveau racine, pas nichée sous
      // `metadata`. `.not(..., 'is', null)` est la syntaxe correcte pour un
      // test IS NOT NULL (`.neq(..., null)` ne filtre rien).
      const { data: themeData, error: themeError } = await supabaseServer
        .from('chunks')
        .select('theme:metadata->>client')
        .not('metadata->>client', 'is', null);

      if (themeError) {
        console.warn('Échec de récupération des thèmes', {
          error: themeError.message,
          userId,
        });
      } else if (themeData && themeData.length > 0) {
        // Extraire les valeurs uniques et filtrer les valeurs vides
        themes = [...new Set(
          themeData
            .map((chunk: any) => chunk.theme)
            .filter((theme: string | null | undefined): theme is string =>
              typeof theme === 'string' && theme.trim() !== ''
            )
        )];
        
        console.info('Thèmes récupérés', {
          count: themes.length,
          themes,
        });
      }
    } catch (themeError: any) {
      console.error('Erreur lors de la récupération des thèmes', {
        error: themeError.message,
        userId,
      });
    }

    // 3. Récupérer les formats de documents distincts
    // La table `documents` n'a pas de colonne `format` — la donnée réelle est
    // dans `type` (voir _bmad-output/architecture/database-structure-update.md
    // et l'insert dans src/lib/supabase/storage/indexer.ts). Alias `format:type`
    // pour garder le nom `documentFormat`/"Format" côté contrat/UI inchangé.
    let documentFormats: string[] = [];
    try {
      const { data: formatData, error: formatError } = await supabaseServer
        .from('documents')
        .select('format:type');

      if (formatError) {
        console.warn('Échec de récupération des formats de documents', {
          error: formatError.message,
          userId,
        });
      } else if (formatData && formatData.length > 0) {
        // Extraire les valeurs uniques et filtrer les valeurs vides
        documentFormats = [...new Set(
          formatData
            .map((doc: any) => doc.format)
            .filter((format: string | null | undefined): format is string =>
              typeof format === 'string' && format.trim() !== ''
            )
        )];
        
        console.info('Formats de documents récupérés', {
          count: documentFormats.length,
          documentFormats,
        });
      }
    } catch (formatError: any) {
      console.error('Erreur lors de la récupération des formats de documents', {
        error: formatError.message,
        userId,
      });
    }

    // 4. Retourner la réponse
    // Les valeurs viennent de la base (colonnes libres) — non garanties
    // statiquement d'appartenir aux unions littérales Theme/DocumentFormat.
    const response: FiltersResponse = {
      themes: themes as FiltersResponse['themes'],
      documentFormats: documentFormats as FiltersResponse['documentFormats'],
    };

    const processingTime = Date.now() - startTime;
    
    console.info('Valeurs de filtre récupérées avec succès', {
      userId,
      processingTime: `${processingTime}ms`,
      themeCount: themes.length,
      formatCount: documentFormats.length,
    });

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('Échec de la récupération des valeurs de filtre', {
      error: error.message,
      stack: error.stack,
      userId: request.headers.get('x-user-id') || 'unknown',
      path: request.nextUrl.pathname,
    });

    return NextResponse.json(
      { error: 'Erreur serveur interne', details: error.message },
      { status: 500 }
    );
  }
}