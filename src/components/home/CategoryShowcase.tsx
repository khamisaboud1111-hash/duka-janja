import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-ink-900 dark:text-white">Aina za Bidhaa</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">Vinjari kategoria zote za Duka Janja</p>
          </div>
          <Link
            href="/search"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap hover:gap-2 transition-all"
          >
            Tazama Zote <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.slug}`}
              className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover hover:border-brand-300 dark:hover:border-brand-500/50 hover:-translate-y-1 transition-all duration-200 text-center overflow-hidden"
            >
              <span
                aria-hidden
                className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent dark:from-brand-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
              />
              <span className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 dark:from-brand-900/50 dark:to-brand-900/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-sm">
                {cat.icon}
              </span>
              <span className="relative text-xs sm:text-sm font-semibold text-ink-700 dark:text-ink-200 leading-tight line-clamp-2">
                {cat.name_sw}
              </span>
            </Link>
          ))}
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
