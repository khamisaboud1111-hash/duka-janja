'use client'

import Link from 'next/link'
import { LayoutGrid, Map, PackageSearch, Tag, Truck } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export default function QuickActionsCard() {
  const lang = useLangStore((s) => s.lang)
  return (
    <div className="page-container relative z-20 -mt-8 sm:-mt-10">
      <div className="bg-ink-900 dark:bg-ink-900 rounded-2xl shadow-xl border border-ink-800 p-4 sm:p-5 grid grid-cols-4 gap-2 sm:gap-4">
        <Link href="/search" className="quick-action-tile dark:bg-ink-800 dark:border-ink-700">
          <span className="quick-action-tile-icon">
            <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-200 text-center leading-tight">{t('categories', lang)}</span>
        </Link>

        <Link href="/map" className="quick-action-tile dark:bg-ink-800 dark:border-ink-700">
          <span className="quick-action-tile-icon">
            <Map className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-200 text-center leading-tight">{t('marketMap', lang)}</span>
        </Link>

        <Link href="/orders" className="quick-action-tile dark:bg-ink-800 dark:border-ink-700">
          <span className="quick-action-tile-icon">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-200 text-center leading-tight">{t('trackOrder', lang)}</span>
        </Link>

        <Link href="/search?on_sale=true" className="quick-action-tile dark:bg-ink-800 dark:border-ink-700">
          <span className="quick-action-tile-icon">
            <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-brand-400 group-hover:text-brand-300 transition-colors" />
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-ink-200 text-center leading-tight">{t('offers', lang)}</span>
        </Link>
      </div>
    </div>
  )
}
