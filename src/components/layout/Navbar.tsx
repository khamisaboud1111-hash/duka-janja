'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShoppingCart, Heart, Bell, User, Search, Menu, X, Globe, LogOut, Package, Store, LayoutDashboard, Grid3x3, MapPin, Tag, Sun, Moon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCartStore, useLangStore, useThemeStore } from '@/store'
import { t } from '@/i18n/translations'
import type { Profile, Category } from '@/types'
import { cn } from '@/utils'
import Sidebar from './Sidebar'

export default function Navbar({ categories = [] }: { categories?: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { lang, setLang } = useLangStore()
  const { theme, toggleTheme } = useThemeStore()
  const itemCount = useCartStore((s) => s.itemCount())
  const [profile, setProfile] = useState<Profile | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
      <header
        className={cn(
          'sticky top-0 z-50 border-b transition-all duration-200',
          scrolled
            ? 'bg-white/90 dark:bg-ink-900/80 backdrop-blur-xl border-ink-100 dark:border-ink-800/60 shadow-sm'
            : 'bg-white dark:bg-ink-900 border-transparent dark:border-ink-800/30'
        )}
      >
        <div className="page-container">
          <div className="flex items-center h-14 gap-3">
            {/* Sidebar menu trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Menu"
              className="p-2 -ml-1 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 active:scale-90 transition-all flex-shrink-0"
            >
              <Menu className="w-5 h-5 text-ink-700 dark:text-ink-200" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2 group">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center group-hover:shadow-glow-brand transition-shadow">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="font-display font-black text-brand-700 dark:text-brand-300 text-lg tracking-tight hidden sm:block">
                Duka Janja
              </span>
            </Link>

            {/* Categories mega-menu trigger */}
            <div className="relative hidden md:block flex-shrink-0">
              <button
                onClick={() => setCategoriesOpen((v) => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <Grid3x3 className="w-4 h-4" /> {lang === 'en' ? 'Categories' : 'Kategoria'}
              </button>
              {categoriesOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoriesOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 w-72 grid grid-cols-2 gap-1 p-3 card z-50 shadow-modal animate-scale-in origin-top-left">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/search?category=${cat.slug}`}
                        onClick={() => setCategoriesOpen(false)}
                        className="flex items-center px-2.5 py-2 rounded-lg text-sm text-ink-700 dark:text-ink-200 hover:bg-brand-50 dark:hover:bg-ink-800 transition-colors"
                      >
                        <span className="truncate">{lang === 'en' ? cat.name_en : cat.name_sw}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Search — always accessible */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('search', lang)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-ink-50 dark:bg-ink-800 border border-transparent dark:border-ink-700 text-sm text-ink-800 dark:text-ink-100 placeholder:text-ink-400 dark:placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white dark:focus:bg-ink-900 transition-all"
                />
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Quick links */}
              <Link href="/#marketplace-map" className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
                <MapPin className="w-3.5 h-3.5" /> {lang === 'en' ? 'Map' : 'Ramani'}
              </Link>
              <Link href="/search?sort=discount" className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-spice-600 dark:text-spice-400 hover:bg-spice-50 dark:hover:bg-spice-500/10 transition-colors">
                <Tag className="w-3.5 h-3.5" /> {lang === 'en' ? 'Deals' : 'Ofa'}
              </Link>
              <Link href={profile?.role === 'seller' ? '/seller/dashboard' : '/register?type=seller'} className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
                <Store className="w-3.5 h-3.5" /> {lang === 'en' ? 'Seller Hub' : 'Kituo cha Wauzaji'}
              </Link>

              {/* Dark / light mode toggle */}
              <button
                onClick={toggleTheme}
                aria-label={lang === 'en' ? 'Toggle theme' : 'Badilisha mwonekano'}
                className="p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 active:scale-90 transition-all"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-ink-200" /> : <Moon className="w-5 h-5 text-ink-700" />}
              </button>

              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {lang === 'en' ? 'SW' : 'EN'}
              </button>

              {/* Cart */}
              <Link href="/checkout" className="relative p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 active:scale-90 transition-all">
                <ShoppingCart className="w-5 h-5 text-ink-700 dark:text-ink-200" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-spice-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {profile ? (
                <>
                  {/* Wishlist */}
                  <Link href="/wishlist" className="hidden sm:block p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 active:scale-90 transition-all">
                    <Heart className="w-5 h-5 text-ink-700 dark:text-ink-200" />
                  </Link>

                  {/* Notifications */}
                  <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800 active:scale-90 transition-all">
                    <Bell className="w-5 h-5 text-ink-700 dark:text-ink-200" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                    >
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} className="w-7 h-7 rounded-lg object-cover ring-2 ring-transparent hover:ring-brand-400 transition-all" alt="" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center">
                          <span className="text-brand-700 dark:text-brand-300 font-bold text-xs">
                            {profile.full_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </button>

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-52 card py-1 z-50 shadow-modal animate-scale-in origin-top-right">
                          <div className="px-4 py-2.5 border-b border-ink-100 dark:border-ink-800">
                            <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{profile.full_name}</p>
                            <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{profile.email}</p>
                          </div>
                          <MenuLink href="/orders" icon={<Package className="w-4 h-4" />} label={t('orders', lang)} onClick={() => setMenuOpen(false)} />
                          <MenuLink href="/wishlist" icon={<Heart className="w-4 h-4" />} label={t('wishlist', lang)} onClick={() => setMenuOpen(false)} />
                          {(profile.role === 'seller' || profile.role === 'admin') && (
                            <MenuLink href="/seller/dashboard" icon={<Store className="w-4 h-4" />} label={t('sellerDashboard', lang)} onClick={() => setMenuOpen(false)} />
                          )}
                          {profile.role === 'admin' && (
                            <MenuLink href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label={t('adminDashboard', lang)} onClick={() => setMenuOpen(false)} />
                          )}
                          <div className="border-t border-ink-100 dark:border-ink-800 mt-1 pt-1">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-ink-900/85 backdrop-blur-xl border-t border-ink-100 dark:border-ink-800/60 safe-bottom">
        <div className="flex items-center justify-around h-14">
          <BottomNavLink href="/" icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>} label="Home" active={pathname === '/'} />
          <BottomNavLink href="/search" icon={<Search className="w-5 h-5" />} label={t('shop', lang)} active={pathname.startsWith('/search') || pathname.startsWith('/products')} />
          <BottomNavLink href="/checkout" icon={<ShoppingCart className="w-5 h-5" />} label={t('cart', lang)} active={pathname === '/checkout'} badge={itemCount} />
          <BottomNavLink href="/orders" icon={<Package className="w-5 h-5" />} label={t('orders', lang)} active={pathname.startsWith('/orders')} />
          <BottomNavLink href={profile ? '/notifications' : '/login'} icon={<Bell className="w-5 h-5" />} label="You" active={pathname === '/notifications'} badge={unreadCount} />
        </div>
      </nav>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        profile={profile}
        onLogout={handleLogout}
      />
    </>
  )
}

function MenuLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
      <span className="text-ink-500 dark:text-ink-400">{icon}</span>
      {label}
    </Link>
  )
}

function BottomNavLink({ href, icon, label, active, badge }: { href: string; icon: React.ReactNode; label: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} className={cn('relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-90', active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-ink-400')}>
      <span className="relative">
        {icon}
        {badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-spice-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {badge > 9 ? '9' : badge}
          </span>
        )}
      </span>
      <span className="text-xs font-medium">{label}</span>
      {active && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-brand-500 dark:bg-brand-400" />}
    </Link>
  )
}
