-- =============================================
-- Script: create-classical-indexes.sql
-- Description: Crée les index classiques sur les tables fréquemment interrogées
-- Story: ST-404 - Créer les Index Classiques
-- Epic: 5 - Base de Données & Optimisation
-- Date: 2026-07-15
-- =============================================

-- Ce script crée des index classiques pour optimiser les performances des requêtes SQL
-- sur les tables chunks, conversations et messages.
--
-- IMPORTANT : toutes les instructions utilisent CONCURRENTLY pour ne pas bloquer les
-- écritures (INSERT/UPDATE/DELETE) pendant la construction (AC5 : "Pas de dégradation
-- des performances sur les opérations d'écriture"). CREATE INDEX CONCURRENTLY ne peut
-- pas s'exécuter dans un bloc de transaction : ce script doit être lancé via `psql -f`
-- (ou l'éditeur SQL Supabase) sans BEGIN/COMMIT englobant, chaque instruction s'exécute
-- et se commit individuellement.

-- Si une instruction échoue, psql doit s'arrêter au lieu de continuer sur un état
-- partiel silencieux. NOTE: `\set` est une méta-commande psql — si ce script est
-- collé dans l'éditeur SQL Supabase (Méthode 2 de la doc) plutôt qu'exécuté via
-- `psql -f`, retirer cette ligne (elle n'est pas comprise hors d'un client psql).
\set ON_ERROR_STOP on

-- =============================================
-- SECTION 1: Index sur la table chunks
-- =============================================

-- Index sur document_id: Utilisé pour filtrer les chunks par document
-- Requête typique: SELECT * FROM chunks WHERE document_id = 'xxx'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_document_id
ON public.chunks(document_id);

-- Index GIN sur metadata: permet des recherches de containment JSON
-- (ex: metadata @> '{"role":"developer"}'), PAS l'extraction texte-égalité metadata->>'role'.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_metadata
ON public.chunks USING GIN (metadata);

-- Index d'expression sur metadata->>'role': sert spécifiquement la requête documentée
-- "SELECT * FROM chunks WHERE metadata->>'role' = 'developer'", que le GIN ci-dessus
-- ne peut pas accélérer (un GIN jsonb_ops standard ne sert que @>/?/?&/?|, pas ->>).
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_metadata_role
ON public.chunks ((metadata->>'role'));

-- Index sur created_at: Utilisé pour le tri chronologique et la pagination
-- Requête typique: SELECT * FROM chunks ORDER BY created_at DESC LIMIT 100
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chunks_created_at
ON public.chunks(created_at);

-- =============================================
-- SECTION 2: Index sur la table conversations
-- =============================================

-- Index sur user_id: Essentiel pour filtrer les conversations par utilisateur
-- Critique pour les politiques RLS (Row-Level Security)
-- Requête typique: SELECT * FROM conversations WHERE user_id = 'xxx'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_id
ON public.conversations(user_id);

-- Index sur created_at: Pour le tri et la pagination des conversations
-- Requête typique: SELECT * FROM conversations ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_created_at
ON public.conversations(created_at);

-- Index composite (user_id, created_at): sert en une seule passe le pattern
-- "filtrer par utilisateur puis trier par date" (ex: liste des conversations d'un
-- utilisateur triée par date), plus efficace que deux index simples pour ce cas précis.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_user_id_created_at
ON public.conversations(user_id, created_at);

-- =============================================
-- SECTION 3: Index sur la table messages
-- =============================================

-- Index sur conversation_id: Pour récupérer tous les messages d'une conversation
-- Requête typique: SELECT * FROM messages WHERE conversation_id = 'xxx'
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id
ON public.messages(conversation_id);

-- Index sur created_at: Pour le tri chronologique dans une conversation
-- Requête typique: SELECT * FROM messages WHERE conversation_id = 'xxx' ORDER BY created_at ASC
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_created_at
ON public.messages(created_at);

-- Index composite (conversation_id, created_at): sert en une seule passe le pattern
-- documenté "SELECT * FROM messages WHERE conversation_id = 'xxx' ORDER BY created_at ASC"
-- (filtre + tri) sans passer par un tri séparé après un index scan simple.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_id_created_at
ON public.messages(conversation_id, created_at);

-- =============================================
-- SECTION 4: Mise à jour des statistiques du planificateur
-- =============================================

-- Sans ANALYZE, le planificateur peut continuer à se baser sur des statistiques
-- obsolètes et tarder à choisir les nouveaux index.
ANALYZE public.chunks;
ANALYZE public.conversations;
ANALYZE public.messages;

-- =============================================
-- SECTION 5: Validation
-- =============================================

-- Vérification que tous les index attendus ont été créés avec succès.
-- Compte les 10 index attendus (3 chunks + 1 expression + 2 conversations + 1 composite
-- + 2 messages + 1 composite = 10) et échoue explicitement si un index manque, plutôt
-- que de laisser un SELECT vide passer silencieusement.
DO $$
DECLARE
    expected_indexes text[] := ARRAY[
        'idx_chunks_document_id', 'idx_chunks_metadata', 'idx_chunks_metadata_role', 'idx_chunks_created_at',
        'idx_conversations_user_id', 'idx_conversations_created_at', 'idx_conversations_user_id_created_at',
        'idx_messages_conversation_id', 'idx_messages_created_at', 'idx_messages_conversation_id_created_at'
    ];
    missing_indexes text[];
BEGIN
    SELECT array_agg(idx) INTO missing_indexes
    FROM unnest(expected_indexes) AS idx
    WHERE NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = idx
    );

    IF missing_indexes IS NOT NULL THEN
        RAISE EXCEPTION 'Index manquants après exécution du script: %', missing_indexes;
    END IF;

    RAISE NOTICE 'Tous les % index attendus sont présents.', array_length(expected_indexes, 1);
END $$;

-- Résumé complet de tous les index créés par ce script (pour inspection manuelle)
SELECT
    schemaname AS schema,
    tablename AS table,
    indexname AS index_name,
    indexdef AS definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    AND tablename IN ('chunks', 'conversations', 'messages')
ORDER BY tablename, indexname;
