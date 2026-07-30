-- ─── SEED: Categories ─────────────────────────────────────────────────────────

insert into categories (name_en, name_sw, slug, icon, sort_order) values
  ('Spices & Herbs',    'Viungo na Mimea',      'spices',      '🌶️',  1),
  ('Fashion & Clothing','Mavazi na Mitindo',     'fashion',     '👗',  2),
  ('Food & Groceries',  'Chakula na Vitu',       'food',        '🥥',  3),
  ('Crafts & Art',      'Sanaa na Ufundi',       'crafts',      '🎨',  4),
  ('Electronics',       'Vifaa vya Umeme',       'electronics', '📱',  5),
  ('Home & Living',     'Nyumba na Maisha',      'home',        '🏠',  6),
  ('Beauty & Health',   'Uzuri na Afya',         'beauty',      '💆',  7),
  ('Agriculture',       'Kilimo',                'agriculture', '🌾',  8);

-- ─── SEED: Storage Buckets (run separately in Supabase dashboard) ─────────────
-- Create these buckets in Supabase Storage:
-- • product-images   (public)
-- • seller-logos     (public)
-- • seller-banners   (public)
-- • avatars          (public)
