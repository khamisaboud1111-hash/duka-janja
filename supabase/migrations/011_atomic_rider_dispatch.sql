-- ============================================================
-- Duka Janja — Migration 011: Atomic Rider Dispatch
-- Atomic dispatch with row locking to prevent double-claim
-- Run AFTER 010_rider_rpc_functions.sql
-- ============================================================

-- Atomic function to offer delivery to nearest available riders
-- Returns the delivery_id and which rider was offered (or null if none accepted)
create or replace function dispatch_delivery_to_rider(
  p_order_id uuid,
  p_pickup_lat numeric,
  p_pickup_lng numeric,
  p_dropoff_lat numeric,
  p_dropoff_lng numeric,
  p_pickup_address text,
  p_dropoff_address text,
  p_fee integer,
  p_rider_fee integer,
  p_platform_fee integer,
  p_max_distance_km integer default 10,
  p_offer_timeout_minutes integer default 5
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_id uuid;
  v_rider_id uuid;
  v_rider_user_id uuid;
  v_distance_km numeric;
  v_offer_expires timestamptz;
  v_result jsonb;
  v_accepted boolean := false;
begin
  -- 1. Verify order exists and is ready for dispatch
  if not exists (
    select 1 from orders where id = p_order_id and status = 'confirmed'
  ) then
    raise exception 'Order not found or not ready for dispatch';
  end if;

  -- 2. Check if delivery already exists for this order
  if exists (select 1 from deliveries where order_id = p_order_id and status in ('offered', 'accepted', 'picked_up', 'out_for_delivery')) then
    raise exception 'Delivery already dispatched for this order';
  end if;

  -- 3. Calculate distance
  select (
    6371 * acos(
      cos(radians(p_pickup_lat)) * cos(radians(p_dropoff_lat)) *
      cos(radians(p_dropoff_lng) - radians(p_pickup_lng)) +
      sin(radians(p_pickup_lat)) * sin(radians(p_dropoff_lat))
    )
  ) into v_distance_km;

  -- 4. Find nearest available rider within max distance
  -- Use FOR UPDATE SKIP LOCKED to prevent race conditions
  select rp.id, rp.user_id,
    (
      6371 * acos(
        cos(radians(p_pickup_lat)) * cos(radians(rps.current_lat)) *
        cos(radians(rps.current_lng) - radians(p_dropoff_lng)) +
        sin(radians(p_pickup_lat)) * sin(radians(rps.current_lat))
      )
    ) as distance_km
  into v_rider_id, v_rider_user_id, v_distance_km
  from rider_profiles rp
  join rider_public_status rps on rps.rider_id = rp.id
  where rp.status = 'approved'
    and rps.is_online = true
    and rps.is_available = true
    and rps.current_lat is not null
    and rps.current_lng is not null
    and rps.last_update > now() - interval '5 minutes'
    and (
      6371 * acos(
        cos(radians(p_pickup_lat)) * cos(radians(rps.current_lat)) *
        cos(radians(rps.current_lng) - radians(p_dropoff_lng)) +
        sin(radians(p_pickup_lat)) * sin(radians(rps.current_lat))
      )
    ) <= p_max_distance_km
    and rp.id not in (
      -- Exclude riders with active deliveries
      select rider_id from deliveries
      where status in ('offered', 'accepted', 'picked_up', 'out_for_delivery')
    )
  order by distance_km asc
  limit 1
  for update skip locked;

  if not found then
    return jsonb_build_object(
      'dispatched', false,
      'reason', 'no_available_riders',
      'message', 'No available riders within ' || p_max_distance_km || 'km'
    );
  end if;

  -- 5. Create delivery record with 'offered' status
  v_offer_expires := now() + (p_offer_timeout_minutes || ' minutes')::interval;

  insert into deliveries (
    order_id, rider_id, status,
    pickup_lat, pickup_lng, pickup_address,
    dropoff_lat, dropoff_lng, dropoff_address,
    distance_km, estimated_duration_min,
    fee, rider_fee, platform_fee,
    offered_at, offer_expires_at
  ) values (
    p_order_id, v_rider_id, 'offered',
    p_pickup_lat, p_pickup_lng, p_pickup_address,
    p_dropoff_lat, p_dropoff_lng, p_dropoff_address,
    v_distance_km, round(v_distance_km * 2)::integer, -- rough estimate: 2 min/km
    p_fee, p_rider_fee, p_platform_fee,
    now(), v_offer_expires
  ) returning id into v_delivery_id;

  -- 5. Notify rider (via realtime/push notification)
  select user_id into v_rider_user_id from rider_profiles where id = v_rider_id;
  
  if v_rider_user_id is not null then
    insert into notifications (user_id, type, title_en, title_sw, body_en, body_sw, link)
    values (
      v_rider_user_id, 'delivery_offered',
      'New delivery offer',
      'Mkopo mpya wa usafirishaji',
      'You have a new delivery offer. Accept within ' || p_offer_timeout_minutes || ' minutes.',
      'Una mkopo mpya wa usafirishaji. Kubali ndani ya dakika ' || p_offer_timeout_minutes || '.',
      '/rider/deliveries/' || v_delivery_id
    );
  end if;

  return jsonb_build_object(
    'dispatched', true,
    'delivery_id', v_delivery_id,
    'rider_id', v_rider_id,
    'distance_km', round(v_distance_km::numeric, 2),
    'offer_expires_at', v_offer_expires,
    'message', 'Delivery offered to rider'
  );
exception
  when others then
    raise exception 'Dispatch failed: %', sqlerrm;
end;
$$;

-- Function for rider to accept/decline an offer
create or replace function respond_to_delivery_offer(
  p_delivery_id uuid,
  p_accept boolean
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery record;
  v_rider_id uuid;
  v_rider_user_id uuid;
begin
  -- Get delivery and lock it
  select * into v_delivery
  from deliveries
  where id = p_delivery_id
    and status = 'offered'
  for update;

  if not found then
    raise exception 'Delivery offer not found or already responded to';
  end if;

  -- Verify this rider is the one the offer was sent to
  if not exists (
    select 1 from rider_profiles
    where id = (select rider_id from deliveries where id = p_delivery_id)
      and user_id = auth.uid()
  ) then
    raise exception 'Not authorized to respond to this offer';
  end if;

  if p_accept then
    -- Accept the delivery
    update deliveries
    set status = 'accepted',
        accepted_at = now(),
        updated_at = now()
    where id = p_delivery_id;

    -- Update rider public status
    update rider_public_status
    set is_available = false,
        current_delivery_id = p_delivery_id
    where rider_id = (select rider_id from deliveries where id = p_delivery_id);

    -- Notify buyer/seller
    insert into notifications (user_id, type, title_en, title_sw, body_en, body_sw, link)
    select o.buyer_id, 'delivery_accepted',
      'Delivery accepted',
      'Usafirishaji umekubaliwa',
      'Your order has been accepted by a rider.',
      'Agizo lako limekubaliwa na dereva.',
      '/orders/' || p_delivery_id
    from orders o where o.id = (select order_id from deliveries where id = p_delivery_id);

    return jsonb_build_object('accepted', true, 'message', 'Delivery accepted');
  else
    -- Decline: mark as cancelled, will trigger redispatch
    update deliveries
    set status = 'cancelled',
        cancel_reason = 'rider_declined',
        cancelled_at = now(),
        updated_at = now()
    where id = p_delivery_id;

    return jsonb_build_object('accepted', false, 'message', 'Delivery declined');
  end if;
end;
$$;

-- Function to handle offer timeout (called by cron or scheduler)
create or replace function handle_delivery_offer_timeout()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired_deliveries record;
  v_count integer := 0;
begin
  for v_expired_deliveries in
    select id from deliveries
    where status = 'offered'
      and offer_expires_at < now()
  loop
    -- Mark as expired/cancelled
    update deliveries
    set status = 'cancelled',
        cancel_reason = 'offer_timeout',
        cancelled_at = now(),
        updated_at = now()
    where id = v_expired_deliveries.id;

    -- Trigger redispatch for the same order
    -- This would typically be called by a cron job that then calls dispatch_delivery_to_rider again
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Function for rider to update delivery status (picked_up, out_for_delivery, delivered)
create or replace function update_delivery_status(
  p_delivery_id uuid,
  p_new_status text, -- 'picked_up' | 'out_for_delivery' | 'delivered'
  p_lat numeric default null,
  p_lng numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery record;
  v_allowed_statuses text[] := array['picked_up', 'out_for_delivery', 'delivered'];
  v_next_status text;
  v_order_id uuid;
begin
  if p_new_status not in (select unnest(v_allowed_statuses)) then
    raise exception 'Invalid status transition';
  end if;

  select * into v_delivery
  from deliveries
  where id = p_delivery_id
    and rider_id = (select id from rider_profiles where user_id = auth.uid())
  for update;

  if not found then
    raise exception 'Delivery not found or not assigned to you';
  end if;

  -- Validate transition
  if v_delivery.status = 'accepted' and p_new_status != 'picked_up' then
    raise exception 'Must pick up order first';
  end if;
  if v_delivery.status = 'picked_up' and p_new_status != 'out_for_delivery' then
    raise exception 'Must start delivery after pickup';
  end if;
  if v_delivery.status = 'out_for_delivery' and p_new_status != 'delivered' then
    raise exception 'Must complete delivery';
  end if;

  v_next_status := p_new_status;

  update deliveries
  set status = v_next_status,
      case v_next_status
        when 'picked_up' then picked_up_at
        when 'out_for_delivery' then out_for_delivery_at
        when 'delivered' then delivered_at
      end = now(),
      updated_at = now(),
      case when p_lat is not null and p_lng is not null then
        current_lat = p_lat, current_lng = p_lng
      end
  where id = p_delivery_id;

  -- Update rider public status
  if v_next_status = 'picked_up' or v_next_status = 'out_for_delivery' then
    update rider_public_status
    set is_available = false,
        current_delivery_id = p_delivery_id,
        current_lat = p_lat,
        current_lng = p_lng,
        last_update = now()
      where rider_id = (select rider_id from deliveries where id = p_delivery_id);
  elsif v_next_status = 'delivered' then
    update rider_public_status
    set is_available = true,
        current_delivery_id = null,
        current_lat = p_lat,
        current_lng = p_lng,
        last_update = now()
      where rider_id = (select rider_id from deliveries where id = p_delivery_id);

    -- Create earnings record
    insert into rider_earnings (rider_id, delivery_id, amount, platform_fee, net_amount)
    select d.rider_id, d.id, d.rider_fee, d.platform_fee, d.rider_fee - d.platform_fee
    from deliveries d where d.id = p_delivery_id;

    -- Update order status via RPC (will trigger order state machine)
    select order_id into v_order_id from deliveries where id = p_delivery_id;
    perform update_order_status(v_order_id, 'delivered', 'Delivered by rider');
  end if;

  return jsonb_build_object('success', true, 'status', v_next_status);
end;
$$;

-- Grant execute
grant execute on function dispatch_delivery_to_rider(uuid, numeric, numeric, numeric, numeric, text, text, integer, integer, integer, integer, integer) to authenticated;
grant execute on function respond_to_delivery_offer(uuid, boolean) to authenticated;
grant execute on function handle_delivery_offer_timeout() to authenticated;
grant execute on function update_delivery_status(uuid, text, numeric, numeric) to authenticated;