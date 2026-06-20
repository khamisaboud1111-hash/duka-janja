'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Bell, User, Search, Menu, X, Globe, LogOut, Package, Store, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore, useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import type { Profile } from '@/types'
import { cn } from '@/utils'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { lang, setLang } = useLangStore()
  const itemCount = useCartStore((s) => s.itemCount())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      if (data) setProfile(data)
    }
    loadProfile()
  }, [])

  useEffect(() => {
    if (!profile) return
    supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))
  }, [profile])

  async function handleLogout() {
    await supabase.auth.signOut()
    setProfile(null)
    router.push('/')
    router.refresh()
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-ink-100 shadow-sm">
        <div className="page-container">
          <div className="flex items-center h-14 gap-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="font-display font-black text-brand-700 text-lg tracking-tight hidden sm:block">
                Duka Janja
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search', lang)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink-50 border border-transparent text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 hover:bg-ink-100 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'en' ? 'SW' : 'EN'}
              </button>

              {/* Cart */}
              <Link href="/checkout" className="relative p-2 rounded-lg hover:bg-ink-100 transition-colors">
                <ShoppingCart className="w-5 h-5 text-ink-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-spice-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {profile ? (
                <>
                  {/* Wishlist */}
                  <Link href="/wishlist" className="hidden sm:block p-2 rounded-lg hover:bg-ink-100 transition-colors">
                    <Heart className="w-5 h-5 text-ink-700" />
                  </Link>

                  {/* Notifications */}
                  <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-ink-100 transition-colors">
                    <Bell className="w-5 h-5 text-ink-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-ink-100 transition-colors"
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-7 h-7 rounded-lg object-cover" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
                          <span className="text-brand-700 font-bold text-xs">
                            {profile.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </button>

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 card py-1 z-50 shadow-modal">
                          <div className="px-4 py-2.5 border-b border-ink-100">
                            <p className="font-semibold text-sm text-ink-900 truncate">{profile.full_name}</p>
                            <p className="text-xs text-ink-500 truncate">{profile.email}</p>
                          </div>
                          <MenuLink href="/orders" icon={<Package className="w-4 h-4" />} label={t('orders', lang)} onClick={() => setMenuOpen(false)} />
                          <MenuLink href="/wishlist" icon={<Heart className="w-4 h-4" />} label={t('wishlist', lang)} onClick={() => setMenuOpen(false)} />
                          {(profile.role === 'seller' || profile.role === 'admin') && (
                            <MenuLink href="/seller/dashboard" icon={<Store className="w-4 h-4" />} label={t('sellerDashboard', lang)} onClick={() => setMenuOpen(false)} />
                          )}
                          {profile.role === 'admin' && (
                            <MenuLink href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label={t('adminDashboard', lang)} onClick={() => setMenuOpen(false)} />
                          )}
                          <div className="border-t border-ink-100 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              {t('logout', lang)}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="btn-secondary py-2 text-xs hidden sm:flex">
                    {t('login', lang)}
                  </Link>
                  <Link href="/register" className="btn-primary py-2 text-xs">
                    {t('register', lang)}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 safe-bottom">
        <div className="flex items-center justify-around h-14">
          <BottomNavLink href="/" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} label="Home" active={pathname === '/'} />
          <BottomNavLink href="/search" icon={<Search className="w-5 h-5" />} label={t('shop', lang)} active={pathname.startsWith('/search') || pathname.startsWith('/products')} />
          <BottomNavLink href="/checkout" icon={<ShoppingCart className="w-5 h-5" />} label={t('cart', lang)} active={pathname === '/checkout'} badge={itemCount} />
          <BottomNavLink href="/orders" icon={<Package className="w-5 h-5" />} label={t('orders', lang)} active={pathname.startsWith('/orders')} />
          <BottomNavLink href={profile ? '/notifications' : '/login'} icon={<Bell className="w-5 h-5" />} label="You" active={pathname === '/notifications'} badge={unreadCount} />
        </div>
      </nav>
    </>
  )
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 transition-colors">
      <span className="text-ink-500">{icon}</span>
      {label}
    </Link>
  )
}

function BottomNavLink({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn('relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors', active ? 'text-brand-600' : 'text-ink-500')}>
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-spice-500 text-white text-xs font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 9 ? '9' : badge}
          </span>
        )}
      </span>
      <span className="text-xs font-medium">{label}</span>
    </Link>
  )
}
