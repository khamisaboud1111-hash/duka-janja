'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-routing-machine'

export interface NavPoint {
  lat: number
  lng: number
  heading?: number
}

interface RiderNavigationMapProps {
  riderLocation: NavPoint | null
  pickupLocation: NavPoint
  deliveryLocation: NavPoint | null
  leg: 'to_pickup' | 'to_delivery'
  customerName?: string
  customerPhone?: string
  onActionClick?: () => void
  actionLabel?: string
}

// Haversine formula to check distance deviation in meters
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000 // Radius of the earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function RiderNavigationMap({
  riderLocation,
  pickupLocation,
  deliveryLocation,
  leg,
  customerName,
  customerPhone,
  onActionClick,
  actionLabel,
}: RiderNavigationMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<L.Map | null>(null)
  const routingControlRef = useRef<L.Routing.Control | null>(null)
  const riderMarkerRef = useRef<L.Marker | null>(null)

  const [isFollowing, setIsFollowing] = useState(true)
  const [routeError, setRouteError] = useState(false)
  const [etaInfo, setEtaInfo] = useState<{ distance: string; duration: string } | null>(null)

  // Cache last routing points to avoid redundant requests
  const lastRoutedOrigin = useRef<{ lat: number; lng: number } | null>(null)
  const lastRoutedDestination = useRef<{ lat: number; lng: number } | null>(null)

  const routerUrl = process.env.NEXT_PUBLIC_ROUTER_URL || 'https://router.project-osrm.org/route/v1'

  const from = leg === 'to_pickup' ? riderLocation : pickupLocation
  const to = leg === 'to_pickup' ? pickupLocation : deliveryLocation

  // Memoized Custom HTML Icons
  const icons = useMemo(() => {
    return {
      rider: (heading = 0) =>
        L.divIcon({
          className: 'custom-rider-icon',
          html: `<div style="transform: rotate(${heading}deg); transition: transform 0.5s ease; background: #0ea5e9; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
                  <span style="font-size: 16px;">🛵</span>
                 </div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        }),
      pickup: L.divIcon({
        className: 'custom-pickup-icon',
        html: `<div style="background: #f59e0b; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <span style="font-size: 14px;">📦</span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
      delivery: L.divIcon({
        className: 'custom-delivery-icon',
        html: `<div style="background: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                <span style="font-size: 14px;">🏠</span>
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      }),
    }
  }, [])

  // 1 & 18. Initialize Map Safely & Handle invalidateSize
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return

    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const initialCenter = from ?? pickupLocation
    const map = L.map(mapRef.current, { zoomControl: false }).setView([initialCenter.lat, initialCenter.lng], 15)
    leafletMapRef.current = map

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Stop auto-following if user interacts/drags the map
    map.on('dragstart', () => setIsFollowing(false))

    // Add static markers
    L.marker([pickupLocation.lat, pickupLocation.lng], { icon: icons.pickup })
      .addTo(map)
      .bindPopup('Mahali pa Kuchukua (Pickup)')

    if (deliveryLocation) {
      L.marker([deliveryLocation.lat, deliveryLocation.lng], { icon: icons.delivery })
        .addTo(map)
        .bindPopup('Mahali pa Kufikisha (Delivery)')
    }

    const timer = setTimeout(() => {
      map.invalidateSize()
    }, 100)

    return () => {
      clearTimeout(timer)
      map.remove()
      leafletMapRef.current = null
    }
  }, [deliveryLocation, icons, pickupLocation])

  // 5, 9, 11, 12, 13. Smart Routing Control (Deviant Trigger & Caching)
  const updateRoute = useCallback(() => {
    const map = leafletMapRef.current
    if (!map || !from || !to) return

    // Check if origin/destination moved significantly (>25 meters) to avoid unnecessary recalculations
    if (
      lastRoutedOrigin.current &&
      lastRoutedDestination.current &&
      getDistanceFromLatLonInMeters(lastRoutedOrigin.current.lat, lastRoutedOrigin.current.lng, from.lat, from.lng) < 25 &&
      lastRoutedDestination.current.lat === to.lat &&
      lastRoutedDestination.current.lng === to.lng
    ) {
      return
    }

    setRouteError(false)

    if (routingControlRef.current) {
      try {
        const plan = routingControlRef.current.getPlan()
        plan.setWaypoints([])
        map.removeControl(routingControlRef.current)
      } catch {
        // Safe catch for cleanup discrepancies
      }
      routingControlRef.current = null
    }

    const control = (L as any).Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      router: (L as any).Routing.osrmv1({ serviceUrl: routerUrl }),
      lineOptions: { styles: [{ color: '#0ea5e9', weight: 6, opacity: 0.85 }] },
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: false, // Prevent camera jumping on every tick
      show: false,
      createMarker: () => null as any,
    })

    control.on('routesfound', (e: any) => {
      const routes = e.routes
      if (routes && routes[0]) {
        const summary = routes[0].summary
        const distanceKm = (summary.totalDistance / 1000).toFixed(1) + ' km'
        const durationMin = Math.ceil(summary.totalTime / 60) + ' min'
        setEtaInfo({ distance: distanceKm, duration: durationMin })
      }
    })

    control.on('routingerror', () => {
      setRouteError(true)
    })

    control.addTo(map)
    routingControlRef.current = control

    lastRoutedOrigin.current = { lat: from.lat, lng: from.lng }
    lastRoutedDestination.current = { lat: to.lat, lng: to.lng }
  }, [from, routerUrl, to])

  useEffect(() => {
    updateRoute()
  }, [updateRoute])

  // 4 & 21. Real-time Smooth Rider Marker Animation & Heading Rotation
  useEffect(() => {
    const map = leafletMapRef.current
    if (!map || !riderLocation) return

    const heading = riderLocation.heading || 0
    const currentIcon = icons.rider(heading)

    if (riderMarkerRef.current) {
      riderMarkerRef.current.setLatLng([riderLocation.lat, riderLocation.lng])
      riderMarkerRef.current.setIcon(currentIcon)
    } else {
      riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], { icon: currentIcon })
        .addTo(map)
        .bindPopup('Wewe (Dereva)')
    }

    if (isFollowing) {
      map.panTo([riderLocation.lat, riderLocation.lng], { animate: true, duration: 0.5 })
    }
  }, [icons, isFollowing, riderLocation])

  return (
    <div className="relative w-full h-[360px] sm:h-[460px] rounded-2xl overflow-hidden shadow-inner border border-ink-100 dark:border-ink-800">
      {/* Map Element */}
      <div ref={mapRef} role="application" aria-label="Navigation map" className="w-full h-full" />

      {/* 15. Live ETA & Distance Overlay Banner */}
      {etaInfo && (
        <div className="absolute top-4 left-4 z-[400] bg-white/90 dark:bg-ink-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-ink-100 dark:border-ink-800 flex items-center gap-3">
          <span className="text-xl">🛵</span>
          <div>
            <p className="text-xs text-ink-500 dark:text-ink-400 font-medium">Muda & Umbali</p>
            <p className="text-sm font-bold text-ink-900 dark:text-white">
              {etaInfo.duration} <span className="text-xs font-normal text-ink-400">({etaInfo.distance})</span>
            </p>
          </div>
        </div>
      )}

      {/* 10. Offline / Route Error Fallback Alert */}
      {routeError && (
        <div className="absolute top-4 right-4 z-[400] bg-red-500 text-white px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 text-xs">
          <span>Imeshindikana kupakia njia.</span>
          <button onClick={updateRoute} className="underline font-semibold cursor-pointer">
            Jaribu Tena
          </button>
        </div>
      )}

      {/* 6. Auto Recentering ('Follow Me') Floating Button */}
      {!isFollowing && riderLocation && (
        <button
          onClick={() => {
            setIsFollowing(true)
            if (leafletMapRef.current) {
              leafletMapRef.current.panTo([riderLocation.lat, riderLocation.lng], { animate: true })
            }
          }}
          className="absolute bottom-24 right-4 z-[400] bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          📍 Fuata Dereva
        </button>
      )}

      {/* 22. Interactive Customer Details & Action Footer Overlay */}
      {(customerName || onActionClick) && (
        <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 dark:bg-ink-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-ink-100 dark:border-ink-800 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-ink-400 font-medium">Mteja</p>
            <h4 className="text-sm font-bold text-ink-900 dark:text-white">{customerName || 'Mteja wa Duka Janja'}</h4>
          </div>
          <div className="flex items-center gap-2">
            {customerPhone && (
              <a
                href={`tel:${customerPhone}`}
                className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 font-semibold text-xs hover:bg-brand-100 transition-colors"
                title="Piga Simu"
              >
                📞 Piga
              </a>
            )}
            {onActionClick && (
              <button
                onClick={onActionClick}
                className="btn-primary px-4 py-2.5 text-xs font-semibold rounded-xl shadow-md"
              >
                {actionLabel || 'Endelea'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
