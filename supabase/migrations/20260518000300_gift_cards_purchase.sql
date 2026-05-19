-- Add purchase metadata to gift_card_codes for online Square purchases
alter table public.gift_card_codes
  add column if not exists balance_cents      int,
  add column if not exists recipient_email    text,
  add column if not exists purchased_at       timestamptz,
  add column if not exists square_order_id    text;
