# RLS Technical Reference: How It Works in MAG

This document explains the technical mechanics of how Row Level Security integrates with the existing codebase.

---

## 1. Agent Portal: How RLS Filters Leads

### The Query (No Changes Required)

**File:** `app/agent/page.tsx` (lines 216-221)

```typescript
const fetchLeads = async () => {
  const { data, error } = await sb
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
  if (!error && data) setLeads((data as DbLead[]).map(dbLeadToLead))
}
```

### What Happens Without RLS

1. Query: `SELECT * FROM leads ORDER BY created_at DESC`
2. Returns: ALL leads in the database (security risk)
3. Agent sees: Every lead, regardless of who owns it

### What Happens With RLS Enabled

1. Query: `SELECT * FROM leads ORDER BY created_at DESC`
2. Supabase intercepts the query
3. RLS policy `leads_select_own_leads` applies:
   ```sql
   USING (
     auth.role() = 'authenticated' 
     AND agent_id = auth.jwt() ->> 'email'
   )
   ```
4. Supabase automatically adds: `WHERE agent_id = '<agent_email>'`
5. Effective query becomes:
   ```sql
   SELECT * FROM leads 
   WHERE agent_id = 'doguhankar1@gmail.com'
   ORDER BY created_at DESC
   ```
6. Returns: Only leads where `agent_id` matches authenticated user's email
7. Agent sees: Only their own leads

### JWT Token Details

When an agent logs in via Google OAuth:

**In browser:**
```typescript
const { data: { session } } = await sb.auth.getSession()
// session.user.email = 'doguhankar1@gmail.com'
```

**In Supabase JWT (decoded):**
```json
{
  "sub": "12345-abc",
  "email": "doguhankar1@gmail.com",
  "email_verified": true,
  "app_metadata": { ... },
  "user_metadata": { "full_name": "Don Karahan" },
  "iss": "https://supabase.co",
  "aud": "authenticated",
  "exp": 1234567890,
  ...
}
```

**RLS Extracts:** `auth.jwt() ->> 'email'` = `"doguhankar1@gmail.com"`

### Anon Key Does NOT Have JWT Email

If a user is not authenticated:

```typescript
// Anonymous request (no login)
const { data: { session } } = await sb.auth.getSession()
// session = null
```

**RLS Policy Evaluation:**
```sql
USING (
  auth.role() = 'authenticated'  ← FALSE (anon role)
  AND agent_id = auth.jwt() ->> 'email'  ← short-circuits, never evaluated
)
```

**Result:** RLS BLOCKS the query → "Permission Denied" error

---

## 2. Form Submission: Service Role Bypasses RLS

### The Route

**File:** `app/api/submit-lead/route.ts`

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  // ... handle request ...
  const supabase = createAdminClient()  ← Service role client
  
  const { error } = await supabase
    .from('leads')
    .insert([payload])
    // No .select() call needed; insert is fire-and-forget
}
```

### Service Role Client Details

**File:** `lib/supabase/admin.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,  ← Service role key (secret)
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
```

### Why Service Role Bypasses RLS

**Supabase Design:**
- **Anon key:** Can only SELECT/INSERT data they own (RLS applies)
- **Service role key:** Full admin access to all data (RLS bypassed)

**JWT Token for Service Role:**
```json
{
  "role": "service_role",  ← Not "authenticated"
  "iss": "https://supabase.co",
  ...
}
```

**RLS Policy Check for Service Role:**
```sql
USING (
  auth.role() = 'authenticated'  ← FALSE (service_role != authenticated)
)
```

**Result:** RLS condition is false, policy is skipped → Query succeeds

### Why This Is Safe

1. **Service role key is server-side only** → Cannot be leaked to client
2. **Only 3 routes use it** → `/api/submit-lead`, `/api/admin/bulk-upload`, `/api/migrate`
3. **All set hardcoded `agent_id`** → Don't allow user to specify which agent gets the lead
4. **No RLS bypass in client-side code** → Anon key always used in agent portal

---

## 3. Dossier Edits: RLS Enforces Ownership

### Update Query

**File:** `app/agent/page.tsx` (lines 340-368)

```typescript
const saveLead = async (leadId: string, updates: Partial<Lead>) => {
  // Build dbUpdates from updates object
  const dbUpdates: Record<string, any> = {}
  if (updates.name !== undefined) dbUpdates.name = updates.name
  if (updates.email !== undefined) dbUpdates.email = updates.email
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone
  // ... more mappings ...

  const numericId = parseInt(leadId)
  if (isNaN(numericId)) {
    console.error('[v0] saveLead: non-numeric id', leadId)
    return
  }

  const { error } = await supabaseRef.current
    .from('leads')
    .update(dbUpdates)
    .eq('id', numericId)  ← This becomes: WHERE id = numericId
}
```

### Execution With RLS

1. Agent clicks dossier, edits lead name
2. Frontend calls: `saveLead('42', { name: 'John Doe' })`
3. Query sent: `UPDATE leads SET name = 'John Doe' WHERE id = 42`
4. Supabase intercepts with RLS policy `leads_update_own_leads`:
   ```sql
   USING (
     auth.role() = 'authenticated' 
     AND agent_id = auth.jwt() ->> 'email'
   )
   WITH CHECK (
     auth.role() = 'authenticated' 
     AND agent_id = auth.jwt() ->> 'email'
   )
   ```
5. Policy adds implicit WHERE:
   ```sql
   UPDATE leads 
   SET name = 'John Doe' 
   WHERE id = 42 
     AND agent_id = 'doguhankar1@gmail.com'  ← RLS added this
   ```

### Two Possible Outcomes

**If agent owns the lead:**
- Lead's `agent_id` = 'doguhankar1@gmail.com'
- WHERE clause matches: row is found
- UPDATE succeeds → UI updates

**If agent doesn't own the lead:**
- Lead's `agent_id` ≠ 'doguhankar1@gmail.com'
- WHERE clause doesn't match: row is not found
- UPDATE returns 0 rows affected
- Supabase returns error: `"No rows updated"` or similar
- UI shows error toast

---

## 4. Archive Flow: Composite Query

### Archive Handler

**File:** `app/agent/page.tsx` (lines 415-440)

```typescript
const handleArchiveLead = async () => {
  if (!selectedLead || !archiveReason) return

  const leadId = selectedLead.id

  // 1. Update local state immediately
  updateLead(leadId, {
    column: 'archive',
    archive_reason: archiveReason,
    archive_notes: archiveNotes,
  })

  // 2. Persist via saveLead
  try {
    await saveLead(leadId, {
      column: 'archive',
      archive_reason: archiveReason,
      archive_notes: archiveNotes,
    })
    showToast('Lead archived')
    // ... reset state ...
  } catch (err) {
    console.error('[v0] handleArchiveLead exception:', err)
    showToast('Failed to archive lead')
  }
}
```

### What Gets Saved

In `saveLead` (lines 352-363):
```typescript
// column → stage mapping (used by archive and any direct stage changes)
if (updates.column !== undefined) {
  const col = COLUMNS.find(c => c.key === updates.column)
  if (col) dbUpdates.stage = col.stage
}

// archive_reason and archive_notes are persisted directly
if (updates.archive_reason !== undefined) dbUpdates.archive_reason = updates.archive_reason
if (updates.archive_notes !== undefined) dbUpdates.archive_notes = updates.archive_notes
```

### SQL Generated

```sql
UPDATE leads 
SET 
  stage = 'Archive',
  archive_reason = 'Ghosted / stopped responding',
  archive_notes = 'No response for 2 weeks'
WHERE id = 42
  AND agent_id = 'doguhankar1@gmail.com'  ← RLS added
```

---

## 5. Shared Lists: Public RLS Policy

### Policy Definition

```sql
CREATE POLICY "saved_lists_select_public" ON saved_lists
FOR SELECT
USING (true);
```

### How It Works

**Anonymous user clicking shared link:**
1. URL: `https://miamiapartmentguy.com/lists/abc123xyz`
2. No authentication (session = null)
3. Frontend calls: `SELECT * FROM saved_lists WHERE slug = 'abc123xyz'`
4. Auth context: `auth.role() = 'anon'`
5. RLS policy `saved_lists_select_public` has `USING (true)`:
   ```sql
   -- true means: always allow (for SELECT only)
   ```
6. Query executes: `SELECT * FROM saved_lists WHERE slug = 'abc123xyz'`
7. Results returned: Buildings array displayed
8. Status: ✅ Success (guest can see shared list)

### Why No Write Policies

In RLS, if no policy exists for an operation, that operation is **denied by default**.

```sql
-- saved_lists table has only SELECT policy
-- No INSERT, UPDATE, DELETE policies defined

-- Therefore:
SELECT ... FROM saved_lists;  ← Allowed (policy defined)
INSERT ... INTO saved_lists;  ← Denied (no policy)
UPDATE ... saved_lists ...;   ← Denied (no policy)
DELETE ... FROM saved_lists;  ← Denied (no policy)
```

**Exception:** Service role key bypasses all RLS checks, so API routes can still INSERT/UPDATE/DELETE.

---

## 6. Multi-Tenant Example: Future Enhancement

If the platform scales to multiple agents, here's how RLS extends:

### New `leads` Table With Team Column

```sql
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_id TEXT;

-- New RLS policies for teams
CREATE POLICY "leads_select_own_team" ON leads
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND agent_id = auth.jwt() ->> 'email'
);
```

### Admin Can See All

```sql
-- Assuming an "admin" role exists in auth metadata
CREATE POLICY "leads_select_admin_all" ON leads
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND (auth.jwt() ->> 'app_metadata'->>'is_admin')::boolean
);
```

### Manager Can See Team Leads

```sql
-- Assuming leads have a team_id column
CREATE POLICY "leads_select_manager_team" ON leads
FOR SELECT
USING (
  auth.role() = 'authenticated'
  AND team_id = (
    SELECT team_id FROM agents 
    WHERE email = auth.jwt() ->> 'email'
  )
);
```

---

## 7. Performance Considerations

### Query Planning

When RLS policy is applied, PostgreSQL treats it as an OR of all applicable policies:

```sql
-- If 2 policies exist for SELECT:
SELECT * FROM leads WHERE ...

-- Becomes (internally):
SELECT * FROM leads WHERE ... AND (policy1_condition OR policy2_condition)
```

### Index Recommendations

For optimal RLS performance, ensure indexes on:
1. `agent_id` (used in all RLS policies for leads)
2. `slug` (used in RLS select policy for saved_lists)

```sql
CREATE INDEX idx_leads_agent_id ON leads(agent_id);
CREATE INDEX idx_saved_lists_slug ON saved_lists(slug);
```

These indexes already exist (implied by primary keys and design), so no changes needed.

### Query Execution Plan

To see how RLS affects query performance:

```sql
EXPLAIN ANALYZE SELECT * FROM leads WHERE agent_id = 'doguhankar1@gmail.com';
```

Compare results before/after enabling RLS to verify the planner still uses indexes.

---

## 8. Debugging RLS Issues

### Enable Query Logging

In Supabase Dashboard → Logs → Postgres:

1. Set log level to "DEBUG"
2. Run a query in the agent portal
3. Check logs for RLS policy evaluation messages

### Test Policy Directly (Supabase SQL)

```sql
-- Simulate authenticated user (requires setting claims)
SET ROLE authenticated;
SET request.jwt.claims = '{"email":"doguhankar1@gmail.com","role":"authenticated"}';

-- Try to select leads
SELECT * FROM leads LIMIT 10;

-- Should return only leads where agent_id = 'doguhankar1@gmail.com'

-- Reset
RESET ROLE;
RESET request.jwt.claims;
```

### Check Policy String Representation

```sql
SELECT 
  policyname,
  qual,        -- USING clause (SELECT/UPDATE USING)
  with_check   -- WITH CHECK clause (UPDATE/INSERT WITH CHECK)
FROM pg_policies
WHERE tablename = 'leads'
ORDER BY policyname;
```

---

## 9. Security Edge Cases

### Edge Case 1: User Modifies JWT Claims Client-Side

**Threat:** Agent tries to decode JWT, modify `email` claim, and re-send

**Protection:** 
- JWT signature cannot be forged without the private key (server-side only)
- Supabase verifies signature on every request
- Tampered JWT is rejected: "Invalid JWT signature"

### Edge Case 2: Agent Directly Edits Another Agent's Lead

**Threat:** Agent discovers another agent's lead ID and tries to UPDATE it

**Protection:**
```sql
UPDATE leads SET name = 'hacked' WHERE id = 999
-- Becomes (with RLS):
UPDATE leads SET name = 'hacked' 
WHERE id = 999 
  AND agent_id = 'doguhankar1@gmail.com'  ← Must own it
-- If lead 999 has agent_id = 'jane@example.com', update fails
```

### Edge Case 3: Anon User Tries to READ Leads

**Threat:** User without auth tries to query leads table directly

**Protection:**
```sql
-- No SELECT policy for anon role
-- RLS denies: "Permission denied for relation leads"
```

### Edge Case 4: Service Role Key Leaked

**Threat:** Service role key exposed in client-side code

**Risk Level:** 🔴 CRITICAL

**Protection:**
- Store service role key in **server-side env vars only**
- Use in API routes that handle requests securely
- Review `/api/*` routes to ensure they never expose the key

**Current Status:** ✅ Secure (key only in admin.ts, never in client code)

---

## 10. Maintenance and Updates

### When to Update RLS Policies

1. **New agent added to allowlist** → No policy changes needed
2. **New column added to leads** → Check if policy needs to scope access
3. **New role added (e.g., manager)** → Create new policies for that role
4. **Data access patterns change** → Review policies for correctness

### Regular Audits

**Monthly:**
1. Review active policies: `SELECT * FROM pg_policies WHERE schemaname = 'public';`
2. Check for unused policies and remove them
3. Verify performance: check slow query logs

**Quarterly:**
1. Review allowed IP ranges (if using IP allowlists)
2. Audit service role key usage (count API calls, check for anomalies)
3. Test disaster recovery (can you recreate policies from migration?)

### Backup Strategy

RLS policies are **not backed up automatically** beyond Supabase's database backups.

**To preserve policies:**
1. Keep migration files in version control (this is done)
2. Document policies in Markdown (this is done: `RLS_SETUP.md`)
3. Export policies periodically:
   ```sql
   pg_dump -s <database_url> > schema_backup.sql
   ```

---

## References

- **Supabase RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL RLS:** https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- **JWT Claims:** https://supabase.com/docs/guides/auth/jwts
- **Performance Tuning:** https://www.postgresql.org/docs/current/sql-explain.html
