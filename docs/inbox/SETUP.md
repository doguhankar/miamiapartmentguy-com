# Social inbox: setup, capability matrix, release plan

Status: built and tested locally on `feat/social-inbox`. NOT pushed, deployed, connected to real accounts, or applied to production.

## What exists
- `/agent/inbox`: 4-pane dashboard (account filter, views, list, conversation, details). Mobile = stacked tabs. Add `?demo=1` for a labeled synthetic-data demo (never touches the DB).
- `/agent/inbox/connections`: state, observed capabilities, last sync, errors, reconnect, capability matrix.
- Routes under `/api/inbox/*`: Instagram webhook (verified), TikTok (501, disabled), Instagram OAuth start/callback, lead link/create.
- Migration `20261117000000_social_inbox_v2.sql` (+ two reconciliation copies of what already runs in prod).
- Honesty rules: "waiting" views only when inbound AND outbound events were both observed; otherwise "reply status unavailable". No read/delivery receipts, no invented history. TikTok without approval is shown as waiting on approval, never as message sync.

## Capability matrix (official docs checked 2026-11-16; full detail on the Connections screen)
| | Instagram (Login API) | TikTok Business Messaging |
|---|---|---|
| Receive messages | Supported (webhook) | Unverified, approval-gated |
| See our own sent messages | Supported (echo events; only trusted once observed) | Unverified |
| Past history | Unverified, not built | Documented, unverified |
| Reply from MAG | Documented, not built | Documented, not built |
| Lead data | Supported | n/a |
| Conversation link | Not available | Not available |
| Both of Don's + Seb's accounts | Yes (professional accounts, each owner authorizes) | Unconfirmed: needs TikTok approval; Business Accounts only; not EEA/CH/UK |
TikTok portal pages render client-side, so scheme/payload details could not be fully confirmed; the webhook is disabled rather than guessed.

## Credentials / approvals needed (nothing below has been requested or created)
**Instagram (Don and Sebastian)**
- Each IG account must be Business or Creator.
- Meta developer app with the Instagram product; Don and Seb added as app roles (Standard Access is enough for accounts you own).
- Env: `IG_APP_ID`, `IG_APP_SECRET`, `IG_VERIFY_TOKEN` (you choose), `INBOX_PUBLIC_ORIGIN`.
- Meta app dashboard: webhook callback `https://<domain>/api/inbox/webhooks/instagram`, verify token, fields `messages`, `messaging_seen`; OAuth redirect `https://<domain>/api/inbox/connect/instagram/callback`.
**Shared**: `INBOX_CRED_KEY` (32 random bytes, base64) and `INBOX_STATE_SECRET` (random string), set in Vercel env only.
**TikTok**: TikTok developer app + approval for the Business Messaging API; both accounts must be eligible Business Accounts. Until approved, slots show "Waiting on platform approval".
**Sebastian**: no access beyond an ordinary agent until Don runs `grant-team-lead.example.sql`. Reassign and send are separate opt-ins.

## Tests
- `pnpm test`: 60 unit/route tests (crypto, signatures, adapters, authz matrix incl. revoked access, reconnect, dedupe, webhook routes, lead routes, dashboard views).
- `pnpm test:inbox-db`: runs migrations twice on a throwaway Postgres and ~60 RLS/trigger/dedupe/out-of-order checks (cross-agent isolation, no client writes to messages, revoked approval/grant).
- Typecheck of all new files is clean. Two pre-existing TS errors exist in `app/agent/page.tsx` (also on main).
- BLOCKED here: full `next build` fails only because the sandbox cannot reach Google Fonts (`next/font` fetch in root layouts). Run `pnpm build` on a networked machine / Vercel preview before release. A live Supabase/webhook test was also impossible (sandbox proxy blocks it).

## Release plan (when Don approves)
1. Review the PR: branch `feat/social-inbox` stacks on `feat/unified-inbox` (PR #11). Merge #11 first or retarget; do not include the Gmail-invoice work (`feat/ar-invoices`), which is untouched here.
2. Production already has the v1 inbox tables applied out of band; the two reconciliation migrations are copies so history matches. Mark them applied (`supabase migration repair`) rather than re-running.
3. Apply `20261117000000_social_inbox_v2.sql` to a Supabase branch first; run advisors (check `inbox_has_grant` SECURITY DEFINER and grants); then production.
4. Set env vars in Vercel (preview first). Seed slots (`seed-accounts.example.sql`). Deploy preview; verify `/agent/inbox?demo=1`, then connect ONE account with Don present.
5. Meta webhook handshake and one test DM; confirm echo observed before trusting reply status.
6. Sebastian grant only after Don's explicit go-ahead.
Rollback: v2 only adds tables/columns/policies; revert the deploy first, DB changes are additive.

## Group-text handoff (future)
`lib/inbox/handoff.ts` defines the boundary only (types + a disabled provider). Nothing sends or provisions. Apple Business Register is not a group-chat service and is not used.
