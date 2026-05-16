alter table public.contact_inquiries
  add column if not exists occasion text,
  add column if not exists occasion_detail text;
