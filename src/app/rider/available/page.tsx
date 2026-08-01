'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Navigation, MapPin, Clock, Package, Users, Calendar, Zap } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState, StatCard } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'

interface AvailableDelivery {
  id: string
  pickup_address: string
  delivery_address: string
  delivery_fee: number
  distance_meters: number | null
  estimated_arrival?: string
  customer_name?: string
  customer_rating?: number
  delivery_type: 'express' | 'standard'
  created_at: string
  status: 'available'
}

type FilterType = 'all' | 'express' | 'standard' | 'nearest'

export default function RiderAvailablePage() {
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const [deliveries, setDeliveries] = useState<AvailableDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        )
      }

      const { data } = await supabase
        .from('deliveries')
        .select('id, pickup_address, delivery_address, delivery_fee, distance_meters, created_at, status')
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(50)
      setDeliveries((data ?? []) as AvailableDelivery[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const filtered = useMemo(() => {
    let result = deliveries

    if (filter !== 'all') {
      result = result.filter(d => d.delivery_type === filter)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.pickup_address.toLowerCase().includes(q) ||
        d.delivery_address.toLowerCase().includes(q)
      )
    }

    if (filter === 'nearest' && userLocation && deliveries.length > 0) {
      result = result.sort((a, b) => {
        const distA = a.distance_meters || 0
        const distB = b.distance_meters || 0
        return distA - distB
      })
    }

    return result
  }, [deliveries, filter, search, userLocation])

  const stats = useMemo(() => {
    return {
      total: deliveries.length,
      express: deliveries.filter(d => d.delivery_type === 'express').length,
      standard: deliveries.filter(d => d.delivery_type === 'standard').length,
      today: deliveries.filter(d => {
        const today = new Date().toISOString().slice(0, 10)
        return d.created_at.startsWith(today)
      }).length,
    }
  }, [deliveries])

  function requestDelivery(deliveryId: string) {
    console.log('Requesting delivery:', deliveryId)
  }

  function getDistanceDisplay(distance: number | null): string {
    if (!distance) return 'Distance unknown'
    if (distance < 1000) return `${distance}m`
    return `${(distance / 1000).toFixed(1)} km`
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Available Deliveries</h1>
          <p className="text-sm text-ink-500 mt-0.5">{stats.total} deliveries available</p>
        </div>
        {userLocation && (
          <button
            onClick={() => setFilter('nearest')}
            className={`btn-secondary text-sm gap-1.5 ${filter === 'nearest' ? 'bg-brand-50 text-brand-600' : ''}`}
          >
            <Navigation className="w-4 h-4" /> Nearest
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Available" value={stats.total} icon={<Package className="w-5 h-5" />} accent="brand" />
        <StatCard label="Express" value={stats.express} icon={<Zap className="w-5 h-5" />} accent="spice" />
        <StatCard label="Standard" value={stats.standard} icon={<Clock className="w-5 h-5" />} accent="green" />
        <StatCard label="Today" value={stats.today} icon={<Calendar className="w-5 h-5" />} accent="gold" />
      </div>

      <div className="card p-4 mb-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by pickup or delivery address..."
              className="input pl-9 text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'express', 'standard', 'nearest'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
              >
                {f === 'all' ? 'All' : f === 'express' ? 'Express' : f === 'standard' ? 'Standard' : 'Nearest'}
              </button>
            ))}
          </div>
        </div>

        {userLocation && (
          <div className="flex items-center gap-2 text-xs text-ink-500">
            <MapPin className="w-3.5 h-3.5" />
            Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title="No deliveries available"
          description="No deliveries match your current filters. Try adjusting your search or check back later."
          action={search || filter !== 'all' ? (
            <button
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
              className="btn-outline"
            >
              Clear filters
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(delivery => (
            <div key={delivery.id} className="card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-3 bg-gradient-to-r from-ink-50 to-ink-100 dark:from-ink-800 dark:to-ink-900">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${delivery.delivery_type === 'express' ? 'bg-spice-100 text-spice-700' : 'bg-green-100 text-green-700'}`}
                  >
                    {delivery.delivery_type === 'express' ? 'EXPRESS' : 'STANDARD'}
                  </span>
                  <span className="text-xs text-ink-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {delivery.estimated_arrival || 'Soon'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ink-900 dark:text-white mb-1 truncate">
                    {delivery.delivery_type === 'express' ? 'Express Delivery' : 'Standard Delivery'}
                  </h3>
                  <p className="text-xs text-ink-500 mb-3">ID: {delivery.id.slice(0, 8)}...</p>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-700 dark:text-ink-300">Pickup</p>
                        <p className="text-sm text-ink-900 dark:text-white truncate">{delivery.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Navigation className="w-3 h-3 text-red-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-700 dark:text-ink-300">Delivery</p>
                        <p className="text-sm text-ink-900 dark:text-white truncate">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {delivery.distance_meters && (
                      <div className="flex items-center justify-between text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" /> Distance
                        </span>
                        <span className="font-medium text-ink-700 dark:text-ink-300">
                          {delivery.distance_meters < 1000
                            ? `${delivery.distance_meters}m`
                            : `${(delivery.distance_meters / 1000).toFixed(1)} km`
                          }
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-ink-500">Fee</span>
                      <span className="font-display font-bold text-sm text-brand-600 dark:text-brand-400">
                        {formatTZS(delivery.delivery_fee)}
                      </span>
                    </div>
                    {delivery.customer_name && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-ink-500">
                          <Users className="w-3 h-3" /> Customer
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-ink-700 dark:text-ink-300">
                            {delivery.customer_name}
                          </span>
                          {delivery.customer_rating && (
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Star className="w-3 h-3 fill-current" />
                              <span className="text-xs font-medium">{delivery.customer_rating}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-ink-100 dark:border-ink-800">
                    <div className="flex gap-2">
                      <button
                        onClick={() => requestDelivery(delivery.id)}
                        className="btn-primary flex-1 justify-center py-2.5 text-sm gap-1.5"
                      >
                        <Zap className="w-4 h-4" /> Request
                      </button>
                      <button
                        onClick={() => {
                          console.log('View delivery:', delivery.id)
                        }}
                        className="btn-outline text-sm px-3"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
