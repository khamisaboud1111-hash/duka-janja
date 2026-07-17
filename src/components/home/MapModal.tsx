'use client'

import dynamic from 'next/dynamic'
import { X, MapPin } from 'lucide-react'
import type { SellerPin } from './LeafletMarketplaceMap'

const LeafletMarketplaceMap = dynamic(() => import('./LeafletMarketplaceMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-ink-100 dark:bg-ink-800 animate-pulse" />,
})

export default function MapModal({
  pins,
  open,
  onClose,
}: {
  pins: SellerPin[]
  open: boolean
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-ink-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl h-[85vh] sm:h-[620px] flex flex-col overflow-hidden shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
          <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-brand-500" /> Ramani ya Soko
          </h2>
          <button
            onClick={onClose}
            aria-label="Funga ramani"
            className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
          >
            <X className="w-5 h-5 text-ink-500 dark:text-ink-300" />
          </button>
        </div>
        <div className="flex-1 p-3 min-h-0">
          <LeafletMarketplaceMap pins={pins} />
        </div>
      </div>
    </div>
  )
}
