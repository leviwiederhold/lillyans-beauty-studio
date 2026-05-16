# Lillyan's Beauty Studio

Production Next.js app for Lillyan's Beauty Studio with Supabase Auth, admin/client dashboards, internal booking, contact/intake submissions, gift-card deposit waiver logic, and Square deposit fields.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in Supabase values from the linked Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Start the app:

```bash
npm run dev
```

## Supabase Local Setup

This repo uses the standard Supabase CLI structure:

- `supabase/config.toml`
- `supabase/migrations/20260513000100_initial_backend.sql`
- `supabase/migrations/20260513000200_seed_services.sql`

Run locally with:

```bash
supabase start
supabase db reset
```

For the linked hosted project:

```bash
supabase link --project-ref <project-ref>
supabase db push
```

The migrations create:

- `profiles`
- `clients`
- `services`
- `service_categories`
- `bookings`
- `business_hours`
- `availability_rules`
- `blocked_times`
- `intake_forms`
- `memberships`
- `gallery_items`
- `business_settings`
- `gift_card_codes`
- `contact_inquiries`
- `admin_audit_log`

They also create supporting tables for gift card redemptions, deposit records, automation logs, and error logs.

## Auth And Roles

Supabase Auth creates a `profiles` row automatically for each new user. New signups always default to `profiles.role = 'client'` and `profiles.is_admin = false`.

Admin access uses the same Supabase Auth login and is controlled server-side by all of:

- `profiles.role = 'admin'`
- `profiles.is_admin = true`
- an admin email allowlist, defaulting to `lillyansbeautystudio@gmail.com`

Set additional server-only admin emails with:

```bash
ADMIN_EMAILS=
```

Promote Lilly manually in Supabase SQL:

```sql
update public.profiles
set role = 'admin', is_admin = true
where lower(email) = 'lillyansbeautystudio@gmail.com';
```

Admin routes use server-side auth and `requireAdmin()`. Client routes require a signed-in Supabase user. `/book` redirects unauthenticated users to `/login?next=/book`.

## RLS Summary

RLS is enabled on all business tables.

- Admins can view and manage all business data.
- Clients can read/update their own client profile.
- Clients can read their own bookings, intake forms, memberships, deposits, and gift card/code history.
- Public users can submit contact inquiries.
- Public users can read active services, active service categories, business hours/settings needed for booking, and published gallery items.
- Public users cannot read bookings, intake forms, clients, memberships, gift card codes, or contact inquiry records.

The app uses server actions/API routes with the service role key for trusted writes such as booking creation, intake submission, admin updates, and gift-card validation.

## Booking And Deposits

Clients must sign in before booking. Booking creation:

1. Reads the signed-in Supabase user.
2. Creates or updates the matching `clients` row with `profile_id`.
3. Validates availability against service duration, availability rules, existing bookings, and blocked times.
4. Saves a booking tied to the client.
5. Saves required intake details when needed.
6. Applies a gift-card waiver only when a valid active code exists.
7. Stores Square deposit fields when deposit payment links are configured.

Square is optional for local development. If these variables are missing, the app saves data but will not create Square checkout links:

```bash
SQUARE_ACCESS_TOKEN=
SQUARE_APPLICATION_ID=
SQUARE_LOCATION_ID=
SQUARE_WEBHOOK_SIGNATURE_KEY=
SQUARE_ENVIRONMENT=sandbox
```

No card data is stored in this app.

## Email

Emails use Resend when configured:

```bash
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=lillyansbeautystudio@gmail.com
FROM_EMAIL=Lillyan's Beauty Studio <notifications@yourdomain.com>
```

If Resend is not configured, form and booking writes still succeed and email sending is skipped gracefully.

## Vercel Deployment

Set these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `ADMIN_NOTIFICATION_EMAIL`
- `FROM_EMAIL`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_APPLICATION_ID`
- `SQUARE_LOCATION_ID`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SQUARE_ENVIRONMENT`

Before deploying, apply migrations to the linked Supabase project:

```bash
supabase db push
npm run lint
npm run typecheck
npm run build
```

## QA Commands

```bash
npm run lint
npm run typecheck
npm run build
```
