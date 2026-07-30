'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface ChatMessage {
  id: string
  room_id: string
  sender_id: string
  body: string
  read_at: string | null
  created_at: string
}

export interface ChatRoom {
  id: string
  buyer_id: string
  seller_id: string
  order_id: string | null
  created_at: string
}

/**
 * Finds an existing chat_room for (buyerId, sellerId[, orderId]) or creates one,
 * then loads its messages and keeps them live via Supabase Realtime.
 * RLS (Phase 8) already restricts access to the two participants — no API
 * route layer is needed, the Supabase client talks directly to Postgres here.
 */
export function useChat(buyerId: string | undefined, sellerId: string | undefined, orderId?: string | null) {
  const supabase = createClient()
  const [room, setRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!buyerId || !sellerId) return
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buyerId, sellerId, orderId])

  async function init() {
    setLoading(true)

    let query = supabase.from('chat_rooms').select('*').eq('buyer_id', buyerId).eq('seller_id', sellerId)
    query = orderId ? query.eq('order_id', orderId) : query.is('order_id', null)
    const { data: existing } = await query.maybeSingle()

    let activeRoom = existing as ChatRoom | null

    if (!activeRoom) {
      const { data: created, error } = await supabase
        .from('chat_rooms')
        .insert({ buyer_id: buyerId, seller_id: sellerId, order_id: orderId ?? null })
        .select()
        .single()
      if (error) {
        console.error('[useChat] room creation failed:', error)
        setLoading(false)
        return
      }
      activeRoom = created
    }

           setRoom(activeRoom)
        if (activeRoom) {
          await loadMessages(activeRoom.id)
        }
        setLoading(false)

  }

  async function loadMessages(roomId: string) {
    const { data } = await supabase.from('messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  // Realtime: new messages in this room.
  useEffect(() => {
    if (!room?.id) return

    const channel = supabase
      .channel(`chat-${room.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${room.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room?.id, supabase])

  const sendMessage = useCallback(
    async (body: string, senderId: string) => {
      if (!room || !body.trim()) return
      setSending(true)
      const { error } = await supabase.from('messages').insert({ room_id: room.id, sender_id: senderId, body: body.trim() })
      setSending(false)
      return !error
    },
    [room, supabase]
  )

  const markRead = useCallback(
    async (viewerId: string) => {
      if (!room) return
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', room.id)
        .is('read_at', null)
        .neq('sender_id', viewerId)
    },
    [room, supabase]
  )

  return { room, messages, loading, sending, sendMessage, markRead }
}
