-- Admin-configurable business settings used by the operations dashboard.
-- Additive + idempotent.
alter table public.business_settings
  add column if not exists booking_minimum_notice_hours int not null default 48,
  add column if not exists intake_expiration_months     int not null default 6,
  add column if not exists business_name        text,
  add column if not exists contact_email        text,
  add column if not exists contact_phone        text,
  add column if not exists service_area         text,
  add column if not exists wedding_travel_policy text,
  add column if not exists instagram_url        text,
  add column if not exists facebook_url         text,
  add column if not exists tiktok_url           text,
  add column if not exists footer_text          text,
  add column if not exists booking_policy       text,
  add column if not exists cancellation_policy  text,
  add column if not exists deposit_policy       text;
