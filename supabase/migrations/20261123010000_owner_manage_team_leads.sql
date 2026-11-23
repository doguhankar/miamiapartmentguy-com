-- Owner (Don) can read and edit teammates' leads from /agent?as=seb. Agents still only see their own.
create policy leads_owner_select_all on public.leads for select to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'doguhankar1@gmail.com');
create policy leads_owner_update_all on public.leads for update to authenticated
  using (lower(coalesce(auth.jwt() ->> 'email', '')) = 'doguhankar1@gmail.com')
  with check (lower(coalesce(auth.jwt() ->> 'email', '')) = 'doguhankar1@gmail.com');
