create table if not exists public.client_forms (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  booking_id       uuid references public.bookings(id) on delete set null,
  form_type        text not null,   -- pmu_intake | informed_consent | liability_waiver | confidential_intake
  service_category text,
  service_name     text,
  submitted_at     timestamptz not null default now(),
  fields           jsonb,
  signature        text,            -- base64 data URL
  signature2       text,            -- second signature for forms that require two
  reviewed         boolean not null default false,
  reviewed_at      timestamptz,
  reviewed_by      uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Clients can only see their own forms; admins see all (handled via service-role client in API)
alter table public.client_forms enable row level security;

create policy "clients_own_forms" on public.client_forms
  for select using (auth.uid() = user_id);

create policy "clients_insert_own_forms" on public.client_forms
  for insert with check (auth.uid() = user_id);

-- Indexes for admin queries
create index if not exists client_forms_user_id_idx        on public.client_forms(user_id);
create index if not exists client_forms_booking_id_idx     on public.client_forms(booking_id);
create index if not exists client_forms_form_type_idx      on public.client_forms(form_type);
create index if not exists client_forms_submitted_at_idx   on public.client_forms(submitted_at desc);
create index if not exists client_forms_reviewed_idx       on public.client_forms(reviewed);
