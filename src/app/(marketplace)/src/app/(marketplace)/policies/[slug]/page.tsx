import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface Props { params: { slug: string } }

async function getPolicy(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase.from('policy_pages').select('*').eq('slug', slug).single()
  return data
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const policy = await getPolicy(params.slug)
  return { title: policy ? `${policy.title_sw} — Duka Janja` : 'Duka Janja' }
}

export default async function PolicyPage({ params }: Props) {
  const policy = await getPolicy(params.slug)
  if (!policy) notFound()

  return (
    <main className="page-container py-10 max-w-2xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-1">{policy.title_sw}</h1>
      <p className="text-sm text-ink-400 mb-6">{policy.title_en}</p>

      <div className="card p-5 space-y-4">
        <div>
          <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">Kiswahili</h2>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{policy.content_sw}</p>
        </div>
        <div className="border-t border-ink-100 pt-4">
          <h2 className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-1">English</h2>
          <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{policy.content_en}</p>
        </div>
      </div>
    </main>
  )
}
