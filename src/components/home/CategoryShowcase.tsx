import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'

// Gradient backdrop per category slug — all local, no external images.
// Anything not in this map falls back to a brand gradient,
// so newly-added categories never render broken.
const CATEGORY_GRADIENTS: Record<string, string> = {
  spices: 'from-amber-400 to-orange-500',
  fashion: 'from-pink-400 to-rose-500',
  food: 'from-green-400 to-emerald-500',
  crafts: 'from-yellow-400 to-amber-500',
  electronics: 'from-blue-400 to-indigo-500',
  home: 'from-violet-400 to-purple-500',
  beauty: 'from-pink-300 to-rose-400',
  agriculture: 'from-lime-400 to-green-500',
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
            const gradient = CATEGORY_GRADIENTS[cat.slug] || 'from-brand-400 to-brand-500'
            return (
              <Link
                key={cat.id}
                href={`/search?category=${cat.slug}`}
                className="group flex-shrink-0 w-24 sm:w-auto flex flex-col items-center gap-2 text-center"
              >
                <span className={`relative w-24 h-24 sm:w-full sm:aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} shadow-card group-hover:shadow-card-hover group-hover:-translate-y-1 transition-all duration-200 flex items-center justify-center`}>
                  <span className="text-4xl sm:text-5xl drop-shadow-lg">{cat.icon}</span>
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
