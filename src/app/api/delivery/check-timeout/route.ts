import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { withValidation } from '@/lib/validation/withValidation'
import { redispatchDelivery } from '@/lib/dispatch/redispatch'

/**
 * ZERO-BUDGET NOTE:
 * Vercel's free Hobby plan only supports daily Cron Jobs, not per-minute ones,
 * so we can't run a true server-side 30-second polling loop for free. Instead,
 * this route is polled by the client (the seller's "waiting for rider" screen
 * and the rider's dashboard both call it every few seconds while a delivery
 * is pending_dispatch). It checks whether the offer has timed out and, if so,
 * performs the same exclusion + re-dispatch step the decline route does.
 *
 * This keeps the whole flow at zero infrastructure cost. If you later upgrade
 * to a Vercel Pro plan, this same logic can be moved into a real Cron Job
 * hitting this delivery_id on a schedule instead of being client-polled.
 */
const checkTimeoutSchema = z.object({
  delivery_id: z.string().uuid(),
})

export const POST = withValidation(checkTimeoutSchema, async (data) => {
  const supabase = createServerClient()

  const { data: delivery, error } = await supabase
    .from('deliveries')
    .select('id, rider_id, status, timeout_expires_at')
    .eq('id', data.delivery_id)
    .single()

  if (error || !delivery) {
    return NextResponse.json({ error: 'Usafirishaji haupo' }, { status: 404 })
  }

  if (delivery.status !== 'pending_dispatch') {
    return NextResponse.json({ expired: false, status: delivery.status })
  }

  const expired = Boolean(delivery.timeout_expires_at) && new Date(delivery.timeout_expires_at!) < new Date()

  if (!expired) {
    return NextResponse.json({ expired: false })
  }

  if (!delivery.rider_id) {
    // No one was ever assigned (no riders were online) — nothing to exclude,
    // just leave it pending so it can be retried next time a rider goes online.
    return NextResponse.json({ expired: true, rider_found: false })
  }

  const result = await redispatchDelivery(supabase, data.delivery_id, delivery.rider_id, 'timed_out')
  return NextResponse.json({ expired: true, ...result })
})
