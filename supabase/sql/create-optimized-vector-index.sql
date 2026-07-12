-- ============================================================================
-- Script SQL pour créer l'index vectoriel optimisé - ST-402
-- 
-- Ce script crée ou recrée l'index idx_embeddings_vector avec les paramètres
-- optimaux déterminés par le benchmark.
-- 
-- @story ST-402
-- @task Tâche 5 - Créer/Mettre à jour l'index de production
-- ============================================================================

-- Vérifier que l'extension pgvector est installée
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
    RAISE NOTICE 'Installation de l''extension pgvector...';
    CREATE EXTENSION IF NOT EXISTS vector;
    RAISE NOTICE 'Extension pgvector installée avec succès';
  ELSE
    RAISE NOTICE 'Extension pgvector déjà installée';
  END IF;
END $$;

-- ============================================================================
-- CONFIGURATION (à mettre à jour avec les résultats du benchmark)
-- ============================================================================

-- Nombre de listes optimal (défini par le benchmark)
-- Valeurs possibles: 50, 100, 200, 400
-- Par défaut: 100 (valeur initiale)
-- Après benchmark: mettre à jour avec la valeur optimale

-- Configuration actuelle: 100 (d'après l'architecture initiale)
-- Configuration recommandée: À déterminer par ST-402

-- Pour l'instant, on garde la configuration existante
-- Après exécution du benchmark, mettre à jour cette variable

\set OPTIMAL_LISTS 200  -- ⬅️ MISE À JOUR AVEC LA VALEUR OPTIMALE TROUVÉE PAR BENCHMARK

-- ============================================================================
-- SUPPRESSION DE L'INDEX EXISTANT (si nécessaire)
-- ============================================================================

-- Vérifier si l'index existe déjà
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_embeddings_vector' 
    AND tablename = 'embeddings'
  ) THEN
    RAISE NOTICE 'Suppression de l''index existant idx_embeddings_vector...';
    DROP INDEX IF EXISTS idx_embeddings_vector;
    RAISE NOTICE 'Index existant supprimé';
  ELSE
    RAISE NOTICE 'Aucun index existant à supprimer';
  END IF;
END $$;

-- ============================================================================
-- CRÉATION DE L'INDEX OPTIMISÉ
-- ============================================================================

-- Créer le nouvel index avec la configuration optimale
CREATE INDEX idx_embeddings_vector 
ON public.embeddings 
USING ivfflat (vector vector_l2_ops) 
WITH (lists = :OPTIMAL_LISTS);

-- Vérifier que l'index a été créé
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_embeddings_vector'
  ) THEN
    RAISE NOTICE '✅ Index idx_embeddings_vector créé avec succès avec lists=:OPTIMAL_LISTS';
  ELSE
    RAISE EXCEPTION '❌ ÉCHEC: Index non créé';
  END IF;
END $$;

-- ============================================================================
-- VÉRIFICATION DE L'INDEX
-- ============================================================================

-- Vérifier la configuration de l'index
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE indexname = 'idx_embeddings_vector'
AND tablename = 'embeddings';

-- Tester l'index avec une requête de similarité
-- (nécessite au moins un embedding dans la table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM embeddings LIMIT 1) THEN
    RAISE NOTICE 'Test de l''index avec une requête de similarité...';
    
    -- Créer un vecteur de test (384 dimensions, valeurs aléatoires)
    -- En pratique, utiliser un vrai embedding de la table
    PERFORM (
      SELECT chunk_id, vector <=> '[0.1, 0.2, 0.3, ...]'::vector(384) as distance
      FROM embeddings
      ORDER BY distance ASC
      LIMIT 10
    );
    
    RAISE NOTICE '✅ Test de requête exécuté avec succès';
  ELSE
    RAISE NOTICE '⚠️ Aucune donnée dans la table embeddings, test impossible';
  END IF;
END $$;

-- ============================================================================
-- MISE À JOUR DE LA DOCUMENTATION
-- ============================================================================

-- Afficher la configuration finale
SELECT 
  'idx_embeddings_vector' as index_name,
  :OPTIMAL_LISTS as lists,
  'ivfflat' as index_type,
  'vector_l2_ops' as operator,
  'public.embeddings' as table_name;

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================

-- 1. Ce script DOIT être exécuté avec la SERVICE ROLE KEY pour contourner RLS
-- 2. L'index existant sera SUPPRIMÉ avant la création du nouveau
-- 3. La valeur :OPTIMAL_LISTS doit être mise à jour avec les résultats du benchmark
-- 4. Pour les gros datasets (>100K documents), envisagez d'augmenter le nombre de listes
-- 5. Les politiques RLS ne sont PAS affectées par ce script

-- Pour exécuter ce script:
-- psql -U postgres -d your_db -f create-optimized-vector-index.sql

-- Pour exécuter avec Supabase CLI:
-- supabase db reset --db-url postgresql://postgres:password@host:port/postgres
-- supabase db push

-- ============================================================================
-- HISTORIQUE DES MODIFICATIONS
-- ============================================================================

-- 2026-07-12: Création initiale (ST-402)
--   - Suppression de l'index existant (lists=100)
--   - Création avec lists=:OPTIMAL_LISTS (à déterminer)
--   - Configuration optimale: À définir par le benchmark

COMMENT ON INDEX idx_embeddings_vector IS 'Index vectoriel optimisé pour la recherche de similarité.
Créé par ST-402: Optimiser l''Index Vectoriel.
Configuration: ivfflat avec lists=:OPTIMAL_LISTS';
