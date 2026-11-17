# Social inbox permission model

Foundation (unchanged): a user needs a CURRENT `agent_allowlist.approved = true` row. It is re-checked on every request and in every RLS policy, so revoking approval cuts access immediately.

| Who | Sees | Can change |
|---|---|---|
| Approved agent | conversations they own or are assigned; their own accounts | notes, next action, follow-up, resolve; claim an unassigned conversation; release their own; link/create a lead in their own pipeline |
| Team lead with `can_view_team` | all conversations (read) | same as an agent, only on conversations they own/are assigned |
| + `can_reassign` | | move conversations between approved agents |
| + `can_send_client_messages` | | reserved. MAG sends nothing in this release |
| Anyone | | never: messages (server-written only), reply status, contact fields, another agent's account/credentials |

Rules:
- The building-image admin flag is NOT a team role. Team access only comes from `inbox_team_roles`.
- Sebastian has no grant by default. See `grant-team-lead.example.sql` (view-only). Reassign/send are separate, explicit opt-ins by Don.
- Team visibility does not let a lead write into another agent's CRM pipeline.
- Enforcement is layered: RLS on every inbox table, a trigger blocking server-managed fields, and equivalent checks (`lib/inbox/authz.ts`) on service-role routes. Credentials and the dedupe ledger have no client policies at all.
