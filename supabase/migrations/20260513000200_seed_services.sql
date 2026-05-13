insert into public.service_categories (name, description, sort_order)
values
  ('Wedding Makeup', 'Wedding and bridal party makeup services.', 10),
  ('Permanent Makeup', 'Brows, lips, eyeliner, touch-ups, and corrections.', 20),
  ('Facials', 'Customized skin treatments.', 30),
  ('Waxing', 'Face and body waxing services.', 40),
  ('Lifts & Tints', 'Brow and lash lift or tint services.', 50),
  ('Makeup', 'Formal and event makeup services.', 60)
on conflict (name) do update set
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.services (category_id, name, description, service_total, duration_minutes, requires_intake, intake_type, requires_deposit, sort_order)
select c.id, v.name, v.description, v.service_total, v.duration_minutes, v.requires_intake, v.intake_type, true, v.sort_order
from (
  values
    ('Wedding Makeup', 'Wedding Makeup Inquiry', 'Wedding makeup request for brides and bridal parties.', 0, 60, true, 'wedding_inquiry', 10),
    ('Permanent Makeup', 'Microblading', 'Natural brow hairstroke permanent makeup.', 0, 120, true, 'permanent_makeup', 20),
    ('Permanent Makeup', 'Powder / Ombre Brows', 'Soft powder brow permanent makeup.', 0, 120, true, 'permanent_makeup', 30),
    ('Permanent Makeup', 'Lip Blush', 'Permanent lip color and definition.', 0, 120, true, 'permanent_makeup', 40),
    ('Permanent Makeup', 'Permanent Eyeliner', 'Permanent eyeliner service.', 0, 120, true, 'permanent_makeup', 50),
    ('Permanent Makeup', 'Touch-Up / Correction Session', 'Permanent makeup touch-up or correction.', 0, 90, true, 'permanent_makeup', 60),
    ('Facials', 'Facial', 'Customized facial treatment.', 0, 60, true, 'facial', 70),
    ('Waxing', 'Waxing', 'Waxing appointment.', 0, 30, true, 'waxing', 80),
    ('Lifts & Tints', 'Brow Lift & Tint', 'Brow lift and tint service.', 0, 45, false, null, 90),
    ('Lifts & Tints', 'Lash Lift & Tint', 'Lash lift and tint service.', 0, 45, false, null, 100),
    ('Makeup', 'Formal Makeup', 'Formal or event makeup appointment.', 0, 60, false, null, 110)
) as v(category_name, name, description, service_total, duration_minutes, requires_intake, intake_type, sort_order)
join public.service_categories c on c.name = v.category_name
on conflict (name) do update set
  category_id = excluded.category_id,
  description = excluded.description,
  duration_minutes = excluded.duration_minutes,
  requires_intake = excluded.requires_intake,
  intake_type = excluded.intake_type,
  requires_deposit = excluded.requires_deposit,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into public.business_hours (day_of_week, opens_at, closes_at, is_closed)
values
  (0, null, null, true),
  (1, '10:00', '17:00', false),
  (2, '10:00', '17:00', false),
  (3, '10:00', '17:00', false),
  (4, '10:00', '17:00', false),
  (5, '10:00', '17:00', false),
  (6, '10:00', '14:00', false)
on conflict (day_of_week) do update set
  opens_at = excluded.opens_at,
  closes_at = excluded.closes_at,
  is_closed = excluded.is_closed,
  updated_at = now();

insert into public.availability_rules (day_of_week, start_time, end_time, is_active)
select day_of_week, opens_at, closes_at, true
from public.business_hours
where is_closed = false
  and opens_at is not null
  and closes_at is not null
  and not exists (
    select 1 from public.availability_rules ar
    where ar.day_of_week = business_hours.day_of_week
      and ar.start_time = business_hours.opens_at
      and ar.end_time = business_hours.closes_at
  );

insert into public.business_settings (
  id,
  business_hours,
  service_availability,
  travel_wedding_availability,
  booking_url,
  gift_card_url,
  gift_card_auto_confirm
)
values (
  1,
  'Editable in admin settings.',
  'Services and durations are managed in the admin dashboard.',
  'Available for weddings in Cincinnati, Ohio and beyond. Travel within the United States may be available when travel expenses are covered.',
  '/book',
  '/gift-cards',
  false
)
on conflict (id) do update set
  travel_wedding_availability = excluded.travel_wedding_availability,
  booking_url = excluded.booking_url,
  gift_card_url = excluded.gift_card_url,
  updated_at = now();
