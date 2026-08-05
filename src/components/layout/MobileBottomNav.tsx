'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, User } from 'lucide-react'
import { cn } from '@/utils'
import { useLangStore, useCartStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

const LINKS: { href: string; icon: any; labelKey: TranslationKey }[] = [
  { href: '/', icon: Home, labelKey: 'home' },
  { href: '/search', icon: LayoutGrid, labelKey: 'shop' },
  { href: '/checkout', icon: ShoppingCart, labelKey: 'cart' },
  { href: '/orders', icon: Package, labelKey: 'orders' },
  { href: '/settings', icon: User, labelKey: 'you' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const lang = useLangStore((s) => s.lang)
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-ink-900 border-t border-ink-800 safe-bottom">
      <div className="flex items-center justify-around h-14">
        {LINKS.map((link) => {
          const Icon = link.icon
          const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)
          const isCart = link.href === '/checkout'
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full transition-colors relative',
                active ? 'text-brand-400' : 'text-ink-500 hover:text-ink-300'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
              {isCart && cartCount > 0 && (
                <span className="absolute top-1.5 right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              <span className="text-[10px] font-semibold leading-none">{t(link.labelKey, lang)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
