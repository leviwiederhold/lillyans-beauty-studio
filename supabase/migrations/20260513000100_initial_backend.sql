create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'client' check (role in ('client', 'admin')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
    case when coalesce(new.raw_user_meta_data->>'role', '') = 'admin' then 'admin' else 'client' end,
    coalesce((new.raw_user_meta_data->>'is_admin')::boolean, false)
  )
  on conflict (id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null unique,
  description text,
  service_total int,
  duration_minutes int not null default 60,
  requires_intake boolean not null default false,
  intake_type text check (intake_type is null or intake_type in ('permanent_makeup', 'facial', 'waxing', 'wedding_inquiry')),
  requires_deposit boolean not null default true,
  deposit_amount_cents int,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
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
  health_conditions text[] not null default '{}',
  services_used text[] not null default '{}',
  membership_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists clients_email_unique on public.clients (lower(email)) where email is not null and email <> '';
create index if not exists clients_profile_id_idx on public.clients (profile_id);
create index if not exists clients_phone_idx on public.clients (phone);

create table if not exists public.contact_inquiries (
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

create table if not exists public.gift_card_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  is_active boolean not null default true,
  allow_reuse boolean not null default false,
  redeemed_at timestamptz,
  used_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  contact_inquiry_id uuid references public.contact_inquiries(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  client_name text,
  email text,
  phone text,
  service_type text not null,
  status text not null default 'pending' check (status in ('pending', 'pending_admin_confirmation', 'confirmed', 'denied', 'cancelled', 'completed', 'no-show')),
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
  gift_card_code_id uuid references public.gift_card_codes(id) on delete set null,
  gift_card_code text,
  gift_card_status text,
  internal_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_client_id_idx on public.bookings (client_id);
create index if not exists bookings_starts_at_idx on public.bookings (starts_at);
create index if not exists bookings_status_idx on public.bookings (status);

create table if not exists public.business_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_of_week)
);

create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.intake_forms (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  type text not null check (type in ('permanent_makeup', 'facial', 'waxing', 'wedding_inquiry')),
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

create index if not exists intake_forms_client_id_idx on public.intake_forms (client_id);
create index if not exists intake_forms_type_idx on public.intake_forms (type);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  image_url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_settings (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gift_card_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  contact_inquiry_id uuid references public.contact_inquiries(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  code text not null,
  status text not null default 'accepted',
  created_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  amount_cents int not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  automation_type text not null,
  target_table text,
  target_id uuid,
  recipient_email text,
  status text not null default 'sent',
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  message text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

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
      and (is_admin = true or role = 'admin')
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists touch_clients_updated_at on public.clients;
create trigger touch_clients_updated_at before update on public.clients for each row execute function public.touch_updated_at();
drop trigger if exists touch_services_updated_at on public.services;
create trigger touch_services_updated_at before update on public.services for each row execute function public.touch_updated_at();
drop trigger if exists touch_bookings_updated_at on public.bookings;
create trigger touch_bookings_updated_at before update on public.bookings for each row execute function public.touch_updated_at();
drop trigger if exists touch_business_hours_updated_at on public.business_hours;
create trigger touch_business_hours_updated_at before update on public.business_hours for each row execute function public.touch_updated_at();
drop trigger if exists touch_memberships_updated_at on public.memberships;
create trigger touch_memberships_updated_at before update on public.memberships for each row execute function public.touch_updated_at();
drop trigger if exists touch_gallery_items_updated_at on public.gallery_items;
create trigger touch_gallery_items_updated_at before update on public.gallery_items for each row execute function public.touch_updated_at();
drop trigger if exists touch_business_settings_updated_at on public.business_settings;
create trigger touch_business_settings_updated_at before update on public.business_settings for each row execute function public.touch_updated_at();
drop trigger if exists touch_gift_card_codes_updated_at on public.gift_card_codes;
create trigger touch_gift_card_codes_updated_at before update on public.gift_card_codes for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.services enable row level security;
alter table public.service_categories enable row level security;
alter table public.bookings enable row level security;
alter table public.business_hours enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_times enable row level security;
alter table public.intake_forms enable row level security;
alter table public.memberships enable row level security;
alter table public.gallery_items enable row level security;
alter table public.business_settings enable row level security;
alter table public.gift_card_codes enable row level security;
alter table public.gift_card_code_redemptions enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.deposits enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.automation_logs enable row level security;
alter table public.error_logs enable row level security;

create policy "profiles admins manage" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "profiles users read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles users update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = 'client' and is_admin = false);

create policy "clients admins manage" on public.clients for all using (public.is_admin()) with check (public.is_admin());
create policy "clients users read own" on public.clients for select using (profile_id = auth.uid());
create policy "clients users update own" on public.clients for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "clients users insert own" on public.clients for insert with check (profile_id = auth.uid());

create policy "services admins manage" on public.services for all using (public.is_admin()) with check (public.is_admin());
create policy "services public read active" on public.services for select using (is_active = true);
create policy "service categories admins manage" on public.service_categories for all using (public.is_admin()) with check (public.is_admin());
create policy "service categories public read active" on public.service_categories for select using (is_active = true);

create policy "bookings admins manage" on public.bookings for all using (public.is_admin()) with check (public.is_admin());
create policy "bookings users read own" on public.bookings for select using (client_id in (select id from public.clients where profile_id = auth.uid()));

create policy "business hours admins manage" on public.business_hours for all using (public.is_admin()) with check (public.is_admin());
create policy "business hours public read" on public.business_hours for select using (true);
create policy "availability rules admins manage" on public.availability_rules for all using (public.is_admin()) with check (public.is_admin());
create policy "availability rules public read active" on public.availability_rules for select using (is_active = true);
create policy "blocked times admins manage" on public.blocked_times for all using (public.is_admin()) with check (public.is_admin());

create policy "intake forms admins manage" on public.intake_forms for all using (public.is_admin()) with check (public.is_admin());
create policy "intake forms users read own" on public.intake_forms for select using (client_id in (select id from public.clients where profile_id = auth.uid()));

create policy "memberships admins manage" on public.memberships for all using (public.is_admin()) with check (public.is_admin());
create policy "memberships users read own" on public.memberships for select using (client_id in (select id from public.clients where profile_id = auth.uid()));

create policy "gallery admins manage" on public.gallery_items for all using (public.is_admin()) with check (public.is_admin());
create policy "gallery public read published" on public.gallery_items for select using (is_published = true);

create policy "business settings admins manage" on public.business_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "business settings public read" on public.business_settings for select using (true);

create policy "gift codes admins manage" on public.gift_card_codes for all using (public.is_admin()) with check (public.is_admin());
create policy "gift code redemptions admins manage" on public.gift_card_code_redemptions for all using (public.is_admin()) with check (public.is_admin());
create policy "gift code redemptions users read own" on public.gift_card_code_redemptions for select using (client_id in (select id from public.clients where profile_id = auth.uid()));

create policy "contact inquiries public insert" on public.contact_inquiries for insert with check (true);
create policy "contact inquiries admins manage" on public.contact_inquiries for all using (public.is_admin()) with check (public.is_admin());

create policy "deposits admins manage" on public.deposits for all using (public.is_admin()) with check (public.is_admin());
create policy "deposits users read own" on public.deposits for select using (booking_id in (select b.id from public.bookings b join public.clients c on c.id = b.client_id where c.profile_id = auth.uid()));

create policy "audit admins manage" on public.admin_audit_log for all using (public.is_admin()) with check (public.is_admin());
create policy "automation logs admins manage" on public.automation_logs for all using (public.is_admin()) with check (public.is_admin());
create policy "error logs admins manage" on public.error_logs for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;
