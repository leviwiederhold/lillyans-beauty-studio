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

alter table public.intake_forms
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists is_default boolean not null default false,
  add column if not exists confirmed_current boolean not null default false;

create table if not exists public.gift_card_inquiries (
  id uuid primary key default gen_random_uuid(),
  purchaser_name text not null,
  purchaser_email text not null,
  purchaser_phone text,
  recipient_name text,
  amount_requested text,
  occasion text not null,
  occasion_other text,
  message text,
  preferred_contact_method text,
  status text not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists touch_intake_forms_updated_at on public.intake_forms;
create trigger touch_intake_forms_updated_at before update on public.intake_forms for each row execute function public.touch_updated_at();
drop trigger if exists touch_gift_card_inquiries_updated_at on public.gift_card_inquiries;
create trigger touch_gift_card_inquiries_updated_at before update on public.gift_card_inquiries for each row execute function public.touch_updated_at();

alter table public.gift_card_inquiries enable row level security;

drop policy if exists "gift card inquiries public insert" on public.gift_card_inquiries;
drop policy if exists "gift card inquiries admins manage" on public.gift_card_inquiries;
create policy "gift card inquiries public insert" on public.gift_card_inquiries for insert with check (true);
create policy "gift card inquiries admins manage" on public.gift_card_inquiries for all using (public.is_admin()) with check (public.is_admin());

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
