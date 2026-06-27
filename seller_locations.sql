-- OPTIONAL: run this in Supabase SQL Editor after you have real approved sellers,
-- to spot-check the homepage marketplace map. Replace coordinates with each
-- seller's real store location when you collect it (e.g. via a "set my store
-- location" action in the seller dashboard).
--
-- Stone Town reference point: -6.1659, 39.2026

update sellers set
  latitude = -6.1659, longitude = 39.2026, location_label = 'Mji Mkongwe, Zanzibar'
where store_slug = 'spice-island-store';

-- Example spread around Unguja for additional demo sellers — adjust slugs as needed:
-- update sellers set latitude = -6.1357, longitude = 39.3621, location_label = 'Paje, Kusini' where store_slug = '...';
-- update sellers set latitude = -5.8783, longitude = 39.2519, location_label = 'Nungwi, Kaskazini' where store_slug = '...';
