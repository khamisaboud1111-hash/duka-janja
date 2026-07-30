-- ─────────────────────────────────────────────────────────────────────────────
-- 005_homepage_upgrade.sql
-- Adds seller geolocation (for the homepage marketplace map) and a public,
-- security-definer RPC that returns real, aggregated homepage statistics
-- without exposing any row-level data that RLS would otherwise block.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Seller geolocation (for "Marketplace Map" section) ──────────────────────
alter table sellers
  add column if not exists latitude  numeric(9,6),
  add column if not exists longitude numeric(9,6),
  add column if not exists location_label text; -- e.g. "Stone Town, Mji Mkongwe"

create index if not exists sellers_geo_idx on sellers(latitude, longitude)
  where latitude is not null and longitude is not null;

comment on column sellers.latitude is 'Store latitude, shown as a marker on the homepage marketplace map.';
comment on column sellers.longitude is 'Store longitude, shown as a marker on the homepage marketplace map.';

-- ─── Homepage statistics RPC ──────────────────────────────────────────────────
-- Returns only aggregate counts (no row-level data), so it is safe to expose
-- to anonymous/public callers via RPC regardless of table-level RLS policies.
create or replace function get_homepage_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'active_sellers', (
      select count(*) from sellers where status = 'approved'
    ),
    'verified_stores', (
      select count(*) from sellers
      where status = 'approved' and national_id_verified = true
    ),
    'products_available', (
      select count(*) from products where status = 'active'
    ),
    'orders_delivered', (
      select count(*) from orders where status = 'delivered'
    ),
    'active_riders', (
      select count(distinct created_by) from delivery_tracking_events
      where created_by is not null
        and status = 'out_for_delivery'
        and created_at > now() - interval '24 hours'
    )
  );
$$;

grant execute on function get_homepage_stats() to anon, authenticated;

-- ─── Public seller locations RPC (for the homepage map) ──────────────────────
-- Exposes only the minimal fields needed to render a map marker + popup card,
-- for approved sellers that have set a store location.
create or replace function get_seller_map_pins()
returns table (
  id uuid,
  store_name text,
  store_slug text,
  logo_url text,
  average_rating numeric,
  location_label text,
  latitude numeric,
  longitude numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select s.id, s.store_name, s.store_slug, s.logo_url, s.average_rating,
         s.location_label, s.latitude, s.longitude
  from sellers s
  where s.status = 'approved'
    and s.latitude is not null
    and s.longitude is not null;
$$;

grant execute on function get_seller_map_pins() to anon, authenticated;
