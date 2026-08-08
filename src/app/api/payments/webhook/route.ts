import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidWebhookSignature, verifyTransaction } from '@/lib/payments/aggregator'

export async function POST(req: Request) {
  const signature = req.headers.get('verif-hash')

  if (!isValidWebhookSignature(signature)) {
    console.warn('[payments/webhook] rejected: invalid or missing verif-hash')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const transactionId = body?.data?.id
  if (!transactionId) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 })
  }

  const verification = await verifyTransaction(transactionId)

  if (!verification.verified) {
    console.error('[payments/webhook] could not verify transaction', transactionId)
    return NextResponse.json({ error: 'Verification failed' }, { status: 502 })
  }

  const supabase = createAdminClient()

  let orderId = verification.orderId

  if (!orderId && verification.txRef) {
    const { data: matched } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_reference', verification.txRef)
      .maybeSingle()
    orderId = matched?.id
  }

  if (!orderId) {
    console.error('[payments/webhook] could not match transaction to an order', verification.txRef)
    return NextResponse.json({ error: 'Order not found for transaction' }, { status: 404 })
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, total_amount, payment_confirmed, status')
    .eq('id', orderId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.payment_confirmed) {
    return NextResponse.json({ success: true, already_processed: true })
  }

  if (verification.status !== 'successful') {
    console.warn(`[payments/webhook] transaction ${transactionId} not successful: ${verification.status}`)
    return NextResponse.json({ success: true, payment_status: verification.status })
  }

  if (verification.amount !== undefined && verification.amount < order.total_amount) {
    console.error(`[payments/webhook] amount mismatch for order ${orderId}: paid ${verification.amount}, expected ${order.total_amount}`)
    return NextResponse.json({ error: 'Amount mismatch' }, { status: 422 })
  }

  const { error: updateErr } = await supabase
    .from('orders')
    .update({
      payment_confirmed: true,
      status: order.status === 'pending' ? 'confirmed' : order.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (updateErr) {
    console.error('[payments/webhook] order update failed:', updateErr)
    return NextResponse.json({ error: 'Could not update order' }, { status: 500 })
  }

  const { data: orderRow } = await supabase.from('orders').select('buyer_id').eq('id', orderId).single()
  if (orderRow) {
    await supabase.from('notifications').insert({
      user_id: orderRow.buyer_id,
      type: 'order_placed',
      title_en: 'Payment confirmed',
      title_sw: 'Malipo Yamethibitishwa',
      body_en: 'Your payment was received. Your order is now confirmed.',
      body_sw: 'Malipo yako yamepokelewa. Agizo lako limethibitishwa.',
      link: `/orders/${orderId}`,
    })
  }

  return NextResponse.json({ success: true })
}
