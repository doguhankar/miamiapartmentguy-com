# Row Level Security (RLS) Implementation Guide

**Status:** Ready to enable  
**Last Updated:** July 28, 2026  
**Migration File:** `supabase/migrations/20260728_enable_rls.sql`

---

## Overview

This document describes the Row Level Security (RLS) configuration for the Miami Apartment Guy platform. RLS ensures that:

1. **Authenticated agents** can only view/edit their own leads (based on `agent_id` matching their email)
2. **Public users** cannot access the `leads` table
3. **Shared lists** remain public for guests to view (but only via service role can be created)
4. **Service role key** bypasses RLS on all server-side API routes (form submissions, bulk uploads, migrations)

---

## Current Setup

### Authentication Flow

The platform uses **Supabase Auth with Google OAuth**:
- Users authenticate via Google → Supabase creates a session with `auth.jwt()` payload
- `auth.jwt() ->> 'email'` extracts the authenticated user's email from the JWT
- Agent allowlist table (`agent_allowlist`) gates access to the portal
- Only approved agents can access the `/agent` route

### Service Role Architecture

Three API routes use the **service role key** (bypasses RLS):

1. **`/api/submit-lead`** (POST)
   - Inserts new leads with hardcoded `agent_id: 'doguhankar1@gmail.com'`
   - RLS does NOT apply (service role key used)
   - Leads are visible to Don in the agent portal

2. **`/api/admin/bulk-upload`** (POST)
   - Bulk inserts leads via CSV
   - Uses service role key
   - All inserts have `agent_id: 'doguhankar1@gmail.com'`

3. **`/api/migrate`** (GET)
   - Checks for schema columns
   - Uses anon key (read-only check), does not insert

---

## RLS Policies Implemented

### `leads` Table

**Status:** RLS ENABLED

#### Policy 1: `leads_select_own_leads`
```sql
FOR SELECT
USING (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
);
```
- ✅ Authenticated agents see only leads where `agent_id` = their email
- ❌ Anon/public users: no access
- **Impact:** Agent portal loads only the logged-in agent's leads

#### Policy 2: `leads_update_own_leads`
```sql
FOR UPDATE
USING (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
)
WITH CHECK (
  auth.role() = 'authenticated' 
  AND agent_id = auth.jwt() ->> 'email'
);
```
- ✅ Agents can update only their own leads (dossier edits, archive, stage changes)
- ❌ Cannot update other agents' leads
- **Impact:** All dossier panel edits work as before, limited to own leads

#### Policy 3: `leads_insert_own_leads`
```sql
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND agent_id = auth.jwt() ->> 'email'
);
```
- ✅ Agents can insert leads if they set `agent_id` to their own email
- ❌ Server-side: bypassed (service role used)
- **Impact:** Future client-side lead creation would be restricted to own `agent_id`

#### No DELETE Policy
- Agents cannot delete leads (not a business requirement)
- Leads are archived instead

#### No Public/Anon Policy
- Non-authenticated users cannot access any leads
- Perfect for protecting sensitive lead data

---

### `saved_lists` Table

**Status:** RLS ENABLED

#### Policy 1: `saved_lists_select_public`
```sql
FOR SELECT
USING (true);
```
- ✅ Anyone (authenticated or anonymous) can read shared lists
- **Impact:** Shared list links work for guests without login
- **Example:** User receives `/lists/abc123xyz` link, can view buildings without auth

#### No Write Policies (Implicit Service Role Only)
- INSERT/UPDATE/DELETE not defined for authenticated users
- Only service role (API routes) can modify
- **Impact:** Shared lists are created only by `/api/lists` route (service role)

---

### `pricing_units` & `scrape_logs` Tables

**Status:** RLS NOT ENABLED (no changes)

- No sensitive data (pricing info is aggregated, not per-lead)
- Read by agents and populated by cron scraper
- No need for per-user restrictions
- Can be revisited later if data governance requires it

---

## Agent Portal Impact

### How the Agent Portal Loads Leads

**Code:** `app/agent/page.tsx` (lines 216-221)
```typescript
const fetchLeads = async () => {
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (!error && data) setLeads((data as DbLead[]).map(dbLeadToLead))
}
```

**With RLS Enabled:**
- Query: `SELECT * FROM leads` (no WHERE clause)
- RLS policy automatically filters: only rows where `agent_id = auth.jwt() ->> 'email'`
- Result: Agent sees only their own leads
- **NO CODE CHANGES** required — RLS does the filtering transparently

**Service Role Bypasses RLS:**
- Routes using `createAdminClient()` bypass RLS entirely
- Form submissions continue to insert leads with hardcoded `agent_id`
- Those leads appear in the agent portal when queried by authenticated agents

---

## Deployment Checklist

### Step 1: Run Migration in Supabase SQL Editor

1. Go to: https://app.supabase.com/project/thmklqucaqohzjqmpnqe/sql/new
2. Copy entire contents of `supabase/migrations/20260728_enable_rls.sql`
3. Click "Run" button
4. Verify success: no errors in the output panel

### Step 2: Verify RLS is Enabled

In Supabase SQL editor, run:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;
```

**Expected output:**
```
tablename
-----------
leads
saved_lists
```

### Step 3: Verify Policies Exist

In Supabase SQL editor, run:
```sql
SELECT schemaname, tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'saved_lists')
ORDER BY tablename, policyname;
```

**Expected output (abbreviated):**
```
tablename  policyname                      qual
---------  -----                           ----
leads      leads_insert_own_leads          ...
leads      leads_select_own_leads          ...
leads      leads_update_own_leads          ...
saved_lists saved_lists_select_public      true
```

### Step 4: Test in Agent Portal

1. Log in to `/agent` with approved agent email (e.g., doguhankar1@gmail.com)
2. Verify kanban board loads
3. Verify leads appear in the board
4. Verify dossier panel edits work (rename, edit fields, archive)
5. No errors in browser console

### Step 5: Test Form Submission

1. Go to home page and click "Move with Don" form
2. Fill out all steps (including agent picker)
3. Submit form
4. Verify:
   - Slack notification received
   - New lead appears in Notion database
   - Lead appears in agent portal kanban board

### Step 6: Test Shared Lists

1. Bookmark some buildings
2. Click "Share" to generate a list slug
3. Copy the shared link (e.g., `/lists/abc123xyz`)
4. Open shared link in **incognito/private mode** (no auth)
5. Verify buildings display without login

---

## Troubleshooting

### Issue: Agent portal shows no leads after enabling RLS

**Cause:** RLS policy filtering out leads (agent_id mismatch)

**Fix:**
1. Check the agent's authenticated email in the JWT
2. Verify leads in database have matching `agent_id`
3. Run: `SELECT agent_id, COUNT(*) FROM leads GROUP BY agent_id;`
4. Confirm at least one lead has `agent_id = 'doguhankar1@gmail.com'` (or your agent's email)

### Issue: Form submission fails to insert lead

**Cause:** Service role key misconfigured or not passed in request headers

**Fix:**
1. Verify `/api/submit-lead` uses `createAdminClient()` (service role)
2. Verify `SUPABASE_SERVICE_ROLE_KEY` env var is set in `.env.local` (dev) and Vercel project settings (prod)
3. Check server logs for Supabase error response

### Issue: Shared lists don't load without login

**Cause:** `saved_lists` policy not created or too restrictive

**Fix:**
1. Verify `saved_lists_select_public` policy exists
2. Run: `SELECT * FROM pg_policies WHERE tablename = 'saved_lists';`
3. If missing, re-run the migration

---

## Security Considerations

### What RLS Protects

✅ **Prevents data leakage** — Agents can't view other agents' leads via direct DB queries  
✅ **Enforces ownership** — All updates checked against `agent_id` match  
✅ **Public vs. Private** — Shared lists are intentionally public; leads are private  

### What RLS Does NOT Protect

❌ **Service role bypass** — API routes with service role key skip RLS (intentional)  
❌ **SQL injection** — Use parameterized queries (already done in the codebase)  
❌ **Application logic** — Client-side code can still attempt unauthorized operations (caught by RLS)  

### Defense-in-Depth

1. **RLS Policies** (database layer) — Stops unauthenticated access
2. **Agent Allowlist** (application layer) — Gates who can log in to `/agent`
3. **Service Role Key** (API layer) — Controls form submissions (hardcoded `agent_id`)

---

## Future Enhancements

### Multi-Agent Support

To support multiple agents in the future:

1. Remove hardcoded `agent_id: 'doguhankar1@gmail.com'` from API routes
2. Read authenticated user's email from request context
3. Allow agents to set their own `agent_id` on lead creation
4. RLS policies will automatically enforce per-agent visibility

**Example:**
```typescript
// Instead of:
agent_id: 'doguhankar1@gmail.com',

// Do this:
const user = await sb.auth.getUser()
agent_id: user.email,
```

### Role-Based Access Control (RBAC)

Add roles like "admin", "manager", "agent":
- Admins: see all leads (RLS policy with role check)
- Managers: see team leads (RLS with team_id match)
- Agents: see own leads (current policy)

### Audit Logging

Track all lead modifications:
1. Create `lead_audit_log` table
2. Add AFTER UPDATE trigger on `leads`
3. Log changes with timestamp, user, old/new values

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL SECURITY LABEL](https://www.postgresql.org/docs/current/sql-createsecuritylabel.html)
- [JWT Claims in Supabase](https://supabase.com/docs/guides/auth/jwts)

---

## Contact

Questions or issues? Check the agent portal auth logs or contact support at the Supabase dashboard.
