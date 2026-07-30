'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Seller } from '@/types'

export function useSeller() {
  const supabase = createClient()
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data } = await supabase
      .from('sellers')
      .select('*, profile:profiles(*)')
      .eq('user_id', user.id)
      .single()

    setSeller(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { seller, loading, refetch: fetch }
}

export function useSellerAnalytics(sellerId: string | null) {
  const supabase = createClient()
  const [analytics, setAnalytics] = useState<{
    totalRevenue: number
    totalOrders: number
    pendingOrders: number
    totalProducts: number
    lowStockProducts: number
    unpaidCommissions: number
    recentOrders: any[]
    topProducts: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sellerId) return

    async function load() {
      setLoading(true)

      const [ordersRes, productsRes, commissionsRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('order_id, total_price, order:orders(status, created_at)')
          .eq('seller_id', sellerId!),

        supabase
          .from('products')
          .select('id, name, stock_quantity, total_sold, status')
          .eq('seller_id', sellerId!),

        supabase
          .from('commissions')
          .select('commission_amount, is_paid')
          .eq('seller_id', sellerId!)
          .eq('is_paid', false),
      ])

      const items = ordersRes.data ?? []
      const products = productsRes.data ?? []
      const commissions = commissionsRes.data ?? []

      const orderMap = new Map<string, any>()
      items.forEach((item: any) => {
        if (!orderMap.has(item.order_id)) orderMap.set(item.order_id, item.order)
      })

      const allOrders = Array.from(orderMap.values())
      const totalRevenue = items.reduce((s: number, i: any) => s + i.total_price, 0)
      const pendingOrders = allOrders.filter((o: any) => ['pending','confirmed','packed'].includes(o?.status)).length
      const unpaidCommissions = commissions.reduce((s: number, c: any) => s + c.commission_amount, 0)

      const topProducts = [...products]
        .sort((a: any, b: any) => b.total_sold - a.total_sold)
        .slice(0, 5)

      setAnalytics({
        totalRevenue,
        totalOrders: orderMap.size,
        pendingOrders,
        totalProducts: products.length,
        lowStockProducts: products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
        unpaidCommissions,
        recentOrders: allOrders.slice(0, 5),
        topProducts,
      })
      setLoading(false)
    }

    load()
  }, [sellerId])

  return { analytics, loading }
}
