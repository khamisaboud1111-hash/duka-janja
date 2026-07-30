'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import BuyerSellerChat from '@/components/chat/BuyerSellerChat'

export default function BuyerMessagePage() {
  const params = useParams<{ sellerId: string }>()
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const [storeName, setStoreName] = useState('Muuzaji')
  const [loadingStore, setLoadingStore] = useState(true)

  const { room, messages, loading, sending, sendMessage, markRead } = useChat(profile?.id, params.sellerId)

  useEffect(() => {
    supabase
      .from('sellers')
      .select('store_name')
      .eq('id', params.sellerId)
      .single()
      .then(({ data }) => {
        if (data) setStoreName(data.store_name)
        setLoadingStore(false)
      })
  }, [params.sellerId])

  if (userLoading || loadingStore) return <PageLoader />

  if (!profile) {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-ink-600 mb-4">Tafadhali ingia ili kuongea na muuzaji.</p>
        <Button onClick={() => router.push(`/login?redirect=/messages/${params.sellerId}`)}>Ingia</Button>
      </div>
    )
  }

  return (
    <div className="page-container py-4 sm:py-6 max-w-lg mx-auto h-[calc(100vh-80px)] flex flex-col">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-ink-500 mb-3">
        <ArrowLeft className="w-4 h-4" /> Rudi
      </button>
      <div className="flex-1">
        <BuyerSellerChat
          messages={messages}
          currentUserId={profile.id}
          otherPartyName={storeName}
          loading={loading}
          sending={sending}
          onSend={(body) => sendMessage(body, profile.id).then(() => {})}
          onMarkRead={() => markRead(profile.id)}
        />
      </div>
    </div>
  )
}
