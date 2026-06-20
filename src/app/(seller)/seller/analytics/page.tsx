'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Star, DollarSign, Package, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { StatCard, PageLoader } from '@/components/ui'
import { formatTZS } from '@/utils'

interface DayRevenue { date: string; revenue: number; orders: number }
interface CategoryBreakdown { name: string; revenue: number; count: number }

export default function SellerAnalyticsPage() {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()

  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [daily, setDaily] = useState<DayRevenue[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [summary, setSummary] = useState({ revenue: 0, orders: 0, units: 0, avgOrder: 0, reviewCount: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!seller) return
    async function load() {
      setLoading(true)
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const since = new Date(Date.now() - days * 86400000).toISOString()

      const [itemsRes, reviewsRes] = await Promise.all([
        supabase
          .from('order_items')
          .select('total_price, quantity, created_at, product:products(category:categories(name_sw))')
          .eq('seller_id', seller!.id)
          .gte('created_at', since),
        supabase
          .from('reviews')
          .select('rating, created_at')
          .eq('product_id', 'any')
          .gte('created_at', since),
      ])

      const items = itemsRes.data ?? []

      // Daily revenue aggregation
      const dayMap: Record<string, DayRevenue> = {}
      items.forEach((item: any) => {
        const date = item.created_at.slice(0, 10)
        if (!dayMap[date]) dayMap[date] = { date, revenue: 0, orders: 0 }
        dayMap[date].revenue += item.total_price
        dayMap[date].orders += 1
      })
      const sortedDays = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date))
      setDaily(sortedDays)

      // Category breakdown
      const catMap: Record<string, CategoryBreakdown> = {}
      items.forEach((item: any) => {
        const cat = (item.product as any)?.category?.name_sw ?? 'Nyingine'
        if (!catMap[cat]) catMap[cat] = { name: cat, revenue: 0, count: 0 }
        catMap[cat].revenue += item.total_price
        catMap[cat].count += item.quantity
      })
      setCategories(Object.values(catMap).sort((a, b) => b.revenue - a.revenue))

      const totalRevenue = items.reduce((s: number, i: any) => s + i.total_price, 0)
      const totalUnits = items.reduce((s: number, i: any) => s + i.quantity, 0)
      const reviews = reviewsRes.data ?? []

      setSummary({
        revenue: totalRevenue,
        orders: items.length,
        units: totalUnits,
        avgOrder: items.length ? Math.round(totalRevenue / items.length) : 0,
        reviewCount: reviews.length,
        avgRating: reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0,
      })
      setLoading(false)
    }
    load()
  }, [seller, period])

  if (sellerLoading) return <PageLoader />

  const maxRevenue = Math.max(...daily.map(d => d.revenue), 1)

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl text-ink-900">Takwimu</h1>
        <div className="flex bg-ink-100 rounded-xl p-1 gap-1">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>
              {p === '7d' ? '7 siku' : p === '30d' ? '30 siku' : '90 siku'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
            <StatCard label="Mapato" value={formatTZS(summary.revenue)} icon={<TrendingUp className="w-5 h-5" />} accent="brand" />
            <StatCard label="Maagizo" value={summary.orders} icon={<ShoppingBag className="w-5 h-5" />} accent="spice" />
            <StatCard label="Vipande vilivyouzwa" value={summary.units} icon={<Package className="w-5 h-5" />} accent="gold" />
            <StatCard label="Wastani wa agizo" value={formatTZS(summary.avgOrder)} icon={<DollarSign className="w-5 h-5" />} accent="green" />
            <StatCard label="Maoni" value={summary.reviewCount} icon={<Users className="w-5 h-5" />} accent="brand" />
            <StatCard label="Ukadiriaji" value={`${summary.avgRating.toFixed(1)} ★`} icon={<Star className="w-5 h-5" />} accent="gold" />
          </div>

          {/* Revenue chart */}
          <div className="card p-5 mb-4">
            <h2 className="font-semibold text-ink-800 mb-4">Mapato kwa Siku</h2>
            {daily.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-8">Hakuna data katika kipindi hiki</p>
            ) : (
              <div className="overflow-x-auto">
                <div className="flex items-end gap-1 h-40 min-w-max pb-1">
                  {daily.map(d => {
                    const height = Math.round((d.revenue / maxRevenue) * 100)
                    return (
                      <div key={d.date} className="flex flex-col items-center gap-1 group" style={{ minWidth: daily.length > 20 ? '10px' : '24px' }}>
                        <div className="relative flex-1 w-full flex items-end">
                          <div
                            style={{ height: `${Math.max(height, 2)}%` }}
                            className="w-full bg-brand-400 hover:bg-brand-500 rounded-t transition-colors cursor-pointer"
                            title={`${d.date}: ${formatTZS(d.revenue)}`}
                          />
                        </div>
                        {daily.length <= 14 && (
                          <span className="text-xs text-ink-400 -rotate-45 origin-top-left whitespace-nowrap" style={{ fontSize: '9px' }}>
                            {d.date.slice(5)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Category breakdown */}
          {categories.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-ink-800 mb-4">Mapato kwa Aina</h2>
              <div className="space-y-3">
                {categories.map(cat => {
                  const pct = Math.round((cat.revenue / summary.revenue) * 100)
                  return (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-ink-700">{cat.name}</span>
                        <span className="text-ink-500">{formatTZS(cat.revenue)} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
