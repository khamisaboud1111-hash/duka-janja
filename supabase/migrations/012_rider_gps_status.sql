-- ============================================================
-- Duka Janja — Migration 012: Rider GPS & Status Flow Safety
-- Secure GPS updates, status transitions, throttling
-- Run AFTER 011_atomic_rider_dispatch.sql
-- ============================================================

-- Update rider GPS location (throttled, authenticated, validated)
create or replace function update_rider_location(
  p_lat numeric,
  p_lng numeric,
  p_accuracy numeric default null,
  p_heading numeric default null,
  p_speed numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rider_id uuid;
  v_last_update timestamptz;
  v_distance_moved numeric;
begin
  -- Get rider profile for current user
  select id into v_rider_id
  from rider_profiles
  where user_id = auth.uid() and status = 'approved';

  if not found then
    raise exception 'Not an approved rider';
  end if;

  -- Validate coordinates
  if p_lat < -90 or p_lat > 90 or p_lng < -180 or p_lng > 180 then
    raise exception 'Invalid coordinates';
  end if;

  -- Basic Tanzania bounds check (rough bounds)
  if p_lat < -12 or p_lat > 0 or p_lng < 29 or p_lng > 41 then
    raise exception 'Coordinates outside valid region';
  end if;

  -- Validate accuracy if provided
  if p_accuracy is not null and p_accuracy < 0 then
    raise exception 'Invalid accuracy value';
  end if;

  -- THROTTLING: Prevent excessive updates (max 1 update per 10 seconds)
  select last_update into p_last_update
  from rider_public_status
  where rider_id = (select id from rider_profiles where user_id = auth.uid());

  if p_last_update is not null and p_last_update > now() - interval '10 seconds' then
    -- Silently accept but don't update (throttling)
    return jsonb_build_object(
      'throttled', true,
      'message', 'Location update throttled'
    );
  end if;

  -- Calculate distance moved (optional validation)
  if (select current_lat from rider_public_status where rider_id = (select id from rider_profiles where user_id = auth.uid())) is not null then
    select 6371000 * acos(
      cos(radians(current_lat)) * cos(radians(p_lat)) *
      cos(radians(current_lng) - radians(p_lng)) +
      sin(radians(current_lat)) * sin(radians(p_lat))
    ) into v_distance_moved
    from rider_public_status
    where rider_id = (select id from rider_profiles where user_id = auth.uid());

    -- Flag implausible movement (> 50 m/s ≈ 180 km/h)
    if v_distance_moved is not null and v_distance_moved > 50 * (10/1000.0) then
      -- Log but don't reject - could be GPS glitch
      raise notice 'Large GPS jump detected: % meters', v_distance_moved;
    end if;
  end if;

  -- Update public status with new location
  update rider_public_status
  set current_lat = p_lat,
      current_lng = p_lng,
      accuracy = p_accuracy,
      heading = p_heading,
      speed = p_speed,
      last_update = now()
  where rider_id = (select id from rider_profiles where user_id = auth.uid());

  return jsonb_build_object('updated', true, 'timestamp', now());
exception
  when others then
    raise exception 'Location update failed: %', sqlerrm;
end;
$$;

-- Complete rider status flow: online -> available -> on_delivery -> available -> offline
create or replace function update_rider_availability(
  p_is_online boolean,
  p_is_available boolean default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rider_id uuid;
  v_current_online boolean;
  v_current_delivery_id uuid;
begin
  select id into v_rider_id
  from rider_profiles
  where user_id = auth.uid() and status = 'approved';

  if not found then
    raise exception 'Not an approved rider';
  end if;

  select is_online, current_delivery_id into v_current_online, v_current_delivery_id
  from rider_public_status
  where rider_id = v_rider_id;

  -- Prevent going offline/available while on active delivery
  if p_is_online = false and v_current_delivery_id is not null then
    raise exception 'Cannot go offline while on active delivery';
  end if;

  if p_is_available = false and v_current_delivery_id is not null then
    raise exception 'Cannot mark unavailable while on active delivery';
  end if;

  -- Update online status
  if p_is_online != v_current_online then
    update rider_public_status
    set is_online = p_is_online,
        last_update = now()
      where rider_id = (select id from rider_profiles where user_id = auth.uid());

    -- Update profile online status
    update rider_profiles
    set is_online = p_is_online
    where id = (select id from rider_profiles where user_id = auth.uid());

    if p_is_online = false then
      -- Going offline - also mark unavailable
      update rider_public_status
      set is_available = false,
          is_online = false
        where rider_id = (select id from rider_profiles where user_id = auth.uid());
    end if;
  end if;

  -- Update availability if provided and online
  if p_is_available is not null then
    if (select is_online from rider_public_status where rider_id = (select id from rider_profiles where user_id = auth.uid())) then
      update rider_public_status
      set is_available = p_is_available
      where rider_id = (select id from rider_profiles where user_id = auth.uid());
    else
      raise exception 'Cannot set availability when offline';
    end if;
  end if;

  return jsonb_build_object('success', true, 'is_online', p_is_online, 'is_available', p_is_available);
exception
  when others then
    raise exception 'Availability update failed: %', sqlerrm;
end;
$$;

-- Function to auto-expire stale rider locations (run via cron)
create or replace function expire_stale_rider_locations(p_max_age_minutes integer default 10)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update rider_public_status
  set is_online = false,
      is_available = false,
      current_lat = null,
      current_lng = null
  where last_update < now() - (p_max_age_minutes || ' minutes')::interval
    and is_online = true;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Grant execute
grant execute on function update_rider_location(numeric, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function update_rider_availability(boolean, boolean) to authenticated;
grant execute on function expire_stale_rider_locations(integer) to authenticated;