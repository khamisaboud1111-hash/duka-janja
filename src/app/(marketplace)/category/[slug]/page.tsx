import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
  params: { slug: string }
}

async function getCategory(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('slug', slug)
    .single()
  return data
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }

  redirect(`/search?category=${category.slug}`)
}