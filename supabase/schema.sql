create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text,
  phone text,
  date_of_birth date,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  medications text,
  allergies text,
  skin_conditions text,
  previous_procedures text,
  health_conditions text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_email_unique on clients (lower(email)) where email is not null and email <> '';
create index if not exists clients_phone_idx on clients (phone);

create table if not exists contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  code text,
  deposit_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  contact_inquiry_id uuid references contact_inquiries(id) on delete set null,
  client_name text,
  email text,
  phone text,
  service_type text not null,
  status text not null default 'pending' check (status in ('pending','pending_admin_confirmation','confirmed','denied','cancelled','completed','no-show')),
  starts_at timestamptz,
  ends_at timestamptz,
  deposit_required boolean not null default true,
  deposit_status text not null default 'pending',
  service_total int,
  deposit_percent int not null default 20,
  deposit_amount int,
  remaining_balance int,
  deposit_amount_cents int,
  square_checkout_url text,
  square_payment_id text,
  square_order_id text,
  deposit_paid_at timestamptz,
  waiver_reason text,
  gift_card_code_id uuid references gift_card_codes(id) on delete set null,
  gift_card_code text,
  gift_card_status text,
  internal_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references service_categories(id) on delete set null,
  name text not null unique,
  description text,
  service_total int,
  duration_minutes int not null default 60,
  requires_intake boolean not null default false,
  intake_type text,
  requires_deposit boolean not null default false,
  deposit_amount_cents int,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists blocked_times (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists deposits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  amount_cents int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists intake_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  type text not null check (type in ('permanent_makeup','facial','waxing','wedding_inquiry')),
  service_label text not null,
  service_details jsonb not null default '{}',
  consent_accuracy boolean not null default false,
  consent_updates boolean not null default false,
  consent_policy boolean not null default false,
  signature text not null,
  signature_date date not null,
  raw_payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists business_settings (
  id int primary key default 1 check (id = 1),
  business_hours text,
  service_availability text,
  blocked_dates jsonb not null default '[]',
  travel_wedding_availability text,
  service_durations jsonb not null default '{}',
  deposit_amounts jsonb not null default '{}',
  booking_url text,
  gift_card_url text,
  gift_card_auto_confirm boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists gift_card_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  is_active boolean not null default true,
  allow_reuse boolean not null default false,
  redeemed_at timestamptz,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  client_name text,
  email text,
  name text,
  plan_name text,
  price_label text,
  perks text,
  status text not null default 'active',
  start_date date,
  renewal_date date,
  payment_status text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table clients add column if not exists profile_id uuid references profiles(id) on delete set null;
alter table clients add column if not exists services_used text[] default '{}';
alter table clients add column if not exists membership_status text;
alter table business_settings add column if not exists service_availability text;

alter table memberships add column if not exists client_id uuid references clients(id) on delete set null;
alter table memberships add column if not exists client_name text;
alter table memberships add column if not exists email text;
alter table memberships add column if not exists plan_name text;
alter table memberships add column if not exists status text not null default 'active';
alter table memberships add column if not exists start_date date;
alter table memberships add column if not exists renewal_date date;
alter table memberships add column if not exists payment_status text;
alter table bookings add column if not exists deposit_amount_cents int;
alter table bookings add column if not exists service_total int;
alter table bookings add column if not exists deposit_percent int not null default 20;
alter table bookings add column if not exists deposit_amount int;
alter table bookings add column if not exists remaining_balance int;
alter table bookings add column if not exists square_checkout_url text;
alter table bookings add column if not exists square_payment_id text;
alter table bookings add column if not exists square_order_id text;
alter table bookings add column if not exists deposit_paid_at timestamptz;
alter table bookings add column if not exists waiver_reason text;
alter table bookings add column if not exists gift_card_code_id uuid references gift_card_codes(id) on delete set null;
alter table bookings add column if not exists internal_notes text;
alter table gift_card_codes add column if not exists allow_reuse boolean not null default false;
alter table gift_card_codes add column if not exists redeemed_at timestamptz;
alter table business_settings add column if not exists blocked_dates jsonb not null default '[]';
alter table business_settings add column if not exists travel_wedding_availability text;
alter table business_settings add column if not exists service_durations jsonb not null default '{}';
alter table business_settings add column if not exists deposit_amounts jsonb not null default '{}';
alter table business_settings add column if not exists gift_card_auto_confirm boolean not null default false;
alter table bookings add column if not exists service_id uuid references services(id) on delete set null;
alter table services add column if not exists service_total int;

create table if not exists gift_card_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  contact_inquiry_id uuid references contact_inquiries(id) on delete set null,
  booking_id uuid references bookings(id) on delete set null,
  code text not null,
  status text not null default 'accepted',
  created_at timestamptz not null default now()
);

create table if not exists admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_type text not null,
  target_table text,
  target_id uuid,
  recipient_email text,
  status text not null default 'sent',
  message text,
  created_at timestamptz not null default now()
);

create table if not exists error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists cms_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  body text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists service_settings (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price_label text,
  duration_minutes int,
  deposit_amount_cents int,
  is_active boolean not null default true,
  required_fields text[] default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  slot text,
  title text,
  url text not null,
  alt_text text,
  width int,
  height int,
  size_bytes int,
  created_at timestamptz not null default now()
);

insert into gift_card_codes (code, description, is_active, used_count, created_at)
select code, description, is_active, used_count, created_at
from gift_card_deposit_waivers
on conflict (code) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and (is_admin = true or role = 'admin')
  );
$$;

alter table profiles enable row level security;
alter table clients enable row level security;
alter table bookings enable row level security;
alter table services enable row level security;
alter table availability_rules enable row level security;
alter table blocked_times enable row level security;
alter table deposits enable row level security;
alter table contact_inquiries enable row level security;
alter table intake_forms enable row level security;
alter table service_categories enable row level security;
alter table gallery_items enable row level security;
alter table business_settings enable row level security;
alter table business_hours enable row level security;
alter table gift_card_codes enable row level security;
alter table gift_card_code_redemptions enable row level security;
alter table memberships enable row level security;
alter table admin_audit_log enable row level security;
alter table automation_logs enable row level security;
alter table error_logs enable row level security;
alter table cms_content enable row level security;
alter table service_settings enable row level security;
alter table announcements enable row level security;
alter table media_assets enable row level security;

drop policy if exists "admins manage profiles" on profiles;
create policy "admins manage profiles" on profiles for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "users view own profile" on profiles;
create policy "users view own profile" on profiles for select using (auth.uid() = id);

drop policy if exists "admins manage clients" on clients;
create policy "admins manage clients" on clients for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own client profile" on clients;
create policy "clients view own client profile" on clients for select using (profile_id = auth.uid());
drop policy if exists "clients update own client profile" on clients;
create policy "clients update own client profile" on clients for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists "admins manage bookings" on bookings;
create policy "admins manage bookings" on bookings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own bookings" on bookings;
create policy "clients view own bookings" on bookings for select using (client_id in (select id from clients where profile_id = auth.uid()));
drop policy if exists "admins manage services" on services;
create policy "admins manage services" on services for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active services" on services;
create policy "public read active services" on services for select using (is_active = true);
drop policy if exists "admins manage availability rules" on availability_rules;
create policy "admins manage availability rules" on availability_rules for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active availability rules" on availability_rules;
create policy "public read active availability rules" on availability_rules for select using (is_active = true);
drop policy if exists "admins manage blocked times" on blocked_times;
create policy "admins manage blocked times" on blocked_times for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage deposits" on deposits;
create policy "admins manage deposits" on deposits for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own deposits" on deposits;
create policy "clients view own deposits" on deposits for select using (booking_id in (select b.id from bookings b join clients c on c.id = b.client_id where c.profile_id = auth.uid()));
drop policy if exists "admins manage contact inquiries" on contact_inquiries;
create policy "admins manage contact inquiries" on contact_inquiries for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage intake forms" on intake_forms;
create policy "admins manage intake forms" on intake_forms for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own intake forms" on intake_forms;
create policy "clients view own intake forms" on intake_forms for select using (client_id in (select id from clients where profile_id = auth.uid()));
drop policy if exists "admins manage service categories" on service_categories;
create policy "admins manage service categories" on service_categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage gallery items" on gallery_items;
create policy "admins manage gallery items" on gallery_items for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage business settings" on business_settings;
create policy "admins manage business settings" on business_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage business hours" on business_hours;
create policy "admins manage business hours" on business_hours for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read business hours" on business_hours;
create policy "public read business hours" on business_hours for select using (true);
drop policy if exists "admins manage gift card codes" on gift_card_codes;
create policy "admins manage gift card codes" on gift_card_codes for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage gift card redemptions" on gift_card_code_redemptions;
create policy "admins manage gift card redemptions" on gift_card_code_redemptions for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own gift card redemptions" on gift_card_code_redemptions;
create policy "clients view own gift card redemptions" on gift_card_code_redemptions for select using (client_id in (select id from clients where profile_id = auth.uid()));
drop policy if exists "admins manage memberships" on memberships;
create policy "admins manage memberships" on memberships for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "clients view own memberships" on memberships;
create policy "clients view own memberships" on memberships for select using (client_id in (select id from clients where profile_id = auth.uid()));
drop policy if exists "admins view audit log" on admin_audit_log;
create policy "admins view audit log" on admin_audit_log for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage automation logs" on automation_logs;
create policy "admins manage automation logs" on automation_logs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage error logs" on error_logs;
create policy "admins manage error logs" on error_logs for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage cms content" on cms_content;
create policy "admins manage cms content" on cms_content for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active cms content" on cms_content;
create policy "public read active cms content" on cms_content for select using (is_active = true);
drop policy if exists "admins manage service settings" on service_settings;
create policy "admins manage service settings" on service_settings for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active service settings" on service_settings;
create policy "public read active service settings" on service_settings for select using (is_active = true);
drop policy if exists "admins manage announcements" on announcements;
create policy "admins manage announcements" on announcements for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read active announcements" on announcements;
create policy "public read active announcements" on announcements for select using (is_active = true);
drop policy if exists "admins manage media assets" on media_assets;
create policy "admins manage media assets" on media_assets for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read media assets" on media_assets;
create policy "public read media assets" on media_assets for select using (true);

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;
