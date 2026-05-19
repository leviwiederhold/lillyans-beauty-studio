-- Prevent two active bookings at the same start time (double-booking guard)
create unique index if not exists bookings_unique_starts_at
  on public.bookings (starts_at)
  where status not in ('cancelled', 'denied', 'no-show');
