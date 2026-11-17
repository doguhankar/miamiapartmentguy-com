-- RECONCILIATION: applied directly to production on 2026-11-16 (version 20261116173559).
-- Committed unchanged so repo history matches production.

create or replace function public.find_lead_by_phone(p_agent text, p_phone text)
returns table(id bigint, name text)
language sql
stable
set search_path = ''
as $$
  select l.id, l.name
  from public.leads l
  where l.agent_id = p_agent
    and public.normalize_phone(l.phone) = public.normalize_phone(p_phone)
    and public.normalize_phone(p_phone) is not null
    and length(public.normalize_phone(p_phone)) >= 7
  order by l.created_at desc
  limit 1
$$;

revoke all on function public.find_lead_by_phone(text, text) from public, anon, authenticated;
grant execute on function public.find_lead_by_phone(text, text) to service_role;
