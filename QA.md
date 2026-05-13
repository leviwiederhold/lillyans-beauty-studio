# Lillyan's Beauty Studio QA Notes

## Manual Verification Checklist

- Booking request creation: visit `/book`, choose an active service, select an available slot, enter contact info, complete intake fields when the service requires intake, and submit. Verify a `bookings` row is created with `status = pending`.
- Admin booking management: log in as an approved admin, visit `/admin/bookings`, confirm/cancel/reschedule/complete/no-show a booking, and verify `admin_audit_log` records the change.
- Client account access: log in at `/account/login`, visit `/account`, and verify only the signed-in client's profile, bookings, intake forms, and memberships are visible.
- Contact form submission: submit the homepage contact form and verify `contact_inquiries` receives the row and the UI shows success/error state.
- Intake form submission: open an intake modal from the homepage, submit required fields, and verify `intake_forms` stores the service type and payload.
- RLS access protection: use a non-admin Supabase user and confirm admin routes redirect/deny access; confirm client policies only expose owned records.
- Mobile layout: check homepage, `/book`, `/account`, and admin list pages at mobile widths.
- CTA links: verify booking, gift cards, care, about, memberships, privacy, and terms are internal. Social links may remain external.

## Intentional Temporary Dependency

- `static.wixstatic.com` image URLs remain as temporary image CDN sources so the public design stays visually unchanged while owned media assets are prepared.
