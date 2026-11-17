-- EXAMPLE ONLY. Not applied. Sebastian gets NOTHING until Don approves and runs this himself.
-- Defaults are least-privilege: view team = yes, reassign = NO, send client messages = NO.
-- Both people must already be approved in agent_allowlist or the grant has no effect.
insert into public.inbox_team_roles (email, role, can_view_team, can_reassign, can_send_client_messages, granted_by)
values ('seb@REPLACE.me', 'team_lead', true, false, false, 'don@REPLACE.me')
on conflict (email) do update
  set role = excluded.role, can_view_team = excluded.can_view_team,
      can_reassign = excluded.can_reassign, can_send_client_messages = excluded.can_send_client_messages,
      granted_by = excluded.granted_by, revoked_at = null;

-- Turn on reassignment later, separately and deliberately:
-- update public.inbox_team_roles set can_reassign = true where email = 'seb@REPLACE.me';

-- Revoke instantly:
-- update public.inbox_team_roles set revoked_at = now() where email = 'seb@REPLACE.me';
