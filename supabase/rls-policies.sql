-- ============================================================================
-- RLS Policies Configuration for NexiaMind AI
-- ============================================================================
--
-- This script configures Row-Level Security (RLS) policies on all tables
-- in the public schema for the NexiaMind AI application.
--
-- Prerequisites:
--   - PostgreSQL 10+ with Supabase extensions
--   - pgvector extension enabled
--   - auth schema exists (Supabase Auth)
--   - All tables created as per architecture.md
--
-- Important Notes:
--   - PostgreSQL does NOT support triggers on SELECT statements
--   - Therefore, we cannot use triggers to set session variables like current_setting
--   - Instead, policies use direct JOINs with the profiles table to get the user's role
--   - The get_user_role() function is provided as a helper but not used in policies
--   - All policies use EXISTS subqueries with JOINs to profiles to determine access
--   - This script is idempotent: every CREATE POLICY is preceded by DROP POLICY IF EXISTS,
--     and the whole script runs inside a single transaction so a mid-script failure
--     leaves no partially-applied state.
--
-- Execution:
--   Run this script as a superuser or with service role privileges
--
-- Created: 2026-07-12
-- Story: ST-401 (5-401-configurer-les-politiques-de-securite-rls)
-- Updated: 2026-07-12 - Fixed: Removed SELECT trigger, using JOINs instead of current_setting
-- Updated: 2026-07-12 - Code review fixes: transaction wrapper, idempotent DROP/CREATE,
--                        role self-escalation trigger, fixed invalid NEW.* reference in
--                        messages INSERT policy, closed default-allow gap on chunks/embeddings,
--                        restricted sync_logs INSERT to admins, hardened get_user_role().
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: Helper Functions
-- ============================================================================

-- Function to get current user's role (helper, not referenced by any policy below)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Trigger function: prevent a non-admin from setting/changing their own (or anyone's)
-- profile role via the self-service INSERT/UPDATE policies below. Without this, any
-- authenticated user could run `UPDATE profiles SET role = 'admin' WHERE user_id = auth.uid()`
-- and gain admin-level access across every other RLS policy in this file.
-- auth.uid() IS NULL bypasses this check for service-role/superuser connections (seed scripts).
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE user_id = auth.uid();

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS DISTINCT FROM 'developer' AND COALESCE(caller_role, '') <> 'admin' THEN
      RAISE EXCEPTION 'Only admins can set a profile role other than the default';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND COALESCE(caller_role, '') <> 'admin' THEN
      RAISE EXCEPTION 'Only admins can change a profile role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_escalation
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ============================================================================
-- SECTION 2: Enable RLS on All Tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 3: RLS Policies for profiles Table
-- ============================================================================
-- Users can only see and manage their own profile.
-- Role changes are additionally gated by trg_prevent_role_self_escalation above.

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users cannot delete their own profile (prevent accidental deletion)
-- Admin can delete profiles via service role

-- ============================================================================
-- SECTION 4: RLS Policies for conversations Table
-- ============================================================================
-- Users can only see and manage their own conversations

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins can view all conversations"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Users can create their own conversations" ON public.conversations;
CREATE POLICY "Users can create their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: RLS Policies for documents Table
-- ============================================================================
-- Documents are accessible based on role and client_id
--
-- KNOWN GAPS (tracked in deferred-work.md, see code review of ST-401):
--   - "Project leads can view project documents" below has a tautological
--     client_id clause and effectively grants unrestricted document access.
--   - "Consultants can view client documents" is not scoped to the consultant's
--     own client_id (no consultant->client mapping exists on profiles yet).
--   - No UPDATE/DELETE policy exists for this table (no current use case).
-- These were explicitly deferred during code review, not fixed here.

DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Managers can view all documents" ON public.documents;
CREATE POLICY "Managers can view all documents"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'manager'
  )
);

DROP POLICY IF EXISTS "Project leads can view project documents" ON public.documents;
CREATE POLICY "Project leads can view project documents"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'project_lead'
  )
  AND (client_id IS NULL OR client_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Developers can view technical documents" ON public.documents;
CREATE POLICY "Developers can view technical documents"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'developer'
  )
  AND type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json')
);

DROP POLICY IF EXISTS "Consultants can view client documents" ON public.documents;
CREATE POLICY "Consultants can view client documents"
ON public.documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'consultant'
  )
  AND (client_id IS NOT NULL)
);

DROP POLICY IF EXISTS "Admins and managers can create documents" ON public.documents;
CREATE POLICY "Admins and managers can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- UPDATE/DELETE policies: deferred, see note above and deferred-work.md

-- ============================================================================
-- SECTION 6: RLS Policies for chunks Table
-- ============================================================================
-- Chunks are filtered based on role, allowed_roles metadata, and the owning
-- document's type/client_id. Access is deny-by-default: a chunk with no
-- allowed_roles metadata falls back to the document-based role check instead
-- of being readable by anyone (previous version defaulted to allow-all here).

DROP POLICY IF EXISTS "Admins can view all chunks" ON public.chunks;
DROP POLICY IF EXISTS "Users can view chunks from allowed documents" ON public.chunks;
CREATE POLICY "Users can view chunks from allowed documents"
ON public.chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND (
      p.role IN ('admin', 'manager')
      OR (chunks.metadata->'allowed_roles' ? p.role)
      OR (chunks.metadata->>'allowed_roles' = 'all')
      OR (
        chunks.metadata->>'allowed_roles' IS NULL
        AND EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = chunks.document_id
          AND (
            p.role = 'project_lead'
            OR (p.role = 'developer' AND d.type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json'))
            OR (p.role = 'consultant' AND d.client_id IS NOT NULL)
          )
        )
      )
    )
  )
);

-- ============================================================================
-- SECTION 7: RLS Policies for embeddings Table
-- ============================================================================
-- Embeddings inherit access from chunks (which inherit from documents), using
-- the same deny-by-default logic as SECTION 6.

DROP POLICY IF EXISTS "Admins can view all embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "Users can view embeddings for accessible chunks" ON public.embeddings;
CREATE POLICY "Users can view embeddings for accessible chunks"
ON public.embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chunks c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = embeddings.chunk_id
    AND (
      p.role IN ('admin', 'manager')
      OR (c.metadata->'allowed_roles' ? p.role)
      OR (c.metadata->>'allowed_roles' = 'all')
      OR (
        c.metadata->>'allowed_roles' IS NULL
        AND EXISTS (
          SELECT 1 FROM public.documents d
          WHERE d.id = c.document_id
          AND (
            p.role = 'project_lead'
            OR (p.role = 'developer' AND d.type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json'))
            OR (p.role = 'consultant' AND d.client_id IS NOT NULL)
          )
        )
      )
    )
  )
);

-- ============================================================================
-- SECTION 8: RLS Policies for messages Table
-- ============================================================================
-- Messages inherit access from conversations. Ownership is checked directly
-- against conversations.user_id (not via a profiles JOIN) so a user without a
-- profiles row yet cannot be locked out of their own conversation's messages.

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON public.messages;
CREATE POLICY "Users can view messages from their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'manager')
      )
    )
  )
);

-- INSERT policy: Users can add messages to their own conversations.
-- Note: WITH CHECK has no NEW/OLD pseudo-records (those only exist in triggers) --
-- the incoming row's columns are referenced directly by (unqualified) name.
DROP POLICY IF EXISTS "Users can add messages to their conversations" ON public.messages;
CREATE POLICY "Users can add messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND (
      c.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'manager')
      )
    )
  )
);

DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
CREATE POLICY "Admins can update messages"
ON public.messages
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins can delete messages"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- ============================================================================
-- SECTION 9: RLS Policies for sync_logs Table
-- ============================================================================
-- Sync logs are restricted to admins for read AND write access.

DROP POLICY IF EXISTS "Admins can view sync logs" ON public.sync_logs;
CREATE POLICY "Admins can view sync logs"
ON public.sync_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- INSERT policy: Only admins can create sync logs (previously any authenticated
-- user could write into this admin-only-readable audit log).
DROP POLICY IF EXISTS "Authenticated users can create sync logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Admins can create sync logs" ON public.sync_logs;
CREATE POLICY "Admins can create sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update sync logs" ON public.sync_logs;
CREATE POLICY "Admins can update sync logs"
ON public.sync_logs
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can delete sync logs" ON public.sync_logs;
CREATE POLICY "Admins can delete sync logs"
ON public.sync_logs
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

COMMIT;

-- ============================================================================
-- SECTION 10: Verification Comments
-- ============================================================================
-- To verify RLS is working correctly, run the test script:
--
--   psql -f supabase/tests/rls-security-tests.sql
--
-- Or test manually with:
--
--   SELECT * FROM public.conversations;  -- Should only show user's conversations
--   SELECT * FROM public.documents;      -- Should only show accessible documents
--   SELECT * FROM public.chunks;          -- Should only show accessible chunks
--
-- ============================================================================
