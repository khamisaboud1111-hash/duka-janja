-- ============================================================
-- OPTIONAL: Sample sellers + products for testing/demo purposes
-- Do NOT run this in production — it creates fake auth users.
-- Run AFTER 001 and 002 migrations.
-- ============================================================

-- This script assumes you have already created real auth users via
-- Supabase Auth (sign up through the app) for at least 2 sellers.
-- Replace the UUIDs below with real profile IDs from your `profiles` table.

-- 1. Find your seller user IDs:
--    select id, email, full_name from profiles where role = 'seller';

-- 2. Then insert sample sellers (replace 'YOUR-USER-ID-1' etc. with real UUIDs):

/*
insert into sellers (user_id, store_name, store_slug, description, whatsapp_number, status, commission_rate, is_featured)
values
  ('YOUR-USER-ID-1', 'Spice Island Store', 'spice-island-store', 'Viungo bora kutoka mashamba ya Zanzibar', '255777111111', 'approved', 5.00, true),
  ('YOUR-USER-ID-2', 'Fatuma Kikoi Shop', 'fatuma-kikoi-shop', 'Mavazi ya asili ya Zanzibar', '255777222222', 'approved', 8.00, true);
*/

-- 3. Then insert sample products referencing the seller IDs and category IDs:

/*
insert into products (seller_id, category_id, name, slug, description, price, stock_quantity, status, is_made_in_zanzibar)
select
  s.id,
  c.id,
  'Pilipili Manga (Black Pepper)',
  'pilipili-manga-black-pepper',
  'Pilipili manga safi kutoka mashamba ya Zanzibar. Inafaa kwa kupikia na ina ladha kali.',
  8500,
  50,
  'active',
  true
from sellers s, categories c
where s.store_slug = 'spice-island-store' and c.slug = 'spices'
limit 1;
*/

-- 4. Add product images separately after uploading via Supabase Storage dashboard
--    or through the seller dashboard UI at /seller/products/new

-- NOTE: It's strongly recommended to seed real data through the actual
-- application UI (register as seller → admin approves → add products with
-- real uploaded images) rather than raw SQL, since image_urls require
-- actual files in Supabase Storage to render correctly.
