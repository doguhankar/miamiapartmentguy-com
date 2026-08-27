# RLS Implementation Summary

**Project:** Miami Apartment Guy (MAG)  
**Date:** July 28, 2026  
**Status:** Ready for Deployment

---

## Executive Summary

Row Level Security (RLS) has been implemented to secure the `leads` table against unauthorized access. When enabled:

✅ **Agents can only access their own leads** (RLS policy enforces `agent_id` match)  
✅ **Public users cannot read leads** (no anon policies defined)  
✅ **API routes bypass RLS** (service role key used for form submissions)  
✅ **Shared lists remain public** (intentional read policy)  
✅ **No code changes required** to agent portal (RLS works transparently)  

---

## What's Been Created

### 1. Migration File
**Location:** `supabase/migrations/20260728_enable_rls.sql`

Contains SQL to:
- Enable RLS on `leads` and `saved_lists` tables
- Create 4 policies on `leads` (SELECT, UPDATE, INSERT for authenticated agents)
- Create 1 policy on `saved_lists` (SELECT for public)

**To apply:** Copy this file's contents into Supabase SQL editor and run.

### 2. Setup Documentation
**Location:** `docs/RLS_SETUP.md`

Comprehensive guide including:
- Overview of RLS architecture
- Policy definitions and their purposes
- Deployment checklist (step-by-step)
- Troubleshooting guide
- Future enhancements (multi-agent, RBAC, audit logging)

### 3. Verification Checklist
**Location:** `docs/RLS_VERIFICATION.md`

10-point verification checklist:
- Database-level checks (pg_policies queries)
- Application-level checks (agent portal, form submission, shared lists)
- Troubleshooting for common issues
- Rollback instructions (if needed)

### 4. Technical Reference
**Location:** `docs/RLS_TECHNICAL_REFERENCE.md`

Deep dive into how RLS works:
- Agent portal query interception
- Service role bypass mechanism
- JWT token inspection
- Dossier edit enforcement
- Archive flow RLS checks
- Performance considerations
- Security edge cases
- Maintenance guidelines

---

## Policy Summary

### `leads` Table (RLS: ENABLED)

| Policy | Operation | Condition | Effect |
|--------|-----------|-----------|--------|
| `leads_select_own_leads` | SELECT | `agent_id = auth.jwt() ->> 'email'` | Agents see only their leads |
| `leads_update_own_leads` | UPDATE | `agent_id = auth.jwt() ->> 'email'` | Agents edit only their leads |
| `leads_insert_own_leads` | INSERT | `agent_id = auth.jwt() ->> 'email'` | Agents can insert if setting own `agent_id` |
| (none) | DELETE | — | No agent can delete (archive only) |

**No public/anon policies:** Non-authenticated users get "Permission Denied"

### `saved_lists` Table (RLS: ENABLED)

| Policy | Operation | Condition | Effect |
|--------|-----------|-----------|--------|
| `saved_lists_select_public` | SELECT | `true` | Anyone can read (for shared links) |
| (none) | INSERT/UPDATE/DELETE | — | Only service role can modify |

**Rationale:** Shared lists need public read access; writes restricted to API routes

### `pricing_units` & `scrape_logs` Tables (RLS: DISABLED)

- No RLS policies
- Not sensitive data (scraped prices, audit logs)
- Can be revisited later if needed

---

## Impact on Existing Code

### ✅ No Changes Required

**Agent Portal** (`app/agent/page.tsx`):
- Existing `SELECT * FROM leads` query works unchanged
- RLS silently filters results to agent's leads
- No code modifications needed

**Form Submission** (`/api/submit-lead`):
- Uses `createAdminClient()` (service role key)
- Service role bypasses RLS
- Inserts continue to work exactly as before

**Bulk Upload** (`/api/admin/bulk-upload`):
- Uses `createAdminClient()` (service role key)
- CSV inserts are unaffected

**Shared Lists** (`/api/lists`):
- SELECT by slug works for guests
- INSERT/UPDATE/DELETE by API only

### ⚠️ Behavioral Changes (Transparent)

**Before RLS:**
```sql
SELECT * FROM leads
→ Returns ALL leads (every lead visible to any authenticated user)
```

**After RLS:**
```sql
SELECT * FROM leads
→ RLS automatically filters: only leads where agent_id = logged-in user's email
→ Same result for single-agent setup (Don only sees Don's leads)
```

**For multi-agent setup (future):**
- Agent A logs in → sees only Agent A's leads
- Agent B logs in → sees only Agent B's leads
- Automatic without code changes

---

## Deployment Instructions

### Step 1: Apply Migration (5 minutes)

1. Log into Supabase Dashboard: https://app.supabase.com/project/thmklqucaqohzjqmpnqe/sql/new
2. Open a new SQL query
3. Copy entire contents of `supabase/migrations/20260728_enable_rls.sql`
4. Click "Run"
5. Verify: no errors in output

### Step 2: Verify (5 minutes)

Follow the checklist in `docs/RLS_VERIFICATION.md`:
1. Check RLS is enabled: `SELECT tablename FROM pg_tables WHERE rowsecurity = true;`
2. Check policies exist: `SELECT * FROM pg_policies WHERE tablename IN ('leads', 'saved_lists');`
3. Test agent portal (login, view leads)
4. Test form submission (should still work)
5. Test shared list (open link in incognito)

### Step 3: Commit & Deploy (5 minutes)

```bash
git add supabase/migrations/20260728_enable_rls.sql
git add docs/RLS_*.md
git commit -m "security: enable RLS on leads and saved_lists tables"
git push origin main
vercel deploy --prod
```

**Total Time:** ~15 minutes

---

## Rollback Plan (Emergency)

If RLS causes issues in production:

**Step 1: Disable RLS** (in Supabase SQL editor)
```sql
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_lists DISABLE ROW LEVEL SECURITY;
```

**Step 2: Verify application works**
- Check agent portal loads
- Check form submission works
- Check shared lists work

**Step 3: Investigate root cause**
- Check browser console for errors
- Check server logs (`/api/submit-lead`, etc.)
- Compare JWT email vs. lead's agent_id

**Step 4: Re-enable RLS with fixes**
- Identify the issue (policy too restrictive, JWT misconfiguration, etc.)
- Update migration file
- Re-run migration

---

## Security Improvements

### Before RLS
- ❌ Any authenticated user could read all leads (via anon key)
- ❌ Any authenticated user could modify any lead
- ✅ Service role (API) restricted by code logic only

### After RLS
- ✅ Only agents owning a lead can read it (database enforced)
- ✅ Only agents owning a lead can modify it (database enforced)
- ✅ Service role (API) still restricted by code + RLS bypass
- ✅ Shared lists intentionally public (policy allows it)
- ✅ No way for non-authenticated users to access leads

### Risk Reduction

| Risk | Before RLS | After RLS |
|------|-----------|----------|
| Unauthorized lead access | 🔴 High | 🟢 None |
| Lead modification by others | 🔴 High | 🟢 None |
| Data leakage via anon key | 🔴 High | 🟢 None |
| Service role bypass | 🟡 Code only | 🟡 Code + RLS bypass (intentional) |

---

## Future Enhancements

### Phase 2: Multi-Agent Support
- Remove hardcoded `agent_id` from API routes
- Allow form to capture which agent lead came from
- RLS automatically enforces per-agent visibility (no code changes needed)

### Phase 3: Role-Based Access (RBAC)
- Add "admin" role → can see all leads
- Add "manager" role → can see team leads
- Extend RLS policies for each role

### Phase 4: Audit Logging
- Create `lead_audit_log` table with RLS
- Trigger on every lead change
- Log user, timestamp, old/new values
- Admins can review change history

---

## Frequently Asked Questions

### Q: Will this break the agent portal?
**A:** No. The portal's existing query (`SELECT * FROM leads`) will work exactly the same. RLS filtering is transparent — the agent will just see only their own leads instead of all leads. For a single-agent setup (current state), the result is identical.

### Q: What about form submissions?
**A:** Completely unaffected. The `/api/submit-lead` route uses the service role key, which bypasses RLS. New leads will still be created and appear in the agent portal.

### Q: Can I test this locally?
**A:** Yes. The RLS policies apply to Supabase projects. For local development, you can either:
1. Test against a Supabase dev/staging project
2. Run Supabase locally via Docker (advanced)

### Q: How do I verify the policies are working?
**A:** Follow the 10-point verification checklist in `docs/RLS_VERIFICATION.md`. Tests include database queries and UI checks.

### Q: What if an agent's email is wrong in the database?
**A:** If a lead has `agent_id = 'jane@example.com'` but the agent logs in as `don@example.com`, the RLS policy will hide that lead from Don. Fix: `UPDATE leads SET agent_id = 'don@example.com' WHERE id = X;`

### Q: Can I undo this if I change my mind?
**A:** Yes. Run the rollback SQL in the troubleshooting section of `docs/RLS_VERIFICATION.md`. The agent portal will work again (less secure, but no errors).

---

## Support & Resources

- **RLS Setup Guide:** `docs/RLS_SETUP.md`
- **Verification Checklist:** `docs/RLS_VERIFICATION.md`
- **Technical Deep Dive:** `docs/RLS_TECHNICAL_REFERENCE.md`
- **Migration SQL:** `supabase/migrations/20260728_enable_rls.sql`

---

## Sign-Off

✅ RLS implementation is complete and ready for deployment.

**Files Created:**
1. `supabase/migrations/20260728_enable_rls.sql` — SQL to apply RLS
2. `docs/RLS_SETUP.md` — Full setup guide (343 lines)
3. `docs/RLS_VERIFICATION.md` — Verification checklist (355 lines)
4. `docs/RLS_TECHNICAL_REFERENCE.md` — Technical details (562 lines)
5. `docs/RLS_SUMMARY.md` — This document

**No Code Changes Required** — Agent portal and API routes work unchanged.

**To Deploy:** Run the migration SQL, verify with the checklist, and commit the documentation.
