'use client'

import Link from 'next/link'
import { ShoppingBag, TrendingUp, Package, Star, AlertTriangle, Plus } from 'lucide-react'
import { useSeller, useSellerAnalytics } from '@/hooks/useSeller'
import { StatCard, PageLoader, EmptyState } from '@/components/ui'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatTZS, formatDate } from '@/utils'

export default function SellerDashboardPage() {
  const { seller, loading: sellerLoading } = useSeller()
  const { analytics, loading: analyticsLoading } = useSellerAnalytics(seller?.id ?? null)

  if (sellerLoading || analyticsLoading) return <PageLoader />

  if (seller?.status === 'pending') {
    return (
      <div className="p-6 max-w-lg dark:bg-ink-950 min-h-screen">
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 border-l-4 border-amber-400">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white mb-2">Ombi lako linasubiri ukaguzi</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
            Timu yetu inakagua maelezo ya duka lako. Utapokea arifa baada ya idhini kutolewa (kawaida saa 24–48).
          </p>
          <Link href="/seller/settings" className="btn-outline text-sm">Angalia/hariri ombi →</Link>
        </div>
      </div>
    )
  }

  if (seller?.status === 'suspended') {
    return (
      <div className="p-6 max-w-lg dark:bg-ink-950 min-h-screen">
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 border-l-4 border-red-400">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white mb-2">Duka lako limesimamishwa</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300">Wasiliana na msimamizi kwa maelezo zaidi.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl dark:bg-ink-950 min-h-screen">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Habari, {seller?.store_name}</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Hizi ndizo takwimu za duka lako</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Bidhaa mpya
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Mapato Yote" value={formatTZS(analytics?.totalRevenue ?? 0)} icon={<TrendingUp className="w-5 h-5" />} accent="brand" />
        <StatCard label="Maagizo Yote" value={analytics?.totalOrders ?? 0} icon={<ShoppingBag className="w-5 h-5" />} accent="spice" />
        <StatCard label="Yanayosubiri" value={analytics?.pendingOrders ?? 0} icon={<Package className="w-5 h-5" />} accent="gold" />
        <StatCard label="Ukadiriaji" value={`${seller?.average_rating.toFixed(1) ?? '—'} ★`} icon={<Star className="w-5 h-5" />} accent="green" />
      </div>

      {/* Alerts */}
      {(analytics?.lowStockProducts ?? 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-800 rounded-xl mb-5">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>{analytics?.lowStockProducts}</strong> bidhaa zina hisa chache (≤5). <Link href="/seller/products" className="underline">Angalia bidhaa</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100">Maagizo ya Hivi Karibuni</h2>
            <Link href="/seller/orders" className="text-xs text-brand-600 dark:text-brand-300 font-medium">Yote →</Link>
          </div>
          {(analytics?.recentOrders?.length ?? 0) === 0 ? (
            <EmptyState icon={<ShoppingBag className="w-8 h-8" />} title="Bado hakuna maagizo" />
          ) : (
            <div className="space-y-2">
              {analytics?.recentOrders.map((order: any) => (
                <Link key={order.id} href={`/seller/orders`}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-ink-700 dark:text-ink-200">#{typeof order.id === 'string' ? order.id.slice(-8).toUpperCase() : order.id}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">{formatDate(order.created_at)}</p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top products */}
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100">Bidhaa za Juu</h2>
            <Link href="/seller/products" className="text-xs text-brand-600 dark:text-brand-300 font-medium">Zote →</Link>
          </div>
          {(analytics?.topProducts?.length ?? 0) === 0 ? (
            <EmptyState icon={<Package className="w-8 h-8" />} title="Bado hakuna bidhaa" />
          ) : (
            <div className="space-y-2">
              {analytics?.topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                  <span className="text-xs font-black text-ink-400 dark:text-ink-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100 truncate">{p.name}</p>
                    <p className="text-xs text-ink-500 dark:text-ink-400">Mauzo: {p.total_sold}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock_quantity <= 5 ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'}`}>
                    Hisa: {p.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
