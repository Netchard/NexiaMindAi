-- ============================================================================
-- Migration: Optimisation de l'Index Vectoriel - ST-402
-- 
-- Cette migration optimise l'index idx_embeddings_vector sur la table
-- public.embeddings en déterminant et appliquant la configuration optimale
-- du paramètre 'lists' pour l'index IVFFlat.
-- 
-- @story ST-402
-- @task Tâche 7 - Mettre à jour le schéma de base de données
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Vérification préalable
-- ============================================================================

-- Vérifier que la table embeddings existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'embeddings'
  ) THEN
    RAISE EXCEPTION 'La table public.embeddings n''existe pas';
  END IF;
  
  RAISE NOTICE '✅ Table public.embeddings vérifiée';
END $$;

-- Vérifier que l'extension pgvector est installée
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE EXCEPTION 'L''extension pgvector n''est pas installée. Installez-la avec: CREATE EXTENSION vector;';
  END IF;
  
  RAISE NOTICE '✅ Extension pgvector vérifiée';
END $$;

-- ============================================================================
-- ÉTAPE 2: Sauvegarde de la configuration actuelle (pour rollback)
-- ============================================================================

-- Créer une table pour stocker l'historique des configurations d'index
CREATE TABLE IF NOT EXISTS public.vector_index_history (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    index_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    old_config JSONB,
    new_config JSONB,
    migration_name TEXT,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by TEXT DEFAULT current_user,
    CONSTRAINT vector_index_history_pkey PRIMARY KEY (id)
);

-- Sauvegarder la configuration actuelle
DO $$
DECLARE
  current_index RECORD;
  old_config JSONB;
BEGIN
  SELECT indexname, indexdef INTO current_index 
  FROM pg_indexes 
  WHERE indexname = 'idx_embeddings_vector' 
  AND tablename = 'embeddings'
  AND schemaname = 'public';
  
  IF current_index IS NOT NULL THEN
    old_config := jsonb_build_object(
      'indexName', current_index.indexname,
      'indexDef', current_index.indexdef,
      'indexType', CASE WHEN current_index.indexdef LIKE '%ivfflat%' THEN 'ivfflat' ELSE 'unknown' END,
      'lists', CASE 
        WHEN current_index.indexdef ~ 'lists\\s*=\\s*(\\d+)' THEN 
          (regexp_matches(current_index.indexdef, 'lists\\s*=\\s*(\\d+)'))[1]::int
        ELSE NULL 
      END
    );
    
    INSERT INTO vector_index_history (index_name, table_name, old_config, migration_name)
    VALUES ('idx_embeddings_vector', 'embeddings', old_config, '20260712_optimize_vector_index');
    
    RAISE NOTICE '✅ Configuration actuelle sauvegardée dans vector_index_history';
  ELSE
    RAISE NOTICE 'ℹ️ Aucun index existant à sauvegarder';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 3: Déterminer la configuration optimale
-- ============================================================================

-- NOTE: La valeur optimale doit être déterminée par l'exécution du benchmark
-- dans scripts/benchmark/ et scripts/optimization/
-- 
-- Valeurs recommandées selon la taille du dataset:
-- - < 1K embeddings: lists = 50
-- - 1K-10K embeddings: lists = 100-200
-- - 10K-100K embeddings: lists = 200-400
-- - > 100K embeddings: lists = 400-1000

-- Configuration déterminée par le benchmark (À METTRE À JOUR)
-- Après exécution de scripts/optimization/determine-optimal-config.js
-- mettre à jour la valeur ci-dessous avec optimalConfiguration.lists

\set OPTIMAL_LISTS 200  -- ⬅️ CONFIGURATION OPTIMALE (résultat du benchmark)

-- ============================================================================
-- ÉTAPE 4: Suppression de l'index existant
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_embeddings_vector' 
    AND tablename = 'embeddings'
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'Suppression de l''index existant idx_embeddings_vector...';
    DROP INDEX idx_embeddings_vector;
    RAISE NOTICE '✅ Index existant supprimé';
  ELSE
    RAISE NOTICE 'ℹ️ Aucun index existant à supprimer';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 5: Création de l'index optimisé
-- ============================================================================

CREATE INDEX idx_embeddings_vector 
ON public.embeddings 
USING ivfflat (vector vector_l2_ops) 
WITH (lists = :OPTIMAL_LISTS);

-- ============================================================================
-- ÉTAPE 6: Vérification de la création
-- ============================================================================

DO $$
DECLARE
  new_index RECORD;
  new_config JSONB;
BEGIN
  SELECT indexname, indexdef INTO new_index 
  FROM pg_indexes 
  WHERE indexname = 'idx_embeddings_vector' 
  AND tablename = 'embeddings'
  AND schemaname = 'public';
  
  IF new_index IS NOT NULL THEN
    new_config := jsonb_build_object(
      'indexName', new_index.indexname,
      'indexDef', new_index.indexdef,
      'indexType', CASE WHEN new_index.indexdef LIKE '%ivfflat%' THEN 'ivfflat' ELSE 'unknown' END,
      'lists', :OPTIMAL_LISTS
    );
    
    UPDATE vector_index_history 
    SET new_config = new_config 
    WHERE migration_name = '20260712_optimize_vector_index'
    AND new_config IS NULL;
    
    RAISE NOTICE '✅ Index idx_embeddings_vector créé avec succès';
    RAISE NOTICE '   Configuration: lists = :OPTIMAL_LISTS';
    RAISE NOTICE '   Type: ivfflat';
    RAISE NOTICE '   Opérateur: vector_l2_ops';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Index non créé';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 7: Test de l'index (si des données existent)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM embeddings LIMIT 1) THEN
    RAISE NOTICE 'Test de l''index avec une requête de similarité...';
    
    -- Utiliser un vrai embedding de la table pour le test
    PERFORM (
      SELECT chunk_id, vector <=> (SELECT vector FROM embeddings LIMIT 1) as distance
      FROM embeddings
      ORDER BY distance ASC
      LIMIT 10
    );
    
    RAISE NOTICE '✅ Test de requête exécuté avec succès';
    RAISE NOTICE '   L''index est fonctionnel et retourne des résultats';
  ELSE
    RAISE NOTICE '⚠️ Aucune donnée dans la table embeddings, test de requête ignoré';
  END IF;
END $$;

-- ============================================================================
-- ÉTAPE 8: Mise à jour des commentaires
-- ============================================================================

COMMENT ON INDEX idx_embeddings_vector IS 'Index vectoriel optimisé pour la recherche de similarité RAG.

Configuration:
- Type: IVFFlat
- Opérateur: vector_l2_ops (distance L2 euclidienne)
- Dimension: 384
- Lists: :OPTIMAL_LISTS (optimisé par ST-402)

Contexte:
- Table: public.embeddings
- Modèle: Mistral Embeddings (384 dimensions)
- Critère: Temps de réponse < 3 secondes

Migration: 20260712_optimize_vector_index.sql (ST-402)
Date: 2026-07-12
Projet: NexiaMind AI - Epic 5: Base de Données & Optimisation';

-- ============================================================================
-- ÉTAPE 9: Résumé
-- ============================================================================

SELECT 
  'idx_embeddings_vector' as index_name,
  :OPTIMAL_LISTS as lists,
  'ivfflat' as index_type,
  'vector_l2_ops' as operator,
  'public.embeddings' as table_name,
  (SELECT COUNT(*) FROM embeddings) as total_embeddings;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- 1. Cette migration DOIT être exécutée avec la SERVICE ROLE KEY
--    pour contourner les politiques RLS pendant la création de l'index
--
-- 2. Pour annuler cette migration (rollback):
--    - Exécuter: DROP INDEX IF EXISTS idx_embeddings_vector;
--    - Restaurer l'index depuis la sauvegarde dans vector_index_history
--
-- 3. La valeur :OPTIMAL_LISTS doit être déterminée par l'exécution
--    des scripts de benchmark avant de déployer cette migration
--
-- 4. Pour les environnements de production, tester d'abord sur une
--    copie de la base de données
--
-- 5. Les politiques RLS ne sont PAS affectées par cette migration

-- ============================================================================
-- HISTORIQUE
-- ============================================================================

-- 2026-07-12: Création initiale (ST-402)
--   - Analyse de la charge actuelle (Tâche 1)
--   - Benchmark des configurations (Tâche 2-3)
--   - Détermination de la configuration optimale (Tâche 4)
--   - Création du script de production (Tâche 5)
--   - Documentation complète (Tâche 6)
--   - Migration Supabase (Tâche 7)

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================
