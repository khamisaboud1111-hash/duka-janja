'use client'

import Link from 'next/link'
import { LayoutGrid, Map, PackageSearch, Tag } from 'lucide-react'

const ACTIONS = [
  { icon: LayoutGrid, label: 'Kategoria', href: '/search' },
  { icon: Map, label: 'Ramani', href: '/search?view=map' },
  { icon: PackageSearch, label: 'Agizo', href: '/orders' },
  { icon: Tag, label: 'Ofa', href: '/search?on_sale=true' },
]

// Floats over the bottom edge of the Hero photo, like the reference design —
// deliberately a plain white card (see .quick-action-tile in globals.css for
// why it has no dark: variants).
export default function QuickActionsCard() {
  return (
    <div className="page-container relative z-20 -mt-10 sm:-mt-12">
      <div className="bg-white rounded-2xl shadow-modal border border-ink-100 p-4 sm:p-5 grid grid-cols-4 gap-1 sm:gap-4">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href} className="quick-action-tile">
              <span className="quick-action-tile-icon">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-ink-700 group-hover:text-brand-600 transition-colors" />
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-ink-700 text-center leading-tight">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
