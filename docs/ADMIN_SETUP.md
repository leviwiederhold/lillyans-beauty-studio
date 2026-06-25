# Admin Operations Dashboard — Setup & Notes

## 1. Database
Apply migrations (Supabase CLI `db push`, or paste in the SQL Editor). New in this PR:
- `supabase/migrations/20260518000800_admin_business_settings.sql` — adds admin-editable
  business settings columns (min notice, intake freshness, business info, social, policies, footer).

> If the production DB is missing earlier tables (notably `client_forms`), apply all
> pending migrations under `supabase/migrations/` first (they are idempotent).

## 2. Make Lilly an admin
Admin access is **server-enforced** via `profiles.role = 'admin'` / `is_admin = true`.
Signups can never self-assign admin (`handle_new_user` forces `client`/`false`).

1. Create the account: sign up at `/signup` **or** Supabase Dashboard → Authentication →
   Users → Add user (check *Auto Confirm User*) with `lillyansbeautystudio@gmail.com`.
2. Run `supabase/seed_admin.sql`.

## 3. Environment variables (all server-side)
See `.env.example`. Required for full functionality:

| Var | Purpose |
|-----|---------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client/auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin queries (never sent to the browser) |
| `NEXT_PUBLIC_SITE_URL` | Absolute URLs for Square redirects/webhooks |
| `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `SQUARE_APPLICATION_ID`, `SQUARE_ENVIRONMENT` | Square deposits/checkout (Square only — no Stripe) |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | Verifies Square webhooks that update deposit/booking status |
| `RESEND_API_KEY`, `ADMIN_NOTIFICATION_EMAIL`, `FROM_EMAIL` | Email notifications |

**If Square is not configured:** the booking flow falls back to a clear pending state
(no fake "paid"); admins see real deposit status. **If Resend is not configured:**
database state is still written correctly; no email is sent and nothing is faked.

## 4. Routing / access behavior
- Signed out → `/admin/*` redirects to `/login?next=/admin`.
- Signed in, not admin → styled `/admin/no-access` page.
- Admin visiting `/account` → redirected to `/admin`.
- Any admin render error is contained by `app/admin/error.tsx` (recoverable UI + logged digest).

## 5. Timezone
Slot generation + the 48-hour notice rule use America/New_York (Cincinnati) via
`lib/availability.ts`. Admin list dates render in the viewer's locale.
