-- Social inbox v2: connected social accounts, identities, notes, follow-ups,
-- explicit team roles, and tightened RLS.
--
-- STATUS: written locally, tested against a scratch Postgres (tests/inbox/db/run.sh).
-- NOT applied to production. Applies on top of the two reconciled migrations
-- 20261116173508 / 20261116173559 that already exist in production.
--
-- Security model (see docs/inbox/PERMISSIONS.md):
--   * Every policy requires public.is_approved_agent() (current approval).
--   * Agents see conversations on accounts they own, or assigned to them.
--   * Team-wide visibility needs an explicit, revocable row in inbox_team_roles.
--   * Reassigning / sending to clients are SEPARATE flags, default false.
--   * Credentials, webhook ledger and role grants are service-role only.
--   * Messages are written only by the server (inbox_ingest); there is no
--     client insert path, so nothing can be sent or faked from the browser.

-- ───────────────────────── helpers ─────────────────────────

create or replace function public.inbox_me()
returns text language sql stable set search_path = ''
as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.inbox_email_is_approved(p_email text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.agent_allowlist a
    where lower(a.email) = lower(coalesce(p_email, '')) and a.approved = true
  )
$$;

-- ───────────────────────── team roles ─────────────────────────

create table if not exists public.inbox_team_roles (
  email text primary key,
  role text not null check (role in ('team_lead', 'admin')),
  can_view_team boolean not null default true,
  can_reassign boolean not null default false,
  can_send_client_messages boolean not null default false,
  granted_by text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  note text
);
alter table public.inbox_team_roles enable row level security;

drop policy if exists inbox_team_roles_select_self on public.inbox_team_roles;
create policy inbox_team_roles_select_self on public.inbox_team_roles
  for select to authenticated using (lower(email) = public.inbox_me());

create or replace function public.inbox_has_grant(p_cap text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select public.is_approved_agent() and exists (
    select 1 from public.inbox_team_roles r
    where lower(r.email) = public.inbox_me()
      and r.revoked_at is null
      and case p_cap
            when 'view_team' then r.can_view_team
            when 'reassign'  then r.can_reassign
            when 'send'      then r.can_send_client_messages
            else false
          end
  )
$$;

-- ───────────────────────── connected accounts ─────────────────────────

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('instagram', 'tiktok', 'manychat')),
  owner_email text not null,
  label text not null,
  external_account_id text,
  handle text,
  status text not null default 'not_connected'
    check (status in ('not_connected', 'pending_approval', 'connected', 'needs_reconnect', 'error')),
  -- verified capabilities only: receive_messages, outbound_events, read_history,
  -- send_replies, webhooks, lead_sync, conversation_link
  capabilities jsonb not null default '{}'::jsonb,
  granted_scopes text[] not null default '{}',
  last_sync_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists social_accounts_provider_ext
  on public.social_accounts (provider, external_account_id) where external_account_id is not null;
alter table public.social_accounts enable row level security;

drop policy if exists social_accounts_select on public.social_accounts;
create policy social_accounts_select on public.social_accounts
  for select to authenticated using (
    public.is_approved_agent()
    and (lower(owner_email) = public.inbox_me() or public.inbox_has_grant('view_team'))
  );

-- tokens live here, encrypted by the app (AES-256-GCM). No policies: service role only.
create table if not exists public.social_account_credentials (
  account_id uuid primary key references public.social_accounts(id) on delete cascade,
  access_token_enc text,
  refresh_token_enc text,
  webhook_secret_enc text,
  token_expires_at timestamptz,
  key_version integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.social_account_credentials enable row level security;
revoke all on public.social_account_credentials from anon, authenticated;

-- webhook ledger: dedupe key per account
create table if not exists public.inbox_events (
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  event_id text not null,
  received_at timestamptz not null default now(),
  primary key (account_id, event_id)
);
alter table public.inbox_events enable row level security;
revoke all on public.inbox_events from anon, authenticated;

-- social identity is separate from the CRM lead: an inquiry is not a qualified lead
create table if not exists public.social_identities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.social_accounts(id) on delete cascade,
  provider text not null,
  external_user_id text not null,
  handle text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, external_user_id)
);
alter table public.social_identities enable row level security;

drop policy if exists social_identities_select on public.social_identities;
create policy social_identities_select on public.social_identities
  for select to authenticated using (
    exists (select 1 from public.social_accounts a where a.id = social_identities.account_id)
  );

-- ───────────────────────── conversation columns ─────────────────────────

alter table public.inbox_conversations
  add column if not exists account_id uuid references public.social_accounts(id) on delete set null,
  add column if not exists identity_id uuid references public.social_identities(id) on delete set null,
  add column if not exists assigned_to text,
  add column if not exists next_action text,
  add column if not exists follow_up_at timestamptz,
  add column if not exists conversation_url text,
  add column if not exists resolved_at timestamptz,
  add column if not exists reply_status text not null default 'unavailable';

alter table public.inbox_conversations drop constraint if exists inbox_conversations_reply_status_check;
alter table public.inbox_conversations
  add constraint inbox_conversations_reply_status_check
  check (reply_status in ('waiting_us', 'waiting_client', 'unavailable'));

create unique index if not exists inbox_conversations_account_thread_uniq
  on public.inbox_conversations (account_id, external_thread_id)
  where account_id is not null and external_thread_id is not null;
create index if not exists inbox_conversations_assigned on public.inbox_conversations (lower(assigned_to));
create index if not exists inbox_conversations_followup on public.inbox_conversations (follow_up_at) where follow_up_at is not null;

-- internal notes: a separate table so they can never be mistaken for client messages
create table if not exists public.inbox_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.inbox_conversations(id) on delete cascade,
  author_email text not null default lower(coalesce(auth.jwt() ->> 'email', '')),
  body text not null check (length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists inbox_notes_convo on public.inbox_notes (conversation_id, created_at);
alter table public.inbox_notes enable row level security;

-- ───────────────────────── RLS (replaces the v1 own-agent policies) ─────────────────────────

drop policy if exists inbox_conversations_select_own on public.inbox_conversations;
drop policy if exists inbox_conversations_insert_own on public.inbox_conversations;
drop policy if exists inbox_conversations_update_own on public.inbox_conversations;
drop policy if exists inbox_conversations_select on public.inbox_conversations;
drop policy if exists inbox_conversations_update on public.inbox_conversations;

create policy inbox_conversations_select on public.inbox_conversations
  for select to authenticated using (
    public.is_approved_agent()
    and (
      lower(agent_id) = public.inbox_me()
      or lower(coalesce(assigned_to, '')) = public.inbox_me()
      or public.inbox_has_grant('view_team')
    )
  );

create policy inbox_conversations_update on public.inbox_conversations
  for update to authenticated
  using (
    public.is_approved_agent()
    and (
      lower(agent_id) = public.inbox_me()
      or lower(coalesce(assigned_to, '')) = public.inbox_me()
      or public.inbox_has_grant('view_team')
    )
  )
  with check (
    public.is_approved_agent()
    and (
      lower(agent_id) = public.inbox_me()
      or lower(coalesce(assigned_to, '')) = public.inbox_me()
      or public.inbox_has_grant('view_team')
    )
  );
-- no INSERT policy: only the server (inbox_ingest / service role) creates conversations

drop policy if exists inbox_messages_select_own on public.inbox_messages;
drop policy if exists inbox_messages_insert_own on public.inbox_messages;
drop policy if exists inbox_messages_select on public.inbox_messages;

create policy inbox_messages_select on public.inbox_messages
  for select to authenticated using (
    exists (select 1 from public.inbox_conversations c where c.id = inbox_messages.conversation_id)
  );
-- no INSERT policy: clients cannot write or send messages from the browser

drop policy if exists inbox_notes_select on public.inbox_notes;
drop policy if exists inbox_notes_insert on public.inbox_notes;
create policy inbox_notes_select on public.inbox_notes
  for select to authenticated using (
    exists (select 1 from public.inbox_conversations c where c.id = inbox_notes.conversation_id)
  );
create policy inbox_notes_insert on public.inbox_notes
  for insert to authenticated with check (
    public.is_approved_agent()
    and lower(author_email) = public.inbox_me()
    and exists (select 1 from public.inbox_conversations c where c.id = inbox_notes.conversation_id)
  );
-- notes are append-only: no UPDATE / DELETE policy

-- ───────────────────────── guard: what a signed-in user may change ─────────────────────────

create or replace function public.inbox_conversations_guard()
returns trigger language plpgsql set search_path = ''
as $$
declare me text := public.inbox_me();
begin
  -- server-side (service role / migrations) is not restricted here
  if current_user not in ('authenticated', 'anon') then
    return new;
  end if;

  if new.agent_id is distinct from old.agent_id
     or new.account_id is distinct from old.account_id
     or new.identity_id is distinct from old.identity_id
     or new.channel is distinct from old.channel
     or new.external_thread_id is distinct from old.external_thread_id
     or new.reply_status is distinct from old.reply_status
     or new.last_message_at is distinct from old.last_message_at
     or new.last_message_preview is distinct from old.last_message_preview
     or new.last_inbound_at is distinct from old.last_inbound_at
     or new.contact_name is distinct from old.contact_name
     or new.contact_handle is distinct from old.contact_handle
     or new.contact_phone is distinct from old.contact_phone
     or new.conversation_url is distinct from old.conversation_url
     or new.created_at is distinct from old.created_at then
    raise exception 'inbox: field is managed by the server' using errcode = '42501';
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    if new.assigned_to is not null and not public.inbox_email_is_approved(new.assigned_to) then
      raise exception 'inbox: assignee is not an approved agent' using errcode = '42501';
    end if;
    if public.inbox_has_grant('reassign') then
      null; -- explicit reassignment grant
    elsif old.assigned_to is null and lower(coalesce(new.assigned_to, '')) = me then
      null; -- claim an unassigned conversation
    elsif lower(coalesce(old.assigned_to, '')) = me and new.assigned_to is null then
      null; -- release your own assignment
    else
      raise exception 'inbox: not allowed to reassign this conversation' using errcode = '42501';
    end if;
  end if;

  if new.lead_id is distinct from old.lead_id and new.lead_id is not null then
    -- runs as the caller, so the leads RLS decides whether they may link this lead
    if not exists (select 1 from public.leads l where l.id = new.lead_id) then
      raise exception 'inbox: lead not found or not yours' using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    new.resolved_at := case when new.status = 'closed' then now() else null end;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inbox_conversations_guard on public.inbox_conversations;
create trigger inbox_conversations_guard
before update on public.inbox_conversations
for each row execute function public.inbox_conversations_guard();

-- ───────────────────────── message trigger: honest reply status ─────────────────────────
-- reply_status is computed ONLY when the account's integration supplies both
-- inbound and outbound events. Otherwise it stays 'unavailable'.

create or replace function public.inbox_messages_after_insert()
returns trigger language plpgsql set search_path = ''
as $$
declare
  caps jsonb;
  latest_dir text;
  rs text := 'unavailable';
begin
  select a.capabilities into caps
  from public.inbox_conversations c
  join public.social_accounts a on a.id = c.account_id
  where c.id = new.conversation_id;

  if caps is not null
     and coalesce((caps ->> 'receive_messages')::boolean, false)
     and coalesce((caps ->> 'outbound_events')::boolean, false) then
    select m.direction into latest_dir
    from public.inbox_messages m
    where m.conversation_id = new.conversation_id
    order by m.sent_at desc, m.created_at desc, m.id desc
    limit 1;
    rs := case latest_dir
            when 'inbound' then 'waiting_us'
            when 'outbound' then 'waiting_client'
            else 'unavailable'
          end;
  end if;

  -- out-of-order safe: summary fields only move forward in time
  update public.inbox_conversations c
  set last_message_at = new.sent_at,
      last_message_preview = left(coalesce(new.body, ''), 140),
      last_inbound_at = case when new.direction = 'inbound' then new.sent_at else c.last_inbound_at end,
      status = case when new.direction = 'inbound' and c.status = 'closed' then 'open' else c.status end,
      resolved_at = case when new.direction = 'inbound' and c.status = 'closed' then null else c.resolved_at end
  where c.id = new.conversation_id
    and (c.last_message_at is null or new.sent_at >= c.last_message_at);

  update public.inbox_conversations c
  set unread_count = case when new.direction = 'inbound' then c.unread_count + 1 else c.unread_count end,
      reply_status = rs,
      updated_at = now()
  where c.id = new.conversation_id;

  return new;
end;
$$;

-- ───────────────────────── server-side ingestion (atomic, idempotent) ─────────────────────────

create or replace function public.inbox_ingest(
  p_account_id uuid,
  p_event_id text,
  p_external_thread_id text,
  p_external_user_id text,
  p_user_handle text,
  p_user_name text,
  p_direction text,
  p_body text,
  p_external_message_id text,
  p_sent_at timestamptz,
  p_conversation_url text default null,
  p_raw jsonb default '{}'::jsonb
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  acc public.social_accounts%rowtype;
  ident uuid;
  conv uuid;
  ins integer;
  chan text;
begin
  if p_direction not in ('inbound', 'outbound') then
    raise exception 'inbox_ingest: bad direction';
  end if;
  if p_external_message_id is null or p_event_id is null then
    raise exception 'inbox_ingest: event id and message id are required for dedupe';
  end if;

  select * into acc from public.social_accounts where id = p_account_id;
  if not found then
    return jsonb_build_object('status', 'unknown_account');
  end if;
  if acc.status = 'not_connected' then
    return jsonb_build_object('status', 'account_not_connected');
  end if;

  insert into public.inbox_events (account_id, event_id) values (p_account_id, p_event_id)
  on conflict do nothing;
  get diagnostics ins = row_count;
  if ins = 0 then
    return jsonb_build_object('status', 'duplicate');
  end if;

  chan := case acc.provider when 'instagram' then 'instagram' when 'tiktok' then 'tiktok' else 'other' end;

  insert into public.social_identities (account_id, provider, external_user_id, handle, display_name)
  values (p_account_id, acc.provider, p_external_user_id, p_user_handle, p_user_name)
  on conflict (account_id, external_user_id) do update
    set handle = coalesce(excluded.handle, public.social_identities.handle),
        display_name = coalesce(excluded.display_name, public.social_identities.display_name),
        updated_at = now()
  returning id into ident;

  insert into public.inbox_conversations
    (agent_id, channel, account_id, identity_id, external_thread_id,
     contact_name, contact_handle, conversation_url)
  values
    (lower(acc.owner_email), chan, p_account_id, ident, p_external_thread_id,
     coalesce(p_user_name, p_user_handle), p_user_handle, p_conversation_url)
  on conflict (account_id, external_thread_id) where account_id is not null and external_thread_id is not null
  do update set
    contact_name = coalesce(excluded.contact_name, public.inbox_conversations.contact_name),
    contact_handle = coalesce(excluded.contact_handle, public.inbox_conversations.contact_handle),
    identity_id = coalesce(public.inbox_conversations.identity_id, excluded.identity_id),
    conversation_url = coalesce(excluded.conversation_url, public.inbox_conversations.conversation_url)
  returning id into conv;

  insert into public.inbox_messages
    (conversation_id, agent_id, direction, body, sender_name, external_message_id, sent_at, raw)
  values
    (conv, lower(acc.owner_email), p_direction, p_body,
     case when p_direction = 'inbound' then coalesce(p_user_name, p_user_handle) else null end,
     p_external_message_id, coalesce(p_sent_at, now()), p_raw)
  on conflict (conversation_id, external_message_id) where external_message_id is not null
  do nothing;

  update public.social_accounts
  set last_sync_at = now(), last_success_at = now(),
      last_error = null, last_error_at = null, updated_at = now()
  where id = p_account_id;

  return jsonb_build_object('status', 'ok', 'conversation_id', conv);
end;
$$;

-- contact/lead-data sync with NO message (Manychat interim mode, conversation links)
create or replace function public.inbox_upsert_contact(
  p_account_id uuid,
  p_external_thread_id text,
  p_external_user_id text,
  p_user_handle text,
  p_user_name text,
  p_conversation_url text default null
) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  acc public.social_accounts%rowtype;
  ident uuid;
  conv uuid;
  chan text;
begin
  select * into acc from public.social_accounts where id = p_account_id;
  if not found then return jsonb_build_object('status', 'unknown_account'); end if;
  if acc.status = 'not_connected' then return jsonb_build_object('status', 'account_not_connected'); end if;

  chan := case acc.provider when 'instagram' then 'instagram' when 'tiktok' then 'tiktok' else 'other' end;

  insert into public.social_identities (account_id, provider, external_user_id, handle, display_name)
  values (p_account_id, acc.provider, p_external_user_id, p_user_handle, p_user_name)
  on conflict (account_id, external_user_id) do update
    set handle = coalesce(excluded.handle, public.social_identities.handle),
        display_name = coalesce(excluded.display_name, public.social_identities.display_name),
        updated_at = now()
  returning id into ident;

  insert into public.inbox_conversations
    (agent_id, channel, account_id, identity_id, external_thread_id,
     contact_name, contact_handle, conversation_url)
  values
    (lower(acc.owner_email), chan, p_account_id, ident, p_external_thread_id,
     coalesce(p_user_name, p_user_handle), p_user_handle, p_conversation_url)
  on conflict (account_id, external_thread_id) where account_id is not null and external_thread_id is not null
  do update set
    contact_name = coalesce(excluded.contact_name, public.inbox_conversations.contact_name),
    contact_handle = coalesce(excluded.contact_handle, public.inbox_conversations.contact_handle),
    conversation_url = coalesce(excluded.conversation_url, public.inbox_conversations.conversation_url)
  returning id into conv;

  update public.social_accounts
  set last_sync_at = now(), last_success_at = now(), last_error = null, last_error_at = null, updated_at = now()
  where id = p_account_id;

  return jsonb_build_object('status', 'ok', 'conversation_id', conv);
end;
$$;

revoke all on function public.inbox_ingest(uuid, text, text, text, text, text, text, text, text, timestamptz, text, jsonb) from public, anon, authenticated;
grant execute on function public.inbox_ingest(uuid, text, text, text, text, text, text, text, text, timestamptz, text, jsonb) to service_role;
revoke all on function public.inbox_upsert_contact(uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.inbox_upsert_contact(uuid, text, text, text, text, text) to service_role;
revoke all on function public.inbox_has_grant(text) from public, anon;
revoke all on function public.inbox_email_is_approved(text) from public, anon;
revoke all on function public.inbox_me() from public, anon;
-- policies call these as the signed-in user, so authenticated needs EXECUTE explicitly
grant execute on function public.inbox_has_grant(text) to authenticated, service_role;
grant execute on function public.inbox_email_is_approved(text) to authenticated, service_role;
grant execute on function public.inbox_me() to authenticated, service_role;

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.inbox_notes;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
