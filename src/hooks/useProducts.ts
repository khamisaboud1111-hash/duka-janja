'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types'

export interface ProductFilters {
  category?: string
  search?: string
  madeInZanzibar?: boolean
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
  page?: number
  pageSize?: number
}

export function useProducts(filters: ProductFilters = {}) {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [count, setCount]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const { category, search, madeInZanzibar, sort = 'newest', page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let q = supabase
      .from('products')
      .select(`
        *,
        seller:sellers(id, store_name, store_slug, status, logo_url),
        category:categories(id, name_en, name_sw, slug),
        images:product_images(*)
      `, { count: 'exact' })
      .eq('status', 'active')
      .range(from, to)

    if (category)         q = q.eq('category.slug', category)
    if (madeInZanzibar)   q = q.eq('is_made_in_zanzibar', true)
    if (search)           q = q.ilike('name', `%${search}%`)

    switch (sort) {
      case 'price_asc':  q = q.order('price', { ascending: true }); break
      case 'price_desc': q = q.order('price', { ascending: false }); break
      case 'popular':    q = q.order('total_sold', { ascending: false }); break
      default:           q = q.order('created_at', { ascending: false })
    }

    const { data, error: err, count: c } = await q
    if (err) setError(err.message)
    else { setProducts(data ?? []); setCount(c ?? 0) }
    setLoading(false)
  }, [category, search, madeInZanzibar, sort, page, pageSize])

  useEffect(() => { fetch() }, [fetch])

  return { products, count, loading, error, refetch: fetch, totalPages: Math.ceil(count / pageSize) }
}
