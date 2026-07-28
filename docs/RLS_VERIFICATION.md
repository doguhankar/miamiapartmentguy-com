# RLS Verification Checklist

After running the migration in `supabase/migrations/20260728_enable_rls.sql`, use this checklist to verify everything is working correctly.

---

## Database-Level Checks (Supabase SQL Editor)

### Check 1: RLS Enabled on Tables

**SQL:**
```sql
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('leads', 'saved_lists', 'pricing_units', 'scrape_logs')
ORDER BY tablename;
```

**Expected Output:**
```
schemaname | tablename      | rowsecurity
-----------+----------------+------------
public     | leads          | true
public     | pricing_units  | false
public     | saved_lists    | true
public     | scrape_logs    | false
```

✅ **If you see this:** RLS is correctly enabled on `leads` and `saved_lists`, disabled on `pricing_units` and `scrape_logs`.

❌ **If not:** Run the migration again and check for SQL errors.

---

### Check 2: Policies on `leads` Table

**SQL:**
```sql
SELECT 
  policyname, 
  qual, 
  with_check 
FROM pg_policies 
WHERE tablename = 'leads' 
ORDER BY policyname;
```

**Expected Policies (4 total):**

| policyname | Type | Purpose |
|-----------|------|---------|
| leads_insert_own_leads | INSERT | Agents can insert if agent_id = their email |
| leads_select_own_leads | SELECT | Agents can read if agent_id = their email |
| leads_update_own_leads | UPDATE | Agents can edit if agent_id = their email |

✅ **If all 4 exist:** Leads table is properly secured.

❌ **If missing any:** Run the migration again.

---

### Check 3: Policies on `saved_lists` Table

**SQL:**
```sql
SELECT 
  policyname, 
  qual 
FROM pg_policies 
WHERE tablename = 'saved_lists' 
ORDER BY policyname;
```

**Expected Policies (1 total):**

| policyname | USING |
|-----------|-------|
| saved_lists_select_public | true |

✅ **If this exists:** Shared lists are readable by anyone.

❌ **If missing:** Run the migration again.

---

### Check 4: No Policies on `pricing_units` & `scrape_logs`

**SQL:**
```sql
SELECT COUNT(*) 
FROM pg_policies 
WHERE tablename IN ('pricing_units', 'scrape_logs');
```

**Expected Output:**
```
count
-----
  0
```

✅ **If count = 0:** Scraper tables are unrestricted (correct).

❌ **If count > 0:** Remove policies or verify they should be there.

---

## Application-Level Checks

### Check 5: Agent Portal Loads Leads

**Steps:**
1. Go to `https://miamiapartmentguy.com/agent` (or localhost:3000/agent for dev)
2. Click "Sign in with Google"
3. Log in with approved agent email (e.g., doguhankar1@gmail.com)
4. Wait for kanban board to load

**Expected Result:**
- Kanban board visible with 4 columns (New Lead, Discovery Call, Options Sent, Follow Up, Tour Scheduled, Applied/Signed, Archive)
- At least one lead card visible (if leads exist in the database)
- No errors in browser console

**How to Check Console:**
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to the "Console" tab
3. Look for red error messages (none should appear)
4. Look for `[v0] Error fetching leads` or similar (should NOT appear)

✅ **If kanban board loads and leads appear:** RLS is working.

❌ **If no leads appear:** RLS may be too restrictive. See Troubleshooting below.

---

### Check 6: Dossier Edits Still Work

**Steps:**
1. In agent portal, click a lead card
2. Dossier panel appears on the right
3. Edit a field (e.g., name, budget, or quick note)
4. Verify the change saves

**Expected Result:**
- Edit succeeds, lead updates in real-time
- No errors in browser console

✅ **If edits work:** UPDATE RLS policy is correct.

❌ **If edits fail:** Check browser console for "Permission denied" errors.

---

### Check 7: Archiving Leads Works

**Steps:**
1. In agent portal, click a lead card
2. Click the red "Archive" button in the dossier header
3. Select an archive reason from the dropdown
4. Click "Archive lead"
5. Verify the lead moves to the Archive column

**Expected Result:**
- Lead disappears from its current column
- Lead appears in the Archive column
- "Lead archived" toast appears

✅ **If archiving works:** UPDATE and STAGE change RLS policies are correct.

❌ **If archiving fails:** Check Supabase for UPDATE policy errors.

---

### Check 8: Form Submission Creates Leads

**Steps:**
1. Go to `https://miamiapartmentguy.com/` (home page)
2. Click "Move with Don" button
3. Fill out all 7 form steps
4. Click "Send to Don 🚀"
5. Wait for success message

**Expected Result:**
- Form closes with success toast
- New lead appears in Slack channel
- New lead appears in Notion database
- New lead appears in agent portal (may need refresh)

✅ **If all these work:** Service role key is correctly bypassing RLS on insert.

❌ **If form fails:** Check server logs (`/api/submit-lead` errors).

---

### Check 9: Shared Lists Work for Guests

**Steps:**
1. In agent portal, click a building card
2. Click the share icon (or similar)
3. Copy the generated link (should be like `/lists/abc123xyz`)
4. Open the link in a **new incognito/private window** (no auth)
5. Verify buildings display

**Expected Result:**
- Buildings load without login
- No "Permission denied" errors
- List is readable by anyone

✅ **If guest access works:** `saved_lists_select_public` policy is correct.

❌ **If guest access fails:** Check RLS policy on `saved_lists` table.

---

### Check 10: Multiple Agents Cannot See Each Other's Leads

**Steps (if multiple agents exist):**
1. Log in as Agent A
2. Note the lead IDs visible in the kanban board
3. Log out
4. Log in as Agent B (different email)
5. Check the kanban board

**Expected Result:**
- Agent A and Agent B see different leads
- Agent A cannot see Agent B's leads
- Agent B cannot see Agent A's leads

✅ **If leads are separate:** RLS `leads_select_own_leads` policy is working.

❌ **If agents see each other's leads:** RLS policy may be missing or incorrect. This is a SECURITY ISSUE — do not deploy.

---

## Troubleshooting

### Issue: Agent portal shows no leads

**Diagnosis:**
1. Open browser console (F12)
2. Look for errors like `PERMISSION DENIED` or `RLS policy violation`
3. If no error but no leads: check if leads exist in the database

**Solution:**
1. Verify leads exist: In Supabase SQL editor, run `SELECT COUNT(*) FROM leads;`
2. If no leads: Submit a new lead via the form
3. Verify the lead's `agent_id` matches the agent's email: `SELECT agent_id, COUNT(*) FROM leads GROUP BY agent_id;`
4. If `agent_id` is wrong, update it: `UPDATE leads SET agent_id = 'doguhankar1@gmail.com' WHERE id = <id>;`

---

### Issue: "Permission Denied" error on lead edits

**Diagnosis:**
1. Open browser console
2. Look for PostgreSQL error like `permission denied for relation leads`

**Solution:**
1. Verify the lead's `agent_id` matches your authenticated email
2. Check the UPDATE policy: `SELECT * FROM pg_policies WHERE tablename = 'leads' AND policyname = 'leads_update_own_leads';`
3. Verify your JWT email is being passed correctly (Supabase should handle this)
4. Try logging out and back in to refresh the session

---

### Issue: Form submission fails with 403 Forbidden

**Diagnosis:**
1. Check server logs (Vercel dashboard or local logs)
2. Look for "SUPABASE_SERVICE_ROLE_KEY not found" or similar

**Solution:**
1. Verify service role key is set: In Vercel project settings, check Env Vars
2. Verify the key is correct (matches Supabase project settings)
3. For local development: verify `.env.local` has `SUPABASE_SERVICE_ROLE_KEY=<key>`
4. Restart dev server if you just added the env var

---

### Issue: Shared list link shows "Permission Denied"

**Diagnosis:**
1. Open the shared list link (no auth) in incognito window
2. Check browser console for PostgreSQL permission error

**Solution:**
1. Verify `saved_lists_select_public` policy exists: `SELECT * FROM pg_policies WHERE tablename = 'saved_lists';`
2. Verify the policy has `USING (true);`
3. If missing, run the migration again
4. Wait a few seconds and refresh the page

---

## Rollback Instructions

If something goes wrong, you can rollback by disabling RLS:

**⚠️ WARNING: Only do this if you understand the security implications.**

**SQL (to remove all RLS policies):**
```sql
-- Remove all policies
DROP POLICY IF EXISTS leads_select_own_leads ON leads;
DROP POLICY IF EXISTS leads_update_own_leads ON leads;
DROP POLICY IF EXISTS leads_insert_own_leads ON leads;
DROP POLICY IF EXISTS saved_lists_select_public ON saved_lists;

-- Disable RLS on tables
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists DISABLE ROW LEVEL SECURITY;
```

**⚠️ After rollback:** The application will work again, but **anyone with the anon key can read all leads**. Do not commit this to production.

---

## Success Criteria

✅ All 10 checks above pass  
✅ Agent portal loads and displays leads  
✅ Dossier edits and archives work  
✅ Form submissions create leads in Slack/Notion/Supabase  
✅ Shared lists work for guests without login  
✅ Multiple agents cannot see each other's leads (if applicable)  
✅ No "Permission Denied" errors in browser console  
✅ No SQL permission errors in server logs  

If all of these pass, **RLS is correctly enabled and the application is more secure.**

---

## Performance Impact

RLS policies have **minimal performance impact** for typical queries:
- SELECT queries with RLS: +1-2ms per query (policy evaluation)
- UPDATE queries with RLS: +1-2ms per query
- INSERT queries: negligible impact

For the agent portal (typical load):
- Fetching ~50 leads per agent: should complete in <500ms (same as before)
- No noticeable delay in the UI

If you notice performance issues, check query logs in Supabase dashboard under "Logs" → "Postgres" to see slow queries.

---

## Questions or Issues?

- Review the RLS setup documentation: `docs/RLS_SETUP.md`
- Check Supabase RLS documentation: https://supabase.com/docs/guides/auth/row-level-security
- Review the migration SQL: `supabase/migrations/20260728_enable_rls.sql`
