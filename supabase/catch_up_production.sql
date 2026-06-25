-- ════════════════════════════════════════════════════════════════════════════
-- PRODUCTION CATCH-UP SCRIPT
-- Brings a database that only has the initial schema + seeds up to date.
-- Safe to run multiple times (idempotent). Run the whole thing in the Supabase
-- SQL Editor. Requires the base schema (public.is_admin, public.touch_updated_at,
-- public.clients, public.bookings) to already exist.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. client_forms (THE fix for the /api/forms 500) ────────────────────────
create table if not exists public.client_forms (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  client_id        uuid references public.clients(id) on delete set null,
  booking_id       uuid references public.bookings(id) on delete set null,
  form_type        text not null,
  service_category text,
  service_name     text,
  submitted_at     timestamptz not null default now(),
  fields           jsonb,
  signature        text,
  signature2       text,
  status           text not null default 'completed',
  reviewed         boolean not null default false,
  reviewed_at      timestamptz,
  reviewed_by      uuid references auth.users(id) on delete set null,
  last_reviewed_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- In case the table already existed without the newer columns:
alter table public.client_forms
  add column if not exists client_id        uuid references public.clients(id) on delete set null,
  add column if not exists status           text not null default 'completed',
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists updated_at       timestamptz not null default now();

alter table public.client_forms enable row level security;

drop policy if exists "clients_own_forms" on public.client_forms;
create policy "clients_own_forms" on public.client_forms
  for select using (auth.uid() = user_id);

drop policy if exists "clients_insert_own_forms" on public.client_forms;
create policy "clients_insert_own_forms" on public.client_forms
  for insert with check (auth.uid() = user_id);

drop policy if exists "client_forms admins manage" on public.client_forms;
create policy "client_forms admins manage" on public.client_forms
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists client_forms_user_id_idx      on public.client_forms(user_id);
create index if not exists client_forms_client_id_idx    on public.client_forms(client_id);
create index if not exists client_forms_booking_id_idx   on public.client_forms(booking_id);
create index if not exists client_forms_form_type_idx    on public.client_forms(form_type);
create index if not exists client_forms_submitted_at_idx on public.client_forms(submitted_at desc);
create index if not exists client_forms_reviewed_idx     on public.client_forms(reviewed);

drop trigger if exists touch_client_forms_updated_at on public.client_forms;
create trigger touch_client_forms_updated_at
  before update on public.client_forms
  for each row execute function public.touch_updated_at();

-- ── 2. business_hour_overrides (date overrides) ─────────────────────────────
create table if not exists public.business_hour_overrides (
  id            uuid primary key default gen_random_uuid(),
  override_date date not null unique,
  opens_at      time,
  closes_at     time,
  is_closed     boolean not null default false,
  reason        text,
  created_at    timestamptz not null default now()
);
alter table public.business_hour_overrides enable row level security;

-- ── 3. Double-booking guard ─────────────────────────────────────────────────
create unique index if not exists bookings_unique_starts_at
  on public.bookings (starts_at)
  where status not in ('cancelled', 'denied', 'no-show');

-- ── 4. Gift card online-purchase columns ────────────────────────────────────
alter table public.gift_card_codes
  add column if not exists balance_cents   int,
  add column if not exists recipient_email text,
  add column if not exists purchased_at    timestamptz,
  add column if not exists square_order_id text;

-- ── 5. Memberships schema + price backfill ──────────────────────────────────
alter table public.memberships
  add column if not exists price_cents     int,
  add column if not exists started_at      timestamptz,
  add column if not exists square_order_id text,
  add column if not exists plan_ref_id     uuid;

update public.memberships set price_cents = 6000  where plan_name ilike '%glow%'     and status = 'plan';
update public.memberships set price_cents = 13000 where plan_name ilike '%radiance%' and status = 'plan';
update public.memberships set price_cents = 20000 where plan_name ilike '%luminary%' and status = 'plan';

-- ── 6. RLS / privilege hardening ────────────────────────────────────────────
-- Block signup privilege escalation: never trust role/is_admin from signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, is_admin)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client', false)
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

-- business_hour_overrides: public-read + admin-write (was world-writable).
drop policy if exists "Admin full access" on public.business_hour_overrides;
drop policy if exists "overrides public read" on public.business_hour_overrides;
create policy "overrides public read" on public.business_hour_overrides
  for select using (true);
drop policy if exists "overrides admins manage" on public.business_hour_overrides;
create policy "overrides admins manage" on public.business_hour_overrides
  for all using (public.is_admin()) with check (public.is_admin());

-- ════════════════════════════════════════════════════════════════════════════
-- Done. Verify:
--   select to_regclass('public.client_forms');            -- should be non-null
--   select count(*) from public.client_forms;             -- should run, 0+ rows
-- ════════════════════════════════════════════════════════════════════════════
