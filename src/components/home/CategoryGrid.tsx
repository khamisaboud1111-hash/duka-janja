'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

interface Category {
  id: string
  name_en: string
  name_sw: string
  slug: string
  icon: string
  image_url?: string
  [key: string]: any
}

const CATEGORY_IMAGES: Record<string, string> = {
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=400&auto=format&fit=crop',
  fashion: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=400&auto=format&fit=crop',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=400&auto=format&fit=crop',
  handmade: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop',
  electronics: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?q=80&w=400&auto=format&fit=crop',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=400&auto=format&fit=crop',
  home: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=400&auto=format&fit=crop',
  sports: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop',
  books: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=400&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=400&auto=format&fit=crop',
}

function getCategoryImage(cat: Category) {
  if (cat.image_url) return cat.image_url
  const slug = cat.slug?.toLowerCase() || ''
  for (const [key, url] of Object.entries(CATEGORY_IMAGES)) {
    if (slug.includes(key)) return url
  }
  return CATEGORY_IMAGES.default
}

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const lang = useLangStore((s) => s.lang)

  if (categories.length === 0) return null

  return (
    <section className="section">
      <div className="page-container">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-bold text-xl text-ink-900 dark:text-white">{t('popularCategories', lang)}</h2>
          </div>
          <Link href="/search" className="text-sm text-brand-400 dark:text-brand-300 font-semibold whitespace-nowrap">
            {t('seeAll', lang)} →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.slice(0, 4).map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={`/category/${cat.slug}`}
                className="group relative block aspect-[4/3] rounded-2xl overflow-hidden"
              >
                <Image
                  src={getCategoryImage(cat)}
                  alt={lang === 'sw' ? cat.name_sw : cat.name_en}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-3">
                  <span className="text-white font-bold text-sm">{lang === 'sw' ? cat.name_sw : cat.name_en}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
