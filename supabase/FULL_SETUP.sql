-- ════════════════════════════════════════════════════════════════════════════
-- LILLYAN'S BEAUTY STUDIO — FULL CATCH-UP SETUP
-- Run this once in the Supabase SQL Editor. It is idempotent (safe to re-run) and
-- brings a database that already has the initial schema + seeds up to date with
-- every later migration, then promotes the owner to admin.
--
-- Prerequisites (from the initial "Salon Platform Schema + RLS" migration):
--   functions public.is_admin(), public.touch_updated_at()
--   tables public.clients, public.bookings, public.profiles, public.contact_inquiries
-- These already exist in your project.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Gift card inquiry occasion fields (20260516000100) ──────────────────────
alter table public.contact_inquiries
  add column if not exists occasion        text,
  add column if not exists occasion_detail text;

-- ── client_forms: canonical store for intake/consent forms (20260516000200 +
--    linkage 20260518000600), full shape incl. later columns ─────────────────
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

-- If the table already existed without the newer columns:
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

-- ── Date overrides (20260518000100) ─────────────────────────────────────────
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

-- ── Double-booking guard (20260518000200) ───────────────────────────────────
create unique index if not exists bookings_unique_starts_at
  on public.bookings (starts_at)
  where status not in ('cancelled', 'denied', 'no-show');

-- ── Gift card online-purchase columns (20260518000300) ──────────────────────
alter table public.gift_card_codes
  add column if not exists balance_cents   int,
  add column if not exists recipient_email text,
  add column if not exists purchased_at    timestamptz,
  add column if not exists square_order_id text;

-- ── Memberships schema + price backfill (20260518000400) ────────────────────
alter table public.memberships
  add column if not exists price_cents     int,
  add column if not exists started_at      timestamptz,
  add column if not exists square_order_id text,
  add column if not exists plan_ref_id     uuid;

update public.memberships set price_cents = 6000  where plan_name ilike '%glow%'     and status = 'plan';
update public.memberships set price_cents = 13000 where plan_name ilike '%radiance%' and status = 'plan';
update public.memberships set price_cents = 20000 where plan_name ilike '%luminary%' and status = 'plan';

-- ── Booking rules + intake expiration + gift card details + booking↔form link
--    (20260518000700) ──────────────────────────────────────────────────────
alter table public.business_settings
  add column if not exists booking_minimum_notice_hours int not null default 48,
  add column if not exists intake_expiration_months     int not null default 6;

alter table public.bookings
  add column if not exists client_form_id uuid references public.client_forms(id) on delete set null;

alter table public.contact_inquiries
  add column if not exists details jsonb;

-- ── RLS / privilege hardening (20260518000500) ──────────────────────────────
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
drop policy if exists "Admin full access"        on public.business_hour_overrides;
drop policy if exists "overrides public read"     on public.business_hour_overrides;
drop policy if exists "overrides admins manage"   on public.business_hour_overrides;
create policy "overrides public read"   on public.business_hour_overrides
  for select using (true);
create policy "overrides admins manage" on public.business_hour_overrides
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Promote the studio owner to admin ───────────────────────────────────────
-- The account must already exist in Authentication (sign up, or Dashboard →
-- Authentication → Users → Add user with "Auto Confirm User").
update public.profiles
set role = 'admin', is_admin = true
where email = 'lillyansbeautystudio@gmail.com';

-- ── Verify ──────────────────────────────────────────────────────────────────
--   select to_regclass('public.client_forms');                       -- not null
--   select email, role, is_admin from public.profiles where is_admin; -- owner listed
--   select booking_minimum_notice_hours, intake_expiration_months from public.business_settings where id = 1;
-- ════════════════════════════════════════════════════════════════════════════
