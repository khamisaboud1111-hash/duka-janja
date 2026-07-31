'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Maximize, Minimize, MapPin, Satellite, Layers } from 'lucide-react'
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

type LayerKey = 'streets' | 'satellite'

export default function LeafletMarketplaceMap({ pins }: { pins: SellerPin[] }) {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMapRef = useRef<any>(null)
  const streetLayerRef = useRef<any>(null)
  const satelliteLayerRef = useRef<any>(null)
  const [layer, setLayer] = useState<LayerKey>('streets')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const userMarkerRef = useRef<any>(null)

  useEffect(() => {
    let map: any
    let streetLayer: any
    let satelliteLayer: any

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

      // Fully interactive: scroll wheel zoom, drag pan, pinch zoom on touch.
      map = L.map(mapRef.current, {
        scrollWheelZoom: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        zoomControl: false,
      }).setView(center, pins.length > 0 ? 13 : 12)
      leafletMapRef.current = map

      streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      )
      streetLayerRef.current = streetLayer
      satelliteLayerRef.current = satelliteLayer

      // Standard zoom controls, top-left.
      L.control.zoom({ position: 'topleft' }).addTo(map)

      // Scale bar bottom-left so people can judge distances.
      L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

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

      // Fix layout after the map container gets its final size (modal open).
      setTimeout(() => map.invalidateSize(), 60)
    }

    init()

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove()
        leafletMapRef.current = null
      }
    }
  }, [pins])

  // Swap base layer when the user toggles Streets / Satellite.
  useEffect(() => {
    const map = leafletMapRef.current
    if (!map) return
    if (layer === 'satellite') {
      streetLayerRef.current?.remove()
      satelliteLayerRef.current?.addTo(map)
    } else {
      satelliteLayerRef.current?.remove()
      streetLayerRef.current?.addTo(map)
    }
  }, [layer])

  // Manual fullscreen for the modal so the map is as big as possible.
  async function toggleFullscreen() {
    if (typeof document === 'undefined') return
    const el = containerRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
      // Wait for the resize to settle before recalculating tiles.
      setTimeout(() => leafletMapRef.current?.invalidateSize(), 120)
    } catch {
      // Fullscreen can be denied by the browser — fail silently.
    }
  }

  // "Kwenye mimi" — recenter + zoom to the user's browser location.
  function locateMe() {
    const map = leafletMapRef.current
    if (!map || typeof navigator === 'undefined' || !('geolocation' in navigator)) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        const L = (window as any).L
        map.setView([latitude, longitude], 16)
        if (userMarkerRef.current) map.removeLayer(userMarkerRef.current)
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:22px;height:22px;border-radius:50%;background:#0ea5e9;border:3px solid #fff;box-shadow:0 0 0 6px rgba(14,165,233,.25)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })
        userMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map)
        setNotice('Unaonekana kwenye ramani')
        setTimeout(() => setNotice(null), 3000)
      },
      () => {
        setNotice('Hatuwezi kupata eneo lako')
        setTimeout(() => setNotice(null), 3000)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="relative">
        <div
          ref={mapRef}
          className="w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0"
        />

        {/* Layer toggle + fullscreen + locate controls */}
        <div className="absolute top-2 right-2 z-[500] flex flex-col gap-1.5">
          <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
            <button
              type="button"
              onClick={() => setLayer('streets')}
              className={`flex items-center gap-1 px-2.5 py-2 text-xs font-semibold transition-colors ${
                layer === 'streets'
                  ? 'bg-teal-500 text-white'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
              }`}
              aria-pressed={layer === 'streets'}
            >
              <Layers className="w-3.5 h-3.5" /> Ramani
            </button>
            <button
              type="button"
              onClick={() => setLayer('satellite')}
              className={`flex items-center gap-1 px-2.5 py-2 text-xs font-semibold transition-colors ${
                layer === 'satellite'
                  ? 'bg-teal-500 text-white'
                  : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
              }`}
              aria-pressed={layer === 'satellite'}
            >
              <Satellite className="w-3.5 h-3.5" /> Anga
            </button>
          </div>

          <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
            <button
              type="button"
              onClick={locateMe}
              title="Onyesha eneo langu"
              className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
            >
              <MapPin className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Ondoka kamili' : 'Skrini kamili'}
              className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Non-blocking hint when there are no seller pins yet — the map stays usable */}
        {pins.length === 0 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] max-w-[90%]">
            <p className="text-xs text-ink-600 dark:text-ink-200 bg-white/90 dark:bg-ink-800/90 backdrop-blur-sm border border-ink-200 dark:border-ink-700 rounded-full px-4 py-1.5 shadow-card text-center">
              Maduka yataongezwa hivi karibuni — vinjari ramani ya Zanzibar hadi sasa
            </p>
          </div>
        )}

        {/* Locate feedback */}
        {notice && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[600] max-w-[90%]">
            <p className="text-xs text-white bg-teal-600 dark:bg-teal-700 rounded-full px-4 py-1.5 shadow-card text-center">
              {notice}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
