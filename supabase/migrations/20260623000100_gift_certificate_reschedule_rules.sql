alter table public.bookings
  add column if not exists gift_certificate_code_id uuid references public.gift_card_codes(id) on delete set null,
  add column if not exists rescheduled_from_booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists rescheduled_to_booking_id uuid references public.bookings(id) on delete set null;

alter table public.gift_card_codes
  add column if not exists type text not null default 'gift_certificate',
  add column if not exists value_cents int,
  add column if not exists usage_limit int,
  add column if not exists usage_count int not null default 0,
  add column if not exists expires_at timestamptz,
  add column if not exists used_by_client_id uuid references public.clients(id) on delete set null,
  add column if not exists used_on_booking_id uuid references public.bookings(id) on delete set null,
  add column if not exists used_at timestamptz;

update public.gift_card_codes
set usage_count = greatest(coalesce(usage_count, 0), coalesce(used_count, 0)),
    usage_limit = case
      when usage_limit is not null then usage_limit
      when allow_reuse = true then null
      else 1
    end;

create table if not exists public.deposit_credits (
  id uuid primary key default gen_random_uuid(),
  original_booking_id uuid references public.bookings(id) on delete set null,
  applied_booking_id uuid references public.bookings(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  amount int not null default 0,
  source text not null default 'square_deposit' check (source in ('square_deposit', 'manual', 'gift_certificate')),
  status text not null default 'available' check (status in ('available', 'applied', 'expired', 'refunded')),
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

alter table public.deposit_credits enable row level security;

drop policy if exists "deposit credits admins manage" on public.deposit_credits;
drop policy if exists "deposit credits users read own" on public.deposit_credits;
create policy "deposit credits admins manage" on public.deposit_credits for all using (public.is_admin()) with check (public.is_admin());
create policy "deposit credits users read own" on public.deposit_credits for select using (
  client_id in (select id from public.clients where profile_id = auth.uid())
);

create index if not exists bookings_gift_certificate_code_id_idx on public.bookings(gift_certificate_code_id);
create index if not exists gift_card_codes_usage_idx on public.gift_card_codes(code, is_active, expires_at);
create index if not exists deposit_credits_client_id_idx on public.deposit_credits(client_id);
