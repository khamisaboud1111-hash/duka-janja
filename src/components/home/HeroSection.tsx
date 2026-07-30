import Link from 'next/link'
import { Store, ShoppingBag, Package, Medal } from 'lucide-react'

interface HomeStats {
  active_sellers: number
  verified_stores: number
  products_available: number
  orders_delivered: number
  active_riders: number
}

export default function HeroSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem] bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500">
      {/* Decorative circles */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5" />
      <div className="absolute top-1/3 right-1/4 w-32 h-32 rounded-full bg-amber-400/10" />

      <div className="page-container relative z-10 pt-10 pb-20 sm:pt-16 sm:pb-24">
        <span className="inline-block px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-bold tracking-wide uppercase mb-4">
          Soko Namba 1 la Zanzibar
        </span>
        <h1 className="font-display font-black text-white text-3xl sm:text-5xl leading-[1.08] mb-3 max-w-xl">
          Nunua Bidhaa Bora Kutoka Zanzibar
        </h1>
        <p className="text-white/85 text-sm sm:text-lg mb-7 max-w-md">
          Gundua maelfu ya bidhaa kutoka kwa wauzaji halisi, zikiwa na malipo salama na usafirishaji wa haraka.
        </p>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-xl hover:bg-teal-50 transition-colors shadow-lg">
            Anza Kununua →
          </Link>
          <Link href="/register?type=seller" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30 backdrop-blur-sm">
            <Store className="w-4 h-4" /> Fungua Duka
          </Link>
        </div>

        {/* Stats row */}
        {stats.active_sellers > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white font-display font-bold text-lg">{stats.products_available}</p>
              <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><ShoppingBag className="w-3 h-3" /> Bidhaa</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white font-display font-bold text-lg">{stats.active_sellers}</p>
              <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><Store className="w-3 h-3" /> Wauzaji</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white font-display font-bold text-lg">{stats.orders_delivered}</p>
              <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><Package className="w-3 h-3" /> Yamefikishwa</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">
              <p className="text-white font-display font-bold text-lg">{stats.active_riders}</p>
              <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><Medal className="w-3 h-3" /> Watumishi</p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export type { HomeStats }
