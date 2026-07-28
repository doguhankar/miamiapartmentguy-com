-- ============================================================================
-- RLS POLICY MIGRATION: Enable Row Level Security on sensitive tables
-- ============================================================================
-- 
-- This migration enables Row Level Security (RLS) on the `leads` table to 
-- ensure authenticated agents can only access their own leads, and configures
-- the `saved_lists` table to allow public reads but authenticated writes only.
--
-- NOTE: Service role key (used in API routes) bypasses RLS by default, so
-- server-side inserts/updates (submit-lead, bulk-upload, migrate) continue
-- to work without changes.
--
-- Run this in the Supabase SQL Editor at:
-- https://app.supabase.com/project/thmklqucaqohzjqmpnqe/sql/new
--
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on the `leads` table
-- ============================================================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create policies for authenticated agents on `leads`
-- ============================================================================

-- Policy: Agents can SELECT only rows where agent_id matches their authenticated email
CREATE POLICY "leads_select_own_leads" ON leads
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
);

-- Policy: Agents can UPDATE only rows where agent_id matches their authenticated email
CREATE POLICY "leads_update_own_leads" ON leads
FOR UPDATE
USING (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
);

-- Policy: Agents can INSERT leads (form submissions will use service role, this is for future use)
CREATE POLICY "leads_insert_own_leads" ON leads
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND agent_id = auth.jwt() ->> 'email'
);

-- NOTE: No DELETE policy. Agents cannot delete leads — only archive them.
-- No public/anon policies. Non-authenticated users cannot access leads.

-- ============================================================================
-- STEP 3: Enable RLS on the `saved_lists` table
-- ============================================================================
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: Create policies for `saved_lists`
-- ============================================================================

-- Policy: ANYONE (authenticated or anonymous) can SELECT saved_lists by slug
-- This allows shared list links to work without login
CREATE POLICY "saved_lists_select_public" ON saved_lists
FOR SELECT
USING (true);

-- Policy: ONLY service role can INSERT/UPDATE/DELETE saved_lists
-- Client-side inserts are blocked; only /api/lists route (service role) can write
-- This is implicit — RLS denies all writes from anon key by default.
-- (No INSERT/UPDATE/DELETE policies defined = no one except service role can modify)

-- NOTE: saved_lists SELECT is public for shared links to work.
-- saved_lists writes are restricted to service role (API routes) by default.

-- ============================================================================
-- STEP 5: Do NOT enable RLS on pricing_units and scrape_logs
-- ============================================================================
-- These tables contain non-sensitive scraper data. They're read by agents
-- and written by the cron scraper (service role). No RLS needed.
-- If you want to restrict access in the future, add policies here.

-- ============================================================================
-- VERIFICATION STEPS (run after applying this migration)
-- ============================================================================
-- 
-- 1. Verify RLS is enabled on leads:
--    SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
--    AND rowsecurity = true;
--    (Should include 'leads' and 'saved_lists')
--
-- 2. Verify policies exist:
--    SELECT schemaname, tablename, policyname FROM pg_policies 
--    WHERE schemaname = 'public' 
--    ORDER BY tablename, policyname;
--
-- 3. Test agent portal access:
--    - Log in as an agent (doguhankar1@gmail.com or allowlisted email)
--    - Verify kanban board loads and displays leads where agent_id matches your email
--    - Leads should be filtered automatically by RLS policy
--
-- 4. Test form submission:
--    - Submit a new lead via the Move with Don form
--    - Verify it appears in Slack, Notion, and the agent portal
--    - Service role key in submit-lead route bypasses RLS, so inserts work normally
--
-- ============================================================================
