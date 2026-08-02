'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { SlidersHorizontal, X, Search, Clock, TrendingUp } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { useProducts } from '@/hooks/useProducts'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui'
import { MobileSheet } from '@/components/shared/MobileSheet'
import { SkeletonGrid, Skeleton } from '@/components/shared/SkeletonComposites'
import type { Category } from '@/types'

const RECENT_KEY = 'dj_recent_searches'
const POPULAR_SEARCHES = ['Karafuu', 'Kanga', 'Mafuta ya Nazi', 'Vazi la Kiislamu', 'Vikapu vya Ukili']

function catName(cat: Category, lang: Language) {
  return lang === 'sw' ? cat.name_sw : cat.name_en
}

function getRecent(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
  } catch {
    return []
  }
}

function pushRecent(q: string) {
  if (typeof window === 'undefined' || !q.trim()) return
  const current = getRecent().filter((r) => r.toLowerCase() !== q.toLowerCase())
  const updated = [q, ...current].slice(0, 6)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLangStore()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  const searchWrapRef = useRef<HTMLDivElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const q          = params.get('q') ?? ''
  const category   = params.get('category') ?? ''
  const sort       = (params.get('sort') ?? 'newest') as any
  const madeInZnz  = params.get('made_in_zanzibar') === 'true'
  const page       = Number(params.get('page') ?? '1')

  const { products, loading, count, totalPages } = useProducts({
    search: q, category, sort, madeInZanzibar: madeInZnz, page, pageSize: 24,
  })

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }: any) => setCategories(data ?? []))
    setRecent(getRecent())
    setInputValue(q)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.set('page', '1')
    router.push(`/search?${p.toString()}`)
  }

  function runSearch(value: string) {
    if (!value.trim()) return
    pushRecent(value.trim())
    setRecent(getRecent())
    setSuggestOpen(false)
    setParam('q', value.trim())
  }

  function clearAll() {
    router.push('/search')
  }

  function clearRecent() {
    localStorage.removeItem(RECENT_KEY)
    setRecent([])
  }

  const hasFilters = !!(q || category || madeInZnz || sort !== 'newest')

  // Shared filter controls — rendered inline on desktop and inside the mobile sheet.
  const filterControls = (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('type', lang)}</p>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setParam('category', category === cat.slug ? null : cat.slug)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${category === cat.slug ? 'bg-brand-500 text-white border-brand-500' : 'border-border text-muted-foreground hover:border-brand-300'}`}>
              {cat.icon} {catName(cat, lang)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('sortBy', lang)}</p>
        <div className="flex flex-col gap-1.5">
          {([['newest', t('sortNewest', lang)],['price_asc', t('sortPriceAsc', lang)],['price_desc', t('sortPriceDesc', lang)],['popular', t('sortPopular', lang)]] as [string, string][]).map(([v, label]) => (
            <button key={v} onClick={() => setParam('sort', v)}
              className={`text-xs text-left px-3 py-1.5 rounded-lg border transition-colors ${sort === v ? 'bg-brand-50 dark:bg-brand-500/15 border-brand-400 text-brand-700 dark:text-brand-300 font-semibold' : 'border-border text-muted-foreground hover:border-brand-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t('special', lang)}</p>
        <button onClick={() => setParam('made_in_zanzibar', madeInZnz ? null : 'true')}
          className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${madeInZnz ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-600' : 'border-border text-muted-foreground hover:border-amber-300'}`}>
          {t('madeInZanzibar', lang)}
        </button>
      </div>
    </div>
  )

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <div className="page-container py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-4 relative" ref={searchWrapRef}>
          {/* Search bar with instant suggestions */}
          <form
            onSubmit={(e) => { e.preventDefault(); runSearch(inputValue) }}
            className="flex-1 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 dark:text-ink-500 z-10" />
            <input
              name="q"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              placeholder={t('search', lang)}
              className="input pl-9 w-full"
              autoComplete="off"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(''); setParam('q', null) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500 hover:text-ink-600 dark:hover:text-ink-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Suggestions dropdown */}
          {suggestOpen && (
            <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[26rem] mt-2 rounded-2xl bg-card border border-border shadow-xl z-30 animate-scale-in origin-top overflow-hidden">
              {recent.length > 0 && (
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {t('recentSearches', lang)}
                    </p>
                    <button onClick={clearRecent} className="text-xs text-red-500 hover:underline">
                      {t('clear', lang)}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recent.map((r) => (
                      <button
                        key={r}
                        onClick={() => { setInputValue(r); runSearch(r) }}
                        className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> {t('popularSearches', lang)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SEARCHES.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setInputValue(p); runSearch(p) }}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-300 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {categories.length > 0 && (
                <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {t('categories', lang)}
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {categories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSuggestOpen(false); setParam('category', cat.slug) }}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
                      >
                        <span>{cat.icon}</span>
                        <span className="truncate">{catName(cat, lang)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              filtersOpen
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-card border-border text-foreground hover:border-brand-300'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">{t('filter', lang)}</span>
          </button>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {q && <FilterChip label={`"${q}"`} onRemove={() => setParam('q', null)} />}
            {category && <FilterChip label={categories.find(c => c.slug === category) ? catName(categories.find(c => c.slug === category)!, lang) : category} onRemove={() => setParam('category', null)} />}
            {madeInZnz && <FilterChip label={t('madeInZanzibar', lang)} onRemove={() => setParam('made_in_zanzibar', null)} />}
            {sort !== 'newest' && <FilterChip label={sortLabel(sort, lang)} onRemove={() => setParam('sort', null)} />}
            <button onClick={clearAll} className="text-xs text-red-500 dark:text-red-400 font-medium hover:underline px-1">{t('clearAllFilters', lang)}</button>
          </div>
        )}

        {/* Filter panel — desktop inline */}
        {filtersOpen && !isMobile && (
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 animate-fade-up">
            {filterControls}
          </div>
        )}

        {/* Filter drawer — mobile sheet */}
        {isMobile && (
          <MobileSheet
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title={t('filter', lang)}
            side="bottom"
          >
            {filterControls}
          </MobileSheet>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? t('searching', lang) : `${count.toLocaleString()} ${t('products', lang).toLowerCase()}`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid count={8} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title={t('noProductsFound', lang)}
            description={q ? `${t('noResultsFor', lang)} "${q}"` : t('tryAdjustingFilters', lang)}
            action={
              hasFilters ? (
                <button onClick={clearAll} className="btn-secondary text-sm">
                  {t('clearAllFilters', lang)}
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">← {t('previous', lang)}</button>
            <span className="text-sm text-muted-foreground px-2">{t('page', lang)} {page} / {totalPages}</span>
            <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">{t('next', lang)} →</button>
          </div>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900 dark:hover:text-brand-100"><X className="w-3 h-3" /></button>
    </span>
  )
}

function sortLabel(sort: string, lang: Language) {
  const map: Record<string, string> = { price_asc: t('sortPriceAsc', lang), price_desc: t('sortPriceDesc', lang), popular: t('sortPopular', lang) }
  return map[sort] ?? sort
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isMobile
}
