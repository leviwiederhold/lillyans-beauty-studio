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

update public.profiles
set role = 'admin',
    is_admin = true,
    updated_at = now()
where lower(email) = 'lillyansbeautystudio@gmail.com';
