\set ON_ERROR_STOP on
\set VERBOSITY terse

-- Fixture builder, run inside each test transaction (rolled back afterwards).
create function t.seed() returns void language plpgsql as $$
begin
  perform t.as_server();
  insert into public.agent_allowlist(email, approved) values
    ('don@mag.test', true), ('seb@mag.test', true), ('chaz@mag.test', true), ('eve@mag.test', false);
  insert into public.leads(name, phone, agent_id) values
    ('Lead Don', '(305) 555-0101', 'don@mag.test'),
    ('Lead Chaz', '(305) 555-0102', 'chaz@mag.test');
  insert into public.social_accounts(id, provider, owner_email, label, external_account_id, status, capabilities) values
    ('00000000-0000-0000-0000-00000000d001', 'instagram', 'don@mag.test',  'Don IG',  'ig_don',  'connected',
       '{"receive_messages":true,"outbound_events":true}'),
    ('00000000-0000-0000-0000-00000000e001', 'instagram', 'seb@mag.test',  'Seb IG',  'ig_seb',  'connected',
       '{"receive_messages":true,"outbound_events":false}'),
    ('00000000-0000-0000-0000-00000000c001', 'instagram', 'chaz@mag.test', 'Chaz IG', 'ig_chaz', 'connected',
       '{"receive_messages":true,"outbound_events":true}'),
    ('00000000-0000-0000-0000-00000000f001', 'tiktok',    'don@mag.test',  'Don TikTok', null, 'pending_approval', '{}');
end $$;

create function t.ingest(acc text, ev text, thread text, usr text, dir text, body text, mid text, at timestamptz)
returns jsonb language sql as $$
  select public.inbox_ingest(acc::uuid, ev, thread, usr, '@' || usr, initcap(usr), dir, body, mid, at, null, '{}'::jsonb)
$$;

\echo '── 1. ingest, reply status, dedupe, out-of-order'
begin;
select t.seed();
select t.ok((t.ingest('00000000-0000-0000-0000-00000000d001','e1','th1','amy','inbound','hi','m1', now() - interval '10 min')->>'status') = 'ok', 'first event ingests');
select t.ok((select reply_status from public.inbox_conversations where external_thread_id='th1') = 'waiting_us', 'inbound latest -> waiting_us');
select t.ok((t.ingest('00000000-0000-0000-0000-00000000d001','e2','th1','amy','outbound','sure!','m2', now() - interval '5 min')->>'status') = 'ok', 'outbound ingests');
select t.ok((select reply_status from public.inbox_conversations where external_thread_id='th1') = 'waiting_client', 'outbound latest -> waiting_client');
select t.ok((t.ingest('00000000-0000-0000-0000-00000000d001','e1','th1','amy','inbound','hi','m1', now() - interval '10 min')->>'status') = 'duplicate', 'same event id is a duplicate');
select t.ok((select count(*) from public.inbox_messages) = 2, 'duplicate event wrote no extra message');
select t.ok((t.ingest('00000000-0000-0000-0000-00000000d001','e9','th1','amy','inbound','hi','m1', now() - interval '10 min')->>'status') = 'ok', 'new event id, same message id accepted by ledger');
select t.ok((select count(*) from public.inbox_messages) = 2, 'same external message id never duplicates a message');
-- out of order: an OLDER inbound message arrives last
select t.ingest('00000000-0000-0000-0000-00000000d001','e3','th1','amy','inbound','very old','m0', now() - interval '60 min');
select t.ok((select last_message_preview from public.inbox_conversations where external_thread_id='th1') = 'sure!', 'late old message does not overwrite latest preview');
select t.ok((select reply_status from public.inbox_conversations where external_thread_id='th1') = 'waiting_client', 'reply status follows true latest message, not arrival order');
rollback;

\echo '── 2. reply status is NOT invented without outbound events'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000e001','e1','th2','bo','inbound','hello','m1', now());
select t.ok((select reply_status from public.inbox_conversations where external_thread_id='th2') = 'unavailable', 'no outbound events -> unavailable');
rollback;

\echo '── 3. ingestion guards'
begin;
select t.seed();
select t.ok((public.inbox_ingest('00000000-0000-0000-0000-00000000f001','e1','th3','x','@x','X','inbound','hi','m1', now(), null, '{}')->>'status') = 'ok', 'pending_approval account still accepts (connection exists)');
select t.ok((public.inbox_ingest('99999999-9999-9999-9999-999999999999','e1','th3','x','@x','X','inbound','hi','m1', now(), null, '{}')->>'status') = 'unknown_account', 'unknown account rejected');
update public.social_accounts set status='not_connected' where id='00000000-0000-0000-0000-00000000d001';
select t.ok((t.ingest('00000000-0000-0000-0000-00000000d001','e1','th4','y','inbound','hi','m1', now())->>'status') = 'account_not_connected', 'disconnected account rejected');
select t.as_user('don@mag.test');
select t.denied($$select public.inbox_ingest('00000000-0000-0000-0000-00000000d001','e','t','u','@u','U','inbound','b','m', now(), null, '{}')$$, '42501', 'signed-in users cannot call inbox_ingest');
rollback;

\echo '── 4. cross-agent isolation + approval'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','don convo','m1', now());
select t.ingest('00000000-0000-0000-0000-00000000c001','e1','chaz1','bob','inbound','chaz convo','m1', now());
select t.ingest('00000000-0000-0000-0000-00000000e001','e1','seb1','cy','inbound','seb convo','m1', now());
select t.as_user('chaz@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 1, 'chaz sees only his own conversation');
select t.ok((select count(*) from public.inbox_messages) = 1, 'chaz sees only his own messages');
select t.ok((select count(*) from public.social_accounts) = 1, 'chaz sees only his own account');
select t.as_user('don@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 1, 'don (no grant) sees only his own, not seb or chaz');
select t.as_server();
-- eve was never approved but is the owner of a conversation
insert into public.social_accounts(id, provider, owner_email, label, external_account_id, status, capabilities)
  values ('00000000-0000-0000-0000-0000000e0e01','instagram','eve@mag.test','Eve IG','ig_eve','connected','{}');
select t.ingest('00000000-0000-0000-0000-0000000e0e01','e1','eve1','zed','inbound','eve convo','m1', now());
select t.as_user('eve@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 0, 'unapproved agent sees nothing even on own account');
select t.as_server();
update public.agent_allowlist set approved=false where email='chaz@mag.test';
select t.as_user('chaz@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 0, 'revoked approval removes access immediately');
select t.as_user('stranger@elsewhere.test');
select t.ok((select count(*) from public.inbox_conversations) = 0, 'signed-in non-agent sees nothing');
rollback;

\echo '── 5. team lead grant (explicit, revocable, split permissions)'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','don convo','m1', now());
select t.ingest('00000000-0000-0000-0000-00000000e001','e1','seb1','cy','inbound','seb convo','m1', now());
select t.as_user('seb@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 1, 'before grant: seb sees only his own');
select t.as_server();
insert into public.inbox_team_roles(email, role, can_view_team, can_reassign, can_send_client_messages, granted_by)
  values ('seb@mag.test','team_lead', true, false, false, 'don@mag.test');
select t.as_user('seb@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 2, 'view grant: seb sees the team');
select t.ok((select count(*) from public.social_accounts) = 4, 'view grant: seb sees all four team accounts');
select t.denied($$update public.inbox_conversations set assigned_to='chaz@mag.test' where external_thread_id='don1'$$, '42501', 'view-only grant cannot reassign');
select t.ok(public.inbox_has_grant('send') = false, 'send grant is separate and still false');
select t.as_server();
update public.inbox_team_roles set can_reassign = true where email='seb@mag.test';
select t.as_user('seb@mag.test');
update public.inbox_conversations set assigned_to='chaz@mag.test' where external_thread_id='don1';
select t.ok((select assigned_to from public.inbox_conversations where external_thread_id='don1') = 'chaz@mag.test', 'reassign grant allows reassignment');
select t.denied($$update public.inbox_conversations set assigned_to='eve@mag.test' where external_thread_id='don1'$$, '42501', 'cannot assign to an unapproved agent');
select t.as_server();
update public.inbox_team_roles set revoked_at = now() where email='seb@mag.test';
select t.as_user('seb@mag.test');
select t.ok((select count(*) from public.inbox_conversations) = 1, 'revoked grant: seb back to own conversations only');
select t.as_user('chaz@mag.test');
select t.ok((select count(*) from public.inbox_conversations where external_thread_id='don1') = 1, 'assignee can see the conversation assigned to them');
select t.as_user('don@mag.test');
select t.denied($$insert into public.inbox_team_roles(email,role,granted_by) values ('don@mag.test','admin','don@mag.test')$$, '42501', 'users cannot grant themselves roles');
rollback;

\echo '── 6. claim / release / protected fields'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','hi','m1', now());
select t.as_user('chaz@mag.test');
update public.inbox_conversations set assigned_to='chaz@mag.test' where external_thread_id='don1';
select t.ok((select count(*) from public.inbox_conversations) = 0, 'agent cannot touch another agent''s conversation (no rows visible)');
select t.as_user('don@mag.test');
update public.inbox_conversations set assigned_to='don@mag.test' where external_thread_id='don1';
select t.ok((select assigned_to from public.inbox_conversations) = 'don@mag.test', 'owner can claim an unassigned conversation');
update public.inbox_conversations set assigned_to=null where external_thread_id='don1';
select t.ok((select assigned_to from public.inbox_conversations) is null, 'owner can release own assignment');
select t.denied($$update public.inbox_conversations set assigned_to='chaz@mag.test' where external_thread_id='don1'$$, '42501', 'no grant: cannot assign someone else');
select t.denied($$update public.inbox_conversations set reply_status='waiting_client'$$, '42501', 'reply_status is server-managed');
select t.denied($$update public.inbox_conversations set agent_id='chaz@mag.test'$$, '42501', 'owner column is server-managed');
select t.denied($$update public.inbox_conversations set account_id='00000000-0000-0000-0000-00000000c001'$$, '42501', 'account column is server-managed');
select t.denied($$update public.inbox_conversations set last_message_preview='forged'$$, '42501', 'message summary is server-managed');
update public.inbox_conversations set follow_up_at = now() + interval '1 day', next_action = 'Send 3 listings';
select t.ok((select next_action from public.inbox_conversations) = 'Send 3 listings', 'next action + follow-up are editable');
update public.inbox_conversations set status='closed';
select t.ok((select resolved_at from public.inbox_conversations) is not null, 'resolving stamps resolved_at');
select t.as_server();
select t.ingest('00000000-0000-0000-0000-00000000d001','e2','don1','amy','inbound','still need help','m2', now() + interval '1 min');
select t.ok((select status from public.inbox_conversations) = 'open', 'new client message reopens a resolved conversation');
rollback;

\echo '── 7. notes are internal, scoped, append-only'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','hi','m1', now());
select t.as_user('don@mag.test');
insert into public.inbox_notes(conversation_id, body) select id, 'budget is flexible' from public.inbox_conversations;
select t.ok((select count(*) from public.inbox_notes) = 1, 'owner can add an internal note');
select t.ok((select count(*) from public.inbox_messages) = 1, 'notes never appear as client messages');
select t.denied($$insert into public.inbox_notes(conversation_id, body, author_email) select id, 'spoof', 'chaz@mag.test' from public.inbox_conversations$$, '42501', 'cannot author a note as someone else');
update public.inbox_notes set body = 'edited';
select t.ok((select body from public.inbox_notes) = 'budget is flexible', 'notes cannot be edited');
delete from public.inbox_notes;
select t.ok((select count(*) from public.inbox_notes) = 1, 'notes cannot be deleted');
select t.as_user('chaz@mag.test');
select t.ok((select count(*) from public.inbox_notes) = 0, 'other agents cannot read notes');
select t.denied($$insert into public.inbox_notes(conversation_id, body) select id, 'x' from (select '00000000-0000-0000-0000-000000000000'::uuid as id) q$$, '42501', 'cannot note a conversation you cannot see');
rollback;

\echo '── 8. no client writes to messages, credentials locked down'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','hi','m1', now());
select t.as_user('don@mag.test');
select t.denied($$insert into public.inbox_messages(conversation_id, direction, body, agent_id) select id, 'outbound', 'forged send', 'don@mag.test' from public.inbox_conversations$$, '42501', 'browser cannot insert messages');
select t.denied($$insert into public.inbox_conversations(agent_id, channel) values ('don@mag.test','instagram')$$, '42501', 'browser cannot create conversations');
select t.denied($$select * from public.social_account_credentials$$, '42501', 'credentials table is not readable by users');
select t.denied($$select * from public.inbox_events$$, '42501', 'webhook ledger is not readable by users');
update public.social_accounts set status='error', capabilities='{"receive_messages":true,"outbound_events":true,"send_replies":true}';
select t.as_server();
select t.ok((select count(*) from public.social_accounts where status='error') = 0, 'users cannot edit connection state (update affects 0 rows)');
select t.ok((select capabilities ? 'send_replies' from public.social_accounts where id='00000000-0000-0000-0000-00000000d001') = false, 'users cannot grant themselves capabilities');
rollback;

\echo '── 9. lead linking and identity/lead separation'
begin;
select t.seed();
select t.ingest('00000000-0000-0000-0000-00000000d001','e1','don1','amy','inbound','hi','m1', now());
select t.ok((select count(*) from public.leads) = 2, 'inbound DM does not create a CRM lead');
select t.ok((select count(*) from public.social_identities) = 1, 'social identity created separately');
select t.as_user('don@mag.test');
update public.inbox_conversations set lead_id = (select id from public.leads where name='Lead Don');
select t.ok((select lead_id from public.inbox_conversations) is not null, 'can link own lead');
select t.as_server();
select set_config('t.chaz_lead', (select id::text from public.leads where name='Lead Chaz'), true);
select t.as_user('don@mag.test');
select t.denied($$update public.inbox_conversations set lead_id = current_setting('t.chaz_lead')::bigint$$, '42501', 'cannot link another agent''s lead by id');
rollback;

\echo '── 10. contact-only upsert (no invented messages)'
begin;
select t.seed();
select t.as_server();
select t.ok((public.inbox_upsert_contact('00000000-0000-0000-0000-00000000d001','mc1','u1','@zoe','Zoe','https://example.test/c/1')->>'status') = 'ok', 'contact upsert ok');
select t.ok((select count(*) from public.inbox_messages) = 0, 'contact sync writes no messages');
select t.ok((select reply_status from public.inbox_conversations) = 'unavailable', 'contact-only conversation has unavailable reply status');
select t.ok((select conversation_url from public.inbox_conversations) = 'https://example.test/c/1', 'conversation link stored');
select public.inbox_upsert_contact('00000000-0000-0000-0000-00000000d001','mc1','u1','@zoe','Zoe',null);
select t.ok((select count(*) from public.inbox_conversations) = 1, 'repeat upsert does not duplicate (safe reconnect/re-sync)');
rollback;

\echo 'ALL DB TESTS PASSED'
