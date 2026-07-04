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
  leg: 'to_pickup' | 'to_delivery'
}

export function RiderNavigationMap({ riderLocation, pickupLocation, deliveryLocation, leg }: RiderNavigationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const routingControlRef = useRef<any>(null)

  const from = leg === 'to_pickup' ? riderLocation : pickupLocation
  const to = leg === 'to_pickup' ? pickupLocation : deliveryLocation

  useEffect(() => {
    let map: any
    async function init() {
      const L = (await import('leaflet')).default
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
          show: false,
          createMarker: () => null as any,
        }).addTo(map)
      }

      if (riderLocation) {
        const riderIcon = L.divIcon({
          className: 'bg-blue-500 rounded-full border-2 border-white',
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

  useEffect(() => {
    if (!leafletMapRef.current || !riderLocation) return
    leafletMapRef.current.panTo([riderLocation.lat, riderLocation.lng], { animate: true })
  }, [riderLocation?.lat, riderLocation?.lng])

  return (
    <div ref={mapRef} className="w-full h-[320px] sm:h-[420px] rounded-2xl overflow-hidden" />
  )
}
