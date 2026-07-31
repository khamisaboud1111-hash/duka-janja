import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import HeroSection from '@/components/home/HeroSection'
import QuickActionsCard from '@/components/home/QuickActionsCard'
import TrustBadges from '@/components/home/TrustBadges'
import GetStartedSteps from '@/components/home/GetStartedSteps'
import FeaturedSellersShowcase from '@/components/home/FeaturedSellersShowcase'
import { FadeInView, StaggerGrid, StaggerItem } from '@/components/shared/FadeInView'
import ProductCard from '@/components/product/ProductCard'
import LText from '@/components/shared/LText'
import type { Product } from '@/types'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/Card'
import type { HomeStats } from '@/components/home/HeroSection'

export const dynamic = 'force-dynamic'

// ─── Data Fetching ────────────────────────────────────────────────────────

async function getStats(): Promise<HomeStats> {
  const empty: HomeStats = { active_sellers: 0, verified_stores: 0, products_available: 0, orders_delivered: 0, active_riders: 0 }
  try {
    const supabase = createServerClient()
    const [sellersRes, productsRes, ordersRes, ridersRes] = await Promise.all([
      supabase.from('sellers').select('id, national_id_verified', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'delivered'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'rider'),
    ])
    return {
      active_sellers: sellersRes.count ?? 0,
      verified_stores: 0,
      products_available: productsRes.count ?? 0,
      orders_delivered: ordersRes.count ?? 0,
      active_riders: ridersRes.count ?? 0,
    }
  } catch {
    return empty
  }
}

async function getFeaturedSellers() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('sellers')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('total_sales', { ascending: false })
      .limit(6)
    return (data ?? []) as any[]
  } catch {
    return []
  }
}

async function getRecentProducts() {
  try {
    const supabase = createServerClient()
    const { data } = await supabase
      .from('products')
      .select(`*, seller:sellers(*), images:product_images(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(8)
    return (data ?? []) as Product[]
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function MarketplaceHomePage() {
  const [stats, featuredSellers, recentProducts] = await Promise.all([
    getStats(),
    getFeaturedSellers(),
    getRecentProducts(),
  ])

  return (
    <>
      <HeroSection stats={stats} />
      <QuickActionsCard />

      {/* Trust badges — moved up for early buyer confidence */}
      <FadeInView>
        <TrustBadges />
      </FadeInView>

      {/* Get Started — staged onboarding for new visitors */}
      <GetStartedSteps />

      {recentProducts.length > 0 && (
        <FadeInView>
          <Suspense fallback={
            <div className="section"><div className="grid grid-cols-2 sm:grid-cols-4 gap-3"><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" /></div></div>
          }>
            <section className="section dark:bg-ink-950">
              <div className="page-container">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">
                      <LText k="newProducts" />
                    </h2>
                  </div>
                  <Link href="/search?sort=newest" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
                    <LText k="seeAll" /> →
                  </Link>
                </div>
                <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {recentProducts.slice(0, 4).map((product) => (
                    <StaggerItem key={product.id}>
                      <ProductCard product={product} />
                    </StaggerItem>
                  ))}
                </StaggerGrid>
              </div>
            </section>
          </Suspense>
        </FadeInView>
      )}

      <FadeInView>
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <FeaturedSellersShowcase sellers={featuredSellers} />
        </Suspense>
      </FadeInView>

      {/* Bottom CTA */}
      <section className="relative isolate overflow-hidden bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 py-12 animate-gradient-pan">
        <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-white/10 animate-pulse-glow" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-white/10 animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="page-container relative text-center">
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mb-2">
            <LText k="bottomCtaTitle" />
          </h2>
          <p className="text-white/85 text-sm mb-5 max-w-sm mx-auto">
            <LText k="bottomCtaSubtitle" />
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 font-bold rounded-xl text-sm hover:bg-brand-50 transition-all shadow-lg hover:-translate-y-0.5 active:scale-95">
              <LText k="gs1Cta" />
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-all border border-white/30 hover:-translate-y-0.5 active:scale-95">
              <LText k="browse" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
