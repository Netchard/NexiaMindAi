-- =============================================
-- One-time setup for scripts/database/backup-db.js and restore-db.js
-- =============================================
--
-- Run this ONCE in the Supabase SQL Editor (Dashboard > SQL Editor). It
-- creates two RPC functions that let the backup/restore Node.js scripts
-- perform schema introspection and execute SQL through the REST API
-- (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) — no direct PostgreSQL
-- connection (DATABASE_URL) required.
--
-- SECURITY — READ BEFORE RUNNING:
-- These functions execute arbitrary dynamic SQL (via `EXECUTE`) under
-- SECURITY DEFINER privileges. That is inherently powerful — equivalent to
-- a raw SQL backdoor for whoever can call it. The REVOKE/GRANT statements
-- below restrict execution to the `service_role` only (the same secret key
-- that already bypasses RLS on every table via the REST API) — never grant
-- these to `anon`/`authenticated` (the roles used by the browser/frontend).
-- If you don't run backups/restores regularly, consider dropping these
-- functions afterward (`DROP FUNCTION public.exec_sql_query, public.exec_sql_batch;`)
-- to minimize standing attack surface tied to the service_role key.

create or replace function public.exec_sql_query(query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', query) into result;
  return result;
end;
$$;

create or replace function public.exec_sql_batch(queries text[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  q text;
begin
  foreach q in array queries loop
    execute q;
  end loop;
end;
$$;

revoke all on function public.exec_sql_query(text) from public, anon, authenticated;
revoke all on function public.exec_sql_batch(text[]) from public, anon, authenticated;
grant execute on function public.exec_sql_query(text) to service_role;
grant execute on function public.exec_sql_batch(text[]) to service_role;
