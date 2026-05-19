-- Business hour overrides for specific dates (e.g. holidays, early closings)
create table if not exists public.business_hour_overrides (
  id           uuid primary key default gen_random_uuid(),
  override_date date not null unique,
  opens_at     time,
  closes_at    time,
  is_closed    boolean not null default false,
  reason       text,
  created_at   timestamptz not null default now()
);

alter table public.business_hour_overrides enable row level security;

-- Admin-only: service role bypasses RLS
create policy "Admin full access" on public.business_hour_overrides
  for all using (true) with check (true);
