'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LiveDeliveryMap from './LiveDeliveryMap'

interface ActiveOrderDelivery {
  delivery_id: string
  status: 'accepted' | 'picked_up'
  rider_id: string
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number | null
  delivery_lng: number | null
}

/**
 * Drop into the buyer's order detail page. Shows nothing until a Duka Janja
 * rider has accepted the delivery, then shows a live map that updates from
 * the rider's broadcast (see useDeliveryBroadcast, Phase 11) — no polling.
 */
export default function OrderLiveMapSection({ orderId }: { orderId: string }) {
  const supabase = createClient()
  const [delivery, setDelivery] = useState<ActiveOrderDelivery | null>(null)
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // Refresh periodically in case the delivery status changes (e.g. moves
    // from accepted -> picked_up, or completes) while this page is open.
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function load() {
    const { data } = await supabase.rpc('get_active_delivery_for_order', { p_order_id: orderId })
    const row = Array.isArray(data) ? data[0] : null
    setDelivery(row ?? null)

    if (row?.rider_id) {
      const { data: rider } = await supabase
        .from('rider_public_status')
        .select('current_location')
        .eq('id', row.rider_id)
        .maybeSingle()
      // current_location comes back as GeoJSON when selected through PostgREST.
      const coords = (rider?.current_location as any)?.coordinates
      if (coords) setRiderLocation({ lat: coords[1], lng: coords[0] })
    }

    setLoading(false)
  }

  if (loading || !delivery) return null

  return (
    <div className="mt-4">
     <h2 className="font-semibold text-sm text-ink-800 dark:text-ink-100 mb-2">Fuatilia Dereva Wako</h2>
      <LiveDeliveryMap
        deliveryId={delivery.delivery_id}
        pickupLocation={{ lat: delivery.pickup_lat, lng: delivery.pickup_lng }}
        deliveryLocation={
          delivery.delivery_lat && delivery.delivery_lng ? { lat: delivery.delivery_lat, lng: delivery.delivery_lng } : null
        }
        initialRiderLocation={riderLocation}
      />
    </div>
  )
}
