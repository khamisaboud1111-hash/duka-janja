'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Store, ShoppingBag, Package, Medal, Sparkles, ArrowRight, ShieldCheck, Bike, BadgeCheck, MapPin, Search } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface HomeStats {
  active_sellers: number
  verified_stores: number
  products_available: number
  orders_delivered: number
  active_riders: number
}

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
}

function StatCard({ icon: Icon, value, label }: { icon: any; value: string | number; label: string }) {
  return (
    <motion.div
      variants={item}
      className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10 hover:bg-white/15 transition-colors"
    >
      <p className="text-white font-display font-bold text-lg">{value}</p>
      <p className="text-white/70 text-[10px] font-medium flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
    </motion.div>
  )
}

export default function HeroSection({ stats }: { stats: HomeStats }) {
  const lang = useLangStore((s) => s.lang)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <section className="relative isolate overflow-hidden rounded-b-[2rem] sm:rounded-b-[2.5rem] bg-ink-900 min-h-[520px] sm:min-h-[580px]">
      {/* Background hero image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1586526399086-29d5b453aafe?q=80&w=1600&auto=format&fit=crop"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900/60 via-ink-900/40 to-ink-900/90" />
      </div>

      {/* Decorative orbs */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/10 animate-pulse-glow" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-brand-500/5" />

      <div className="page-container relative z-10 pt-10 pb-16 sm:pt-14 sm:pb-20">
        {/* Location badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-white/90 text-xs font-medium mb-5"
        >
          <MapPin className="w-3.5 h-3.5 text-brand-400" />
          Zanzibar, Tanzania
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="visible">
          <motion.h1
            variants={item}
            className="font-display font-black text-white text-3xl sm:text-5xl lg:text-6xl leading-[1.08] mb-3 max-w-2xl"
          >
            {t('heroTitlePart1', lang)}{' '}
            <span className="shimmer-text">{t('heroTitlePart2', lang)}</span>
          </motion.h1>

          <motion.p variants={item} className="text-white/80 text-sm sm:text-lg mb-7 max-w-md">
            {t('heroSubtitle', lang)}
          </motion.p>

          {/* Search bar integrated in hero */}
          <motion.form
            variants={item}
            onSubmit={handleSearch}
            className="relative max-w-xl mb-6"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder', lang)}
              className="w-full bg-white/95 backdrop-blur-sm border-0 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-ink-900 placeholder:text-ink-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </motion.form>

          <motion.div variants={item} className="flex flex-wrap gap-3 mb-8">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            >
              {t('startShopping', lang)}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/register?type=seller"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/15 text-white font-semibold rounded-xl hover:bg-white/25 transition-colors border border-white/25 backdrop-blur-sm hover:-translate-y-0.5 active:scale-95"
            >
              <Store className="w-4 h-4" /> {t('openStore', lang)}
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust badges row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap gap-4 mb-8"
        >
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <BadgeCheck className="w-4 h-4 text-brand-400" />
            </div>
            <span>{t('verifiedSellers', lang)}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
            </div>
            <span>{t('securePayments', lang)}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
              <Bike className="w-4 h-4 text-brand-400" />
            </div>
            <span>{t('fastDelivery', lang)}</span>
          </div>
        </motion.div>

        {/* Stats row */}
        {stats.active_sellers > 0 && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl"
          >
            <StatCard icon={ShoppingBag} value={stats.products_available} label={t('products', lang)} />
            <StatCard icon={Store} value={stats.active_sellers} label={t('sellers', lang)} />
            <StatCard icon={Package} value={stats.orders_delivered} label={t('ordersDelivered', lang)} />
            <StatCard icon={Medal} value={stats.active_riders} label={t('riders', lang)} />
          </motion.div>
        )}
      </div>
    </section>
  )
}

export type { HomeStats }
