'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Trash2, Package, MapPin, CreditCard, CheckCircle } from 'lucide-react'
import { useCartStore, useLangStore, selectCartSubtotal } from '@/store'
import { DELIVERY_ZONES, PAYMENT_METHODS, toPaymentProvider } from '@/utils'
import { formatTZS } from '@/utils'
import { t, type Language } from '@/i18n/translations'
import type { DeliveryZone } from '@/types'
import toast from 'react-hot-toast'
import Link from 'next/link'

function makeSchema(lang: Language) {
  return z.object({
    delivery_name:    z.string().min(2, t('nameRequired', lang)),
    delivery_phone:   z.string().min(10, t('phoneRequired', lang)),
    delivery_zone:    z.string().min(1, t('selectZoneRequired', lang)),
    delivery_address: z.string().min(5, t('addressRequired', lang)),
    payment_method:   z.string().min(1, t('paymentMethodRequired', lang)),
    payment_reference: z.string().optional(),
    notes:            z.string().optional(),
  })
}

type FormData = z.infer<ReturnType<typeof makeSchema>>

export default function CheckoutPage() {
  const router = useRouter()
  const { lang } = useLangStore()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const subtotal = useCartStore(selectCartSubtotal)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(makeSchema(lang)),
    defaultValues: { payment_method: 'mpesa' }
  })

  const selectedZone = watch('delivery_zone') as string
  const deliveryFee = selectedZone ? DELIVERY_ZONES[selectedZone as DeliveryZone]?.fee ?? 0 : 0
  const total = subtotal + deliveryFee

  const onSubmit = useCallback(async (data: FormData) => {
    if (items.length === 0) return
    setSubmitting(true)

    try {
      const orderPayload = {
        items: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        delivery_zone: data.delivery_zone,
        delivery_address: data.delivery_address,
        delivery_name: data.delivery_name,
        delivery_phone: data.delivery_phone,
        payment_method: data.payment_method,
        payment_reference: data.payment_reference || null,
        notes: data.notes || null,
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      })
      const json = await res.json()

      if (!res.ok) {
        toast.error(`${t('error', lang)}: ${json.error ?? 'Unknown'}`)
        setSubmitting(false)
        return
      }

      const order = json.data

      clearCart()

      const provider = toPaymentProvider(data.payment_method)

      if (provider === 'cash_on_delivery') {
        setSuccess(order.id)
        setSubmitting(false)
        return
      }

      const payRes = await fetch('/api/payments/mobile-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          phone_number: data.delivery_phone,
          provider: provider,
        }),
      })
      const payJson = await payRes.json()

      if (payRes.ok && payJson.checkout_url) {
        window.location.href = payJson.checkout_url
        return
      }

      if (payRes.ok && payJson.reference) {
        setSuccess(order.id)
        setSubmitting(false)
        return
      }

      toast.error(t('paymentInitError', lang))
    } catch {
      toast.error(t('networkError', lang))
    }

    setSubmitting(false)
  }, [items, lang, clearCart])

  if (success) {
    return (
      <div className="page-container py-16 text-center">
        <div className="max-w-sm mx-auto">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="font-display font-black text-2xl text-ink-900 mb-2">{t('orderPlaced', lang)} 🎉</h1>
          <p className="text-ink-500 text-sm mb-6">{t('willCallToConfirm', lang)}</p>
          <div className="flex flex-col gap-3">
            <Link href={`/orders/${success}`} className="btn-primary justify-center">
              {t('trackOrder', lang)}
            </Link>
            <Link href="/" className="btn-secondary justify-center">
              {t('continueShopping', lang)}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="page-container py-16 text-center">
        <Package className="w-12 h-12 text-ink-300 mx-auto mb-4" />
        <h2 className="font-semibold text-ink-700 mb-2">{t('emptyCart', lang)}</h2>
        <Link href="/" className="btn-primary mt-4 inline-flex">{t('startShopping', lang)}</Link>
      </div>
    )
  }

  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-4 sm:py-8">
        <h1 className="font-display font-black text-2xl text-ink-900 mb-6">{t('checkout', lang)}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          <div className="lg:col-span-3 space-y-4">

            <div className="card p-4">
              <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t('products', lang)} ({items.length})
              </h2>
              <div className="space-y-4 divide-y divide-ink-100">
                {items.map(({ product, quantity }) => {
                  const img = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
                  return (
                    <div key={product.id} className="flex gap-3 pt-4 first:pt-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                        {img ? <Image src={img.url} alt={product.name} fill sizes="64px" className="object-cover" /> : <Package className="absolute inset-0 m-auto w-6 h-6 text-ink-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-ink-900 line-clamp-1">{product.name}</p>
                        <p className="text-xs text-ink-500">{product.seller?.store_name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 bg-ink-100 rounded-lg p-0.5">
                            <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-white">−</button>
                            <span className="text-xs font-bold w-4 text-center">{quantity}</span>
                            <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-5 h-5 rounded flex items-center justify-center text-xs hover:bg-white">+</button>
                          </div>
                          <span className="font-bold text-sm">{formatTZS(product.price * quantity)}</span>
                          <button onClick={() => removeItem(product.id)} className="text-red-400 hover:text-red-600 ml-auto">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card p-4">
              <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('deliveryDetails', lang)}
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">{t('fullName', lang)}</label>
                    <input {...register('delivery_name')} className="input" placeholder={t('yourName', lang)} />
                    {errors.delivery_name && <p className="text-xs text-red-500 mt-1">{errors.delivery_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">{t('phone', lang)}</label>
                    <input {...register('delivery_phone')} className="input" placeholder="255..." />
                    {errors.delivery_phone && <p className="text-xs text-red-500 mt-1">{errors.delivery_phone.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="label">{t('selectZone', lang)}</label>
                  <select {...register('delivery_zone')} className="input">
                    <option value="">{t('chooseZone', lang)}</option>
                    {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
                      <option key={key} value={key}>
                        {lang === 'sw' ? zone.nameSw : zone.nameEn} — {formatTZS(zone.fee)} ({zone.days} {t('days', lang)})
                      </option>
                    ))}
                  </select>
                  {errors.delivery_zone && <p className="text-xs text-red-500 mt-1">{errors.delivery_zone.message}</p>}
                </div>
                <div>
                  <label className="label">{t('deliveryAddress', lang)}</label>
                  <textarea {...register('delivery_address')} rows={2} className="input resize-none" placeholder={t('addressPlaceholder', lang)} />
                  {errors.delivery_address && <p className="text-xs text-red-500 mt-1">{errors.delivery_address.message}</p>}
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="font-semibold text-ink-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('paymentMethod', lang)}
              </h2>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {PAYMENT_METHODS.map((pm) => {
                  const current = watch('payment_method')
                  return (
                    <label key={pm.id} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${current === pm.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-300'}`}>
                      <input {...register('payment_method')} type="radio" value={pm.id} className="sr-only" />
                      <span>{pm.icon}</span>
                      <span className="font-semibold text-sm">{pm.label}</span>
                    </label>
                  )
                })}
              </div>
              <div>
                <label className="label">{t('paymentReference', lang)}</label>
                <input {...register('payment_reference')} className="input" placeholder={t('paymentReferencePlaceholder', lang)} />
              </div>
              <div className="mt-3">
                <label className="label">{t('additionalNotes', lang)}</label>
                <textarea {...register('notes')} rows={2} className="input resize-none" placeholder={t('notesPlaceholder', lang)} />
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card p-4 sticky top-20">
              <h2 className="font-semibold text-ink-800 mb-4">{t('orderSummary', lang)}</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between text-ink-700">
                  <span>{t('subtotal', lang)}</span>
                  <span>{formatTZS(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-700">
                  <span>{t('deliveryFee', lang)}</span>
                  <span>{deliveryFee > 0 ? formatTZS(deliveryFee) : '—'}</span>
                </div>
                <div className="border-t border-ink-100 pt-2 mt-2 flex justify-between font-bold text-ink-900 text-base">
                  <span>{t('total', lang)}</span>
                  <span>{formatTZS(total)}</span>
                </div>
              </div>
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={submitting}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {submitting ? t('placingOrder', lang) : t('placeOrder', lang)}
              </button>
              <p className="text-xs text-ink-400 text-center mt-3">
                {t('callToConfirmPayment', lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
