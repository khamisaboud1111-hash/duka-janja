import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import HeroSection from '@/components/home/HeroSection'
import QuickActionsCard from '@/components/home/QuickActionsCard'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import FeaturedSellersShowcase from '@/components/home/FeaturedSellersShowcase'
import MarketplaceMapSection from '@/components/home/MarketplaceMapSection'
import DeliveryProcess from '@/components/home/DeliveryProcess'
import ZanzibarDiscovery from '@/components/home/ZanzibarDiscovery'
import TrustBadges from '@/components/home/TrustBadges'
import ReviewsSection from '@/components/home/ReviewsSection'
import type { Category } from '@/types'

export const revalidate = 60 // ISR: revalidate every 60s

async function getHomeData() {
  const supabase = createServerClient()
  const [
    productsRes,
    categoriesRes,
    featuredSellersRes,
    reviewsRes,
    statsRes,
    mapPinsRes,
  ] = await Promise.all([
    supabase
      .from('products')
      .select(`*, seller:sellers(id, store_name, store_slug, status, logo_url, national_id_verified), category:categories(id, name_en, name_sw, slug), images:product_images(*), videos:product_videos(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),

    supabase
      .from('categories')
      .select('*')
      .order('sort_order'),

    supabase
      .from('sellers')
      .select('id, store_name, store_slug, logo_url, banner_url, average_rating, review_count, total_sales, location_area, location_label, national_id_verified, products:products(count)')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(6),

    supabase
      .from('reviews')
      .select('id, rating, comment, created_at, buyer:profiles(full_name, avatar_url), product:products(name, slug)')
      .not('comment', 'is', null)
      .order('created_at', { ascending: false })
      .limit(6),

    supabase.rpc('get_homepage_stats'),

    supabase.rpc('get_seller_map_pins'),
  ])

  return {
    products: productsRes.data ?? [],
    categories: (categoriesRes.data ?? []) as Category[],
    featuredSellers: (featuredSellersRes.data ?? []).map((s: any) => ({
      ...s,
      product_count: s.products?.[0]?.count ?? 0,
    })),
    reviews: (reviewsRes.data ?? []) as any[],
    stats: (statsRes.data as any) ?? {
      active_sellers: 0,
      verified_stores: 0,
      products_available: 0,
      orders_delivered: 0,
      active_riders: 0,
    },
    mapPins: (mapPinsRes.data ?? []) as any[],
  }
}

export default async function HomePage() {
  const { products, categories, featuredSellers, reviews, stats, mapPins } = await getHomeData()
  const madeInZanzibar = products.filter((p: any) => p.is_made_in_zanzibar).slice(0, 6)
  const newArrivals = products.slice(0, 8)

  return (
    <main className="pb-20 sm:pb-0 dark:bg-ink-950">
      <HeroSection stats={stats} />
      
      {/* Fixed: Passing the mapPins data to the component */}
      <QuickActionsCard pins={mapPins} />

      {/* Payments strip */}
      <div className="bg-ink-50 dark:bg-ink-900 border-b border-ink-100 dark:border-ink-800 mt-6">
        <div className="page-container py-3">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-xs text-ink-600 dark:text-ink-300 font-medium">
            <span className="flex-shrink-0 text-ink-400 dark:text-ink-500">Malipo:</span>
            {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Halopesa'].map((p) => (
              <span key={p} className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-ink-800 rounded-lg border border-ink-200 dark:border-ink-700 shadow-sm">{p}</span>
            ))}
          </div>
        </div>
      </div>

      <CategoryShowcase categories={categories} />

      {/* New Arrivals */}
      <section className="section bg-ink-50/50 dark:bg-ink-900/40">
        <div className="page-container">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">Bidhaa Mpya</h2>
              <p className="text-sm text-ink-500 dark:text-ink-300">Zilizoongezwa hivi karibuni</p>
            </div>
            <Link href="/search?sort=newest" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">Zote →</Link>
          </div>
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {newArrivals.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState message="Bidhaa zinaongezwa hivi karibuni" />
          )}
        </div>
      </section>

      {/* Made in Zanzibar */}
      {madeInZanzibar.length > 0 && (
        <section className="section dark:bg-ink-950">
          <div className="page-container">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏅</span>
                  <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">Imezalishwa Zanzibar</h2>
                </div>
                <p className="text-sm text-ink-500 dark:text-ink-300 mt-0.5">Bidhaa za asili za Zanzibar</p>
              </div>
              <Link href="/search?made_in_zanzibar=true" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">Zote →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {madeInZanzibar.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FeaturedSellersShowcase sellers={featuredSellers} />

      <div id="marketplace-map">
        <MarketplaceMapSection pins={mapPins} />
      </div>

      <DeliveryProcess />

      <ZanzibarDiscovery />

      <TrustBadges />

      <ReviewsSection reviews={reviews} />

      {/* CTA: become a seller */}
      <section className="section dark:bg-ink-950">
        <div className="page-container">
          <div className="bg-gradient-to-r from-spice-600 to-spice-500 rounded-2xl p-6 sm:p-8 text-white">
            <div className="max-w-lg">
              <h2 className="font-display font-black text-2xl mb-2">Una Bidhaa za Kuuza?</h2>
              <p className="text-spice-100 text-sm mb-6">
                Fungua duka lako leo. Tunakusaidia kufikia wateja zaidi Zanzibar nzima.
              </p>
              <Link href="/register?type=seller"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-spice-700 font-bold rounded-xl hover:bg-spice-50 transition-colors">
                Fungua Duka →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p className="text-ink-400 dark:text-ink-500 text-sm">{message}</p>
    </div>
  )
}
