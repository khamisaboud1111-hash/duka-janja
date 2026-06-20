-- ============================================================
-- Promote a user to admin
-- Run AFTER that user has signed up through the app
-- ============================================================

-- Replace with the actual email of the user you want to make admin
update profiles
set role = 'admin'
where email = 'admin@dukajanja.co.tz';

-- Verify
select id, email, full_name, role from profiles where role = 'admin';
