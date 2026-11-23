-- Owner-only, read-only view of teammates' CRM leads (Don sees Seb's pipeline on his own login).
-- Existing RLS on leads is untouched: agents still only see their own rows directly.
create or replace function public.team_crm_leads()
returns table (
  id bigint, created_at timestamptz, name text, phone text, stage text,
  agent_id text, source text, building_name text,
  next_action text, next_action_date date,
  spoke_with timestamptz, first_tour date, notes_updated_at timestamptz,
  quick_note text, engagement_status text, closed_at timestamptz,
  commission_estimate numeric, commission_actual numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.created_at, l.name, l.phone, l.stage, lower(l.agent_id), l.source, l.building_name,
         l.next_action, l.next_action_date, l.spoke_with, l.first_tour, l.notes_updated_at,
         l.quick_note, l.engagement_status, l.closed_at, l.commission_estimate, l.commission_actual
  from public.leads l
  where lower(coalesce(auth.jwt() ->> 'email', '')) = 'doguhankar1@gmail.com'
    and lower(l.agent_id) <> 'doguhankar1@gmail.com';
$$;
revoke all on function public.team_crm_leads() from public, anon;
grant execute on function public.team_crm_leads() to authenticated;
