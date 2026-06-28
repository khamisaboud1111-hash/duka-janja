'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronDown, Package } from 'lucide-react'
import { useSeller } from '@/hooks/useSeller'
import { useSellerOrders } from '@/hooks/useOrders'
import { OrderStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate, ORDER_STATUS_STEPS } from '@/utils'
import type { Order, OrderStatus } from '@/types'
import toast from 'react-hot-toast'
import ReadyForPickupButton from '@/components/seller/ReadyForPickupButton'
import DeliveryRatingSection from '@/components/delivery/DeliveryRatingSection'

const NEXT_STATUS: Record<string, OrderStatus> = {
  pending: 'confirmed', confirmed: 'packed', packed: 'out_for_delivery', out_for_delivery: 'delivered',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Inasubiri', confirmed: 'Imethibitishwa', packed: 'Imefungashwa',
  out_for_delivery: 'Inasafirishwa', delivered: 'Imefikishwa', cancelled: 'Imefutwa',
}

export default function SellerOrdersPage() {
  const { seller, loading: sellerLoading } = useSeller()
  const { orders, loading, updateOrderStatus } = useSellerOrders(seller?.id ?? null)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [note, setNote] = useState('')

  async function handleAdvance(order: Order) {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    await updateOrderStatus(order.id, next, note || undefined)
    setNote('')
    setActiveOrder(null)
    setUpdatingId(null)
    toast.success(`Hali imebadilishwa: ${STATUS_LABELS[next]}`)
  }

  async function handleCancel(order: Order) {
    setUpdatingId(order.id)
    await updateOrderStatus(order.id, 'cancelled', note || 'Imefutwa na muuzaji')
    setNote('')
    setActiveOrder(null)
    setUpdatingId(null)
    toast.success('Agizo limefutwa')
  }

  if (sellerLoading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-4xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-6">Maagizo ({orders.length})</h1>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <EmptyState icon={<Package className="w-10 h-10" />} title="Bado hakuna maagizo" description="Maagizo kutoka kwa wateja yatakuja hapa" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const sellerItems = order.items?.filter((i: any) => i.seller_id === seller?.id) ?? order.items ?? []
            const next = NEXT_STATUS[order.status]

            return (
              <div key={order.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-bold text-ink-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-ink-500">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <button onClick={() => setActiveOrder(activeOrder?.id === order.id ? null : order)} className="text-ink-400 hover:text-ink-600">
                      <ChevronDown className={`w-4 h-4 transition-transform ${activeOrder?.id === order.id ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
                  {sellerItems.slice(0, 4).map((item: any) => {
                    const img = item.product?.images?.find((i: any) => i.is_primary) ?? item.product?.images?.[0]
                    return (
                      <div key={item.id} className="relative w-12 h-12 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                        {img && <Image src={img.url} alt="" fill sizes="48px" className="object-cover" />}
                      </div>
                    )
                  })}
                  <div className="text-sm text-ink-600 ml-1">
                    <p className="font-medium">{formatTZS(sellerItems.reduce((s: number, i: any) => s + i.total_price, 0))}</p>
                    <p className="text-xs text-ink-400">{sellerItems.length} bidhaa</p>
                  </div>
                </div>

                {/* Delivery info */}
                <div className="text-xs text-ink-500 mb-3">
                  📍 {order.delivery_name} · {order.delivery_phone} · {order.delivery_address}
                </div>

                {/* Actions */}
                {activeOrder?.id === order.id && order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <div className="border-t border-ink-100 pt-3 space-y-2">
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Maelezo (hiari)..."
                      rows={2}
                      className="input text-xs resize-none"
                    />
                    <div className="flex gap-2">
                      {next && order.status === 'packed' ? (
                        <div className="flex-1">
                          <ReadyForPickupButton
                                               orderId={order.id}
                    sellerId={seller!.id}
                    sellerLatitude={(seller as any).latitude}
                    sellerLongitude={(seller as any).longitude}
                    sellerAddress={seller!.store_name}
                    deliveryAddress={order.delivery_address}

                            suggestedFee={order.delivery_fee}
                          />
                          <button
                            onClick={() => handleAdvance(order)}
                            disabled={!!updatingId}
                            className="text-xs text-ink-400 underline mt-2"
                          >
                            Au weka alama ya kusafirishwa moja kwa moja (bila dereva wa Duka Janja)
                          </button>
                        </div>
                      ) : next ? (
                        <button
                          onClick={() => handleAdvance(order)}
                          disabled={!!updatingId}
                          className="btn-primary text-sm py-2 flex-1 justify-center"
                        >
                          {updatingId === order.id ? 'Inabadilisha...' : `→ ${STATUS_LABELS[next]}`}
                        </button>
                      ) : null}
                      {order.status !== 'out_for_delivery' && order.status !== 'delivered' && (
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={!!updatingId}
                          className="btn-danger text-sm py-2 px-3 justify-center"
                        >
                          Futa
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {order.status === 'delivered' && seller && (
                  <div className="border-t border-ink-100 pt-3 mt-1">
                    <DeliveryRatingSection orderId={order.id} reviewerId={seller.user_id} reviewerRole="seller" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
