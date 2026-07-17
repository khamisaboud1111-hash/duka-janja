'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LayoutGrid, Map, PackageSearch, Tag } from 'lucide-react'
import MapModal from './MapModal'
import type { SellerPin } from './LeafletMarketplaceMap'

// Floats over the bottom edge of the Hero photo, like the reference design —
// deliberately a plain white card (see .quick-action-tile in globals.css for
// why it has no dark: variants).
export default function QuickActionsCard({ pins }: { pins: SellerPin[] }) {
  const [mapOpen, setMapOpen] = useState(false)

  return (
    <div className="page-container relative z-20 -mt-10 sm:-mt-12">
      <div className="bg-white rounded-2xl shadow-modal border border-ink-100 p-4 sm:p-5 grid grid-cols-4 gap-1 sm:gap-4">
        <Link href="/search" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">Kategoria</span>
        </Link>

        {/* Map opens as an on-demand modal rather than a permanent section on
            the home page, so the homepage itself stays short. */}
        <button type="button" onClick={() => setMapOpen(true)} className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">Ramani</span>
        </button>

        <Link href="/orders" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <PackageSearch className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">Agizo</span>
        </Link>

        <Link href="/search?on_sale=true" className="quick-action-tile">
          <span className="quick-action-tile-icon">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">Ofa</span>
        </Link>
      </div>

      <MapModal pins={pins} open={mapOpen} onClose={() => setMapOpen(false)} />
    </div>
  )
}
