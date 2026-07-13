-- Migration: Créer les fonctions RPC nécessaires pour le benchmark ST-402
-- Ces fonctions sont utilisées par scripts/benchmark/benchmark-vector-index.js
-- 
-- Contraintes:
-- - SECURITY DEFINER pour accéder aux catalogues système
-- - Validation stricte des identifiants avec format('%I', ...)
-- - Dimension vectorielle FIXÉE à 384 (leçon de ST-401)

-- ============================================================================
-- Fonction: drop_index_if_exists
-- Description: Supprime un index s'il existe, sans erreur si introuvable
-- Sécurité: SECURITY DEFINER pour accéder à pg_indexes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.drop_index_if_exists(index_name text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DROP INDEX IF EXISTS public."||index_name||;
$$;

COMMENT ON FUNCTION public.drop_index_if_exists(text) IS 'Supprime un index s''il existe. Utilisée par les scripts de benchmark ST-402.';

-- ============================================================================
-- Fonction: create_ivfflat_index
-- Description: Crée un index IVFFlat sur une colonne vectorielle
-- Paramètres:
--   - table_name: Nom de la table (validé contre liste blanche)
--   - column_name: Nom de la colonne vectorielle
--   - index_name: Nom de l'index à créer
--   - lists: Nombre de listes (partitionnement)
-- Sécurité: SECURITY DEFINER avec validation stricte des identifiants
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_ivfflat_index(
  table_name text,
  column_name text,
  index_name text,
  lists integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
  column_exists boolean;
  is_vector_type boolean;
  vector_dimension integer;
BEGIN
  -- Valider que la table existe dans le schéma public
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = table_name
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table % non trouvée dans le schéma public', table_name;
  END IF;
  
  -- Valider que la colonne existe et est de type vector
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = table_name 
      AND column_name = column_name
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE EXCEPTION 'Colonne % non trouvée dans la table %', column_name, table_name;
  END IF;
  
  -- Vérifier que la colonne est de type vector (leçon de ST-401: dimension doit être 384)
  BEGIN
    SELECT pg_typeof_alias(column_name::regtype) = 'vector' 
    INTO is_vector_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = table_name 
      AND column_name = column_name;
    
    IF NOT is_vector_type THEN
      RAISE EXCEPTION 'Colonne % n''est pas de type vector dans la table %', column_name, table_name;
    END IF;
    
    -- Vérifier la dimension (doit être 384 - contrainte ST-401)
    SELECT vector_dimensionality(column_name) INTO vector_dimension
    FROM public."||table_name|| 
    LIMIT 1;
    
    IF vector_dimension IS NULL OR vector_dimension != 384 THEN
      RAISE EXCEPTION 'Dimension vectorielle invalide: attendu 384, trouvé %. Vérifiez ST-401.', vector_dimension;
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la vérification de la colonne %: %', column_name, SQLERRM;
  END;
  
  -- Vérifier que lists est valide
  IF lists <= 0 THEN
    RAISE EXCEPTION 'Nombre de listes doit être > 0, reçu: %', lists;
  END IF;
  
  -- Supprimer l'index s'il existe déjà
  PERFORM public.drop_index_if_exists(index_name);
  
  -- Créer l'index IVFFlat avec vector_l2_ops (conforme à l'architecture)
  EXECUTE format('CREATE INDEX %I ON public.%I USING ivfflat (%I vector_l2_ops) WITH (lists = %s)',
    index_name, table_name, column_name, lists);
  
  RAISE NOTICE 'Index % créé avec succès (lists = %)', index_name, lists;
END;
$$;

COMMENT ON FUNCTION public.create_ivfflat_index(text, text, text, integer) IS 'Crée un index IVFFlat sur une colonne vectorielle avec validation stricte. Utilisée par ST-402.';

-- ============================================================================
-- Fonction: benchmark_vector_similarity
-- Description: Exécute une recherche de similarité vectorielle pour le benchmark
-- Paramètres:
--   - query_vector: Vecteur de requête (doit être de dimension 384)
--   - limit_count: Nombre maximum de résultats (défaut: 10)
-- Retourne: Table avec chunk_id et distance pour chaque résultat
-- Sécurité: SECURITY DEFINER, vecteur passé comme paramètre typé (pas d'injection)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.benchmark_vector_similarity(
  query_vector vector(384),
  limit_count integer DEFAULT 10
)
RETURNS TABLE (
  chunk_id uuid,
  distance double precision
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    chunk_id,
    vector <=> query_vector as distance
  FROM public.embeddings
  ORDER BY distance ASC
  LIMIT limit_count;
$$;

COMMENT ON FUNCTION public.benchmark_vector_similarity(vector(384), integer) IS 'Recherche de similarité vectorielle pour benchmark ST-402. Le vecteur est passé comme paramètre typé pour éviter l''injection SQL.';

-- ============================================================================
-- Fonction: get_index_construction_status
-- Description: Vérifie si un index est en cours de construction
-- Paramètres:
--   - index_name: Nom de l'index
-- Retourne: Table avec status (true si construit, false si en cours)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_index_construction_status(index_name text)
RETURNS TABLE (done boolean)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      (SELECT true FROM pg_indexes WHERE indexname = index_name AND schemaname = 'public'),
      false
    ) as done;
$$;

COMMENT ON FUNCTION public.get_index_construction_status(text) IS 'Vérifie si un index existe et est prêt. Utilisée pour attendre la fin de construction.';
