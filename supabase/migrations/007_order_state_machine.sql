-- ============================================================
-- Duka Janja — Migration 007: Order State Machine
-- Adds formal order state transitions with validation
-- Run AFTER 001_initial_schema.sql, 002_storage_and_functions.sql
-- ============================================================

-- Extend order_status enum with additional states
-- Note: In PostgreSQL, enum values can only be added, not removed or reordered
-- We need to add the missing states to the existing enum
do $$
begin
  -- Add missing order statuses if they don't exist
  if not exists (select 1 from pg_enum where enumlabel = 'confirmed' and enumtypid = 'order_status'::regtype) then
    alter type order_status add value 'confirmed' after 'pending';
  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'packed' and enumtypid = 'order_status'::regtype) then
    alter type order_status add value 'packed' after 'confirmed';
  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'assigned' and enumtypid = 'order_status'::regtype) then
    alter type order_status add value 'assigned' after 'packed';
  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'picked_up' and enumtypid = 'order_status'::regtype) then
    alter type order_status add value 'picked_up' after 'assigned';
  end if;
  if not exists (select 1 from pg_enum where enumlabel = 'refund_pending' and enumtypid = 'order_status'::regtype) then
    alter type order_status add value 'refund_pending' after 'cancelled';
  end if;
end $$;

-- Valid transitions mapping (from_status -> array of allowed next statuses)
create or replace function get_valid_order_transitions()
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'pending',       array['confirmed', 'cancelled'],
    'confirmed',     array['packed', 'cancelled'],
    'packed',        array['assigned', 'cancelled'],
    'assigned',      array['picked_up', 'cancelled'],
    'picked_up',     array['out_for_delivery', 'cancelled'],
    'out_for_delivery', array['delivered', 'cancelled'],
    'delivered',     array['refund_pending'],
    'cancelled',     array[]::text[],
    'refund_pending', array['refunded', 'cancelled'],
    'refunded',      array[]::text[],
    'out_for_delivery', array['delivered', 'cancelled']
  );
$$;

-- Validate if a transition from old_status to new_status is allowed
create or replace function is_valid_order_transition(p_from order_status, p_to order_status)
returns boolean language plpgsql as $$
begin
  -- Same status is always allowed (idempotent)
  if p_from = p_to then
    return true;
  end if;
  
  -- Check against allowed transitions
  return p_to = any(
    select value::order_status
    from jsonb_array_elements_text(get_valid_order_transitions() -> p_from::text)
  );
end;

-- Trigger function to validate order status transitions
create or replace function validate_order_status_transition()
returns trigger language plpgsql as $$
declare
  v_allowed boolean;
  v_user_id uuid;
begin
  -- Skip if status hasn't changed
  if new.status = old.status then
    return new;
  end if;

  -- Validate transition
  v_allowed := is_valid_order_transition(old.status, new.status);
  if not v_allowed then
    raise exception 'Invalid order status transition: % -> %', old.status, new.status;
  end if;

  -- Additional authorization checks for sensitive transitions
  if new.status = 'cancelled' then
    -- Only buyer, seller, or admin can cancel
    if not (
      select exists (
        select 1 from profiles p
        where p.id = auth.uid() and (
          p.id = old.buyer_id or
          p.role = 'admin' or
          exists (select 1 from sellers s where s.user_id = p.id and s.id in (select seller_id from order_items where order_id = old.id))
        )
      )
    ) then
      raise exception 'Insufficient permissions to cancel this order';
    end if;
  end if;

  if new.status = 'confirmed' then
    -- Only seller or admin can confirm
    if not (
      select exists (
        select 1 from profiles p
        where p.id = auth.uid() and (
          p.role = 'admin' or
          exists (select 1 from sellers s where s.user_id = p.id and s.id in (select seller_id from order_items where order_id = old.id))
        )
      )
    ) then
      raise exception 'Only the seller or admin can confirm this order';
    end if;
  end if;

  if new.status in ('packed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered') then
    -- Only seller, rider, or admin can advance delivery states
    if not (
      select exists (
        select 1 from profiles p
        where p.id = auth.uid() and (
          p.role = 'admin' or
          p.role = 'rider' or
          exists (select 1 from sellers s where s.user_id = p.id and s.id in (select seller_id from order_items where order_id = old.id))
        )
      )
    ) then
      raise exception 'Insufficient permissions to update delivery status';
    end if;
  end if;

  if new.status = 'refund_pending' or new.status = 'refunded' then
    -- Only admin can process refunds
    if not (select is_admin()) then
      raise exception 'Only administrators can process refunds';
    end if;
  end if;

  -- Create tracking event for status change
  insert into order_tracking (order_id, status, note, created_by)
  values (new.id, new.status,
    case new.status
      when 'confirmed' then 'Order confirmed by seller'
      when 'packed' then 'Order packed and ready for pickup'
      when 'assigned' then 'Delivery assigned to rider'
      when 'picked_up' then 'Order picked up by rider'
      when 'out_for_delivery' then 'Order out for delivery'
      when 'delivered' then 'Order delivered successfully'
      when 'cancelled' then 'Order cancelled'
      when 'refund_pending' then 'Refund requested'
      when 'refunded' then 'Refund processed'
      else 'Status updated to ' || new.status
    end,
    auth.uid()
  );

  -- Handle side effects of status changes
  if new.status = 'delivered' and old.status != 'delivered' then
    -- The update_seller_stats trigger will handle seller stats
    null;
  elsif new.status = 'cancelled' and old.status != 'cancelled' then
    -- The handle_order_cancellation trigger will restore stock
    null;
  end if;

  return new;
end;
$$;

-- Attach trigger to orders table
drop trigger if exists validate_order_status_transition on orders;
create trigger validate_order_status_transition
  before update on orders
  for each row
  when (new.status is distinct from old.status)
  execute procedure validate_order_status_transition();

-- Helper function to get valid next statuses for a given status (useful for UI)
create or replace function get_allowed_next_statuses(p_current order_status)
returns order_status[] language plpgsql as $$
begin
  return array(
    select value::order_status
    from jsonb_array_elements_text(get_valid_order_transitions() -> p_current::text)
  );
end;
$$;

-- Function to update order status with validation (for API use)
create or replace function update_order_status(
  p_order_id uuid,
  p_new_status order_status,
  p_note text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_old_status order_status;
  v_buyer_id uuid;
  v_result jsonb;
begin
  -- Get current status
  select status, buyer_id into v_old_status, v_buyer_id from orders where id = p_order_id;
  if not found then
    raise exception 'Order not found: %', p_order_id;
  end if;

  -- Validate transition
  if not is_valid_order_transition(v_old_status, p_new_status) then
    raise exception 'Invalid status transition: % -> %', v_old_status, p_new_status;
  end if;

  -- Perform the update (will trigger validate_order_status_transition trigger)
  update orders
  set status = p_new_status,
      updated_at = now()
  where id = p_order_id
  returning *;

  -- Add tracking note if provided
  if p_note is not null then
    insert into order_tracking (order_id, status, note, created_by)
    values (p_order_id, p_new_status, p_note, auth.uid());
  end if;

  return (select row_to_json(o)::jsonb from orders o where id = p_order_id);
end;
$$;

revoke execute on function update_order_status(uuid, order_status, text) from public, anon;
grant execute on function update_order_status(uuid, order_status, text) to authenticated;

-- Grant execute on helper functions
grant execute on function is_valid_order_transition(order_status, order_status) to authenticated;
grant execute on function get_allowed_next_statuses(order_status) to authenticated;
grant execute on function update_order_status(uuid, order_status, text) to authenticated;