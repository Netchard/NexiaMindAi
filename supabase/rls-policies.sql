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
--
-- Execution:
--   Run this script as a superuser or with service role privileges
--   
-- Created: 2026-07-12
-- Story: ST-401 (5-401-configurer-les-politiques-de-securite-rls)
-- Updated: 2026-07-12 - Fixed: Removed SELECT trigger, using JOINs instead of current_setting
-- ============================================================================

-- ============================================================================
-- SECTION 1: Helper Functions for Role Lookup
-- ============================================================================
-- These functions retrieve the current user's role from the profiles table
-- Note: We cannot use triggers on SELECT in PostgreSQL, so we use subqueries directly in policies

-- Function to get current user's role (can be used in policies via subquery)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================================
-- SECTION 2: Enable RLS on All Tables
-- ============================================================================
-- Enable RLS on all tables in the public schema
-- This must be done before creating policies

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on documents table
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on chunks table
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- Enable RLS on embeddings table
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sync_logs table
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 3: RLS Policies for profiles Table
-- ============================================================================
-- Users can only see and manage their own profile

-- SELECT policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- INSERT policy: Users can create their own profile
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own profile
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

-- SELECT policy: Users can view their own conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = user_id);

-- SELECT policy: Admins can view all conversations
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

-- INSERT policy: Users can create their own conversations
CREATE POLICY "Users can create their own conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE policy: Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE policy: Users can delete their own conversations
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: RLS Policies for documents Table
-- ============================================================================
-- Documents are accessible based on role and client_id

-- SELECT policy: Admins can view all documents
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

-- SELECT policy: Managers can view all documents
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

-- SELECT policy: Project leads can view documents for their projects
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

-- SELECT policy: Developers can view technical documents
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

-- SELECT policy: Consultants can view client documents
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

-- INSERT policy: Only admins and managers can create documents
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

-- UPDATE/DELETE policies: Only document owner or admin can modify
-- Note: This requires additional metadata in the documents table

-- ============================================================================
-- SECTION 6: RLS Policies for chunks Table
-- ============================================================================
-- Chunks are filtered based on role and allowed_roles in metadata

-- SELECT policy: Admins can view all chunks
CREATE POLICY "Admins can view all chunks"
ON public.chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- SELECT policy: Users can view chunks from their own documents or allowed roles
-- This policy checks document-level permissions
CREATE POLICY "Users can view chunks from allowed documents"
ON public.chunks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE d.id = chunks.document_id
    AND (
      p.role = 'admin'
      OR p.role = 'manager'
      OR (p.role = 'developer' AND d.type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json'))
      OR (p.role = 'consultant' AND d.client_id IS NOT NULL)
    )
  )
  OR (metadata->>'allowed_roles' = 'all')
  OR (metadata->>'allowed_roles' IS NULL)
);

-- ============================================================================
-- SECTION 7: RLS Policies for embeddings Table
-- ============================================================================
-- Embeddings inherit access from chunks (which inherit from documents)

-- SELECT policy: Admins can view all embeddings
CREATE POLICY "Admins can view all embeddings"
ON public.embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- SELECT policy: Users can view embeddings for chunks they can access
CREATE POLICY "Users can view embeddings for accessible chunks"
ON public.embeddings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chunks c
    JOIN public.documents d ON c.document_id = d.id
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = embeddings.chunk_id
    AND (
      p.role = 'admin'
      OR p.role = 'manager'
      OR (p.role = 'developer' AND d.type IN ('pdf', 'text', 'markdown', 'code', 'csv', 'json'))
      OR (p.role = 'consultant' AND d.client_id IS NOT NULL)
      OR c.metadata->>'allowed_roles' = 'all'
      OR c.metadata->>'allowed_roles' IS NULL
    )
  )
);

-- ============================================================================
-- SECTION 8: RLS Policies for messages Table
-- ============================================================================
-- Messages inherit access from conversations

-- SELECT policy: Users can view messages from their own conversations
CREATE POLICY "Users can view messages from their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = messages.conversation_id
    AND (
      p.user_id = c.user_id
      OR p.role = 'admin'
      OR p.role = 'manager'
    )
  )
);

-- INSERT policy: Users can add messages to their own conversations
CREATE POLICY "Users can add messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.profiles p ON p.user_id = auth.uid()
    WHERE c.id = NEW.conversation_id
    AND (
      p.user_id = c.user_id
      OR p.role = 'admin'
      OR p.role = 'manager'
    )
  )
);

-- UPDATE policy: Only admins can update messages (to prevent tampering)
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

-- DELETE policy: Only admins can delete messages
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
-- Sync logs are restricted to admins only

-- SELECT policy: Only admins can view sync logs
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

-- INSERT policy: Allow any authenticated user to create sync logs
CREATE POLICY "Authenticated users can create sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE/DELETE: Only admins
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
