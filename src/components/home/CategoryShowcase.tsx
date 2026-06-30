'use client'

import Link from 'next/link'
import { useLangStore } from '@/store'
import type { Category } from '@/types'

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  const { lang } = useLangStore()

  if (categories.length === 0) return null

  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white">
            {lang === 'en' ? 'Categories' : 'Aina za Bidhaa'}
          </h2>
          <Link href="/search" className="text-sm text-brand-600 dark:text-brand-300 font-semibold whitespace-nowrap">
            {lang === 'en' ? 'See all →' : 'Zote →'}
          </Link>
        </div>

        {/* Simple text chip row — no icons/emoji, scrolls horizontally on mobile */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/search?category=${cat.slug}`}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-ink-50 dark:bg-ink-900 border border-ink-200 dark:border-ink-700 text-sm font-medium text-ink-700 dark:text-ink-200 hover:border-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
            >
              {lang === 'en' ? cat.name_en : cat.name_sw}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
