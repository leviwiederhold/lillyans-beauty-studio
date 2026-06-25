-- Promote the studio owner to admin.
-- Admin is NEVER granted via signup (handle_new_user forces role='client',
-- is_admin=false). This out-of-band statement is the only way to grant it.
--
-- Prerequisite: the account must already exist in Authentication (sign up at
-- /signup, or Dashboard → Authentication → Users → Add user + "Auto Confirm").
update public.profiles
set role = 'admin', is_admin = true
where email = 'lillyansbeautystudio@gmail.com';

-- Verify:
--   select email, role, is_admin from public.profiles where is_admin = true;
