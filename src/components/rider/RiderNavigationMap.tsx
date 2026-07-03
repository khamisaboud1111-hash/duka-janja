'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'

export interface NavPoint {
  lat: number
  lng: number
}

interface RiderNavigationMapProps {
  riderLocation: NavPoint | null
  pickupLocation: NavPoint
  deliveryLocation: NavPoint | null
  /** 'to_pickup' shows rider -> pickup. 'to_delivery' shows pickup -> delivery (post pickup). */
  leg: 'to_pickup' | 'to_delivery'
}

/**
 * Uses leaflet-routing-machine with the free public OSRM demo router
 * (router.project-osrm.org) — no paid map/directions API involved, per the
 * zero-budget requirement. For production scale beyond the demo server's
 * fair-use limits, you'd self-host an OSRM instance, but that's a future
 * concern, not a blocker today.
 */
export default function RiderNavigationMap({ riderLocation, pickupLocation, deliveryLocation, leg }: RiderNavigationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const routingControlRef = useRef<any>(null)

  const from = leg === 'to_pickup' ? riderLocation : pickupLocation
  const to = leg === 'to_pickup' ? pickupLocation : deliveryLocation

  useEffect(() => {
    let map: any

    async function init() {
      const L = (await import('leaflet')).default
      // leaflet-routing-machine has no official types; loaded for its side effect
      // of attaching L.Routing to the leaflet namespace.
      // @ts-expect-error - no types published for this package
      await import('leaflet-routing-machine')

      if (!mapRef.current || leafletMapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center = from ?? pickupLocation
      map = L.map(mapRef.current).setView([center.lat, center.lng], 14)
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      if (from && to) {
        routingControlRef.current = (L as any).Routing.control({
          waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
          router: (L as any).Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
          lineOptions: { styles: [{ color: '#1da8ab', weight: 5, opacity: 0.85 }] },
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: true,
          show: false, // hide the verbose turn-by-turn text panel, keep just the map line
          createMarker: () => null as any, // we draw our own markers below for consistent styling
        }).addTo(map)
      }

      if (riderLocation) {
        const riderIcon = L.divIcon({
          html: '<div style="background:#1da8ab;width:18px;height:18px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 2px rgba(29,168,171,0.4)"></div>',
          className: '',
          iconSize: [18, 18],
        })
        L.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon }).addTo(map).bindPopup('Wewe (Dereva)')
      }

      L.marker([pickupLocation.lat, pickupLocation.lng]).addTo(map).bindPopup('Mahali pa Kuchukua')
      if (deliveryLocation) {
        L.marker([deliveryLocation.lat, deliveryLocation.lng]).addTo(map).bindPopup('Mahali pa Kufikisha')
      }
    }

    init()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leg])

  // Update rider marker position live without re-initializing the whole map/route.
  useEffect(() => {
    if (!leafletMapRef.current || !riderLocation) return
    leafletMapRef.current.panTo([riderLocation.lat, riderLocation.lng], { animate: true })
  }, [riderLocation?.lat, riderLocation?.lng])

 return <div ref={mapRef} className="w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0" />
