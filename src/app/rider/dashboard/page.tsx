'use client'

import { useEffect, useState, useCallback, memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Power, Wallet, Package, Star, TrendingUp, ShieldAlert, RefreshCw } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRiderTracking } from '@/hooks/useRiderTracking'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import ActiveJobOverlay from '@/components/rider/ActiveJobOverlay'
import { RiderNavigationMap } from '@/components/rider/RiderNavigationMap'

// --- 11. Delivery Status Enum ---
export enum DeliveryStatus {
  Accepted = 'accepted',
  PickedUp = 'picked_up',
  Delivered = 'delivered',
}

interface RiderProfileRow {
  id: string
  is_verified: boolean
  is_online: boolean
  account_status: 'active' | 'suspended'
  wallet_balance: number
  rating_average: number
  total_ratings: number
  total_deliveries: number
}

interface Metrics {
  todayEarnings: number
  weekEarnings: number
  completedToday: number
}

interface ActiveDelivery {
  delivery_id: string
  status: DeliveryStatus
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number | null
  delivery_lng: number | null
  pickup_address: string
  delivery_address: string
  customer_name?: string
  customer_phone?: string
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()

  // --- 1. Consolidated Local State / Architecture Setup ---
  const [riderProfile, setRiderProfile] = useState<RiderProfileRow | null>(null)
  const [metrics, setMetrics] = useState<Metrics>({ todayEarnings: 0, weekEarnings: 0, completedToday: 0 })
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null)
  const [riderLatLng, setRiderLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [updatingDeliveryStatus, setUpdatingDeliveryStatus] = useState(false)

  const { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer, activeDeliveryId } = useRiderTracking(profile?.id)

  // --- 3. Optimized RPC & 8. Abort / Mounted Flag ---
  const loadRiderData = useCallback(async () => {
    if (!profile) return
    setLoadingData(true)
    setLoadError(null)
    let isMounted = true

    try {
      // Fetch profile & optimized server metrics via RPC or parallel request
      const [profileResult, metricsResult] = await Promise.all([
        supabase.from('rider_profiles').select('*').eq('id', profile.id).single(),
        supabase.rpc('get_rider_metrics', { p_rider_id: profile.id }).catch(() => ({ data: null, error: null }))
      ])

      if (!isMounted) return

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw new Error(profileResult.error.message)
      }

      if (profileResult.data) {
        setRiderProfile(profileResult.data)
        setIsOnline(profileResult.data.is_online)
      }

      if (metricsResult.data) {
        setMetrics({
          todayEarnings: metricsResult.data.todayEarnings || 0,
          weekEarnings: metricsResult.data.weekEarnings || 0,
          completedToday: metricsResult.data.completedToday || 0,
        })
      }
    } catch (err: any) {
      if (isMounted) {
        setLoadError(err.message || 'Imeshindikana kupakia taarifa za dereva.')
        toast.error('Hitilafu ya mtandao au mfumo imetokea.')
      }
    } finally {
      if (isMounted) setLoadingData(false)
    }

    return () => {
      isMounted = false
    }
  }, [profile, supabase, setIsOnline])

  useEffect(() => {
    if (!profile) return
    loadRiderData()
  }, [profile, loadRiderData])

  // --- 4. Realtime Profile Subscription ---
  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel(`rider-profile-changes-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rider_profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          setRiderProfile(payload.new as RiderProfileRow)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, supabase])

  // --- 16. Refresh Metrics Automatically Every Minute ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile) loadRiderData()
    }, 60000)
    return () => clearInterval(interval)
  }, [profile, loadRiderData])

  // Redirect unapplied riders safely
  useEffect(() => {
    if (!loadingData && profile?.role === 'rider' && !riderProfile) {
      router.replace('/rider/apply')
    }
  }, [loadingData, profile, riderProfile, router])

  // Fetch active delivery data
  useEffect(() => {
    if (!activeDeliveryId || !profile) {
      setActiveDelivery(null)
      return
    }
    supabase.rpc('get_active_delivery_for_rider', { p_rider_id: profile.id }).then(({ data, error }: { data: ActiveDelivery[] | null; error: any }) => {
      if (error) {
        toast.error('Imeshindikana kupata safari inayoendelea')
        return
      }
      const row = Array.isArray(data) ? data[0] : null
      setActiveDelivery(row ?? null)
    })
  }, [activeDeliveryId, profile, supabase])

  // --- 6 & 7. Geolocation Accuracy Filtering & Permission Handling ---
  useEffect(() => {
    if (!activeDelivery || !isOnline || !('geolocation' in navigator)) {
      setRiderLatLng(null)
      return
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        // Only accept high-precision GPS coordinates (< 25 meters accuracy)
        if (pos.coords.accuracy <= 25) {
          setRiderLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Ruhusa ya GPS imekataliwa. Tafadhali ruhusu kupata eneo lako.')
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return () => navigator.geolocation.clearWatch(id)
  }, [activeDelivery, isOnline])

  // --- 5. Optimistic UI Toggle ---
  async function handleToggle() {
    if (!riderProfile) return
    if (!riderProfile.is_verified) {
      toast.error('Akaunti yako bado inasubiri uthibitisho wa msimamizi')
      return
    }

    const previousState = isOnline
    setTogglingOnline(true)

    // Optimistic state change
    setIsOnline(!previousState)
    setRiderProfile((prev) => (prev ? { ...prev, is_online: !previousState } : null))

    const ok = await toggleOnline(!previousState)
    if (!ok) {
      // Rollback on failure
      setIsOnline(previousState)
      setRiderProfile((prev) => (prev ? { ...prev, is_online: previousState } : null))
      toast.error('Imeshindikana kubadilisha hali mtandaoni')
    }
    setTogglingOnline(false)
  }

  // --- 10. API Validation & Safe Parsing ---
  async function handleUpdateStatus() {
    if (!activeDelivery || updatingDeliveryStatus) return
    setUpdatingDeliveryStatus(true)

    try {
      const nextStatus = activeDelivery.status === DeliveryStatus.Accepted ? DeliveryStatus.PickedUp : DeliveryStatus.Delivered
      const res = await fetch('/api/delivery/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: activeDelivery.delivery_id, status: nextStatus }),
      })

      const json = await res.json()

      if (res.ok) {
        if (nextStatus === DeliveryStatus.Delivered) {
          setActiveDelivery(null)
          toast.success('Safari imekamilika kikamilifu!')
          loadRiderData()
        } else {
          setActiveDelivery({ ...activeDelivery, status: DeliveryStatus.PickedUp })
          toast.success('Bidhaa zimechukuliwa mafanikio.')
        }
      } else {
        toast.error(json.message || 'Imeshindikana kusasisha hali ya safari.')
      }
    } catch {
      toast.error('Hitilafu ya kimtandao imetokea.')
    } finally {
      setUpdatingDeliveryStatus(false)
    }
  }

  // --- 14. Skeleton Loading UI ---
  if (userLoading || loadingData) {
    return (
      <div className="page-container py-8 max-w-3xl mx-auto space-y-6 animate-pulse">
        <div className="h-20 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-48 bg-ink-100 dark:bg-ink-800 rounded-2xl" />
      </div>
    )
  }

  // --- 15. Retry UI on Load Failure ---
  if (loadError) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto space-y-4">
        <p className="text-red-500 font-medium">Imeshindikana kupakia dashibodi.</p>
        <Button onClick={loadRiderData} className="flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Jaribu Tena
        </Button>
      </div>
    )
  }

  if (!profile || profile.role !== 'rider') {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-ink-600 dark:text-ink-300 mb-4">Ukurasa huu ni kwa madereva tu.</p>
        <Button onClick={() => router.replace('/rider/apply')}>Jiunge kama Dereva</Button>
      </div>
    )
  }

  if (!riderProfile) return null

  if (riderProfile.account_status === 'suspended') {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">Akaunti Imesimamishwa</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">
          Akaunti yako ya dereva imesimamishwa kwa sasa kutokana na tathmini ya chini. Wasiliana na msimamizi kwa maelezo zaidi.
        </p>
      </div>
    )
  }

  if (!riderProfile.is_verified) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">Inasubiri Uthibitisho</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">
          Maombi yako yanahakikiwa na msimamizi. Utaweza kuanza kupokea safari pindi utakapothibitishwa.
        </p>
      </div>
    )
  }

  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto space-y-6">
      {/* --- 13. Accessibility aria-live status header --- */}
      <div
        aria-live="polite"
        className="flex items-center justify-between bg-white dark:bg-ink-900 border border-transparent dark:border-ink-800 rounded-2xl shadow-card p-4 sm:p-5"
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-ink-300 dark:bg-ink-600'}`} />
          <div>
            <p className="font-display font-bold text-ink-900 dark:text-white">{isOnline ? 'Uko Mtandaoni' : 'Uko Nje ya Mtandao'}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{isOnline ? 'Unapokea safari mpya' : 'Bonyeza ili kuanza kupokea safari'}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglingOnline}
          role="switch"
          aria-checked={isOnline}
          aria-label="Badilisha hali ya mtandaoni"
          className={`w-16 h-9 rounded-full relative transition-colors flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-ink-200 dark:bg-ink-700'} disabled:opacity-60 cursor-pointer`}
        >
          <span
            className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${isOnline ? 'translate-x-7' : ''}`}
          >
            <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-ink-400'}`} />
          </span>
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Mapato ya Leo" value={`TZS ${metrics.todayEarnings.toLocaleString()}`} accent="brand" />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Mapato ya Wiki" value={`TZS ${metrics.weekEarnings.toLocaleString()}`} accent="green" />
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Salio la Pochi" value={`TZS ${riderProfile.wallet_balance.toLocaleString()}`} accent="gold" />
        <MetricCard icon={<Package className="w-4 h-4" />} label="Safari Zilizokamilika" value={String(riderProfile.total_deliveries)} accent="spice" />
        <MetricCard icon={<Star className="w-4 h-4" />} label="Tathmini" value={riderProfile.rating_average.toFixed(1)} accent="gold" />
      </div>

      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-5 text-center">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          {isOnline ? 'Tunakutafutia safari karibu na eneo lako...' : 'Washa hali ya mtandaoni ili kuanza kupokea ofa za safari.'}
        </p>
      </div>

      {/* Active delivery section */}
      {activeDelivery && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900 dark:text-white">Safari Inayoendelea</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
              {activeDelivery.status === DeliveryStatus.Accepted ? 'Unakwenda kuchukua' : 'Bidhaa Zimechukuliwa'}
            </span>
          </div>

          <RiderNavigationMap
            riderLocation={riderLatLng}
            pickupLocation={{ lat: activeDelivery.pickup_lat, lng: activeDelivery.pickup_lng }}
            deliveryLocation={
              activeDelivery.delivery_lat && activeDelivery.delivery_lng
                ? { lat: activeDelivery.delivery_lat, lng: activeDelivery.delivery_lng }
                : null
            }
            leg={activeDelivery.status === DeliveryStatus.Accepted ? 'to_pickup' : 'to_delivery'}
            customerName={activeDelivery.customer_name}
            customerPhone={activeDelivery.customer_phone}
          />

          <Button
            fullWidth
            disabled={updatingDeliveryStatus}
            onClick={handleUpdateStatus}
          >
            {updatingDeliveryStatus
              ? 'Inasasisha...'
              : activeDelivery.status === DeliveryStatus.Accepted
              ? 'Nimechukua Bidhaa'
              : 'Nimefikisha Bidhaa'}
          </Button>
        </div>
      )}

      {offer && (
        <ActiveJobOverlay offer={offer} onAccept={acceptOffer} onDecline={declineOffer} />
      )}
    </div>
  )
}

const MetricCard = memo(function MetricCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'brand' | 'spice' | 'green' | 'gold'
}) {
  const colors = {
    brand: 'text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30',
    spice: 'text-spice-600 dark:text-spice-300 bg-spice-50 dark:bg-spice-900/30',
    green: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30',
    gold: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30',
  }
  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-3.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[accent]}`}>{icon}</div>
      <p className="font-display font-black text-base text-ink-900 dark:text-white leading-tight">{value}</p>
      <p className="text-[10px] text-ink-500 dark:text-ink-400 leading-tight mt-0.5">{label}</p>
    </div>
  )
})
