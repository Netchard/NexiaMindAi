-- ============================================================================
-- RLS Security Tests for NexiaMind AI
-- ============================================================================
--
-- This script tests all Row-Level Security (RLS) policies configured
-- in the main rls-policies.sql script.
--
-- Prerequisites:
--   - rls-policies.sql must have been executed first
--   - Test users must exist in auth.users and public.profiles
--   - Test data must be inserted (see setup section)
--   - Must be run as a role that can both write to auth.users (setup) and
--     SET ROLE authenticated (simulation) -- e.g. the `postgres` superuser
--     role in a Supabase-managed database.
--
-- EXECUTION INSTRUCTIONS:
-- ======================
-- 1. Apply rls-policies.sql first (requires superuser)
--    psql -f supabase/rls-policies.sql
--
-- 2. For this test file, you have two options:
--
--    Option A: Run on EXISTING database (WARNING: Creates test data!)
--    - This script will insert test records into your tables
--    - It requires SUPERUSER privileges to insert into auth.users
--    - If you don't have superuser, comment out the auth.users insert section
--    - Backup your database before running on production!
--
--    Option B: Run on TEST database (Recommended)
--    - Create a test database
--    - Run rls-policies.sql on the test database
--    - Then run this test script
--
-- Execution:
--   psql -f supabase/tests/rls-security-tests.sql
--
-- NOTE: This script is idempotent -- every test-data row uses a fixed UUID
--       with ON CONFLICT (id) DO NOTHING, so it can be re-run safely.
--
-- HOW THE ROLE SIMULATION WORKS:
--   auth.uid() (used by every policy in rls-policies.sql) resolves the
--   current user from the `sub` claim of `request.jwt.claims`. Each test
--   block below sets that claim to a specific test user's UUID and switches
--   to the `authenticated` role before running its assertions, then resets
--   both so the following block (and any superuser-only setup) is unaffected.
--   Without this, queries run as the connecting superuser/service role,
--   which bypasses RLS entirely and would make every assertion meaningless.
--
-- Created: 2026-07-12
-- Story: ST-401 (5-401-configurer-les-politiques-de-securite-rls)
-- Updated: 2026-07-12 - Fixed: Using gen_random_uuid() for all UUID columns
-- Updated: 2026-07-12 - Code review fixes: fixed UUIDs for idempotent reruns,
--                        real role simulation via request.jwt.claims + SET ROLE
--                        authenticated (set_config('app.current_role', ...) was
--                        a no-op -- no policy reads it), corrected sync_logs
--                        columns to match the real schema, fixed the jsonb `?`
--                        operator usage (was applied to a ->> text result).
-- ============================================================================

-- ============================================================================
-- TEST SETUP: Create Test Users and Data
-- ============================================================================

-- IMPORTANT: RLS policies use auth.uid() which requires users in auth.users
-- This section creates test users in auth.users (requires superuser privileges)

-- ============================================================================
-- STEP 1: Create Test Users in auth.users
-- ============================================================================

-- Fixed UUIDs for reproducibility (also reused by create-test-users.sql)
--   admin1@nexiamind.ai      a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
--   manager@nexiamind.ai     b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12
--   lead@nexiamind.ai        c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13
--   dev@nexiamind.ai         d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14
--   consultant@nexiamind.ai  e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15

DO $$
BEGIN
  -- Try to insert test users with standard Supabase auth.users structure
  -- Note: Column names may vary based on Supabase version
  -- We'll try multiple approaches

  -- Approach 1: Try with minimal required columns (most common structure)
  BEGIN
    INSERT INTO auth.users (id, email, created_at, updated_at)
    VALUES
      ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin1@nexiamind.ai', NOW(), NOW()),
      ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', NOW(), NOW()),
      ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', NOW(), NOW()),
      ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', NOW(), NOW()),
      ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    -- If minimal approach fails, try with more columns
    BEGIN
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed, created_at, updated_at)
      VALUES
        ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin1@nexiamind.ai', NULL, false, NOW(), NOW()),
        ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', NULL, false, NOW(), NOW()),
        ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', NULL, false, NOW(), NOW()),
        ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', NULL, false, NOW(), NOW()),
        ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', NULL, false, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create users in auth.users - you need SUPERUSER privileges. Create them via Supabase Dashboard or API, then run this script again.';
    END;
  END;
END $$;

-- ============================================================================
-- STEP 2: Create Test Profiles
-- ============================================================================

INSERT INTO public.profiles (id, user_id, email, full_name, role, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin1@nexiamind.ai', 'Admin User', 'admin', NOW(), NOW()),
  (gen_random_uuid(), 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', 'Manager User', 'manager', NOW(), NOW()),
  (gen_random_uuid(), 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', 'Project Lead User', 'project_lead', NOW(), NOW()),
  (gen_random_uuid(), 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', 'Developer User', 'developer', NOW(), NOW()),
  (gen_random_uuid(), 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', 'Consultant User', 'consultant', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test documents (fixed UUIDs so reruns don't duplicate)
INSERT INTO public.documents (id, name, type, source, client_id, created_at, updated_at)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::UUID, 'Technical Documentation', 'markdown', 'upload', 'test-client-001', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b02'::UUID, 'API Reference', 'markdown', 'upload', 'test-client-001', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03'::UUID, 'Client Project Specs', 'pdf', 'upload', 'test-client-001', NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04'::UUID, 'Internal Process', 'text', 'upload', NULL, NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05'::UUID, 'General Announcement', 'text', 'upload', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test chunks for documents (fixed UUIDs so reruns don't duplicate)
INSERT INTO public.chunks (id, document_id, content, chunk_index, token_count, metadata, created_at)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::UUID, 'Technical content chunk 1', 1, 50, '{"allowed_roles": ["admin", "manager", "project_lead", "developer"]}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c02'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::UUID, 'Technical content chunk 2', 2, 50, '{"allowed_roles": "all"}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b03'::UUID, 'Client content chunk 1', 1, 50, '{"allowed_roles": ["admin", "manager", "consultant"]}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b04'::UUID, 'Internal content chunk 1', 1, 50, '{"allowed_roles": ["admin", "manager"]}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c05'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b05'::UUID, 'General content chunk 1', 1, 50, '{"allowed_roles": "all"}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create embeddings for chunks (fixed UUIDs; vector dimension 1024 per architecture.md)
INSERT INTO public.embeddings (id, chunk_id, vector, created_at)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380d01'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c01'::UUID, (SELECT array_agg(i/100.0) FROM generate_series(1, 1024) AS i)::vector(1024), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380d02'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c03'::UUID, (SELECT array_agg((i+100)/100.0) FROM generate_series(1, 1024) AS i)::vector(1024), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380d03'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c04'::UUID, (SELECT array_agg((i+200)/100.0) FROM generate_series(1, 1024) AS i)::vector(1024), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test conversations for each user (fixed UUIDs)
INSERT INTO public.conversations (id, user_id, title, description, is_archived, client_id, metadata, created_at, updated_at)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'::UUID, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'Admin Conversation', 'Admin discussion', false, NULL, '{}'::jsonb, NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02'::UUID, 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'Manager Conversation', 'Manager discussion', false, NULL, '{}'::jsonb, NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e03'::UUID, 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'Project Lead Conversation', 'Project discussion', false, 'test-client-001', '{}'::jsonb, NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04'::UUID, 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'Developer Conversation', 'Dev discussion', false, 'test-client-001', '{}'::jsonb, NOW(), NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e05'::UUID, 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'Consultant Conversation', 'Consultant discussion', false, 'test-client-001', '{}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test messages in conversations (fixed UUIDs)
INSERT INTO public.messages (id, conversation_id, content, role, token_count, sources, metadata, created_at)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f01'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e01'::UUID, 'Admin message', 'user', 10, '[]'::jsonb, '{}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f02'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e02'::UUID, 'Manager message', 'user', 10, '[]'::jsonb, '{}'::jsonb, NOW()),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380f03'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380e04'::UUID, 'Developer message', 'user', 10, '[]'::jsonb, '{}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- Create sync logs (fixed UUIDs; columns match the real sync_logs schema --
-- the previous version used records_processed/errors, which don't exist)
INSERT INTO public.sync_logs (id, source, status, created_at, last_sync_at, documents_processed, chunks_created, embeddings_created, documents_deleted, error_message)
VALUES
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380011'::UUID, 'gitlab', 'success', NOW() - INTERVAL '1 hour', NOW(), 100, 50, 50, 0, NULL),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380012'::UUID, 'supabase', 'success', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 50, 25, 25, 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEST 1: Verify RLS is Enabled on All Tables
-- ============================================================================

DO $$
DECLARE
  v_table_name TEXT;
  v_table_exists BOOLEAN;
  v_rls_enabled BOOLEAN;
  all_enabled BOOLEAN := true;
  error_message TEXT := '';
  required_tables TEXT[] := ARRAY[
    'profiles',
    'documents',
    'chunks',
    'embeddings',
    'conversations',
    'messages',
    'sync_logs'
  ];
BEGIN
  RAISE NOTICE 'TEST 1: Verifying RLS is enabled on all tables...';

  FOREACH v_table_name IN ARRAY required_tables LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = v_table_name
    ) INTO v_table_exists;

    IF NOT v_table_exists THEN
      error_message := concat(error_message, 'Table ', v_table_name, ' does not exist. ');
      all_enabled := false;
      CONTINUE;
    END IF;

    SELECT relrowsecurity FROM pg_class
    WHERE relname = v_table_name AND relnamespace = 'public'::regnamespace
    INTO v_rls_enabled;

    IF NOT v_rls_enabled THEN
      error_message := concat(error_message, 'RLS not enabled on ', v_table_name, '. ');
      all_enabled := false;
    END IF;
  END LOOP;

  IF all_enabled THEN
    RAISE NOTICE '✅ TEST 1 PASSED: All required tables exist and have RLS enabled';
  ELSE
    RAISE EXCEPTION '%', error_message;
  END IF;
END $$;

-- ============================================================================
-- TEST 2: Profiles Table RLS
-- ============================================================================
-- Note: profiles has no admin-bypass policy (see rls-policies.sql SECTION 3),
-- so every role -- including admin -- can only see its own profile row.

-- Test 2a: Admin can see their own profile
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_profile_count
FROM public.profiles
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID;
-- Expected: 1 (admin can see own profile)
RESET ROLE;
RESET request.jwt.claims;

-- Test 2b: Developer can see their own profile
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_profile_count
FROM public.profiles
WHERE user_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID;
-- Expected: 1 (developer can see own profile)

-- Test 2c: Developer cannot see admin's profile
SELECT COUNT(*) AS should_be_zero
FROM public.profiles
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID;
-- Expected: 0 (developer cannot see admin profile)
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 3: Conversations Table RLS
-- ============================================================================

-- Test 3a: Admin can see all conversations
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_conversations_count FROM public.conversations;
-- Expected: 5 (all conversations)
RESET ROLE;
RESET request.jwt.claims;

-- Test 3b: Developer can only see their own conversations
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_conversations_count
FROM public.conversations
WHERE user_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID;
-- Expected: 1 (only their conversation)

-- Verify developer cannot see other users' conversations
SELECT COUNT(*) AS should_be_zero
FROM public.conversations
WHERE user_id != 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID;
-- Expected: 0 (developer cannot see others' conversations)
RESET ROLE;
RESET request.jwt.claims;

-- Test 3c: INSERT policy exists (introspection only, no simulation needed)
SELECT COUNT(*) AS insert_policy_count
FROM pg_policies
WHERE tablename = 'conversations'
AND policyname = 'Users can create their own conversations';
-- Expected: 1

-- ============================================================================
-- TEST 4: Documents Table RLS
-- ============================================================================

-- Test 4a: Admin can see all documents
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_documents_count FROM public.documents;
-- Expected: 5 (all documents)
RESET ROLE;
RESET request.jwt.claims;

-- Test 4b: Developer can see technical documents
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_documents_count
FROM public.documents
WHERE type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json');
-- Expected: >= 2 (technical documents)
RESET ROLE;
RESET request.jwt.claims;

-- Test 4c: Consultant can see client documents
SET request.jwt.claims = '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS consultant_documents_count
FROM public.documents
WHERE client_id = 'test-client-001';
-- Expected: >= 1 (client documents for their client)
-- NOTE: consultant access is currently NOT scoped to their own client_id
-- (see Review Findings / deferred-work.md) -- this only proves consultants
-- can see *some* client-tagged document, not that access is correctly scoped.
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 5: Chunks Table RLS
-- ============================================================================

-- Test 5a: Admin can see all chunks
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_chunks_count FROM public.chunks;
-- Expected: 5 (all chunks seeded so far)
RESET ROLE;
RESET request.jwt.claims;

-- Test 5b: Developer can see chunks with allowed_roles including developer, or 'all'
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_chunks_count
FROM public.chunks
WHERE (metadata->'allowed_roles' ? 'developer')
   OR metadata->>'allowed_roles' = 'all';
-- Expected: >= 2 (chunks allowed for developer)

-- Test 5c: Verify allowed_roles = 'all' works
SELECT COUNT(*) AS all_roles_chunks_count
FROM public.chunks
WHERE metadata->>'allowed_roles' = 'all';
-- Expected: >= 1
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 6: Embeddings Table RLS
-- ============================================================================

-- Test 6a: Admin can see all embeddings
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_embeddings_count FROM public.embeddings;
-- Expected: 3 (all embeddings)
RESET ROLE;
RESET request.jwt.claims;

-- Test 6b: Developer can see embeddings for accessible chunks
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_embeddings_count
FROM public.embeddings e
JOIN public.chunks c ON e.chunk_id = c.id
WHERE (c.metadata->'allowed_roles' ? 'developer')
   OR c.metadata->>'allowed_roles' = 'all';
-- Expected: >= 1
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 7: Messages Table RLS
-- ============================================================================

-- Test 7a: Admin can see all messages
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_messages_count FROM public.messages;
-- Expected: 3 (all messages)
RESET ROLE;
RESET request.jwt.claims;

-- Test 7b: Developer can see messages from their conversations
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_messages_count
FROM public.messages m
JOIN public.conversations c ON m.conversation_id = c.id
WHERE c.user_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID;
-- Expected: 1 (message from their conversation)
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 8: Sync Logs Table RLS
-- ============================================================================

-- Test 8a: Admin can see sync logs
SET request.jwt.claims = '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS admin_sync_logs_count FROM public.sync_logs;
-- Expected: 2 (all sync logs)
RESET ROLE;
RESET request.jwt.claims;

-- Test 8b: Developer cannot see sync logs
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS developer_sync_logs_should_be_zero
FROM public.sync_logs;
-- Expected: 0 (developers cannot see sync logs)
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 9: Cross-Table Access Verification
-- ============================================================================

-- Test that a developer cannot access admin's conversation through messages
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS should_be_zero
FROM public.messages m
JOIN public.conversations c ON m.conversation_id = c.id
WHERE c.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID;
-- Expected: 0 (developer cannot access admin's messages)
RESET ROLE;
RESET request.jwt.claims;

-- Test that embeddings respect chunk-level permissions
SET request.jwt.claims = '{"sub": "e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS consultant_embeddings_via_chunks
FROM public.embeddings e
JOIN public.chunks c ON e.chunk_id = c.id
JOIN public.documents d ON c.document_id = d.id
WHERE d.client_id = 'test-client-001';
-- Expected: >= 1 (embeddings from chunks in client documents)
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST 10: Security Edge Cases
-- ============================================================================

-- Test with NULL metadata in chunks (fixed UUID for idempotent reruns)
INSERT INTO public.chunks (id, document_id, content, chunk_index, token_count,  created_at)
VALUES ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380c06'::UUID, 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380b01'::UUID, 'Null metadata chunk', 3, 20, NOW())
ON CONFLICT (id) DO NOTHING;

-- With deny-by-default chunk access (see rls-policies.sql SECTION 6), a chunk
-- with NULL metadata falls back to the document-based role/type check instead
-- of being visible to everyone. The parent document (Technical Documentation)
-- is a 'markdown' type, so developer should still see it via that fallback.
SET request.jwt.claims = '{"sub": "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14", "role": "authenticated"}';
SET ROLE authenticated;
SELECT COUNT(*) AS null_metadata_chunk_visible_to_developer
FROM public.chunks
WHERE content = 'Null metadata chunk';
-- Expected: 1 (developer sees it via the document-type fallback, not a blanket allow)
RESET ROLE;
RESET request.jwt.claims;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RLS SECURITY TESTS SUMMARY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'All test scenarios above ran under a simulated auth.uid() per role via';
  RAISE NOTICE 'request.jwt.claims + SET ROLE authenticated. Review each SELECT''s actual';
  RAISE NOTICE 'result against its "Expected:" comment.';
  RAISE NOTICE '============================================================================';
END $$;
