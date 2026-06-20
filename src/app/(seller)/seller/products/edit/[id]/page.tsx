'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import ProductForm from '@/components/seller/ProductForm'
import { PageLoader } from '@/components/ui'
import type { Product } from '@/types'

export default function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seller) return
    supabase
      .from('products')
      .select(`*, images:product_images(*)`)
      .eq('id', params.id)
      .eq('seller_id', seller.id)
      .single()
      .then(({ data }) => { setProduct(data); setLoading(false) })
  }, [seller, params.id])

  if (sellerLoading || loading) return <PageLoader />
  if (!seller || !product) return (
    <div className="p-6">
      <p className="text-ink-600">Bidhaa haipatikani.</p>
    </div>
  )

  return (
    <div className="p-4 sm:p-6">
      <Link href="/seller/products" className="flex items-center gap-2 text-sm text-ink-500 hover:text-brand-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Bidhaa zangu
      </Link>
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Hariri Bidhaa</h1>
      <ProductForm seller={seller} product={product} />
    </div>
  )
}
