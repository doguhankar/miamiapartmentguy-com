-- EXAMPLE ONLY. Not applied anywhere. Review, replace the emails, then run it yourself (SQL editor)
-- AFTER the v2 migration is applied. Creates empty account slots; nothing is connected by this.
insert into public.social_accounts (provider, owner_email, label, handle, status) values
  ('instagram', 'don@REPLACE.me',  'Don Instagram',  null, 'not_connected'),
  ('tiktok',    'don@REPLACE.me',  'Don TikTok',     null, 'pending_approval'),
  ('instagram', 'seb@REPLACE.me',  'Seb Instagram',  null, 'not_connected'),
  ('tiktok',    'seb@REPLACE.me',  'Seb TikTok',     null, 'pending_approval')
on conflict do nothing;

