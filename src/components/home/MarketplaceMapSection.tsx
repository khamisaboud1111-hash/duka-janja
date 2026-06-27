'use client'

import dynamic from 'next/dynamic'
import { MapPin } from 'lucide-react'
import type { SellerPin } from './LeafletMarketplaceMap'

const LeafletMarketplaceMap = dynamic(() => import('./LeafletMarketplaceMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] sm:h-[460px] rounded-2xl bg-ink-100 dark:bg-ink-800 animate-pulse" />
  ),
})

export default function MarketplaceMapSection({ pins }: { pins: SellerPin[] }) {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-500" /> Ramani ya Soko
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">
              Tafuta maduka yaliyothibitishwa karibu nawe kote Zanzibar
            </p>
          </div>
        </div>
        <LeafletMarketplaceMap pins={pins} />
      </div>
    </section>
  )
}
