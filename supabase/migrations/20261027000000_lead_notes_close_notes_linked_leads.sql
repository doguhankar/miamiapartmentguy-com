-- Editable lead notes, close notes, and cross-agent duplicate lead linking.
-- leads.notes already exists (intake notes); it is reused as the editable Notes field.

alter table public.leads
  add column if not exists notes_updated_at timestamptz,
  add column if not exists close_notes text,
  add column if not exists linked_lead_group uuid;

create index if not exists leads_linked_lead_group_idx
  on public.leads (linked_lead_group)
  where linked_lead_group is not null;

-- Digits only, leading country code 1 stripped. Returns null unless the result is a 10-digit number.
create or replace function public.normalize_lead_phone(raw text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when length(d) = 11 and left(d, 1) = '1' then substr(d, 2)
    when length(d) = 10 then d
    else null
  end
  from (select regexp_replace(coalesce(raw, ''), '\D', '', 'g') as d) s
$$;

-- Links a lead to leads owned by a different agent when the normalized phone matches,
-- or when either side has no usable phone and the email matches.
create or replace function public.link_duplicate_leads(target_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t record;
  matched_ids bigint[];
  existing_groups uuid[];
  chosen uuid;
begin
  select
    l.id,
    l.agent_id,
    l.linked_lead_group,
    public.normalize_lead_phone(l.phone) as np,
    nullif(lower(btrim(coalesce(l.email, ''))), '') as ne
  into t
  from public.leads l
  where l.id = target_id;

  if not found then
    return;
  end if;

  select
    coalesce(array_agg(o.id), '{}'::bigint[]),
    coalesce(array_agg(distinct o.linked_lead_group) filter (where o.linked_lead_group is not null), '{}'::uuid[])
  into matched_ids, existing_groups
  from public.leads o
  where o.id <> t.id
    and lower(coalesce(o.agent_id, '')) <> lower(coalesce(t.agent_id, ''))
    and (
      (t.np is not null and t.np = public.normalize_lead_phone(o.phone))
      or (
        (t.np is null or public.normalize_lead_phone(o.phone) is null)
        and t.ne is not null
        and t.ne = nullif(lower(btrim(coalesce(o.email, ''))), '')
      )
    );

  if cardinality(matched_ids) = 0 then
    return;
  end if;

  chosen := coalesce(t.linked_lead_group, existing_groups[1], gen_random_uuid());

  update public.leads
  set linked_lead_group = chosen
  where id = t.id
     or id = any(matched_ids)
     or linked_lead_group = any(existing_groups || array[chosen]);
end;
$$;

create or replace function public.leads_link_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.link_duplicate_leads(new.id);
  return null;
end;
$$;

drop trigger if exists leads_link_duplicates_after_insert on public.leads;
create trigger leads_link_duplicates_after_insert
  after insert on public.leads
  for each row execute function public.leads_link_on_insert();

revoke execute on function public.link_duplicate_leads(bigint) from public, anon, authenticated;
revoke execute on function public.leads_link_on_insert() from public, anon, authenticated;

-- One-time backfill for existing leads.
do $$
declare
  r record;
begin
  for r in select id from public.leads order by id loop
    perform public.link_duplicate_leads(r.id);
  end loop;
end;
$$;
