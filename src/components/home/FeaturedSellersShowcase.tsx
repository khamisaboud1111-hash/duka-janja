import Link from 'next/link'
import Image from 'next/image'
import { BadgeCheck, MapPin, Package, ShoppingBag, Star } from 'lucide-react'

interface FeaturedSeller {
  id: string
  store_name: string
  store_slug: string
  logo_url: string | null
  banner_url: string | null
  average_rating: number
  review_count: number
  total_sales: number
  location_area: string | null
  location_label: string | null
  national_id_verified: boolean
  product_count?: number
}

export default function FeaturedSellersShowcase({ sellers }: { sellers: FeaturedSeller[] }) {
  if (sellers.length === 0) return null

  return (
    <section className="section bg-ink-50/50 dark:bg-ink-900/40">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">Maduka Maarufu</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">Wauzaji halisi waliothibitishwa Zanzibar</p>
          </div>
          <Link href="/search?type=sellers" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
            Zote →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map((seller) => (
            <Link
              key={seller.id}
              href={`/sellers/${seller.store_slug}`}
              className="group rounded-2xl overflow-hidden bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover transition-shadow"
            >
              {/* Banner */}
              <div className="relative h-24 bg-gradient-to-br from-brand-500 to-brand-700">
                {seller.banner_url && (
                  <Image
                    src={seller.banner_url}
                    alt={`Banner ya ${seller.store_name}`}
                    fill
                    sizes="400px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="p-4 -mt-8 relative">
                {/* Logo */}
                <div className="w-16 h-16 rounded-xl border-4 border-white dark:border-ink-900 bg-white dark:bg-ink-800 shadow-card overflow-hidden mb-2">
                  {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.store_name} width={64} height={64} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-brand-100 dark:bg-brand-900">
                      <span className="text-brand-700 dark:text-brand-200 font-bold text-xl">{seller.store_name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 mb-1">
                  <h3 className="font-bold text-ink-900 dark:text-white text-sm line-clamp-1">{seller.store_name}</h3>
                  {seller.national_id_verified && (
                    <BadgeCheck className="w-4 h-4 text-brand-500 flex-shrink-0" aria-label="Duka lililothibitishwa" />
                  )}
                </div>

                {(seller.location_label || seller.location_area) && (
                  <p className="flex items-center gap-1 text-xs text-ink-500 dark:text-ink-400 mb-2">
                    <MapPin className="w-3 h-3" /> {seller.location_label || seller.location_area}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-ink-600 dark:text-ink-300">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {seller.average_rating?.toFixed(1) ?? '0.0'}
                    <span className="text-ink-400">({seller.review_count})</span>
                  </span>
                  {typeof seller.product_count === 'number' && (
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {seller.product_count}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> {seller.total_sales}
                  </span>
                </div>

                <span className="mt-3 inline-flex w-full justify-center items-center gap-1 py-2 rounded-lg bg-ink-50 dark:bg-ink-800 text-ink-700 dark:text-ink-200 text-xs font-semibold group-hover:bg-brand-500 group-hover:text-white transition-colors">
                  Tembelea Duka
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
