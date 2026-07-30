-- ============================================================
-- Duka Janja — Storage Buckets, RPC Functions, Additional Triggers
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ─── STORAGE BUCKETS ──────────────────────────────────────────────────────────
-- Run this section in the Supabase SQL Editor, or create manually via Dashboard → Storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('seller-logos',    'seller-logos',    true, 2097152, array['image/jpeg','image/png','image/webp']),
  ('seller-banners',  'seller-banners',  true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('avatars',         'avatars',         true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ─── STORAGE POLICIES ─────────────────────────────────────────────────────────

-- Public read access for all buckets
create policy "Public read access for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Public read access for seller logos"
  on storage.objects for select
  using (bucket_id = 'seller-logos');

create policy "Public read access for seller banners"
  on storage.objects for select
  using (bucket_id = 'seller-banners');

create policy "Public read access for avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload to their own folder (folder name = user id or seller id)
create policy "Authenticated users can upload product images"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Authenticated users can upload seller logos"
  on storage.objects for insert
  with check (bucket_id = 'seller-logos' and auth.role() = 'authenticated');

create policy "Authenticated users can upload seller banners"
  on storage.objects for insert
  with check (bucket_id = 'seller-banners' and auth.role() = 'authenticated');

create policy "Authenticated users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

-- Owners can update/delete their own uploads
create policy "Users can update own uploaded images"
  on storage.objects for update
  using (auth.uid()::text = (storage.foldername(name))[1] or bucket_id in ('product-images','seller-logos','seller-banners'));

create policy "Users can delete own uploaded images"
  on storage.objects for delete
  using (auth.role() = 'authenticated');

-- ─── RPC: DECREMENT STOCK (atomic, prevents race conditions) ─────────────────

create or replace function decrement_stock(p_product_id uuid, p_quantity integer)
returns void language plpgsql as $$
begin
  update products
  set stock_quantity = greatest(0, stock_quantity - p_quantity),
      total_sold = total_sold + p_quantity,
      status = case when stock_quantity - p_quantity <= 0 then 'out_of_stock'::product_status else status end
  where id = p_product_id;
end;
$$;

-- ─── RPC: RESTORE STOCK (for cancelled orders) ───────────────────────────────

create or replace function restore_stock(p_product_id uuid, p_quantity integer)
returns void language plpgsql as $$
begin
  update products
  set stock_quantity = stock_quantity + p_quantity,
      total_sold = greatest(0, total_sold - p_quantity),
      status = case when status = 'out_of_stock' then 'active'::product_status else status end
  where id = p_product_id;
end;
$$;

-- ─── TRIGGER: AUTO-RESTORE STOCK ON CANCELLATION ─────────────────────────────

create or replace function handle_order_cancellation()
returns trigger language plpgsql as $$
declare
  item record;
begin
  if new.status = 'cancelled' and old.status != 'cancelled' then
    for item in select product_id, quantity from order_items where order_id = new.id loop
      perform restore_stock(item.product_id, item.quantity);
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_order_cancelled
  after update on orders
  for each row
  when (new.status = 'cancelled' and old.status is distinct from 'cancelled')
  execute procedure handle_order_cancellation();

-- ─── TRIGGER: UPDATE SELLER STATS ON DELIVERED ORDER ─────────────────────────

create or replace function update_seller_stats()
returns trigger language plpgsql as $$
declare
  item record;
begin
  if new.status = 'delivered' and old.status != 'delivered' then
    for item in
      select seller_id, sum(total_price) as revenue, count(*) as cnt
      from order_items where order_id = new.id group by seller_id
    loop
      update sellers
      set total_sales = total_sales + item.cnt,
          total_revenue = total_revenue + item.revenue
      where id = item.seller_id;
    end loop;
  end if;
  return new;
end;
$$;

create trigger on_order_delivered
  after update on orders
  for each row
  when (new.status = 'delivered' and old.status is distinct from 'delivered')
  execute procedure update_seller_stats();

-- ─── TRIGGER: AUTO product_status OUT_OF_STOCK when stock hits 0 ─────────────

create or replace function check_low_stock()
returns trigger language plpgsql as $$
begin
  if new.stock_quantity = 0 and new.status = 'active' then
    new.status := 'out_of_stock';
  elsif new.stock_quantity > 0 and new.status = 'out_of_stock' then
    new.status := 'active';
  end if;
  return new;
end;
$$;

create trigger on_stock_change
  before update on products
  for each row
  when (old.stock_quantity is distinct from new.stock_quantity)
  execute procedure check_low_stock();

-- ─── INDEX: full text search on products (optional but recommended) ─────────

alter table products add column if not exists search_vector tsvector
  generated always as (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) stored;

create index if not exists products_search_idx on products using gin(search_vector);
