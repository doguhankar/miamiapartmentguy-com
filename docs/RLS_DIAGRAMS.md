# RLS Visual Diagrams

This document provides visual representations of how RLS works in MAG.

---

## Diagram 1: Authentication Flow & JWT Extraction

```
┌─────────────────────────────────────────────────────────────┐
│                     User Login Flow                          │
└─────────────────────────────────────────────────────────────┘

  ┌─────────────────────────┐
  │  Google OAuth Flow      │
  │  (1) User clicks login  │
  │  (2) Redirects to Google│
  │  (3) User authenticates│
  │  (4) Returns to MAG     │
  └─────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Supabase Creates JWT Token                             │
  │                                                          │
  │  {                                                       │
  │    "sub": "12345-abc",                                  │
  │    "email": "doguhankar1@gmail.com",        ◄── EXTRACTED
  │    "email_verified": true,                             │
  │    "role": "authenticated",                            │
  │    "app_metadata": { ... },                            │
  │    "user_metadata": { "full_name": "Don" },           │
  │    "iss": "https://supabase.co",                       │
  │    "exp": 1234567890                                   │
  │  }                                                      │
  └─────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────┐
  │  RLS Policy Evaluation                                   │
  │                                                          │
  │  auth.jwt() ->> 'email' = 'doguhankar1@gmail.com'      │
  │                                                          │
  │  Used in RLS condition:                                │
  │    agent_id = auth.jwt() ->> 'email'                   │
  └─────────────────────────────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────┐
  │  Query Results                                           │
  │                                                          │
  │  Only rows where agent_id = 'doguhankar1@gmail.com'    │
  │  are returned to the client                             │
  └─────────────────────────────────────────────────────────┘
```

---

## Diagram 2: How RLS Filters Agent Portal Queries

```
┌─────────────────────────────────────────────────────────────┐
│     Agent Portal: Fetch Leads (app/agent/page.tsx)         │
└─────────────────────────────────────────────────────────────┘

BEFORE RLS (No filtering):
  
  App sends:
  ┌────────────────────────────────────────┐
  │ SELECT * FROM leads                    │
  │ ORDER BY created_at DESC               │
  └────────────────────────────────────────┘
           │
           ▼
  Database returns:
  ┌────────────────────────────────────────────────────────────┐
  │ id | name    | agent_id              | ...                │
  │ 1  | John    | doguhankar1@gmail.com |                    │
  │ 2  | Jane    | jane.agent@gmail.com  |  ◄── PROBLEM:      │
  │ 3  | Bob     | doguhankar1@gmail.com |     Sees all leads │
  │ 4  | Alice   | jane.agent@gmail.com  |                    │
  └────────────────────────────────────────────────────────────┘
           │
           ▼
  Agent sees: Leads from multiple agents ❌ SECURITY RISK


AFTER RLS (With filtering):
  
  App sends:
  ┌────────────────────────────────────────┐
  │ SELECT * FROM leads                    │
  │ ORDER BY created_at DESC               │
  └────────────────────────────────────────┘
           │
           ▼
  RLS Policy intercepts:
  ┌───────────────────────────────────────────────────────────┐
  │ Check: auth.role() = 'authenticated'? YES                │
  │ Check: agent_id = auth.jwt() ->> 'email'?               │
  │ Email extracted: 'doguhankar1@gmail.com'                 │
  └───────────────────────────────────────────────────────────┘
           │
           ▼
  Query transformed to:
  ┌────────────────────────────────────────────────────────────┐
  │ SELECT * FROM leads                                       │
  │ WHERE agent_id = 'doguhankar1@gmail.com'  ◄── Added by RLS│
  │ ORDER BY created_at DESC                                  │
  └────────────────────────────────────────────────────────────┘
           │
           ▼
  Database returns:
  ┌────────────────────────────────────────────────────────────┐
  │ id | name | agent_id              | ...                   │
  │ 1  | John | doguhankar1@gmail.com |                      │
  │ 3  | Bob  | doguhankar1@gmail.com |  ◄── Only Don's leads │
  └────────────────────────────────────────────────────────────┘
           │
           ▼
  Agent sees: Only their own leads ✅ SECURE
```

---

## Diagram 3: Service Role Bypass (API Routes)

```
┌─────────────────────────────────────────────────────────────┐
│             Form Submission Flow (/api/submit-lead)         │
└─────────────────────────────────────────────────────────────┘

User fills form and clicks "Send to Don 🚀"
           │
           ▼
┌──────────────────────────────────────────────┐
│ POST /api/submit-lead                        │
│ {                                            │
│   moveDate: "August 2026",                  │
│   apartmentSize: "2BR",                     │
│   budget: "$3000-3500",                     │
│   ...                                        │
│ }                                            │
└──────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│ API Route reads SUPABASE_SERVICE_ROLE_KEY                  │
│                                                            │
│ const supabase = createAdminClient()                       │
│   ↓                                                         │
│ Uses service_role key (not anon key)                       │
│   ↓                                                         │
│ Auth context: auth.role() = 'service_role'               │
└────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│ RLS Policy Evaluation                                      │
│                                                            │
│ Policy condition:                                          │
│   auth.role() = 'authenticated' AND                        │
│   agent_id = auth.jwt() ->> 'email'                        │
│                                                            │
│ Check: auth.role() = 'authenticated'?                      │
│        NO ← auth.role() = 'service_role'                  │
│   ↓                                                         │
│ Policy condition is FALSE                                  │
│   ↓                                                         │
│ RLS is BYPASSED (not because of rejection,                │
│ but because service_role escapes RLS entirely)           │
└────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│ INSERT INTO leads                                          │
│ (name, email, phone, agent_id, ...)                        │
│ VALUES (...)                                               │
│                                                            │
│ agent_id is set to: 'doguhankar1@gmail.com'              │
│ (hardcoded in API route)                                   │
└────────────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────────┐
│ INSERT succeeds ✅                                          │
│ (Service role bypasses RLS entirely)                       │
│                                                            │
│ Lead stored in database                                    │
│ Lead appears in Slack, Notion                              │
│ Lead appears in agent portal (Don sees it)                │
└────────────────────────────────────────────────────────────┘
```

---

## Diagram 4: Shared Lists - Public Read Policy

```
┌─────────────────────────────────────────────────────────────┐
│           Shared List Access (No Authentication)            │
└─────────────────────────────────────────────────────────────┘

Guest receives shared link: https://miamiapartmentguy.com/lists/abc123xyz
           │
           ▼
Guest opens link in INCOGNITO WINDOW (no auth)
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ Route: /lists/[slug]                                         │
│ Query: SELECT * FROM saved_lists WHERE slug = 'abc123xyz'  │
│                                                              │
│ Client state:                                                │
│   - No session (incognito mode)                             │
│   - auth.role() = 'anon'                                    │
│   - No JWT token                                             │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ RLS Policy Evaluation                                        │
│                                                              │
│ Policy: saved_lists_select_public                           │
│   USING (true)                                              │
│                                                              │
│ Check: Is the condition true?                               │
│        YES - the condition is literally "true"             │
│                                                              │
│ Result: Policy allows SELECT                                │
└──────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────┐
│ SELECT succeeds ✅                                            │
│                                                              │
│ Returns: {                                                   │
│   "buildings": [                                             │
│     { id: "modera-riverside", name: "Modera Riverside" },  │
│     { id: "maizon", name: "Maizon" }                        │
│   ]                                                          │
│ }                                                            │
│                                                              │
│ Guest sees: Building list in their browser                  │
│ (Even though they're not logged in)                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Diagram 5: Multi-Tenant Isolation (Future)

```
┌─────────────────────────────────────────────────────────────┐
│    Future: Multiple Agents with RLS Isolation              │
└─────────────────────────────────────────────────────────────┘

SCENARIO: Two agents both have leads

Agent A: don@miamiapartmentguy.com
Agent B: jane@miamiapartmentguy.com

Database state:
┌──────────────────────────────────────────────┐
│ id | name  | agent_id                       │
├──────────────────────────────────────────────┤
│ 1  | John  | don@miamiapartmentguy.com     │
│ 2  | Jane  | jane@miamiapartmentguy.com    │
│ 3  | Bob   | don@miamiapartmentguy.com     │
│ 4  | Alice | jane@miamiapartmentguy.com    │
└──────────────────────────────────────────────┘

─────────────────────────────────────────────────

AGENT A LOGS IN:

  Agent A email: don@miamiapartmentguy.com
           │
           ▼
  Query: SELECT * FROM leads
           │
           ▼
  RLS adds WHERE: agent_id = 'don@miamiapartmentguy.com'
           │
           ▼
  Result: Rows 1, 3 returned
           │
           ▼
  Agent A sees: John, Bob (their leads only)

─────────────────────────────────────────────────

AGENT B LOGS IN:

  Agent B email: jane@miamiapartmentguy.com
           │
           ▼
  Query: SELECT * FROM leads
           │
           ▼
  RLS adds WHERE: agent_id = 'jane@miamiapartmentguy.com'
           │
           ▼
  Result: Rows 2, 4 returned
           │
           ▼
  Agent B sees: Jane, Alice (their leads only)

─────────────────────────────────────────────────

ISOLATION RESULT:

  Agent A cannot see Jane or Alice (Agent B's leads) ✅
  Agent B cannot see John or Bob (Agent A's leads) ✅
  
  Both use the same database query
  Both get different results (automatic via RLS)
  NO APPLICATION CODE CHANGES NEEDED
```

---

## Diagram 6: Update Operation RLS Enforcement

```
┌─────────────────────────────────────────────────────────────┐
│       Lead Update: RLS Ownership Verification               │
└─────────────────────────────────────────────────────────────┘

Agent A (don@example.com) tries to edit lead #5:

App sends:
┌────────────────────────────────────────────────────────────┐
│ UPDATE leads                                               │
│ SET name = 'Updated Name'                                  │
│ WHERE id = 5                                               │
└────────────────────────────────────────────────────────────┘
           │
           ▼
RLS applies UPDATE policy:
┌────────────────────────────────────────────────────────────┐
│ USING Condition:                                           │
│   agent_id = auth.jwt() ->> 'email'                        │
│   = 'don@example.com'                                      │
│                                                            │
│ WITH CHECK Condition (also same):                          │
│   agent_id = auth.jwt() ->> 'email'                        │
│   = 'don@example.com'                                      │
└────────────────────────────────────────────────────────────┘
           │
           ▼
Query becomes:
┌────────────────────────────────────────────────────────────┐
│ UPDATE leads                                               │
│ SET name = 'Updated Name'                                  │
│ WHERE id = 5 AND agent_id = 'don@example.com'   ◄── Added │
└────────────────────────────────────────────────────────────┘
           │
           ▼
Database checks:
┌────────────────────────────────────────────────────────────┐
│ Is there a row where:                                      │
│   id = 5 AND agent_id = 'don@example.com'?               │
└────────────────────────────────────────────────────────────┘
           │
        ┌──┴──┐
        │     │
        ▼     ▼
    YES      NO
  (owns)   (doesn't own)
    │         │
    ▼         ▼
┌──────┐  ┌────────────────┐
│ PASS │  │ FAIL: 0 rows   │
│      │  │ updated        │
│ Allow│  │                │
│Update│  │ Permission     │
└──────┘  │ denied (RLS)   │
    ✅    └────────────────┘
            ❌
```

---

## Diagram 7: RLS Policy Application Order

```
┌─────────────────────────────────────────────────────────────┐
│        Query Execution with Multiple RLS Policies           │
└─────────────────────────────────────────────────────────────┘

Query: SELECT * FROM leads

┌──────────────────────────────────────────────────────────┐
│ Step 1: Database receives query                          │
│ Step 2: Check if table has RLS enabled? YES              │
│ Step 3: Does user have permissions? YES (auth)           │
│ Step 4: Apply RLS policies...                            │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│ For SELECT operation, find all SELECT policies:          │
│                                                          │
│   Policy 1: leads_select_own_leads                       │
│     USING (agent_id = auth.jwt() ->> 'email')            │
│                                                          │
│ (Only one SELECT policy exists; if multiple existed,     │
│  they'd be combined with OR)                             │
└──────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────┐
│ Step 5: Apply policy condition to query                  │
│                                                          │
│ Original: SELECT * FROM leads                            │
│           ↓                                              │
│ Modified: SELECT * FROM leads                            │
│           WHERE (agent_id = 'don@example.com')          │
│           ↓                                              │
│ Result: Only Don's leads returned                        │
└──────────────────────────────────────────────────────────┘
```

---

## Diagram 8: Security Boundaries

```
┌────────────────────────────────────────────────────────────────┐
│                    Security Boundaries                         │
└────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┐
│ BROWSER (Client-Side)               │
│                                     │
│ ✗ Anon key (read-only access)      │
│ ✗ NO service role key              │
│ ✗ No direct database access        │
└──┬──────────────────────────────────┘
   │
   │ ← BOUNDARY 1: Network/TLS
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│ API ROUTES (Trusted Server)                              │
│                                                          │
│ ✓ Service role key (full access)                         │
│ ✓ Hardcoded agent_id logic                              │
│ ✓ Access control checks                                 │
│ ✓ Validation & sanitization                             │
└──┬───────────────────────────────────────────────────────┘
   │
   │ ← BOUNDARY 2: Authentication (Service Role Key)
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE                                        │
│                                                          │
│ ✓ RLS Policies (fine-grained access)                    │
│ ✓ No one bypasses DB-level security                     │
│ ✓ Enforce auth.role() checks                            │
│ ✓ Even server can't violate policies (but can bypass)  │
└──────────────────────────────────────────────────────────┘

Legend:
  ✓ = Has access/protection
  ✗ = No access/less protection

RLS protects: Database → API Routes
Service Role protects: API Routes → Database
Network TLS protects: Browser ↔ API Routes
```

---

## Summary

These diagrams show:

1. **JWT extraction** → How RLS gets the agent's email
2. **Query filtering** → How RLS automatically filters leads
3. **Service role bypass** → Why API routes are unaffected
4. **Public policies** → Why shared lists work for guests
5. **Multi-tenant** → How RLS isolates multiple agents (future)
6. **UPDATE enforcement** → RLS checks ownership on edits
7. **Policy application** → How multiple policies combine
8. **Security boundaries** → Layers of defense
