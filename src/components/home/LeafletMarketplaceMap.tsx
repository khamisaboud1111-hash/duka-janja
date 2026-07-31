'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { Maximize, Minimize, MapPin, Satellite, Layers, Map, Home } from 'lucide-react'
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

export interface LeafletMapHandle {
  refresh: () => void
  flyToZanzibar: () => void
}

// Main island (Unguja) is the primary view. The archipelago bounds below only
// cap how far the user can pan, so Pemba stays reachable to the north.
const UNGUJA_BOUNDS: [[number, number], [number, number]] = [
  [-6.55, 39.02],
  [-5.68, 39.62],
]
const ARCHIPELAGO_BOUNDS: [[number, number], [number, number]] = [
  [-6.9, 38.9],
  [-4.6, 39.9],
]
const ZANZIBAR_CENTER: [number, number] = [-6.1659, 39.2026]

// Simplified Zanzibar island outlines (Unguja + Pemba). Drawn as vector shapes
// the moment the map initializes — the archipelago is visible instantly with
// ZERO external requests, so it can never be a blank screen.
const ZANZIBAR_ISLANDS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Unguja' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [39.31, -5.72],
            [39.36, -5.79],
            [39.42, -5.86],
            [39.47, -5.93],
            [39.5, -6.0],
            [39.52, -6.08],
            [39.53, -6.16],
            [39.52, -6.24],
            [39.49, -6.32],
            [39.44, -6.39],
            [39.38, -6.45],
            [39.32, -6.44],
            [39.27, -6.4],
            [39.22, -6.34],
            [39.18, -6.28],
            [39.16, -6.22],
            [39.15, -6.16],
            [39.16, -6.1],
            [39.17, -6.04],
            [39.19, -5.98],
            [39.2, -5.92],
            [39.23, -5.86],
            [39.26, -5.8],
            [39.29, -5.75],
            [39.31, -5.72],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Pemba' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [39.79, -4.86],
            [39.83, -4.93],
            [39.85, -5.01],
            [39.84, -5.09],
            [39.8, -5.16],
            [39.76, -5.23],
            [39.74, -5.31],
            [39.7, -5.38],
            [39.66, -5.45],
            [39.62, -5.44],
            [39.58, -5.38],
            [39.59, -5.3],
            [39.61, -5.22],
            [39.63, -5.14],
            [39.66, -5.07],
            [39.7, -5.0],
            [39.74, -4.93],
            [39.79, -4.86],
          ],
        ],
      },
    },
  ],
}

// Main roads of Zanzibar as vector routes — visible instantly, no tiles needed.
// Approximate real-world routes (Stone Town → Nungwi, east coast, the island
// crossing, the southern loop, and Pemba's Chake Chake → Wete road).
const ZANZIBAR_ROADS = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'West coast road (Stone Town – Nungwi)' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.192, -6.162],
          [39.204, -6.12],
          [39.208, -6.08],
          [39.213, -6.042],
          [39.217, -6.008],
          [39.221, -5.972],
          [39.227, -5.94],
          [39.237, -5.902],
          [39.247, -5.868],
          [39.262, -5.835],
          [39.283, -5.8],
          [39.299, -5.765],
          [39.3, -5.726],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'East coast road (Kiwengwa – Paje)' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.425, -5.99],
          [39.442, -6.022],
          [39.455, -6.058],
          [39.463, -6.095],
          [39.47, -6.13],
          [39.475, -6.165],
          [39.478, -6.2],
          [39.484, -6.235],
          [39.494, -6.27],
          [39.504, -6.303],
          [39.511, -6.32],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Stone Town – Paje crossing' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.192, -6.162],
          [39.232, -6.17],
          [39.272, -6.185],
          [39.312, -6.205],
          [39.352, -6.23],
          [39.392, -6.26],
          [39.432, -6.29],
          [39.472, -6.312],
          [39.505, -6.32],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Southern loop (Paje – Jambiani – Kizimkazi – Stone Town)' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.511, -6.32],
          [39.518, -6.36],
          [39.525, -6.4],
          [39.533, -6.435],
          [39.518, -6.46],
          [39.492, -6.468],
          [39.458, -6.464],
          [39.425, -6.456],
          [39.39, -6.45],
          [39.378, -6.44],
          [39.33, -6.42],
          [39.292, -6.382],
          [39.256, -6.332],
          [39.24, -6.282],
          [39.228, -6.238],
          [39.214, -6.202],
          [39.192, -6.162],
        ],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Pemba road (Chake Chake – Wete)' },
      geometry: {
        type: 'LineString',
        coordinates: [
          [39.76, -5.245],
          [39.745, -5.15],
          [39.722, -5.055],
        ],
      },
    },
  ],
}

// Towns & villages of Zanzibar with their locations.
const ZANZIBAR_TOWNS: { name: string; lat: number; lng: number }[] = [
  { name: 'Stone Town', lat: -6.162, lng: 39.192 },
  { name: 'Nungwi', lat: -5.726, lng: 39.3 },
  { name: 'Kendwa', lat: -5.756, lng: 39.227 },
  { name: 'Kiwengwa', lat: -5.99, lng: 39.425 },
  { name: 'Matemwe', lat: -6.036, lng: 39.475 },
  { name: 'Uroa', lat: -6.2, lng: 39.49 },
  { name: 'Paje', lat: -6.32, lng: 39.51 },
  { name: 'Jambiani', lat: -6.38, lng: 39.515 },
  { name: 'Makunduchi', lat: -6.435, lng: 39.53 },
  { name: 'Kizimkazi', lat: -6.44, lng: 39.38 },
  { name: 'Fumba', lat: -6.27, lng: 39.25 },
  { name: 'Bwejuu', lat: -6.28, lng: 39.5 },
  { name: 'Chake Chake', lat: -5.245, lng: 39.76 },
  { name: 'Wete', lat: -5.055, lng: 39.72 },
]

type LayerKey = 'zanzibar' | 'live' | 'satellite'

const LeafletMarketplaceMap = forwardRef<LeafletMapHandle, { pins: SellerPin[] }>(
  function LeafletMarketplaceMap({ pins }, ref) {
    const mapRef = useRef<HTMLDivElement | null>(null)
    const leafletMapRef = useRef<any>(null)
    const cartoLayerRef = useRef<any>(null)
    const satelliteLayerRef = useRef<any>(null)
    const baseVizLayerRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const userMarkerRef = useRef<any>(null)
    const [layer, setLayer] = useState<LayerKey>('zanzibar')
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)

    useEffect(() => {
      let map: any
      let cartoLayer: any
      let satelliteLayer: any

      async function init() {
        const L = (await import('leaflet')).default
        if (!mapRef.current || leafletMapRef.current) return

        map = L.map(mapRef.current, {
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
          zoomControl: false,
          minZoom: 9,
          maxBounds: ARCHIPELAGO_BOUNDS,
          maxBoundsViscosity: 0.8,
        })
        leafletMapRef.current = map

        // ── Always-on vector base map (zero external requests) ─────────────
        // Islands rendered as sand shapes over the ocean gradient.
        const islands = L.geoJSON(ZANZIBAR_ISLANDS as any, {
          style: {
            color: '#14b8a6',
            weight: 1.5,
            fillColor: '#f5e7c1',
            fillOpacity: 0.9,
          },
        })

        // Big decorative "ZANZIBAR" label over the main island.
        const zanzibarLabel = L.marker([-6.12, 39.32], {
          interactive: false,
          icon: L.divIcon({
            className: '',
            html: `<span style="font-size:30px;font-weight:800;color:rgba(13,148,136,.45);letter-spacing:3px;font-family:ui-sans-serif,system-ui;white-space:nowrap;transform:translate(-50%,-50%);display:inline-block">ZANZIBAR</span>`,
            iconSize: [0, 0],
          }),
        })

        baseVizLayerRef.current = L.layerGroup([islands, zanzibarLabel]).addTo(map)

        // Roads: white casing underneath, amber route lines on top.
        const roadCasing = L.geoJSON(ZANZIBAR_ROADS as any, {
          style: {
            color: '#ffffff',
            weight: 7,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          },
        })
        const roadLines = L.geoJSON(ZANZIBAR_ROADS as any, {
          style: {
            color: '#f59e0b',
            weight: 3.5,
            opacity: 0.95,
            lineCap: 'round',
            lineJoin: 'round',
          },
        })

        // Towns: teal dot + white label pill.
        const towns = L.layerGroup(
          ZANZIBAR_TOWNS.map((t) =>
            L.marker([t.lat, t.lng], {
              interactive: false,
              keyboard: false,
              icon: L.divIcon({
                className: '',
                html: `<div style="transform:translate(-50%,-50%);display:flex;align-items:center;gap:3px;background:rgba(255,255,255,.94);border:1px solid #0d9488;border-radius:9999px;padding:1px 7px;font-size:10px;font-weight:700;color:#0f766e;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15)"><span style="width:6px;height:6px;border-radius:50%;background:#0d9488;display:inline-block;flex-shrink:0"></span>${t.name}</div>`,
                iconSize: [0, 0],
              }),
            })
          )
        )
        L.layerGroup([roadCasing, roadLines, towns]).addTo(map)

        // ── Optional live tiles (only shown when the user picks the layer) ─
        cartoLayer = L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 20,
            subdomains: 'abcd',
          }
        )
        satelliteLayer = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
            maxZoom: 19,
          }
        )
        cartoLayerRef.current = cartoLayer
        satelliteLayerRef.current = satelliteLayer

        // Fallback: if CartoDB tiles fail (network/region block), swap to OSM.
        cartoLayer.on('tileerror', () => {
          if (cartoLayerRef.current?._url?.includes('cartocdn')) {
            const fallback = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 19,
            })
            map.removeLayer(cartoLayer)
            cartoLayer = fallback
            cartoLayerRef.current = fallback
            fallback.addTo(map)
          }
        })

        // Initial view: fit Zanzibar's main island (or pick a center + warm
        // tiles when the container is hidden, e.g. in the preloaded modal).
        if (mapRef.current.clientHeight > 0) {
          map.fitBounds(UNGUJA_BOUNDS)
        } else {
          map.setView(ZANZIBAR_CENTER, 10)
        }

        L.control.zoom({ position: 'topleft' }).addTo(map)
        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map)

        // Seller pins as colored teardrop divIcons — no external image files.
        pins.forEach((pin) => {
          const initial = (pin.store_name.trim()[0] || 'S').toUpperCase()
          const icon = L.divIcon({
            className: '',
            html: `<div style="width:26px;height:26px;border-radius:50%;background:#14b8a6;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;transform:translateY(-7px)">${initial}</div>`,
            iconSize: [26, 34],
            iconAnchor: [13, 34],
          })
          const marker = L.marker([pin.latitude, pin.longitude], { icon }).addTo(map)
          marker.bindPopup(
            `<div style="min-width:160px">
              <div style="font-weight:700;font-size:13px;margin-bottom:2px">${escapeHtml(pin.store_name)}</div>
              <div style="font-size:12px;color:#777;margin-bottom:6px">⭐ ${pin.average_rating?.toFixed(1) ?? '0.0'}${pin.location_label ? ' · ' + escapeHtml(pin.location_label) : ''}</div>
              <a href="/sellers/${pin.store_slug}" style="font-size:12px;font-weight:600;color:#1da8ab">Tembelea Duka →</a>
            </div>`
          )
        })

        setTimeout(() => map.invalidateSize(), 120)
        setTimeout(() => map.invalidateSize(), 500)
      }

      init()

      return () => {
        if (leafletMapRef.current) {
          leafletMapRef.current.remove()
          leafletMapRef.current = null
        }
      }
    }, [pins])

    useImperativeHandle(ref, () => ({
      refresh() {
        const map = leafletMapRef.current
        if (!map) return
        map.invalidateSize()
        setTimeout(() => map.fitBounds(UNGUJA_BOUNDS), 80)
      },
      flyToZanzibar() {
        leafletMapRef.current?.flyToBounds(UNGUJA_BOUNDS)
      },
    }))

    // Swap base layer: vector Zanzibar map (default, always works), live
    // colorful tiles, or satellite imagery.
    useEffect(() => {
      const map = leafletMapRef.current
      if (!map) return
      cartoLayerRef.current?.remove()
      satelliteLayerRef.current?.remove()
      if (layer === 'zanzibar') {
        baseVizLayerRef.current?.addTo(map)
      } else {
        baseVizLayerRef.current?.remove()
        if (layer === 'live') cartoLayerRef.current?.addTo(map)
        if (layer === 'satellite') satelliteLayerRef.current?.addTo(map)
      }
    }, [layer])

    function resetView() {
      leafletMapRef.current?.flyToBounds(UNGUJA_BOUNDS)
    }

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
        setTimeout(() => leafletMapRef.current?.invalidateSize(), 120)
      } catch {
        // Fullscreen can be denied by the browser — fail silently.
      }
    }

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

    const layerButton = (key: LayerKey, label: string, icon: ReactNode, active: boolean) => (
      <button
        type="button"
        onClick={() => setLayer(key)}
        className={`flex items-center gap-1 px-2.5 py-2 text-xs font-semibold transition-colors ${
          active ? 'bg-teal-500 text-white' : 'text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700'
        }`}
        aria-pressed={active}
      >
        {icon} {label}
      </button>
    )

    return (
      <div className="relative">
        <div ref={containerRef} className="relative">
          {/* Ocean gradient — the vector Zanzibar map renders on top instantly */}
          <div
            ref={mapRef}
            style={{
              background: 'linear-gradient(180deg, #8fd0ea 0%, #bce4f3 55%, #dbf1f9 100%)',
            }}
            className="w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-2xl overflow-hidden border border-ink-100 dark:border-ink-800 z-0"
          />

          {/* Layer toggle + fullscreen + locate controls */}
          <div className="absolute top-2 right-2 z-[500] flex flex-col gap-1.5 items-end">
            <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
              {layerButton('zanzibar', 'Zanzibar', <Map className="w-3.5 h-3.5" />, layer === 'zanzibar')}
              {layerButton('live', 'Live', <Layers className="w-3.5 h-3.5" />, layer === 'live')}
              {layerButton('satellite', 'Anga', <Satellite className="w-3.5 h-3.5" />, layer === 'satellite')}
            </div>

            <div className="flex rounded-xl overflow-hidden bg-white dark:bg-ink-800 shadow-card border border-ink-200 dark:border-ink-700">
              <button
                type="button"
                onClick={resetView}
                title="Onyesha Zanzibar yote"
                className="p-2 text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
              >
                <Home className="w-4 h-4" />
              </button>
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
)

export default LeafletMarketplaceMap

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
