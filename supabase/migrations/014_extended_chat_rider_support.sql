-- ============================================================
-- Duka Janja — Migration 014: Extended Chat System (Rider Support)
-- Supports buyer-seller, buyer-rider, seller-rider messaging
-- Run AFTER 013
-- ============================================================

-- Add participant_type to chat_rooms to distinguish conversation types
alter table if exists chat_rooms
add column if not exists participant_type text not null default 'buyer_seller'
check (participant_type in ('buyer_seller', 'buyer_rider', 'seller_rider'));

-- Add rider_id column for rider conversations
alter table if exists chat_rooms
add column if not exists rider_id uuid references profiles(id) on delete cascade;

-- Update unique constraint to include participant_type
alter table if exists chat_rooms
drop constraint if exists chat_rooms_buyer_id_seller_id_product_id_key;

alter table if exists chat_rooms
add constraint chat_rooms_unique_participants
unique (buyer_id, seller_id, rider_id, product_id, participant_type);

-- Indexes for new queries
create index if not exists chat_rooms_rider_idx on chat_rooms(rider_id);
create index if not exists chat_rooms_participant_type_idx on chat_rooms(participant_type);

-- ============================================================
-- RLS Policies Update
-- ============================================================

-- Drop old policies
drop policy if exists "Participants can view their chat rooms" on chat_rooms;
drop policy if exists "Buyers can create chat rooms" on chat_rooms;
drop policy if exists "Participants can view messages" on messages;
drop policy if exists "Participants can send messages" on messages;
drop policy if exists "Recipient can mark as read" on messages;
drop policy if exists "Senders can update own messages" on messages;

-- Chat rooms: participants can view their rooms based on participant_type
create policy "Participants can view their chat rooms" on chat_rooms for select using (
  -- Buyer-Seller: buyer or seller
  (participant_type = 'buyer_seller' and (
    buyer_id = auth.uid() or
    seller_id in (select id from sellers where user_id = auth.uid())
  )) or
  -- Buyer-Rider: buyer or rider
  (participant_type = 'buyer_rider' and (
    buyer_id = auth.uid() or
    rider_id = auth.uid()
  )) or
  -- Seller-Rider: seller or rider
  (participant_type = 'seller_rider' and (
    seller_id in (select id from sellers where user_id = auth.uid()) or
    rider_id = auth.uid()
  )) or
  is_admin()
);

-- Create chat rooms - various participant combinations
create policy "Buyers can create buyer-seller chat rooms" on chat_rooms for insert with check (
  participant_type = 'buyer_seller' and
  buyer_id = auth.uid() and
  exists (select 1 from sellers where id = seller_id and status = 'approved')
);

create policy "Buyers can create buyer-rider chat rooms" on chat_rooms for insert with check (
  participant_type = 'buyer_rider' and
  buyer_id = auth.uid() and
  exists (select 1 from profiles where id = rider_id and role = 'rider')
);

create policy "Sellers can create seller-rider chat rooms" on chat_rooms for insert with check (
  participant_type = 'seller_rider' and
  seller_id in (select id from sellers where user_id = auth.uid()) and
  exists (select 1 from profiles where id = rider_id and role = 'rider')
);

create policy "Riders can create buyer-rider chat rooms" on chat_rooms for insert with check (
  participant_type = 'buyer_rider' and
  rider_id = auth.uid() and
  exists (select 1 from profiles where id = buyer_id)
);

create policy "Riders can create seller-rider chat rooms" on chat_rooms for insert with check (
  participant_type = 'seller_rider' and
  rider_id = auth.uid() and
  exists (select 1 from sellers where id = seller_id)
);

-- Messages: participants can view messages in their rooms
create policy "Participants can view messages" on messages for select using (
  room_id in (
    select id from chat_rooms
    where (buyer_id = auth.uid())
       or (seller_id in (select id from sellers where user_id = auth.uid()))
       or (rider_id = auth.uid())
  )
);

-- Participants can send messages
create policy "Participants can send messages" on messages for insert with check (
  sender_id = auth.uid() and
  room_id in (
    select id from chat_rooms
    where (buyer_id = auth.uid())
       or (seller_id in (select id from sellers where user_id = auth.uid()))
       or (rider_id = auth.uid())
  )
);

-- Messages can be marked as read by recipient
create policy "Recipient can mark as read" on messages for update using (
  room_id in (
    select id from chat_rooms
    where (buyer_id = auth.uid())
       or (seller_id in (select id from sellers where user_id = auth.uid()))
       or (rider_id = auth.uid())
  ) and sender_id != auth.uid()
) with check (read_at is not null);

-- Senders can update own messages (for editing)
create policy "Senders can update own messages" on messages for update using (
  sender_id = auth.uid()
);

-- ============================================================
-- Helper Functions for Extended Chat
-- ============================================================

-- Get user's chat rooms (all types)
create or replace function get_chat_rooms(p_user_id uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  select jsonb_agg(
    jsonb_build_object(
      'id', cr.id,
      'participant_type', cr.participant_type,
      'buyer_id', cr.buyer_id,
      'seller_id', cr.seller_id,
      'rider_id', cr.rider_id,
      'product_id', cr.product_id,
      'product_name', p.name,
      'product_image', pi.url,
      'seller_name', s.store_name,
      'seller_slug', s.store_slug,
      'seller_logo', s.logo_url,
      'rider_name', rp.full_name,
      'rider_avatar', rp.avatar_url,
      'buyer_name', bp.full_name,
      'buyer_avatar', bp.avatar_url,
      'last_message_at', cr.last_message_at,
      'unread_count', (
        select count(*) from messages m
        where m.room_id = cr.id
          and m.sender_id != p_user_id
          and m.read_at is null
      )
    )
    order by cr.last_message_at desc
  ) into v_result
  from chat_rooms cr
  left join sellers s on s.id = cr.seller_id
  left join products p on p.id = cr.product_id
  left join product_images pi on pi.product_id = p.id and pi.is_primary = true
  left join profiles rp on rp.id = cr.rider_id
  left join profiles bp on bp.id = cr.buyer_id
  where cr.buyer_id = p_user_id
     or cr.seller_id in (select id from sellers where user_id = p_user_id)
     or cr.rider_id = p_user_id;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Get messages for a room (unchanged but kept for reference)
create or replace function get_messages(
  p_room_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  -- Verify user has access to this room
  if not exists (
    select 1 from chat_rooms
    where id = p_room_id
      and (buyer_id = auth.uid()
           or seller_id in (select id from sellers where user_id = auth.uid())
           or rider_id = auth.uid())
  ) then
    raise exception 'Access denied to this chat room';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'room_id', m.room_id,
      'sender_id', m.sender_id,
      'sender_name', p.full_name,
      'sender_avatar', p.avatar_url,
      'body', m.body,
      'message_type', m.message_type,
      'attachment_url', m.attachment_url,
      'read_at', m.read_at,
      'created_at', m.created_at,
      'is_own', m.sender_id = auth.uid()
    )
    order by m.created_at desc
  ) into v_result
  from messages m
  join profiles p on p.id = m.sender_id
  where m.room_id = p_room_id
    and (p_before is null or m.created_at < p_before)
  order by m.created_at desc
  limit p_limit;

  if v_result is null then
    return '[]'::jsonb;
  end if;

  return v_result;
end;
$$;

-- Create or get chat room for buyer-seller
create or replace function create_buyer_seller_room(
  p_buyer_id uuid,
  p_seller_id uuid,
  p_product_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  -- Check if room exists
  select id into v_room_id
  from chat_rooms
  where buyer_id = p_buyer_id
    and seller_id = p_seller_id
    and product_id is not distinct from p_product_id
    and participant_type = 'buyer_seller';

  if v_room_id is not null then
    return v_room_id;
  end if;

  -- Create new room
  insert into chat_rooms (buyer_id, seller_id, product_id, participant_type)
  values (p_buyer_id, p_seller_id, p_product_id, 'buyer_seller')
  returning id into v_room_id;

  return v_room_id;
end;
$$;

-- Create or get chat room for buyer-rider
create or replace function create_buyer_rider_room(
  p_buyer_id uuid,
  p_rider_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  select id into v_room_id
  from chat_rooms
  where buyer_id = p_buyer_id
    and rider_id = p_rider_id
    and participant_type = 'buyer_rider';

  if v_room_id is not null then
    return v_room_id;
  end if;

  insert into chat_rooms (buyer_id, rider_id, participant_type)
  values (p_buyer_id, p_rider_id, 'buyer_rider')
  returning id into v_room_id;

  return v_room_id;
end;
$$;

-- Create or get chat room for seller-rider
create or replace function create_seller_rider_room(
  p_seller_id uuid,
  p_rider_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
begin
  select id into v_room_id
  from chat_rooms
  where seller_id = p_seller_id
    and rider_id = p_rider_id
    and participant_type = 'seller_rider';

  if v_room_id is not null then
    return v_room_id;
  end if;

  insert into chat_rooms (seller_id, rider_id, participant_type)
  values (p_seller_id, p_rider_id, 'seller_rider')
  returning id into v_room_id;

  return v_room_id;
end;
$$;

-- Send a message (updated for all room types)
create or replace function send_message(
  p_room_id uuid,
  p_body text,
  p_message_type text default 'text',
  p_attachment_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room record;
  v_message record;
begin
  -- Verify access to room (any participant type)
  select * into v_room
  from chat_rooms
  where id = p_room_id
    and (buyer_id = auth.uid()
         or seller_id in (select id from sellers where user_id = auth.uid())
         or rider_id = auth.uid());

  if not found then
    raise exception 'Access denied to this chat room';
  end if;

  insert into messages (room_id, sender_id, body, message_type, attachment_url)
  values (p_room_id, auth.uid(), p_body, p_message_type, p_attachment_url)
  returning * into v_message;

  -- Update room's last_message_at
  update chat_rooms set last_message_at = now() where id = p_room_id;

  return jsonb_build_object(
    'id', v_message.id,
    'room_id', v_message.room_id,
    'sender_id', v_message.sender_id,
    'body', v_message.body,
    'message_type', v_message.message_type,
    'attachment_url', v_message.attachment_url,
    'created_at', v_message.created_at,
    'is_own', true
  );
end;
$$;

-- Mark messages as read
create or replace function mark_messages_read(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  if not exists (
    select 1 from chat_rooms
    where id = p_room_id
      and (buyer_id = auth.uid()
           or seller_id in (select id from sellers where user_id = auth.uid())
           or rider_id = auth.uid())
  ) then
    raise exception 'Access denied to this chat room';
  end if;

  update messages
  set read_at = now()
  where room_id = p_room_id
    and sender_id != auth.uid()
    and read_at is null;

  get diagnostics v_count = row_count;

  return jsonb_build_object('marked_read', v_count);
end;
$$;

-- Grant execute permissions
grant execute on function get_chat_rooms(uuid) to authenticated;
grant execute on function get_messages(uuid, integer, timestamptz) to authenticated;
grant execute on function send_message(uuid, text, text, text) to authenticated;
grant execute on function mark_messages_read(uuid) to authenticated;
grant execute on function create_buyer_seller_room(uuid, uuid, uuid) to authenticated;
grant execute on function create_buyer_rider_room(uuid, uuid) to authenticated;
grant execute on function create_seller_rider_room(uuid, uuid) to authenticated;

-- Add Realtime publication
-- Run in Supabase Dashboard -> Realtime:
-- alter publication supabase_realtime add table messages;
-- alter publication supabase_realtime add table chat_rooms;