'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, LayoutGrid, ShoppingCart, Package, Heart, User, Store, X, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import { useUiStore } from '@/store'

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
  const router = useRouter()
  const open = useUiStore((s) => s.sidebarOpen)
  const setOpen = useUiStore((s) => s.setSidebarOpen)
  const [query, setQuery] = useState('')

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      {/* Desktop rail */}
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

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="fixed left-0 top-0 bottom-0 w-72 max-w-[80vw] z-50 flex flex-col bg-white dark:bg-ink-900 shadow-xl lg:hidden"
            >
              <div className="flex items-center justify-between px-4 h-16 border-b border-ink-100 dark:border-ink-800">
                <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  DUKA JANJA
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-ink-500 dark:text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                  aria-label="Funga menyu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="px-4 pt-4 relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tafuta bidhaa..."
                  className="w-full bg-ink-100 dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-full py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500" />
              </form>
              <nav className="flex-1 overflow-y-auto py-3 px-3">
                {LINKS.map((link) => {
                  const Icon = link.icon
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition-colors',
                        active
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 font-semibold'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', active && 'scale-110')} />
                      <span className="text-sm font-medium">{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
