'use client'

import { useEffect, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { useUser } from '@/hooks/useUser'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState } from '@/components/ui'
import BuyerSellerChat from '@/components/chat/BuyerSellerChat'

interface RoomPreview {
  id: string
  buyer_id: string
  buyer_name: string
  last_message: string | null
  last_at: string | null
  unread_count: number
}

export default function SellerMessagesPage() {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()
  const { profile } = useUser()
  const [rooms, setRooms] = useState<RoomPreview[]>([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [activeBuyerId, setActiveBuyerId] = useState<string | null>(null)

  useEffect(() => {
    if (!seller) return
    loadRooms()
  }, [seller])

  async function loadRooms() {
    setLoadingRooms(true)
    const { data: roomRows } = await supabase
      .from('chat_rooms')
      .select('id, buyer_id, buyer:profiles(full_name)')
      .eq('seller_id', seller!.id)

    const previews: RoomPreview[] = []
    for (const r of roomRows ?? []) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('body, created_at')
        .eq('room_id', r.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('room_id', r.id)
        .is('read_at', null)
        .neq('sender_id', profile?.id ?? '')

      previews.push({
        id: r.id,
        buyer_id: r.buyer_id,
        buyer_name: (r as any).buyer?.full_name ?? 'Mteja',
        last_message: lastMsg?.body ?? null,
        last_at: lastMsg?.created_at ?? null,
        unread_count: count ?? 0,
      })
    }

    previews.sort((a, b) => (b.last_at ?? '').localeCompare(a.last_at ?? ''))
    setRooms(previews)
    setLoadingRooms(false)
  }

  const { messages, loading, sending, sendMessage, markRead } = useChat(activeBuyerId ?? undefined, seller?.id)

  if (sellerLoading || loadingRooms) return <PageLoader />

  const activeRoom = rooms.find((r) => r.buyer_id === activeBuyerId)

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Ujumbe</h1>

      {rooms.length === 0 ? (
        <EmptyState icon={<MessageCircle className="w-10 h-10" />} title="Bado hakuna ujumbe" description="Ujumbe kutoka kwa wateja utaonekana hapa" />
      ) : (
        <div className="grid sm:grid-cols-[280px_1fr] gap-4">
          <div className="space-y-2">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveBuyerId(r.buyer_id)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  activeBuyerId === r.buyer_id ? 'border-brand-400 bg-brand-50' : 'border-ink-100 hover:bg-ink-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-ink-900 truncate">{r.buyer_name}</p>
                  {r.unread_count > 0 && (
                    <span className="text-[10px] font-bold bg-brand-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {r.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-500 truncate mt-0.5">{r.last_message ?? 'Hakuna ujumbe bado'}</p>
              </button>
            ))}
          </div>

          <div className="h-[60vh]">
            {activeBuyerId && activeRoom && profile ? (
              <BuyerSellerChat
                messages={messages}
                currentUserId={profile.id}
                otherPartyName={activeRoom.buyer_name}
                loading={loading}
                sending={sending}
                onSend={(body) => sendMessage(body, profile.id).then(() => {})}
                onMarkRead={() => {
                  markRead(profile.id)
                  setRooms((prev) => prev.map((r) => (r.buyer_id === activeBuyerId ? { ...r, unread_count: 0 } : r)))
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink-400 border border-dashed border-ink-200 rounded-2xl">
                Chagua mazungumzo upande wa kushoto
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
