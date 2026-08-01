'use client'

import { useEffect, useState, useMemo } from 'react'
import { Search, Filter, Download, Star, MapPin, Navigation, Clock, ChevronDown, Package, ArrowUpDown, Languages } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState, StatCard } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import { useLangStore } from '@/store'

interface DeliveryRecord {
  id: string
  order_id: string
  status: string
  pickup_address: string
  delivery_address: string
  delivery_fee: number
  distance_meters: number | null
  accepted_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  created_at: string
  buyer?: { full_name: string } | null
  seller?: { store_name: string } | null
  rider_rating?: number | null
}

type FilterStatus = 'all' | 'delivered' | 'cancelled'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
]

export default function RiderDeliveriesPage() {
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('deliveries')
        .select('*, buyer:profiles!deliveries_buyer_id_fkey(full_name), seller:sellers(store_name)')
        .eq('rider_id', profile!.id)
        .order('delivered_at', { ascending: false })
        .limit(200)
      setDeliveries((data ?? []) as DeliveryRecord[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const filtered = useMemo(() => {
    let result = deliveries
    if (statusFilter !== 'all') result = result.filter(d => d.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d =>
        d.pickup_address?.toLowerCase().includes(q) ||
        d.delivery_address?.toLowerCase().includes(q) ||
        (d as any).buyer?.full_name?.toLowerCase().includes(q) ||
        (d as any).seller?.store_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [deliveries, search, statusFilter])

  const stats = useMemo(() => {
    const delivered = deliveries.filter(d => d.status === 'delivered')
    const totalEarnings = delivered.reduce((s, d) => s + (d.delivery_fee || 0), 0)
    const avgDistance = delivered.length > 0
      ? delivered.reduce((s, d) => s + (d.distance_meters || 0), 0) / delivered.length / 1000
      : 0
    const avgDuration = delivered.filter(d => d.accepted_at && d.delivered_at).length > 0
      ? delivered.filter(d => d.accepted_at && d.delivered_at).reduce((s, d) => {
          return s + (new Date(d.delivered_at!).getTime() - new Date(d.accepted_at!).getTime())
        }, 0) / delivered.filter(d => d.accepted_at && d.delivered_at).length / 60000
      : 0
    return {
      total: deliveries.length,
      delivered: delivered.length,
      cancelled: deliveries.filter(d => d.status === 'cancelled').length,
      totalEarnings,
      avgDistance: avgDistance.toFixed(1),
      avgDuration: Math.round(avgDuration),
    }
  }, [deliveries])

  function exportCSV() {
    const header = 'Date,Pickup,Delivery,Status,Fee,Distance\n'
    const rows = filtered.map(d =>
      `${d.delivered_at ?? d.created_at},"${d.pickup_address}","${d.delivery_address}",${d.status},${d.delivery_fee},${d.distance_meters ?? ''}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'safari.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function getDuration(d: DeliveryRecord) {
    if (!d.accepted_at || !d.delivered_at) return null
    const mins = Math.round((new Date(d.delivered_at).getTime() - new Date(d.accepted_at).getTime()) / 60000)
    return mins < 60 ? `${mins}dak` : `${Math.floor(mins / 60)}s ${mins % 60}dak`
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Historia ya Safari</h1>
          <p className="text-sm text-ink-500 mt-0.5">{stats.total} safari jumla</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary text-sm gap-1.5">
          <Download className="w-4 h-4" /> Pakua
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Jumla" value={stats.total} icon={<Package className="w-5 h-5" />} accent="brand" />
        <StatCard label="Zimekamilika" value={stats.delivered} icon={<Star className="w-5 h-5" />} accent="green" />
        <StatCard label="Mapato" value={formatTZS(stats.totalEarnings)} icon={<Clock className="w-5 h-5" />} accent="gold" />
        <StatCard label="Wastani Umbali" value={`${stats.avgDistance} km`} icon={<Navigation className="w-5 h-5" />} accent="spice" />
      </div>

      {/* Search & Filters */}
      <div className="card p-3 mb-4 rounded-2xl">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tafuta safari..." className="input pl-9 text-sm w-full" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary text-sm gap-1.5 ${showFilters ? 'bg-brand-50 text-brand-600' : ''}`}>
            <Filter className="w-4 h-4" /> Vichujio
          </button>
        </div>
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-ink-100 flex gap-2">
            {(['all', 'delivered', 'cancelled'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}>
                {s === 'all' ? 'Zote' : s === 'delivered' ? 'Zimekamilika' : 'Zimefutwa'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delivery List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Package className="w-10 h-10" />} title="Hakuna safari" description="Safari zako zitaonekana hapa" />
      ) : (
        <div className="space-y-2">
          {filtered.map(d => (
            <div key={d.id} className="card rounded-2xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    d.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {d.status === 'delivered' ? 'Imekamilika' : 'Imefutwa'}
                  </span>
                  {d.rider_rating && (
                    <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                      <Star className="w-3 h-3" fill="currentColor" /> {d.rider_rating}
                    </span>
                  )}
                </div>
                <span className="text-xs text-ink-400">{d.delivered_at ? formatDate(d.delivered_at) : formatDate(d.created_at)}</span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink-700 dark:text-ink-300 truncate">{d.pickup_address}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Navigation className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-ink-700 dark:text-ink-300 truncate">{d.delivery_address}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-ink-500">
                  {d.distance_meters && <span>{(d.distance_meters / 1000).toFixed(1)} km</span>}
                  {getDuration(d) && <span>{getDuration(d)}</span>}
                  {(d as any).seller?.store_name && <span className="truncate max-w-[120px]">{(d as any).seller.store_name}</span>}
                </div>
                <span className="font-display font-bold text-brand-600 dark:text-brand-400">{formatTZS(d.delivery_fee)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
