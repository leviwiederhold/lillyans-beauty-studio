alter table public.memberships
  add column if not exists plan_id text,
  add column if not exists monthly_price_cents int,
  add column if not exists benefits text[] not null default '{}',
  add column if not exists square_customer_id text,
  add column if not exists square_subscription_id text,
  add column if not exists square_payment_id text,
  add column if not exists square_order_id text,
  add column if not exists square_checkout_url text,
  add column if not exists started_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists next_billing_at timestamptz;

create index if not exists memberships_plan_id_idx on public.memberships (plan_id);
create index if not exists memberships_square_order_id_idx on public.memberships (square_order_id);
create index if not exists memberships_square_subscription_id_idx on public.memberships (square_subscription_id);

update public.memberships
set plan_id = lower(plan_name),
    monthly_price_cents = case
      when lower(plan_name) = 'glow' then 6000
      when lower(plan_name) = 'radiance' then 13000
      when lower(plan_name) = 'luminary' then 20000
      else monthly_price_cents
    end,
    benefits = case
      when benefits = '{}'::text[] and perks is not null then string_to_array(perks, E'\n')
      else benefits
    end
where status = 'plan';
