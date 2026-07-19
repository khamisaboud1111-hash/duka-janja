'use client'

import Link from 'next/link'
import { X, Home, LayoutGrid, ShoppingCart, Package, Heart, Bell, User, Store, Bike } from 'lucide-react'
import type { Profile } from '@/types'

const LINKS = [
  { href: '/', icon: Home, label: 'Nyumbani' },
  { href: '/search', icon: LayoutGrid, label: 'Tafuta' },
  { href: '/checkout', icon: ShoppingCart, label: 'Kikapu' },
  { href: '/orders', icon: Package, label: 'Maagizo' },
  { href: '/wishlist', icon: Heart, label: 'Pendwa' },
  { href: '/notifications', icon: Bell, label: 'Arifa' },
]

export default function MobileDrawer({
  open,
  onClose,
  profile,
}: {
  open: boolean
  onClose: () => void
  profile: Profile | null
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-ink-900 shadow-modal flex flex-col">
        <div className="flex items-center justify-between h-14 px-4 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
          <span className="font-display font-black text-brand-700 dark:text-brand-300 text-lg">Duka Janja</span>
          <button onClick={onClose} aria-label="Funga menyu" className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="w-5 h-5 text-ink-500 dark:text-ink-300" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {LINKS.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <Icon className="w-5 h-5 text-ink-500 dark:text-ink-400" /> {link.label}
              </Link>
            )
          })}

          <Link
            href={profile ? '/seller/settings' : '/login'}
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            <User className="w-5 h-5 text-ink-500 dark:text-ink-400" /> Akaunti
          </Link>

          <div className="my-2 border-t border-ink-100 dark:border-ink-800" />

          <Link
            href="/register?type=seller"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
          >
            <Store className="w-5 h-5" /> Fungua Duka
          </Link>
          <Link
            href="/register?type=rider"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
          >
            <Bike className="w-5 h-5" /> Jiunge kama Dereva
          </Link>
        </nav>
      </div>
    </div>
  )
}
