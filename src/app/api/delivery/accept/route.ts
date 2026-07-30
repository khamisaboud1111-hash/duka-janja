import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { acceptDeliverySchema } from '@/lib/validation/rider'
import { redispatchDelivery } from '@/lib/dispatch/redispatch'

/**
 * Rider accepts a pending_dispatch delivery offered to them.
 * Body: { delivery_id }
 */
export const POST = withValidation(acceptDeliverySchema, async (data) => {
  const supabase = createServerClient()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth?.user) {
    return NextResponse.json({ error: 'Hujaingia (not authenticated)' }, { status: 401 })
  }

  const { data: delivery, error: fetchErr } = await supabase
    .from('deliveries')
    .select('id, rider_id, status, timeout_expires_at')
    .eq('id', data.delivery_id)
    .single()

  if (fetchErr || !delivery) {
    return NextResponse.json({ error: 'Usafirishaji haupo (delivery not found)' }, { status: 404 })
  }

  if (delivery.rider_id !== auth.user.id) {
    return NextResponse.json({ error: 'Usafirishaji huu haukutolewa kwako' }, { status: 403 })
  }

  if (delivery.status !== 'pending_dispatch') {
    return NextResponse.json({ error: 'Usafirishaji huu si tena unasubiri (already resolved)' }, { status: 409 })
  }

  // If the 30s window already lapsed, treat as expired rather than letting a
  // late accept slip through — the re-dispatch route may already be reassigning it.
  if (delivery.timeout_expires_at && new Date(delivery.timeout_expires_at) < new Date()) {
    await redispatchDelivery(supabase, data.delivery_id, auth.user.id, 'timed_out')
    return NextResponse.json({ error: 'Muda umepita (offer expired)' }, { status: 409 })
  }

  const { data: updated, error: updateErr } = await supabase
    .from('deliveries')
    .update({ status: 'accepted', accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', data.delivery_id)
    .eq('status', 'pending_dispatch') // guards against a race with the timeout checker
    .select()
    .single()

  if (updateErr || !updated) {
    return NextResponse.json({ error: 'Imeshindikana kukubali (could not accept, may have expired)' }, { status: 409 })
  }

  return NextResponse.json({ delivery: updated })
})
