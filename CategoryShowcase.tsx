import Link from 'next/link'
import type { Category } from '@/types'

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">Aina za Bidhaa</h2>
            <p className="text-sm text-ink-500 dark:text-ink-300">Vinjari kategoria zote</p>
          </div>
          <Link href="/search" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
            Zote →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.slug}`}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-gradient-to-b from-white to-ink-50 dark:from-ink-900 dark:to-ink-950 border border-ink-100 dark:border-ink-800 shadow-card hover:shadow-card-hover hover:border-brand-300 hover:-translate-y-0.5 transition-all text-center"
            >
              <span className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {cat.icon}
              </span>
              <span className="text-xs font-semibold text-ink-700 dark:text-ink-200 leading-tight line-clamp-2">
                {cat.name_sw}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
