-- Booking lead-time + intake expiration settings, gift card detail storage, and
-- linking a booking to the intake form that satisfied it. All additive/idempotent.

-- 1) Studio-configurable rules.
alter table public.business_settings
  add column if not exists booking_minimum_notice_hours int not null default 48,
  add column if not exists intake_expiration_months     int not null default 6;

-- 2) Express booking: track when a client last confirmed their health info, and
--    which form satisfied a given booking.
alter table public.client_forms
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists status           text not null default 'completed';

alter table public.bookings
  add column if not exists client_form_id uuid references public.client_forms(id) on delete set null;

-- 3) Gift card inquiries: store the rich recipient / delivery / shipping payload.
alter table public.contact_inquiries
  add column if not exists details jsonb;
