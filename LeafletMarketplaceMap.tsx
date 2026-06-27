'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

export interface SellerPin {
  id: string
  store_name: string
  store_slug: string
  logo_url: string | null
  average_rating: number
  location_label: string | null
  latitude: number
  longitude: number
}

// Default Zanzibar center (Stone Town) used when no pins are available yet.
const ZANZIBAR_CENTER: [number, number] = [-6.1659, 39.2026]

export default function LeafletMarketplaceMap({ pins }: { pins: SellerPin[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)

  useEffect(() => {
    let map: any

    async function init() {
      const L = (await import('leaflet')).default
      if (!mapRef.current || leafletMapRef.current) return

      // Fix default marker icon paths (Leaflet's bundled assets don't resolve via webpack)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const center: [number, number] =
        pins.length > 0 ? [pins[0].latitude, pins[0].longitude] : ZANZIBAR_CENTER

      map = L.map(mapRef.current, { scrollWheelZoom: false }).setView(center, pins.length > 0 ? 11 : 10)
      leafletMapRef.current = map

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      pins.forEach((pin) => {
        const marker = L.marker([pin.latitude, pin.longitude]).addTo(map)
        const popupHtml = `
          <div style="min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:2px">${escapeHtml(pin.store_name)}</div>
            <div style="font-size:12px;color:#777;margin-bottom:6px">⭐ ${pin.average_rating?.toFixed(1) ?? '0.0'}${pin.location_label ? ' · ' + escapeHtml(pin.location_label) : ''}</div>
            <a href="/sellers/${pin.store_slug}" style="font-size:12px;font-weight:600;color:#1da8ab">Tembelea Duka →</a>
          </div>
        `
        marker.bindPopup(popupHtml)
      })
    }

    init()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [pins])

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0" />
      {pins.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-ink-950/70 rounded-2xl">
          <p className="text-sm text-ink-500 dark:text-ink-300 px-4 text-center">
            Wauzaji wanaongeza maeneo yao ya duka. Ramani itaonyesha alama mara watakapoongezwa.
          </p>
        </div>
      )}
    </div>
  )
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
