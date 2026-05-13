create table if not exists public.gift_card_inquiries (
  id uuid primary key default gen_random_uuid(),
  purchaser_name text not null,
  purchaser_email text not null,
  purchaser_phone text not null,
  recipient_name text not null,
  amount_requested text not null,
  occasion text not null check (occasion in ('Birthday', 'Anniversary', 'Wedding', 'Mother''s Day', 'Graduation', 'Holiday', 'Thank You', 'Self Care', 'Other')),
  occasion_other text,
  message text,
  preferred_contact_method text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'completed', 'cancelled')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gift_card_inquiries_created_at_idx on public.gift_card_inquiries (created_at desc);
create index if not exists gift_card_inquiries_status_idx on public.gift_card_inquiries (status);

create or replace function public.prepare_public_gift_card_inquiry()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() is not true then
    new.status = 'new';
    new.internal_notes = null;
  end if;
  return new;
end;
$$;

drop trigger if exists prepare_public_gift_card_inquiry on public.gift_card_inquiries;
create trigger prepare_public_gift_card_inquiry
before insert on public.gift_card_inquiries
for each row execute function public.prepare_public_gift_card_inquiry();

drop trigger if exists touch_gift_card_inquiries_updated_at on public.gift_card_inquiries;
create trigger touch_gift_card_inquiries_updated_at
before update on public.gift_card_inquiries
for each row execute function public.touch_updated_at();

alter table public.gift_card_inquiries enable row level security;

create policy "gift card inquiries public insert"
on public.gift_card_inquiries
for insert
with check (true);

create policy "gift card inquiries admins manage"
on public.gift_card_inquiries
for all
using (public.is_admin())
with check (public.is_admin());
