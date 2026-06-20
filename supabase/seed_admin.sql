-- ════════════════════════════════════════════════════════════════════════════
-- Promote the studio owner to admin.
--
-- Admin status is NEVER granted through signup (handle_new_user forces every new
-- account to role='client', is_admin=false — see 20260518000500_rls_hardening).
-- The only way to grant admin is this out-of-band statement.
--
-- Prerequisite: the account must already exist in auth (sign up via /signup, or
-- create it in Supabase Dashboard → Authentication → Users → Add user, with
-- "Auto Confirm User" checked). Creating the user auto-creates its profiles row.
-- ════════════════════════════════════════════════════════════════════════════

update public.profiles
set role = 'admin', is_admin = true
where email = 'lillyansbeautystudio@gmail.com';

-- Verify:
--   select email, role, is_admin from public.profiles
--   where email = 'lillyansbeautystudio@gmail.com';
