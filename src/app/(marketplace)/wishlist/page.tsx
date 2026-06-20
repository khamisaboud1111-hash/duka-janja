'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import ProductCard from '@/components/product/ProductCard'
import { PageLoader, EmptyState } from '@/components/ui'
import type { WishlistItem } from '@/types'

export default function WishlistPage() {
  const { profile, loading: authLoading } = useUser()
  const supabase = createClient()
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    supabase
      .from('wishlists')
      .select(`*, product:products(*, seller:sellers(store_name, status), images:product_images(*))`)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems(data ?? [])
        setLoading(false)
      })
  }, [profile])

  if (authLoading) return <PageLoader />
  if (!profile) return (
    <div className="page-container py-16 text-center">
      <Link href="/login" className="btn-primary inline-flex">Ingia ili kuona orodha yako</Link>
    </div>
  )

  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-4 sm:py-8">
        <h1 className="font-display font-black text-2xl text-ink-900 mb-6 flex items-center gap-3">
          <Heart className="w-6 h-6 text-red-400 fill-red-400" />
          Bidhaa zilizohifadhiwa ({items.length})
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="card aspect-square animate-pulse bg-ink-50" />)}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title="Orodha yako iko tupu"
            description="Bonyeza moyo kwenye bidhaa yoyote kuihifadhi"
            action={<Link href="/search" className="btn-primary">Tafuta bidhaa</Link>}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {items.map((item) => item.product && (
              <ProductCard key={item.id} product={item.product as any} wishlisted />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
