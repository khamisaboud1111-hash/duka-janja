-- ============================================================
-- Duka Janja — Migration 010: Rider RPC Functions
-- Implements the RPC functions needed by the rider frontend/API
-- Run AFTER 009_rider_system.sql
-- ============================================================

-- Find nearest available rider (used for dispatch)
create or replace function find_nearest_available_rider(
  p_pickup_lat numeric,
  p_pickup_lng numeric,
  p_max_distance_km integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  -- Find the nearest available rider within max distance
  with nearby_riders as (
    select
      rp.id as rider_id,
      rp.user_id,
      rp.full_name,
      rp.vehicle_type,
      rp.rating,
      rp.total_deliveries,
      rps.current_lat,
      rps.current_lng,
      (
        6371 * acos(
          cos(radians(p_pickup_lat)) * cos(radians(rps.current_lat)) *
          cos(radians(rps.current_lng) - radians(p_pickup_lng)) +
          sin(radians(p_pickup_lat)) * sin(radians(rps.current_lat))
        )
      ) as distance_km
    from rider_profiles rp
    join rider_public_status rps on rps.rider_id = rp.id
    where rp.status = 'approved'
      and rps.is_online = true
      and rps.is_available = true
      and rps.current_lat is not null
      and rps.current_lng is not null
      and rps.last_update > now() - interval '5 minutes'
  )
  select jsonb_build_object(
    'rider_id', rider_id,
    'user_id', user_id,
    'full_name', full_name,
    'vehicle_type', vehicle_type,
    'rating', rating,
    'total_deliveries', total_deliveries,
    'distance_km', round(distance_km::numeric, 2)
  ) into v_result
  from nearby_riders
  where distance_km <= p_max_distance_km
  order by distance_km asc
  limit 1;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object('found', true, 'rider', v_result);
end;
$$;

-- Get rider metrics (earnings, deliveries, rating)
create or replace function get_rider_metrics(p_rider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_deliveries', coalesce(total_deliveries, 0),
    'total_earnings', coalesce(total_earnings, 0),
    'wallet_balance', coalesce(wallet_balance, 0),
    'rating', coalesce(rating, 0),
    'rating_count', (
      select count(*) from rider_reviews where rider_id = p_rider_id
    ),
    'this_week_deliveries', (
      select count(*) from deliveries
      where rider_id = p_rider_id
        and delivered_at >= now() - interval '7 days'
        and status = 'delivered'
    ),
    'this_week_earnings', (
      select coalesce(sum(net_amount), 0) from rider_earnings
      where rider_id = p_rider_id and status = 'available'
        and created_at >= now() - interval '7 days'
    ),
    'pending_payout', (
      select coalesce(sum(net_amount), 0) from rider_earnings
      where rider_id = p_rider_id and status = 'available'
    )
  ) into v_result
  from rider_profiles
  where id = p_rider_id;

  if not found then
    raise exception 'Rider not found: %', p_rider_id;
  end if;

  return v_result;
end;
$$;

-- Get active delivery for a rider
create or replace function get_active_delivery_for_rider(p_rider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', d.id,
    'order_id', d.order_id,
    'status', d.status,
    'pickup_address', d.pickup_address,
    'dropoff_address', d.dropoff_address,
    'pickup_lat', d.pickup_lat,
    'pickup_lng', d.pickup_lng,
    'dropoff_lat', d.dropoff_lat,
    'dropoff_lng', d.dropoff_lng,
    'fee', d.fee,
    'rider_fee', d.rider_fee,
    'picked_up_at', d.picked_up_at,
    'out_for_delivery_at', d.out_for_delivery_at,
    'distance_km', d.distance_km
  ) into v_result
  from deliveries d
  where d.rider_id = p_rider_id
    and d.status in ('accepted', 'picked_up', 'out_for_delivery')
  order by d.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('active', false);
  end if;

  return jsonb_build_object('active', true, 'delivery', v_result);
end;
$$;

-- List online riders near a location (for dispatch)
create or replace function list_online_riders(
  p_lat numeric,
  p_lng numeric,
  p_radius_km integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  with nearby as (
    select
      rp.id as rider_id,
      rp.full_name,
      rp.vehicle_type,
      rp.rating,
      rp.total_deliveries,
      rps.current_lat,
      rps.current_lng,
      (
        6371 * acos(
          cos(radians(p_lat)) * cos(radians(rps.current_lat)) *
          cos(radians(rps.current_lng) - radians(p_lng)) +
          sin(radians(p_lat)) * sin(radians(rps.current_lat))
        )
      ) as distance_km
    from rider_profiles rp
    join rider_public_status rps on rps.rider_id = rp.id
    where rp.status = 'approved'
      and rps.is_online = true
      and rps.is_available = true
      and rps.current_lat is not null
      and rps.current_lng is not null
      and rps.last_update > now() - interval '5 minutes'
  )
  select jsonb_agg(
    jsonb_build_object(
      'rider_id', rider_id,
      'full_name', full_name,
      'vehicle_type', vehicle_type,
      'rating', rating,
      'total_deliveries', total_deliveries,
      'distance_km', round(distance_km::numeric, 2)
    )
    order by distance_km
  ) into v_result
  from nearby
  where distance_km <= p_radius_km;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Get active delivery for an order
create or replace function get_active_delivery_for_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'id', d.id,
    'rider_id', d.rider_id,
    'status', d.status,
    'rider_name', rp.full_name,
    'rider_phone', rp.phone,
    'pickup_address', d.pickup_address,
    'dropoff_address', d.dropoff_address,
    'pickup_lat', d.pickup_lat,
    'pickup_lng', d.pickup_lng,
    'dropoff_lat', d.dropoff_lat,
    'dropoff_lng', d.dropoff_lng,
    'accepted_at', d.accepted_at,
    'picked_up_at', d.picked_up_at,
    'out_for_delivery_at', d.out_for_delivery_at
  ) into v_result
  from deliveries d
  left join rider_profiles rp on rp.id = d.rider_id
  where d.order_id = p_order_id
    and d.status in ('offered', 'accepted', 'picked_up', 'out_for_delivery', 'delivered')
  order by d.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object('active', false);
  end if;

  return jsonb_build_object('active', true, 'delivery', v_result);
end;
$$;

-- Grant execute
grant execute on function find_nearest_available_rider(numeric, numeric, integer) to authenticated;
grant execute on function get_rider_metrics(uuid) to authenticated;
grant execute on function get_active_delivery_for_rider(uuid) to authenticated;
grant execute on function list_online_riders(numeric, numeric, integer) to authenticated;
grant execute on function get_active_delivery_for_order(uuid) to authenticated;