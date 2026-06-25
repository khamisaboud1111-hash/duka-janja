'use client'

import { useTrackRecentlyViewed } from '@/hooks/useRecentlyViewed'

export default function TrackView({ productId }: { productId: string }) {
  useTrackRecentlyViewed(productId)
  return null
}
