'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowLeft, MapPin, Store } from 'lucide-react'
import type { SellerPin } from './LeafletMarketplaceMap'

const LeafletMarketplaceMap = dynamic(() => import('./LeafletMarketplaceMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gradient-to-b from-sky-200 to-sky-100 animate-pulse" />,
})

export default function FullPageMap({ pins }: { pins: SellerPin[] }) {
  return (
    <div className="h-[100dvh] flex flex-col bg-white dark:bg-ink-950">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
        <Link
          href="/"
          aria-label="Rudi nyumbani"
          className="p-2 -ml-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink-600 dark:text-ink-300" />
        </Link>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg text-ink-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" /> Ramani ya Soko
          </h1>
          <p className="text-xs text-ink-500 dark:text-ink-300">Tafuta maduka yaliyothibitishwa kote Zanzibar</p>
        </div>
        {pins.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 dark:text-ink-300 bg-ink-50 dark:bg-ink-800 rounded-full px-3 py-1.5 whitespace-nowrap">
            <Store className="w-3.5 h-3.5 text-brand-500" /> {pins.length} maduka
          </span>
        )}
      </header>
      <div className="flex-1 min-h-0">
        <LeafletMarketplaceMap pins={pins} fill />
      </div>
    </div>
  )
}
