import Link from 'next/link'
import Image from 'next/image'
import { Store } from 'lucide-react'

interface HomeStats {
  active_sellers: number
  verified_stores: number
  products_available: number
  orders_delivered: number
  active_riders: number
}

export default function HeroSection({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-900 rounded-b-[2rem] sm:rounded-b-[2.5rem]">
      {/* Aerial Stone Town / Zanzibar coastline backdrop */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1565019011521-254d3a82d2a8?q=80&w=2400&auto=format&fit=crop"
          alt="Mtazamo wa anga wa Mji Mkongwe na ufukwe wa Zanzibar"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/60 to-ink-950/20" />
      </div>

      <div className="page-container relative z-10 pt-10 pb-20 sm:pt-16 sm:pb-24">
        <span className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-[11px] font-bold tracking-wide uppercase mb-4">
          Soko Namba 1 la Zanzibar
        </span>
        <h1 className="font-display font-black text-white text-3xl sm:text-5xl leading-[1.08] mb-3 max-w-xl [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
          Nunua Bidhaa Bora Kutoka Zanzibar
        </h1>
        <p className="text-white/85 text-sm sm:text-lg mb-7 max-w-md">
          Gundua maelfu ya bidhaa kutoka kwa wauzaji halisi, zikiwa na malipo salama na usafirishaji wa haraka.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg">
            Anza Kununua →
          </Link>
          <Link href="/register?type=seller" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors border border-white/30 backdrop-blur-sm">
            <Store className="w-4 h-4" /> Fungua Duka
          </Link>
        </div>
      </div>
    </section>
  )
}

export type { HomeStats }
