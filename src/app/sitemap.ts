import { createServerClient } from '@/lib/supabase/server'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://dukajanja.co.tz'
  const supabase = createServerClient()

  const [productsRes, sellersRes] = await Promise.all([
    supabase.from('products').select('slug, updated_at').eq('status', 'active').limit(5000),
    supabase.from('sellers').select('store_slug, updated_at').eq('status', 'approved').limit(2000),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ]

  const productRoutes: MetadataRoute.Sitemap = (productsRes.data ?? []).map((p) => ({
    url: `${baseUrl}/products/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const sellerRoutes: MetadataRoute.Sitemap = (sellersRes.data ?? []).map((s) => ({
    url: `${baseUrl}/sellers/${s.store_slug}`,
    lastModified: new Date(s.updated_at),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...productRoutes, ...sellerRoutes]
}
