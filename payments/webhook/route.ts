import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getPaymentAdapter } from '@/lib/payments'
import { PaymentProvider } from '@/types'

/**
 * Generic webhook receiver. Each provider posts here with its own payload shape;
 * `?provider=mpesa|airtel_money|tigo_pesa` tells us which adapter should parse it.
 *
 * NOTE: until real provider credentials exist, the adapters throw — this route
 * is wired and ready, but won't receive real traffic until M-Pesa/Airtel/Tigo
 * merchant accounts are configured (see src/lib/payments/providers/*.ts).
 */
export async function POST(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get('provider') as PaymentProvider | null
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 })

  const adapter = getPaymentAdapter(provider)
  if (!adapter) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })

  const payload = await req.json().catch(() => null)

  try {
    const result = await adapter.handleCallback(payload)
    const supabase = createServerClient()

    const { data: txn } = await supabase
      .from('payment_transactions')
      .update({
        status: result.status,
        provider_payload: result.rawPayload,
        completed_at: result.status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('provider_reference', result.providerReference)
      .select()
      .single()

    if (txn && result.status === 'completed') {
      await supabase.from('orders').update({ payment_confirmed: true }).eq('id', txn.order_id)

      const { data: order } = await supabase.from('orders').select('buyer_id').eq('id', txn.order_id).single()
      if (order) {
        await supabase.from('notifications').insert({
          user_id: order.buyer_id,
          type: 'payment_received',
          title_en: 'Payment received',
          title_sw: 'Malipo yamepokelewa',
          body_en: 'Your payment was successful. Your order is being processed.',
          body_sw: 'Malipo yako yamefanikiwa. Agizo lako linashughulikiwa.',
          link: `/orders/${txn.order_id}`,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Provider not yet configured for live callbacks' }, { status: 501 })
  }
}
