-- Add missing columns to memberships table
alter table public.memberships
  add column if not exists price_cents      int,
  add column if not exists started_at       timestamptz,
  add column if not exists square_order_id  text,
  add column if not exists plan_ref_id      uuid;

-- Backfill price_cents for existing plan rows (status = 'plan')
update public.memberships set price_cents = 6000  where plan_name ilike '%glow%'      and status = 'plan';
update public.memberships set price_cents = 13000 where plan_name ilike '%radiance%'  and status = 'plan';
update public.memberships set price_cents = 20000 where plan_name ilike '%luminary%'  and status = 'plan';
