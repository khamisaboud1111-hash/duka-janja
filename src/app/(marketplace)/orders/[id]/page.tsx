import { createServerClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Package, ArrowLeft } from 'lucide-react'
import OrderTracker from '@/components/order/OrderTracker'
import { formatTZS, formatDate, DELIVERY_ZONES, PAYMENT_METHODS } from '@/utils'

export default async function OrderPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*, product:products(*, images:product_images(*))),
      tracking:order_tracking(* order: created_at asc)
    `)
    .eq('id', params.id)
    .eq('buyer_id', user.id)
    .single()

  if (!order) notFound()

  const zone = DELIVERY_ZONES[order.delivery_zone as keyof typeof DELIVERY_ZONES]
  const payment = PAYMENT_METHODS.find((p) => p.id === order.payment_method)

  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-4 sm:py-8 max-w-2xl">
        <Link href="/orders" className="flex items-center gap-2 text-sm text-ink-500 hover:text-brand-600 mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Maagizo yangu
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-black text-xl text-ink-900">
              Agizo #{order.id.slice(-8).toUpperCase()}
            </h1>
            <p className="text-sm text-ink-500 mt-0.5">Imewekwa {formatDate(order.created_at)}</p>
          </div>
          <span className={`badge text-xs ${
            order.status === 'delivered' ? 'badge-green' :
            order.status === 'cancelled' ? 'badge-red' :
            order.status === 'out_for_delivery' ? 'badge-orange' :
            'badge-blue'
          }`}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Tracker */}
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-sm text-ink-700 mb-4">Hali ya agizo</h2>
          <OrderTracker currentStatus={order.status} tracking={order.tracking} />
        </div>

        {/* Items */}
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-sm text-ink-700 mb-4">Bidhaa ({order.items?.length})</h2>
          <div className="space-y-4 divide-y divide-ink-100">
            {order.items?.map((item: any) => {
              const img = item.product?.images?.find((i: any) => i.is_primary) ?? item.product?.images?.[0]
              return (
                <div key={item.id} className="flex gap-3 pt-4 first:pt-0">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                    {img ? <Image src={img.url} alt={item.product?.name ?? ''} fill sizes="56px" className="object-cover" /> : <Package className="absolute inset-0 m-auto w-5 h-5 text-ink-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-ink-900">{item.product?.name}</p>
                    <p className="text-xs text-ink-500">Idadi: {item.quantity}</p>
                  </div>
                  <p className="font-bold text-sm text-ink-900">{formatTZS(item.total_price)}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-sm text-ink-700 mb-3">Muhtasari</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-ink-600"><span>Bidhaa</span><span>{formatTZS(order.subtotal)}</span></div>
            <div className="flex justify-between text-ink-600"><span>Usafirishaji</span><span>{formatTZS(order.delivery_fee)}</span></div>
            <div className="flex justify-between font-bold text-ink-900 pt-1.5 border-t border-ink-100">
              <span>Jumla</span><span>{formatTZS(order.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* Delivery & payment */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="font-semibold text-xs text-ink-500 uppercase tracking-wide mb-2">Utoaji</h2>
            <p className="font-semibold text-sm text-ink-900">{order.delivery_name}</p>
            <p className="text-xs text-ink-500">{order.delivery_phone}</p>
            <p className="text-xs text-ink-500 mt-1">{zone?.nameSw}</p>
            <p className="text-xs text-ink-500">{order.delivery_address}</p>
          </div>
          <div className="card p-4">
            <h2 className="font-semibold text-xs text-ink-500 uppercase tracking-wide mb-2">Malipo</h2>
            <p className="font-semibold text-sm text-ink-900">{payment?.label ?? order.payment_method}</p>
            {order.payment_reference && <p className="text-xs text-ink-500 mt-1">Ref: {order.payment_reference}</p>}
            <span className={`badge mt-2 text-xs ${order.payment_confirmed ? 'badge-green' : 'badge-gray'}`}>
              {order.payment_confirmed ? 'Imethibitishwa' : 'Inasubiri'}
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
