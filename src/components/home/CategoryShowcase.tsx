import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'

// Curated photography per category slug (all free-to-use, Unsplash License).
// Anything not in this map falls back to its emoji icon on a gradient tile,
// so newly-added categories never render broken.
const CATEGORY_PHOTOS: Record<string, string> = {
  spices: 'https://images.unsplash.com/photo-1716816211590-c15a328a5ff0?q=80&w=600&auto=format&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1481325545291-94394fe1cf95?q=80&w=600&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1757627550652-30788bfce978?q=80&w=600&auto=format&fit=crop',
  crafts: 'https://images.unsplash.com/photo-1631125915902-d8abe9225ff2?q=80&w=600&auto=format&fit=crop',
  electronics: 'https://images.unsplash.com/photo-1603184017968-953f59cd2e37?q=80&w=600&auto=format&fit=crop',
  home: 'https://images.unsplash.com/photo-1632323187625-7a4e4414338e?q=80&w=600&auto=format&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1567721913486-6585f069b332?q=80&w=600&auto=format&fit=crop',
  agriculture: 'https://images.unsplash.com/photo-1483871788521-4f224a86e166?q=80&w=600&auto=format&fit=crop',
}

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-2xl text-ink-900 dark:text-white">Kategoria Maarufu</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Vinjari kategoria zote za Duka Janja</p>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap hover:gap-2 transition-all"
          >
            Tazama Zote <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((cat) => {
            const photo = CATEGORY_PHOTOS[cat.slug]
            return (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}`}
                className="group flex-shrink-0 w-24 sm:w-auto flex flex-col items-center gap-2 text-center"
              >
                <span className="relative w-24 h-24 sm:w-full sm:aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 shadow-card group-hover:shadow-card-hover group-hover:-translate-y-1 transition-all duration-200">
                  {photo ? (
                    <Image src={photo} alt={cat.name_sw} fill sizes="140px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-3xl">{cat.icon}</span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                </span>
                <span className="text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 leading-tight line-clamp-2">
                  {cat.name_sw}
                </span>
              </Link>
            )
          })}
        </div>

        <Link
          href="/search"
          className="sm:hidden mt-5 inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-300 font-semibold"
        >
          Tazama Zote <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
