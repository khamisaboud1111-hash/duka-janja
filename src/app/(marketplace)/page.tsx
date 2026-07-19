import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ProductCard from '@/components/product/ProductCard'
import HeroSection from '@/components/home/HeroSection'
import QuickActionsCard from '@/components/home/QuickActionsCard'
import CategoryShowcase from '@/components/home/CategoryShowcase'
import type { Category } from '@/types'

export const revalidate = 60 // ISR: revalidate every 60s

async function getHomeData() {
  const supabase = createServerClient()

  const [productsRes, categoriesRes, statsRes, mapPinsRes] = await Promise.all([
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

    supabase.rpc('get_homepage_stats'),

    supabase.rpc('get_seller_map_pins'),
  ])

  return {
    products: productsRes.data ?? [],
    categories: (categoriesRes.data ?? []) as Category[],
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

// Deliberately just 4 sections — Hero, Quick Actions, Categories, New
// Arrivals — matching the reference design exactly. Made in Zanzibar,
// Featured Sellers, Delivery Process, the Zanzibar culture gallery, Trust
// Badges, Reviews, and the seller CTA banner all used to live below this;
// none of them are part of the reference home screen, so they're off the
// home page entirely now rather than pushed further down it. The
// components themselves still exist if that content is wanted somewhere
// else later (a dedicated About/Trust page, for instance).
export default async function HomePage() {
  const { products, categories, stats, mapPins } = await getHomeData()
  const newArrivals = products.slice(0, 8)

  return (
    <main className="pb-20 sm:pb-0 dark:bg-ink-950">
      <HeroSection stats={stats} />
      <QuickActionsCard pins={mapPins} />

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
