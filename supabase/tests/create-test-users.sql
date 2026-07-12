-- ============================================================================
-- Create Test Users for RLS Testing
-- ============================================================================
-- 
-- This script provides multiple methods to create test users for RLS testing
-- Choose the method that works for your Supabase setup
--
-- Created: 2026-07-12
-- Story: ST-401 (5-401-configurer-les-politiques-de-securite-rls)
-- ============================================================================

-- ============================================================================
-- METHOD 1: Direct SQL Insert (Requires SUPERUSER)
-- ============================================================================
-- 
-- Try this first if you have superuser access to your database
-- This attempts to insert directly into auth.users table
--
-- Note: The exact column structure may vary based on your Supabase version.
-- We provide multiple variations to handle different Supabase versions.

-- Uncomment and run ONE of these approaches:

-- -- APPROACH A: Minimal columns (Supabase v2+)
-- INSERT INTO auth.users (id, email, created_at, updated_at)
-- VALUES 
--   ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin@nexiamind.ai', NOW(), NOW()),
--   ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', NOW(), NOW()),
--   ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', NOW(), NOW()),
--   ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', NOW(), NOW()),
--   ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- -- APPROACH B: With encrypted_password (Older Supabase versions)
-- INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at)
-- VALUES 
--   ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin@nexiamind.ai', NULL, NOW(), NOW()),
--   ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', NULL, NOW(), NOW()),
--   ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', NULL, NOW(), NOW()),
--   ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', NULL, NOW(), NOW()),
--   ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', NULL, NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- -- APPROACH C: With all common columns
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed, created_at, updated_at)
-- VALUES 
--   ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 'admin@nexiamind.ai', NULL, false, NOW(), NOW()),
--   ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12'::UUID, 'manager@nexiamind.ai', NULL, false, NOW(), NOW()),
--   ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13'::UUID, 'lead@nexiamind.ai', NULL, false, NOW(), NOW()),
--   ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14'::UUID, 'dev@nexiamind.ai', NULL, false, NOW(), NOW()),
--   ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15'::UUID, 'consultant@nexiamind.ai', NULL, false, NOW(), NOW())
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- METHOD 2: Using Supabase Dashboard (RECOMMENDED for most users)
-- ============================================================================
-- 
-- If you don't have SUPERUSER access, use the Supabase Dashboard:
--
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to: Auth -> Users
-- 3. Click "Create User" button
-- 4. Create users with these emails:
--    - admin@nexiamind.ai (role: admin)
--    - manager@nexiamind.ai (role: manager)
--    - lead@nexiamind.ai (role: project_lead)
--    - dev@nexiamind.ai (role: developer)
--    - consultant@nexiamind.ai (role: consultant)
-- 5. Note the UUID of each user
-- 6. Update the user_id values in rls-security-tests.sql to match these UUIDs
--
-- Note: You cannot specify the UUID in the Dashboard, so you'll need to:
-- 1. Query auth.users to get the UUIDs:
--    SELECT id, email FROM auth.users;
-- 2. Update rls-security-tests.sql with these UUIDs

-- ============================================================================
-- METHOD 3: Using Supabase Auth API (Programmatic)
-- ============================================================================
-- 
-- Use this method if you want to create users programmatically
-- Requires: Supabase Service Role Key
--
-- JavaScript/Node.js example:
-- ```javascript
-- import { createClient } from '@supabase/supabase-js'
-- 
-- const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
-- 
-- const users = [
--   { email: 'admin@nexiamind.ai', password: 'password123', user_metadata: { role: 'admin' } },
--   { email: 'manager@nexiamind.ai', password: 'password123', user_metadata: { role: 'manager' } },
--   { email: 'lead@nexiamind.ai', password: 'password123', user_metadata: { role: 'project_lead' } },
--   { email: 'dev@nexiamind.ai', password: 'password123', user_metadata: { role: 'developer' } },
--   { email: 'consultant@nexiamind.ai', password: 'password123', user_metadata: { role: 'consultant' } }
-- ]
-- 
-- for (const user of users) {
--   const { data, error } = await supabase.auth.admin.createUser({
--     email: user.email,
--     password: user.password,
--     user_metadata: user.user_metadata
--   })
--   if (error) console.error(error)
--   else console.log('Created user:', data.user.id, data.user.email)
-- }
-- ```
--
-- Python example:
-- ```python
-- from supabase import create_client, Client
-- import os
-- 
-- supabase: Client = create_client(
--     os.getenv('SUPABASE_URL'),
--     os.getenv('SUPABASE_SERVICE_ROLE_KEY')
-- )
-- 
-- users = [
--     {'email': 'admin@nexiamind.ai', 'password': 'password123'},
--     {'email': 'manager@nexiamind.ai', 'password': 'password123'},
--     {'email': 'lead@nexiamind.ai', 'password': 'password123'},
--     {'email': 'dev@nexiamind.ai', 'password': 'password123'},
--     {'email': 'consultant@nexiamind.ai', 'password': 'password123'}
-- ]
-- 
-- for user in users:
--     result = supabase.auth.admin.create_user({
--         'email': user['email'],
--         'password': user['password']
--     })
--     print(f"Created user: {result.user.id}")
-- ```

-- ============================================================================
-- METHOD 4: Verify Users Were Created
-- ============================================================================
-- 
-- After creating users, verify they exist with:
--
-- SELECT id, email, created_at FROM auth.users 
-- WHERE email IN ('admin@nexiamind.ai', 'manager@nexiamind.ai', 'lead@nexiamind.ai', 'dev@nexiamind.ai', 'consultant@nexiamind.ai')
-- ORDER BY email;

-- ============================================================================
-- METHOD 5: Quick Check - Do Users Exist?
-- ============================================================================
-- 
-- Run this query to check if test users already exist:
--
DO $$
DECLARE
  user_count INTEGER;
  missing_users TEXT[] := ARRAY['admin@nexiamind.ai', 'manager@nexiamind.ai', 'lead@nexiamind.ai', 'dev@nexiamind.ai', 'consultant@nexiamind.ai'];
  existing_emails TEXT[];
  missing_emails TEXT[];
BEGIN
  -- Check which users exist
  SELECT array_agg(email) INTO existing_emails
  FROM auth.users 
  WHERE email = ANY(missing_users);
  
  -- Find missing users
  SELECT array_agg(email) INTO missing_emails
  FROM unnest(missing_users) AS email
  WHERE email NOT IN (SELECT unnest(existing_emails));
  
  -- Report status
  IF array_length(missing_emails, 1) = 0 THEN
    RAISE NOTICE '✅ All test users already exist in auth.users';
    RAISE NOTICE '   You can now run: psql -f rls-security-tests.sql';
  ELSE
    RAISE NOTICE '⚠️ Missing test users in auth.users:';
    FOR i IN 1..array_length(missing_emails, 1) LOOP
      RAISE NOTICE '   - %', missing_emails[i];
    END LOOP;
    RAISE NOTICE '   Create these users first, then run the test script';
  END IF;
END $$;

-- ============================================================================
