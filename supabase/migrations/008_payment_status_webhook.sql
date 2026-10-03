-- ============================================================
-- Duka Janja — Migration 008: Payment Status & Webhook Hardening
-- Adds payment_status to orders, improves webhook idempotency
-- Run AFTER 001_initial_schema.sql, 002_storage_and_functions.sql,
-- 003_production_upgrade.sql, 004_notification_types.sql,
-- 005_create_order_rpc.sql, 006_rider_deliveries_tables.sql,
-- 007_order_state_machine.sql
-- ============================================================

-- Add payment_status to orders (if not exists)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'payment_status'
  ) then
    alter table orders add column payment_status text
      not null default 'pending'
      check (payment_status in ('pending', 'initiated', 'successful', 'failed', 'cancelled', 'refunded'));
  end if;
end $$;

-- Add provider_reference to orders if not exists
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'payment_provider_reference'
  ) then
    alter table orders add column payment_provider_reference text;
  end if;
end $$;

-- Add paid_at to orders
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'paid_at'
  ) then
    alter table orders add column paid_at timestamptz;
  end if;
end $$;

-- Add index for payment status queries
create index if not exists orders_payment_status_idx on orders(payment_status);
create index if not exists orders_payment_reference_idx on orders(payment_reference);
create index if not exists orders_payment_provider_reference_idx on orders(payment_provider_reference);

-- Add unique constraint on payment_provider_reference to prevent duplicates
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_provider_reference_key'
  ) then
    alter table orders add constraint orders_payment_provider_reference_key
      unique (payment_provider_reference);
  end if;
end $$;

-- Improve payment_transactions table (ensure idempotency)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'payment_transactions' and column_name = 'provider_transaction_id'
  ) then
    alter table payment_transactions add column provider_transaction_id text unique;
  end if;
end $$;

create index if not exists payment_transactions_provider_tx_idx
  on payment_transactions(provider_transaction_id);

-- Function to process payment webhook atomically
create or replace function process_payment_webhook(
  p_provider text,
  p_provider_reference text,
  p_transaction_id text,
  p_status text, -- 'successful' | 'failed' | 'cancelled' | 'pending'
  p_amount integer,
  p_currency text default 'TZS',
  p_raw_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_order record;
  v_txn_id uuid;
  v_already_processed boolean := false;
begin
  -- IDEMPOTENCY: Check if we've already processed this provider reference
  select id into v_txn_id
  from payment_transactions
  where provider_transaction_id = p_provider_reference;

  if found then
    -- Already processed this webhook
    v_already_processed := true;
  else
    -- Insert payment transaction record
    insert into payment_transactions (
      provider,
      provider_reference,
      provider_transaction_id,
      status,
      amount,
      currency,
      raw_payload
    ) values (
      p_provider, p_provider_reference, p_provider_reference,
      case p_status when 'successful' then 'successful'
                    when 'failed' then 'failed'
                    when 'cancelled' then 'cancelled'
                    else 'pending' end,
      p_amount, p_currency, p_raw_payload
    )
    returning id into v_txn_id;
  end if;

  -- Find order by payment_reference (tx_ref from Flutterwave) or by provider_reference
  select id into v_order_id
  from orders
  where payment_reference = (select p_provider_reference) -- tx_ref from Flutterwave
     or payment_provider_reference = p_provider_reference
  limit 1;

  if not found then
    -- Try to find by matching amount and recent pending order
    select id into v_order_id
    from orders
    where total_amount = (select amount from payment_transactions where id = v_txn_id)
      and payment_status = 'pending'
      and created_at > now() - interval '1 hour'
    order by created_at desc
    limit 1;
  end if;

  if not found then
    raise exception 'Could not match payment to order: provider_reference=%', p_provider_reference;
  end if;

  -- Get order details
  select id, total_amount, payment_status, status as order_status, buyer_id
  into v_order_id, v_order.total_amount, v_order.payment_status, v_order.status, v_order.buyer_id
  from orders
  where id = v_order_id;

  if not found then
    raise exception 'Order not found after matching';
  end if;

  -- IDEMPOTENCY: Check if already processed
  if v_order.payment_status = 'successful' then
    return jsonb_build_object(
      'success', true,
      'already_processed', true,
      'order_id', v_order_id
    );
  end if;

  -- Validate amount
  if v_order.total_amount <> (select amount from payment_transactions where id = v_txn_id) then
    raise exception 'Amount mismatch: expected %, got %',
      v_order.total_amount, (select amount from payment_transactions where id = v_txn_id);
  end if;

  -- Only process successful payments
  if (select status from payment_transactions where id = v_txn_id) = 'successful' then
    -- Update order
    update orders
    set payment_status = 'successful',
        payment_confirmed = true,
        payment_provider_reference = (select provider_transaction_id from payment_transactions where id = v_txn_id),
        paid_at = now(),
        status = case when status = 'pending' then 'confirmed' else status end,
        updated_at = now()
    where id = v_order_id;

    -- Update payment transaction
    update payment_transactions
    set status = 'successful',
        order_id = v_order_id
    where id = v_txn_id;

    -- Notify buyer
    insert into notifications (user_id, type, title_en, title_sw, body_en, body_sw, link)
    select buyer_id, 'order_placed',
      'Payment confirmed',
      'Malipo Yamethibitishwa',
      'Your payment was received. Your order is now confirmed.',
      'Malipo yako yamepokelewa. Agizo lako limethibitishwa.',
      '/orders/' || v_order_id
    from orders where id = v_order_id;
  else
    -- Mark as failed
    update payment_transactions
    set status = 'failed'
    where id = v_txn_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'already_processed', v_already_processed
  );
exception
  when others then
    -- Log error but return success to prevent webhook retries
    raise notice 'Payment webhook processing failed: %', sqlerrm;
    return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- Grant execute
revoke execute on function process_payment_webhook(text, text, text, text, integer, text, jsonb) from public, anon;
grant execute on function process_payment_webhook(text, text, text, text, integer, text, jsonb) to authenticated;