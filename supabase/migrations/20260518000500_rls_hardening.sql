-- ─────────────────────────────────────────────────────────────────────────────
-- RLS / privilege hardening
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Privilege-escalation fix.
--    The previous handle_new_user() trusted role / is_admin from raw_user_meta_data,
--    which a client can set freely via supabase.auth.signUp({ options: { data }}).
--    Force every self-service signup to be a non-admin client. Admins must be
--    promoted out-of-band (service-role / SQL), never through signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_admin)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'client',
    false
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

-- 2) business_hour_overrides: the prior "for all using (true)" policy let ANY
--    caller read and write overrides. Replace with public-read + admin-write.
drop policy if exists "Admin full access" on public.business_hour_overrides;

create policy "overrides public read"
  on public.business_hour_overrides
  for select using (true);

create policy "overrides admins manage"
  on public.business_hour_overrides
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) client_forms: previously only had clients-own select/insert and relied solely
--    on the service-role key bypassing RLS for admin access. Add an explicit admin
--    policy (defense in depth) so admin reads/updates of the `reviewed` flag are
--    governed by RLS rather than only the service key.
drop policy if exists "client_forms admins manage" on public.client_forms;

create policy "client_forms admins manage"
  on public.client_forms
  for all using (public.is_admin()) with check (public.is_admin());
