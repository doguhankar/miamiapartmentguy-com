-- RECONCILIATION: this migration was applied directly to production on 2026-11-16
-- (version 20261116173508) through the Supabase MCP, before it existed in the repo.
-- It is committed here, unchanged, so repo history matches production.
-- Do not re-run against production; it is a no-op target there. Safe on a fresh database.

create or replace function public.normalize_phone(p text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p is null then null
    else (
      select case
        when length(d) = 11 and left(d,1) = '1' then right(d,10)
        else d
      end
      from (select regexp_replace(p, '\D', '', 'g') as d) s
    )
  end
$$;

create table public.inbox_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id text not null default (auth.jwt() ->> 'email'),
  lead_id bigint references public.leads(id) on delete set null,
  channel text not null check (channel in ('imessage','sms','instagram','messenger','facebook_marketplace','tiktok','email','other')),
  contact_name text,
  contact_phone text,
  contact_phone_norm text generated always as (public.normalize_phone(contact_phone)) stored,
  contact_handle text,
  external_thread_id text,
  status text not null default 'open' check (status in ('open','snoozed','closed')),
  unread_count integer not null default 0,
  last_message_at timestamptz,
  last_message_preview text,
  last_inbound_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index inbox_conversations_thread_uniq
  on public.inbox_conversations (agent_id, channel, external_thread_id)
  where external_thread_id is not null;
create index inbox_conversations_agent_recent
  on public.inbox_conversations (agent_id, last_message_at desc nulls last);
create index inbox_conversations_lead on public.inbox_conversations (lead_id);
create index inbox_conversations_phone on public.inbox_conversations (contact_phone_norm);

create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  agent_id text not null default (auth.jwt() ->> 'email'),
  direction text not null check (direction in ('inbound','outbound')),
  body text,
  sender_name text,
  external_message_id text,
  delivery_status text,
  is_automated boolean not null default false,
  sent_at timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now()
);

create unique index inbox_messages_external_uniq
  on public.inbox_messages (conversation_id, external_message_id)
  where external_message_id is not null;
create index inbox_messages_convo_time on public.inbox_messages (conversation_id, sent_at);

create or replace function public.inbox_messages_after_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.inbox_conversations c
  set last_message_at = new.sent_at,
      last_message_preview = left(coalesce(new.body, ''), 140),
      last_inbound_at = case when new.direction = 'inbound' then new.sent_at else c.last_inbound_at end,
      unread_count = case when new.direction = 'inbound' then c.unread_count + 1 else c.unread_count end,
      updated_at = now()
  where c.id = new.conversation_id
    and (c.last_message_at is null or new.sent_at >= c.last_message_at);
  return new;
end;
$$;

create trigger inbox_messages_after_insert
after insert on public.inbox_messages
for each row execute function public.inbox_messages_after_insert();

alter table public.inbox_conversations enable row level security;
alter table public.inbox_messages enable row level security;

create policy inbox_conversations_select_own on public.inbox_conversations
  for select to authenticated using (agent_id = (auth.jwt() ->> 'email'));
create policy inbox_conversations_insert_own on public.inbox_conversations
  for insert to authenticated with check (agent_id = (auth.jwt() ->> 'email'));
create policy inbox_conversations_update_own on public.inbox_conversations
  for update to authenticated
  using (agent_id = (auth.jwt() ->> 'email'))
  with check (agent_id = (auth.jwt() ->> 'email'));

create policy inbox_messages_select_own on public.inbox_messages
  for select to authenticated using (agent_id = (auth.jwt() ->> 'email'));
create policy inbox_messages_insert_own on public.inbox_messages
  for insert to authenticated with check (
    agent_id = (auth.jwt() ->> 'email')
    and exists (select 1 from public.inbox_conversations c
                where c.id = conversation_id and c.agent_id = (auth.jwt() ->> 'email'))
  );

alter publication supabase_realtime add table public.inbox_conversations;
alter publication supabase_realtime add table public.inbox_messages;
