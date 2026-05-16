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
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_admin = true
      and lower(email) in ('lillyansbeautystudio@gmail.com')
  );
$$;

insert into public.profiles (id, email, full_name, role, is_admin)
select id, email, coalesce(raw_user_meta_data->>'full_name', ''), 'admin', true
from auth.users
where lower(email) = 'lillyansbeautystudio@gmail.com'
on conflict (id) do update
  set email = excluded.email,
      role = 'admin',
      is_admin = true,
      updated_at = now();

update public.profiles
set role = 'client',
    is_admin = false,
    updated_at = now()
where lower(coalesce(email, '')) <> 'lillyansbeautystudio@gmail.com'
  and (role = 'admin' or is_admin = true);
