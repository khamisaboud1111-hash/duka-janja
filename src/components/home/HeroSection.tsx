'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Search, Store } from 'lucide-react'
import { useLangStore } from '@/store'

interface HomeStats {
  active_sellers: number
  verified_stores: number
  products_available: number
  orders_delivered: number
  active_riders: number
}

function formatStat(n: number | undefined | null): string {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`
  return `${n}`
}

export default function HeroSection({ stats }: { stats: HomeStats }) {
  const { lang } = useLangStore()

  return (
    <section className="relative isolate overflow-hidden bg-ink-900">
      {/* Stone Town, Zanzibar — local asset, not a hotlinked stock photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/zanzibar/stone-town-aerial.jpg"
          alt="Aerial view of Stone Town, Zanzibar"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/80 via-ink-950/20 to-transparent" />
      </div>

      <div className="page-container relative z-10 pt-12 pb-8 sm:pt-20 sm:pb-14 lg:pt-28 lg:pb-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-brand-200 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-4 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
            {lang === 'en' ? "Zanzibar's #1 Marketplace" : 'Soko Namba 1 la Zanzibar'}
          </p>
          <h1 className="font-display font-black text-white text-3xl sm:text-5xl lg:text-6xl leading-[1.08] mb-5 [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
            {lang === 'en' ? (
              <>Buy the Best Products<br />from Zanzibar</>
            ) : (
              <>Nunua Bidhaa Bora<br />Kutoka Zanzibar</>
            )}
          </h1>
          <p className="text-white/85 text-base sm:text-lg mb-8 max-w-lg">
            {lang === 'en'
              ? 'Discover thousands of products from authentic Zanzibar sellers with secure payments and fast shipping.'
              : 'Gundua maelfu ya bidhaa kutoka kwa wauzaji halisi wa Zanzibar zikiwa na malipo salama na usafirishaji wa haraka.'}
          </p>

          {/* In-hero search */}
          <form action="/search" className="mb-8 max-w-xl">
            <div className="relative flex items-center bg-white rounded-2xl shadow-modal p-1.5">
              <Search className="w-5 h-5 text-ink-400 ml-3 flex-shrink-0" />
              <input
                name="q"
                placeholder={lang === 'en' ? 'Search for products, stores, categories...' : 'Tafuta bidhaa, maduka, kategoria...'}
                className="flex-1 bg-transparent px-3 py-2.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none min-w-0"
              />
              <button type="submit" className="btn-primary py-2.5 px-5 flex-shrink-0">
                {lang === 'en' ? 'Search' : 'Tafuta'}
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-3">
            <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-ink-900 font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-lg">
              {lang === 'en' ? 'Start Shopping →' : 'Anza Kununua →'}
            </Link>
            <Link href="/register?type=seller" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30 backdrop-blur-sm">
              <Store className="w-4 h-4" /> {lang === 'en' ? 'Open a Store' : 'Fungua Duka'}
            </Link>
          </div>
        </div>

        {/* Live stats strip — pulled from get_homepage_stats() RPC, never hardcoded */}
        <div className="mt-10 sm:mt-14 grid grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4 max-w-3xl">
          <StatPill value={formatStat(stats.active_sellers)} label={lang === 'en' ? 'Live Sellers' : 'Wauzaji Hai'} />
          <StatPill value={formatStat(stats.products_available)} label={lang === 'en' ? 'Available Products' : 'Bidhaa Zilizopo'} />
          <StatPill value={formatStat(stats.orders_delivered)} label={lang === 'en' ? 'Orders Delivered' : 'Maagizo Yaliyofikishwa'} />
          <StatPill value={formatStat(stats.verified_stores)} label={lang === 'en' ? 'Verified Stores' : 'Maduka Yaliyothibitishwa'} />
          <StatPill value={formatStat(stats.active_riders)} label={lang === 'en' ? 'Active Drivers' : 'Madereva Hai'} />
        </div>
      </div>
    </section>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-3 py-3 text-center">
      <p className="font-display font-black text-white text-lg sm:text-2xl">{value}</p>
      <p className="text-white/70 text-[10px] sm:text-xs leading-tight mt-0.5">{label}</p>
    </div>
  )
}
