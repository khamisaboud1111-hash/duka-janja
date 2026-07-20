'use client'

import { useEffect, useState, useRef, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Power, Wallet, Package, Star, TrendingUp, ShieldAlert, WifiOff, Clock, Award, Target, RefreshCw } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRiderTracking } from '@/hooks/useRiderTracking'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import ActiveJobOverlay from '@/components/rider/ActiveJobOverlay'
import RiderNavigationMap from '@/components/rider/RiderNavigationMap'

interface RiderProfileRow {
  id: string
  is_verified: boolean
  is_online: boolean
  account_status: 'active' | 'suspended'
  wallet_balance: number
  rating_average: number
  total_ratings: number
  total_deliveries: number
  tier?: 'bronze' | 'silver' | 'gold' | 'diamond'
}

interface Metrics {
  today: number
  week: number
  completed: number
}

interface ActiveDelivery {
  delivery_id: string
  status: 'accepted' | 'picked_up'
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number | null
  delivery_lng: number | null
  pickup_address: string
  delivery_address: string
  accepted_at?: string
  picked_up_at?: string
}

interface DashboardState {
  rider: RiderProfileRow | null
  metrics: Metrics
  activeDelivery: ActiveDelivery | null
  loading: boolean
}

// Web Audio API notification sound generator
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    // Audio context not allowed or supported
  }
}

// Queue offline delivery status updates if network drops
function queueOfflineAction(action: any) {
  try {
    const queue = JSON.parse(localStorage.getItem('rider_offline_queue') || '[]')
    queue.push(action)
    localStorage.setItem('rider_offline_queue', JSON.stringify(queue))
  } catch (e) {}
}

async function syncOfflineQueue(supabase: any) {
  try {
    const queue = JSON.parse(localStorage.getItem('rider_offline_queue') || '[]')
    if (queue.length === 0) return
    const remaining = []
    for (const item of queue) {
      const res = await fetch('/api/delivery/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
      if (!res.ok) {
        remaining.push(item)
      }
    }
    localStorage.setItem('rider_offline_queue', JSON.stringify(remaining))
    if (remaining.length < queue.length) {
      toast.success('Offline updates synchronized successfully!')
    }
  } catch (e) {}
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()

  // Unified Dashboard State
  const [dashboard, setDashboard] = useState<DashboardState>({
    rider: null,
    metrics: { today: 0, week: 0, completed: 0 },
    activeDelivery: null,
    loading: true,
  })

  const [togglingOnline, setTogglingOnline] = useState(false)
  const [riderLatLng, setRiderLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [isOnlineNetwork, setIsOnlineNetwork] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer, activeDeliveryId } = useRiderTracking(profile?.id)

  // Play sound when new offer arrives
  useEffect(() => {
    if (offer) {
      playNotificationSound()
    }
  }, [offer])

  // Network listener & offline sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnlineNetwork(true)
      toast.success('Connection restored!')
      syncOfflineQueue(supabase)
    }
    const handleOffline = () => {
      setIsOnlineNetwork(false)
      toast.error('You are offline. Changes will sync when reconnected.')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [supabase])

  // Load Rider Data with Promise.all and Error Handling
  const loadDashboardData = useCallback(async () => {
    if (!profile) return
    setDashboard((prev) => ({ ...prev, loading: true }))

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    const [profileRes, deliveriesRes, activeRes] = await Promise.all([
      supabase.from('rider_profiles').select('*').eq('id', profile.id).single(),
      supabase
        .from('deliveries')
        .select('delivery_fee, delivered_at, status')
        .eq('rider_id', profile.id)
        .eq('status', 'delivered')
        .gte('delivered_at', startOfWeek.toISOString()),
      supabase.rpc('get_active_delivery_for_rider', { p_rider_id: profile.id }),
    ])

    if (profileRes.error) {
      toast.error(profileRes.error.message)
      setDashboard((prev) => ({ ...prev, loading: false }))
      return
    }

    const rp = profileRes.data
    if (rp) {
      setIsOnline(rp.is_online)
    }

    let todayEarnings = 0
    let weekEarnings = 0
    let completedToday = 0

    if (!deliveriesRes.error && deliveriesRes.data) {
      for (const d of deliveriesRes.data) {
        if (!d.delivered_at) continue
        weekEarnings += d.delivery_fee
        if (new Date(d.delivered_at) >= startOfDay) {
          todayEarnings += d.delivery_fee
          completedToday += 1
        }
      }
    }

    let activeRow = null
    if (!activeRes.error && activeRes.data) {
      activeRow = Array.isArray(activeRes.data) ? activeRes.data[0] : null
    }

    setDashboard({
      rider: rp ?? null,
      metrics: { today: todayEarnings, week: weekEarnings, completed: completedToday },
      activeDelivery: activeRow ?? null,
      loading: false,
    })
  }, [profile, supabase, setIsOnline])

  useEffect(() => {
    if (!profile) return
    loadDashboardData()
  }, [profile, loadDashboardData])

  // Live Wallet & Profile updates via Supabase Realtime
  useEffect(() => {
    if (!profile?.id) return
    const channel = supabase
      .channel(`rider-dashboard-${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rider_profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          const newRow = payload.new as RiderProfileRow
          setDashboard((prev) => ({
            ...prev,
            rider: newRow,
          }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, supabase])

  // Battery Saver GPS tracking (polls every 10s when active or online)
  useEffect(() => {
    if (!isOnline && !dashboard.activeDelivery) return
    if (!('geolocation' in navigator)) return

    const updatePosition = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setRiderLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    updatePosition()
    const interval = setInterval(updatePosition, 10000)
    return () => clearInterval(interval)
  }, [isOnline, dashboard.activeDelivery])

  async function handleToggle() {
    if (!dashboard.rider) return
    if (!dashboard.rider.is_verified) {
      toast.error('Akaunti yako bado inasubiri uthibitisho wa msimamizi')
      return
    }
    setTogglingOnline(true)
    const ok = await toggleOnline(!isOnline)
    if (!ok) toast.error('Imeshindikana kubadilisha hali')
    setTogglingOnline(false)
  }

  // Pull to refresh handlers
  const pullStartY = useRef(0)
  const [pullDistance, setPullDistance] = useState(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) pullStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (pullStartY.current > 0) {
      const distance = e.touches[0].clientY - pullStartY.current
      if (distance > 0 && distance < 120) setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setIsRefreshing(true)
      await loadDashboardData()
      setIsRefreshing(false)
    }
    pullStartY.current = 0
    setPullDistance(0)
  }

  if (userLoading || dashboard.loading) {
    return <DashboardSkeleton />
  }

  if (!profile || profile.role !== 'rider') {
    return (
      <div className="page-container py-16 text-center" role="region" aria-label="Access Restricted">
        <p className="text-ink-600 dark:text-ink-300 mb-4">Ukurasa huu ni kwa madereva tu.</p>
        <Button onClick={() => router.push('/rider/apply')} aria-label="Jiunge kama Dereva">Jiunge kama Dereva</Button>
      </div>
    )
  }

  if (!dashboard.rider) return <DashboardSkeleton />

  if (dashboard.rider.account_status === 'suspended') {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto" role="alert">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">Akaunti Imesimamishwa</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">
          Akaunti yako ya dereva imesimamishwa kwa sasa kutokana na tathmini ya chini. Wasiliana na msimamizi kwa maelezo zaidi.
        </p>
      </div>
    )
  }

  if (!dashboard.rider.is_verified) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto" role="alert">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-4" aria-hidden="true">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">Inasubiri Uthibitisho</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">
          Maombi yako yanahakikiwa na msimamizi. Utaweza kuanza kupokea safari pindi utakapothibitishwa.
        </p>
      </div>
    )
  }

  const dailyGoal = 40000
  const dailyProgress = Math.min(100, (dashboard.metrics.today / dailyGoal) * 100)
  const riderTier = dashboard.rider.rating_average >= 4.8 ? 'Diamond' : dashboard.rider.rating_average >= 4.5 ? 'Gold' : dashboard.rider.rating_average >= 4.2 ? 'Silver' : 'Bronze'

  return (
    <div
      className="page-container py-6 sm:py-8 max-w-3xl mx-auto space-y-6"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {!isOnlineNetwork && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 justify-center shadow-md" role="status">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Offline - Waiting for connection... Changes will sync automatically.</span>
        </div>
      )}

      {isRefreshing && (
        <div className="flex items-center justify-center gap-2 text-xs text-brand-600 font-semibold" role="status">
          <RefreshCw className="w-4 h-4 animate-spin" /> Refreshing dashboard...
        </div>
      )}

      {/* Online Toggle Header with smooth animation */}
      <div className="flex items-center justify-between bg-white dark:bg-ink-900 border border-transparent dark:border-ink-800 rounded-2xl shadow-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${isOnline ? 'bg-emerald-500 animate-pulse shadow-glow' : 'bg-ink-300 dark:bg-ink-600'}`} aria-hidden="true" />
          <div>
            <p className="font-display font-bold text-ink-900 dark:text-white">{isOnline ? 'Uko Mtandaoni' : 'Uko Nje ya Mtandao'}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{isOnline ? 'Unapokea safari mpya' : 'Bonyeza ili kuanza kupokea safari'}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglingOnline}
          aria-label={isOnline ? 'Turn offline' : 'Turn online'}
          role="switch"
          aria-checked={isOnline}
          className={`w-16 h-9 rounded-full relative transition-all duration-300 flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-ink-200 dark:bg-ink-700'} disabled:opacity-60 shadow-inner`}
        >
          <span
            className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-300 ${isOnline ? 'translate-x-7' : 'translate-x-0'}`}
          >
            <Power className={`w-3.5 h-3.5 transition-colors ${isOnline ? 'text-emerald-600' : 'text-ink-400'}`} aria-hidden="true" />
          </span>
        </button>
      </div>

      {/* Daily Goal & Tier Status */}
      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-4 sm:p-5 space-y-3 border border-ink-100 dark:border-ink-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <span className="text-xs font-bold text-ink-900 dark:text-white uppercase tracking-wider">Malengo ya Leo</span>
          </div>
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
            {dashboard.metrics.today.toLocaleString()} / {dailyGoal.toLocaleString()} TZS
          </span>
        </div>
        <div className="w-full bg-ink-100 dark:bg-ink-800 h-2.5 rounded-full overflow-hidden">
          <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${dailyProgress}%` }} />
        </div>
        <div className="flex items-center justify-between pt-1 text-[11px] text-ink-500 dark:text-ink-400">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" /> Rider Tier: <strong className="text-ink-900 dark:text-white">{riderTier}</strong>
          </span>
          <span>{Math.round(dailyProgress)}% Completed</span>
        </div>
      </div>

      {/* Memoized Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Mapato ya Leo" value={`TZS ${dashboard.metrics.today.toLocaleString()}`} accent="brand" />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Mapato ya Wiki" value={`TZS ${dashboard.metrics.week.toLocaleString()}`} accent="green" />
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Salio la Pochi" value={`TZS ${dashboard.rider.wallet_balance.toLocaleString()}`} accent="gold" subtext="Live sync active" />
        <MetricCard icon={<Package className="w-4 h-4" />} label="Safari Zilizokamilika" value={String(dashboard.rider.total_deliveries)} accent="spice" />
        <MetricCard icon={<Star className="w-4 h-4" />} label="Tathmini" value={dashboard.rider.rating_average.toFixed(2)} accent="gold" subtext={`(${dashboard.rider.total_ratings} reviews)`} />
      </div>

      {/* Friendly Empty State */}
      {!dashboard.activeDelivery && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-6 text-center space-y-2 border border-ink-100 dark:border-ink-800">
          <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mx-auto text-xl" aria-hidden="true">
            🚲
          </div>
          <h3 className="font-display font-bold text-ink-900 dark:text-white text-base">
            {isOnline ? "You're online." : 'Uko nje ya mtandao'}
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 max-w-sm mx-auto">
            {isOnline ? "We'll notify you when nearby deliveries appear." : 'Washa hali ya mtandaoni ili kuanza kupokea ofa za safari.'}
          </p>
        </div>
      )}

      {/* Active Delivery Card with Timer & Progress Bar */}
      {dashboard.activeDelivery && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-4 sm:p-5 space-y-4 border border-ink-100 dark:border-ink-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-ink-900 dark:text-white">Safari Inayoendelea</h2>
              <ActiveDeliveryTimer timestamp={dashboard.activeDelivery.accepted_at} />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
              {dashboard.activeDelivery.status === 'accepted' ? 'Unakwenda kuchukua' : 'Bidhaa Zimechukuliwa'}
            </span>
          </div>

          {/* Delivery Progress Bar */}
          {(() => {
            const st = dashboard.activeDelivery.status
            const step = st === 'picked_up' ? 2 : st === 'accepted' ? 1 : 0
            return (
              <div className="flex items-center justify-between px-3 py-2.5 bg-ink-50 dark:bg-ink-800/50 rounded-xl" aria-label="Delivery progress">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 1 ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-brand-600 text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-600'}`}>1</span>
                  Accepted
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'}`} />
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 2 ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-brand-600 text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-600'}`}>2</span>
                  Picked Up
                </div>
                <div className={`flex-1 h-0.5 mx-2 ${step >= 3 ? 'bg-brand-600' : 'bg-ink-200 dark:bg-ink-700'}`} />
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${step >= 3 ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-brand-600 text-white' : 'bg-ink-200 dark:bg-ink-700 text-ink-600'}`}>3</span>
                  Delivered
                </div>
              </div>
            )
          })()}

          <RiderNavigationMap
            riderLocation={riderLatLng}
            pickupLocation={{ lat: dashboard.activeDelivery.pickup_lat, lng: dashboard.activeDelivery.pickup_lng }}
            deliveryLocation={
              dashboard.activeDelivery.delivery_lat && dashboard.activeDelivery.delivery_lng
                ? { lat: dashboard.activeDelivery.delivery_lat, lng: dashboard.activeDelivery.delivery_lng }
                : null
            }
            leg={dashboard.activeDelivery.status === 'accepted' ? 'to_pickup' : 'to_delivery'}
          />

          <Button
            fullWidth
            aria-label={dashboard.activeDelivery.status === 'accepted' ? 'Confirm item picked up' : 'Confirm item delivered'}
            onClick={async () => {
              const nextStatus = dashboard.activeDelivery?.status === 'accepted' ? 'picked_up' : 'delivered'
              const payload = { delivery_id: dashboard.activeDelivery?.delivery_id, status: nextStatus }

              if (!navigator.onLine) {
                queueOfflineAction(payload)
                toast.success('Saved offline. Will sync when reconnected.')
                if (nextStatus === 'delivered') {
                  setDashboard((prev) => ({ ...prev, activeDelivery: null }))
                } else {
                  setDashboard((prev) => ({
                    ...prev,
                    activeDelivery: prev.activeDelivery ? { ...prev.activeDelivery, status: 'picked_up' } : null,
                  }))
                }
                return
              }

              const res = await fetch('/api/delivery/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              })
              if (res.ok) {
                if (nextStatus === 'delivered') {
                  setDashboard((prev) => ({ ...prev, activeDelivery: null }))
                  toast.success('Safari imekamilika!')
                  loadDashboardData()
                } else {
                  setDashboard((prev) => ({
                    ...prev,
                    activeDelivery: prev.activeDelivery ? { ...prev.activeDelivery, status: 'picked_up' } : null,
                  }))
                }
              } else {
                toast.error('Imeshindikana kusasisha')
              }
            }}
          >
            {dashboard.activeDelivery.status === 'accepted' ? 'Nimechukua Bidhaa' : 'Nimefikisha Bidhaa'}
          </Button>
        </div>
      )}

      {offer && (
        <ActiveJobOverlay offer={offer} onAccept={acceptOffer} onDecline={declineOffer} />
      )}
    </div>
  )
}

// Memoized Metric Card for optimal rendering performance
const MetricCard = memo(function MetricCard({
  icon,
  label,
  value,
  accent,
  subtext,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'brand' | 'spice' | 'green' | 'gold'
  subtext?: string
}) {
  const colors = {
    brand: 'text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/35',
    spice: 'text-spice-600 dark:text-spice-300 bg-spice-50 dark:bg-spice-900/35',
    green: 'text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/35',
    gold: 'text-amber-600 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/35',
  }
  return (
    <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-3.5 border border-ink-100 dark:border-ink-800 transition-all hover:shadow-card-hover">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[accent]}`} aria-hidden="true">{icon}</div>
      <p className="font-display font-black text-base text-ink-900 dark:text-white leading-tight">{value}</p>
      <p className="text-[10px] text-ink-500 dark:text-ink-400 leading-tight mt-0.5">{label}</p>
      {subtext && <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">{subtext}</p>}
    </div>
  )
})

// Skeleton Loader component for smooth loading state
function DashboardSkeleton() {
  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto space-y-6 animate-pulse" aria-label="Loading dashboard" role="status">
      <div className="h-20 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
      <div className="h-24 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
        ))}
      </div>
      <div className="h-40 bg-ink-200 dark:bg-ink-800 rounded-2xl" />
    </div>
  )
}

function ActiveDeliveryTimer({ timestamp }: { timestamp?: string }) {
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!timestamp) return
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
      const mins = Math.floor(diff / 60)
      const secs = diff % 60
      setElapsed(`${mins} min ${secs} sec ago`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [timestamp])

  if (!timestamp) return null
  return <span className="text-xs text-ink-500 dark:text-ink-400 font-medium">Started {elapsed}</span>
}
