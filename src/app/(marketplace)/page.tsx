import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ProductCard from '@/components/product/ProductCard'
import KikoiStripe from '@/components/shared/KikoiStripe'
import type { Product, Category } from '@/types'

export const revalidate = 60 // ISR: revalidate every 60s

async function getHomeData() {
  const supabase = createServerClient()

  const [productsRes, categoriesRes, featuredSellersRes, testimonialsRes] = await Promise.all([
    supabase
      .from('products')
      .select(`*, seller:sellers(id, store_name, store_slug, status, logo_url, national_id_verified), category:categories(id, name_en, name_sw, slug), images:product_images(*)`)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(12),

    supabase
      .from('categories')
      .select('*')
      .order('sort_order'),

    supabase
      .from('sellers')
      .select('*')
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('average_rating', { ascending: false })
      .limit(6),

    supabase
      .from('testimonials')
      .select('*')
      .eq('is_published', true)
      .order('sort_order')
      .limit(6),
  ])

  return {
    products: productsRes.data ?? [],
    categories: categoriesRes.data ?? [],
    featuredSellers: featuredSellersRes.data ?? [],
    testimonials: testimonialsRes.data ?? [],
  }
}

export default async function HomePage() {
  const { products, categories, featuredSellers, testimonials } = await getHomeData()

  const madeInZanzibar = products.filter((p: any) => p.is_made_in_zanzibar).slice(0, 6)
  const newArrivals = products.slice(0, 8)

  return (
    <main className="pb-20 sm:pb-0">
      {/* Hero Banner */}
      <section className="relative bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white overflow-hidden">
        {/* Dhow silhouette — Zanzibar's traditional sailing vessel, low-opacity backdrop */}
        <svg
          className="absolute -right-6 bottom-0 w-[420px] sm:w-[560px] opacity-15 pointer-events-none"
          viewBox="0 0 400 200" fill="none" aria-hidden="true"
        >
          <path d="M40 170 Q200 195 380 165 L360 175 Q200 200 50 178 Z" fill="white" />
          <path d="M180 170 L180 20 L300 165 Z" fill="white" />
          <path d="M170 170 L170 60 L90 165 Z" fill="white" />
        </svg>

        <div className="page-container py-12 sm:py-16 relative z-10">
          <div className="max-w-xl">
            <p className="text-brand-200 text-sm font-semibold uppercase tracking-widest mb-3">
              Soko la Zanzibar
            </p>
            <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
              Nunua bidhaa bora<br />
              <span className="text-sand-300">kutoka Zanzibar</span>
            </h1>
            <p className="text-brand-100 text-base mb-8 max-w-md">
              Bidhaa za asili, mavazi, viungo — lipa kwa M-Pesa, Tigo Pesa, au Airtel Money. Tunafikisha kwako.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-700 font-bold rounded-xl hover:bg-brand-50 transition-colors">
                Anza kununua →
              </Link>
              <Link href="/register?type=seller" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-800/50 text-white font-semibold rounded-xl hover:bg-brand-800 transition-colors border border-brand-400">
                Uza nasi
              </Link>
            </div>
          </div>
        </div>
      </section>

      <KikoiStripe />


      {/* Payments strip */}
      <div className="bg-ink-50 border-b border-ink-100">
        <div className="page-container py-3">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide text-xs text-ink-600 font-medium">
            <span className="flex-shrink-0 text-ink-400">Malipo:</span>
            {['M-Pesa', 'Tigo Pesa', 'Airtel Money', 'Halopesa'].map((p) => (
              <span key={p} className="flex-shrink-0 px-3 py-1.5 bg-white rounded-lg border border-ink-200 shadow-sm">{p}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-ink-100">
        <div className="page-container py-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display font-black text-lg text-ink-900">{featuredSellers.length > 0 ? `${featuredSellers.length}+` : '—'}</p>
              <p className="text-xs text-ink-500">Wauzaji wateule</p>
            </div>
            <div>
              <p className="font-display font-black text-lg text-ink-900">{products.length > 0 ? `${products.length}+` : '—'}</p>
              <p className="text-xs text-ink-500">Bidhaa zinazouzwa</p>
            </div>
            <div>
              <Link href="/policies/returns-refunds" className="block">
                <p className="font-display font-black text-lg text-ink-900">↩</p>
                <p className="text-xs text-brand-600 font-medium underline">Sera ya marejesho</p>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <section className="section">
        <div className="page-container">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl text-ink-900">Aina za bidhaa</h2>
            <Link href="/search" className="text-sm text-brand-600 font-semibold">Zote →</Link>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {categories.map((cat: Category) => (
              <Link key={cat.id} href={`/search?category=${cat.slug}`}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-ink-100 shadow-sm hover:border-brand-300 hover:shadow-card-hover transition-all text-center group">
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs font-medium text-ink-700 leading-tight">{cat.name_sw}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="section bg-ink-50/50">
        <div className="page-container">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-xl text-ink-900">Bidhaa mpya</h2>
              <p className="text-sm text-ink-500">Zilizoongezwa hivi karibuni</p>
            </div>
            <Link href="/search?sort=newest" className="text-sm text-brand-600 font-semibold">Zote →</Link>
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
        <section className="section">
          <div className="page-container">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏅</span>
                  <h2 className="font-display font-bold text-xl text-ink-900">Imezalishwa Zanzibar</h2>
                </div>
                <p className="text-sm text-ink-500 mt-0.5">Bidhaa za asili za Zanzibar</p>
              </div>
              <Link href="/search?made_in_zanzibar=true" className="text-sm text-brand-600 font-semibold">Zote →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {madeInZanzibar.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Sellers */}
      {featuredSellers.length > 0 && (
        <section className="section bg-ink-50/50">
          <div className="page-container">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl text-ink-900">Maduka maarufu</h2>
              <Link href="/search?type=sellers" className="text-sm text-brand-600 font-semibold">Zote →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {featuredSellers.map((seller: any) => (
                <Link key={seller.id} href={`/sellers/${seller.store_slug}`}
                  className="card p-4 flex flex-col items-center gap-2 text-center hover:shadow-card-hover transition-shadow">
                  {seller.logo_url ? (
                    <img src={seller.logo_url} alt={seller.store_name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center">
                      <span className="text-brand-700 font-bold text-lg">{seller.store_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm text-ink-900 line-clamp-1">{seller.store_name}</p>
                    <p className="text-xs text-ink-500">⭐ {seller.average_rating.toFixed(1)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="section">
          <div className="page-container">
            <h2 className="font-display font-black text-xl text-ink-900 mb-5">Wateja wanasema nini</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {testimonials.map((tt: any) => (
                <div key={tt.id} className="card p-4">
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1,2,3,4,5].map((n) => (
                      <span key={n} className={n <= (tt.rating ?? 5) ? 'text-amber-400' : 'text-ink-200'}>★</span>
                    ))}
                  </div>
                  <p className="text-sm text-ink-700 mb-3">&ldquo;{tt.quote_sw}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    {tt.avatar_url ? (
                      <img src={tt.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                        {tt.author_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-ink-800">{tt.author_name}</p>
                      {tt.author_role && <p className="text-xs text-ink-400">{tt.author_role}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA: become a seller */}
      <section className="section">
        <div className="page-container">
          <div className="bg-gradient-to-r from-spice-600 to-spice-500 rounded-2xl p-6 sm:p-8 text-white">
            <div className="max-w-lg">
              <h2 className="font-display font-black text-2xl mb-2">Una bidhaa za kuuza?</h2>
              <p className="text-spice-100 text-sm mb-6">
                Fungua duka lako leo. Tunakusaidia kufikia wateja zaidi Zanzibar nzima.
              </p>
              <Link href="/register?type=seller"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-spice-700 font-bold rounded-xl hover:bg-spice-50 transition-colors">
                Fungua duka →
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
      <p className="text-ink-400 text-sm">{message}</p>
    </div>
  )
}
