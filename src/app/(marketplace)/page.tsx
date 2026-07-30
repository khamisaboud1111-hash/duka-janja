import { createServerClient } from '@/lib/supabase/server'
import HeroSection from '@/components/home/HeroSection'
import QuickActionsCard from '@/components/home/QuickActionsCard'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import TrustBadges from '@/components/home/TrustBadges'
import FeaturedSellersShowcase from '@/components/home/FeaturedSellersShowcase'
import DeliveryProcess from '@/components/home/DeliveryProcess'
import { FadeInView } from '@/components/shared/FadeInView'
import ProductCard from '@/components/product/ProductCard'
import type { Product, Category } from '@/types'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ─── Data Fetching ────────────────────────────────────────────────────────

async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createServerClient()
    const { data } = await supabase.from('categories').select('*').order('sort_order').limit(8)
    return (data as Category[]) ?? []
  } catch {
    return []
  }
}

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
  const [categories, stats, featuredSellers, recentProducts, reviews] = await Promise.all([
    getCategories(),
    getStats(),
    getFeaturedSellers(),
    getRecentProducts(),
    getRecentReviews(),
  ])

  return (
    <>
      <HeroSection stats={stats} />
      <QuickActionsCard pins={[]} />

      {categories.length > 0 && (
        <FadeInView>
          <CategoryShowcase categories={categories} />
        </FadeInView>
      )}

      {recentProducts.length > 0 && (
        <FadeInView>
          <section className="section dark:bg-ink-950">
            <div className="page-container">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">
                    Bidhaa Mpya
                  </h2>
                </div>
                <Link href="/search?sort=newest" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
                  Zote →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {recentProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        </FadeInView>
      )}

      <FadeInView>
        <FeaturedSellersShowcase sellers={featuredSellers} />
      </FadeInView>

      <TrustBadges />

      <FadeInView>
        <DeliveryProcess />
      </FadeInView>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-r from-brand-500 to-brand-600 py-10">
        <div className="page-container text-center">
          <h2 className="font-display font-black text-xl sm:text-2xl text-white mb-2">
            Anza Kununua na Kuuza Leo!
          </h2>
          <p className="text-white/85 text-sm mb-5 max-w-sm mx-auto">
            Jiunge na maelfu ya Wazanzibari wanaotumia Duka Janja.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-600 font-bold rounded-xl text-sm hover:bg-brand-50 transition-colors shadow-lg">
              Fungua Akaunti Bure
            </Link>
            <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 text-white font-semibold rounded-xl text-sm hover:bg-white/25 transition-colors border border-white/30">
              Vinjari Bidhaa
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
