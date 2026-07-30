'use client'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Package, ChevronRight } from 'lucide-react'
import { useBuyerOrders } from '@/hooks/useOrders'
import { useUser } from '@/hooks/useUser'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { formatTZS, formatDate } from '@/utils'
import { PageLoader, EmptyState } from '@/components/ui'
import { Skeleton } from '@/components/ui/Card'

export default function OrdersPage() {
  const { profile, loading: authLoading } = useUser()
  const { orders, loading } = useBuyerOrders()

  if (authLoading) return <PageLoader />
  if (!profile) { redirect('/login'); return null }

  return (
    <main className="pb-20 sm:pb-8 dark:bg-ink-950 min-h-screen">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-6">Maagizo yangu</h1>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <OrderSkeleton key={i} />)}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12" />}
            title="Huna maagizo bado"
            description="Unapoweka agizo, litaonekana hapa"
            action={<Link href="/" className="btn-primary">Anza kununua</Link>}
          />
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const firstItem = order.items?.[0]
              const img = firstItem?.product?.images?.find((i: any) => i.is_primary) ?? firstItem?.product?.images?.[0]
              const extraCount = (order.items?.length ?? 1) - 1

              return (
                <Link key={order.id} href={`/orders/${order.id}`}
                  className="card dark:bg-ink-900 dark:border-ink-800 p-4 flex items-center gap-3 hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-ink-100 dark:bg-ink-800 flex-shrink-0">
                    {img ? (
                      <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <Package className="absolute inset-0 m-auto w-6 h-6 text-ink-300 dark:text-ink-600" />
                    )}
                    {extraCount > 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">+{extraCount}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">
                          {firstItem?.product?.name ?? 'Bidhaa'}
                          {extraCount > 0 && <span className="text-ink-500 dark:text-ink-400"> +{extraCount} zaidi</span>}
                        </p>
                        <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">#{order.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-bold text-sm text-ink-900 dark:text-white">{formatTZS(order.total_amount)}</span>
                      <span className="text-xs text-ink-400 dark:text-ink-500">{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-ink-400 dark:text-ink-500 flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

function OrderSkeleton() {
  return (
    <div className="card dark:bg-ink-900 dark:border-ink-800 p-4 flex items-center gap-3">
      <Skeleton className="w-14 h-14 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}
