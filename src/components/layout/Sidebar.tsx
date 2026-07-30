'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, Heart, User, Store } from 'lucide-react'
import { cn } from '@/utils'

const LINKS = [
  { href: '/', icon: Home, label: 'Nyumbani' },
  { href: '/search', icon: LayoutGrid, label: 'Vinjari' },
  { href: '/checkout', icon: ShoppingCart, label: 'Kikapu' },
  { href: '/orders', icon: Package, label: 'Maagizo' },
  { href: '/wishlist', icon: Heart, label: 'Pendwa' },
  { href: '/seller/dashboard', icon: Store, label: 'Duka' },
  { href: '/settings', icon: User, label: 'Akaunti' },
]

export default function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden lg:flex flex-col items-center gap-1 fixed left-0 top-0 bottom-0 w-16 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800 pt-20 z-30">
      {LINKS.map((link) => {
        const Icon = link.icon
        const active = isActive(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={cn(
              'relative w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-xl mx-2 mb-1 transition-all duration-200 group',
              active
                ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 shadow-sm'
                : 'text-ink-400 dark:text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800 hover:text-ink-700 dark:hover:text-ink-200'
            )}
          >
            <Icon className={cn('w-5 h-5 transition-transform duration-200', active ? 'scale-110' : 'group-hover:scale-110')} />
            <span className="text-[9px] font-semibold leading-none">{link.label}</span>
          </Link>
        )
      })}
    </aside>
  )
}
