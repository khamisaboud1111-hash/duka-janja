'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, Heart, Bell, User } from 'lucide-react'

const LINKS = [
  { href: '/', icon: Home, label: 'Nyumbani', match: (p: string) => p === '/' },
  { href: '/search', icon: LayoutGrid, label: 'Tafuta', match: (p: string) => p.startsWith('/search') || p.startsWith('/products') },
  { href: '/checkout', icon: ShoppingCart, label: 'Kikapu', match: (p: string) => p === '/checkout' },
  { href: '/orders', icon: Package, label: 'Maagizo', match: (p: string) => p.startsWith('/orders') },
  { href: '/wishlist', icon: Heart, label: 'Pendwa', match: (p: string) => p === '/wishlist' },
  { href: '/notifications', icon: Bell, label: 'Arifa', match: (p: string) => p === '/notifications' },
  { href: '/seller/settings', icon: User, label: 'Akaunti', match: (p: string) => p === '/seller/settings' },
]

// Desktop-only quick-nav rail (this is what you saw as blank left margin on
// the laptop screenshots). Hidden below lg — the mobile bottom nav already
// covers the same ground on phones, so this doesn't duplicate anything there.
export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col items-center gap-1 fixed left-0 top-0 bottom-0 w-16 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800 pt-20 z-30">
      {LINKS.map((link) => {
        const Icon = link.icon
        const active = link.match(pathname)
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl mx-2 mb-1 transition-colors group ${
              active
                ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300'
                : 'text-ink-500 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold leading-none">{link.label}</span>
          </Link>
        )
      })}
    </aside>
  )
}
