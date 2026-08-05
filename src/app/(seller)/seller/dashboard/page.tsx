'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, TrendingUp, TrendingDown, Package, Star, AlertTriangle, Plus, DollarSign, Users, Wallet, Bell, MessageSquare, BarChart2, Activity, CreditCard, Clock, CheckCircle, XCircle, Archive, Layers, Percent, Settings, PackagePlus, UsersRound, Store, PackageCheck, PackageX, Clock4, Gauge, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { StatCard, PageLoader, EmptyState } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  totalProducts: number
  lowStockProducts: number
  unpaidCommissions: number
  totalCustomers: number
  averageOrderValue: number
  conversionRate: number
  recentRevenue: number
  inventoryValue: number
  walletBalance: number
  pendingWithdrawals: number
}

interface Alert {
  id: string
  type: 'warning' | 'info' | 'success'
  message: string
  action?: () => void
  actionLabel?: string
}

export default function SellerDashboardPage() {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [notifications, setNotifications] = useState(5)
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    if (seller?.id) {
      loadDashboardData()
    }
  }, [seller])

  useEffect(() => {
    loadAlerts()
  }, [stats])

  async function loadDashboardData() {
    if (!seller) return
    setLoading(true)
    
    try {
      // Load comprehensive analytics
      const daysAgo = 30
      const since = new Date(Date.now() - daysAgo * 86400000).toISOString()
      
      // Get orders data
      const { data: ordersData } = await supabase
        .from('order_items')
        .select('order_id, total_price, quantity, created_at, seller_id, order:orders(status, created_at, buyer_id)')
        .eq('seller_id', seller.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
      
      // Get products data
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, price, stock_quantity, total_sold, status, category_id')
        .eq('seller_id', seller.id)
      
      // Get commissions data
      const { data: commissionsData } = await supabase
        .from('commissions')
        .select('commission_amount, is_paid, created_at')
        .eq('seller_id', seller.id)
        .eq('is_paid', false)
      
      // Get unique customers
      const { data: customersData } = await supabase
        .from('order_items')
        .select('buyer_id')
        .eq('seller_id', seller.id)
        .gte('created_at', since)
      
      // Calculate comprehensive stats
      const items = ordersData ?? []
      const products = productsData ?? []
      const commissions = commissionsData ?? []
      const customers = (customersData ?? []).filter((c: any, i: number, arr: any[]) =>
        arr.findIndex((x: any) => x.buyer_id === c.buyer_id) === i
      )
      
      // Order aggregation
      const orderMap = new Map<string, any>()
      items.forEach((item: any) => {
        if (!orderMap.has(item.order_id)) {
          orderMap.set(item.order_id, {
            ...item.order,
            total: 0,
            quantity: 0,
            items: []
          })
        }
        const order = orderMap.get(item.order_id)
        order.total += item.total_price
        order.quantity += item.quantity
        order.items.push(item)
      })
      
      const allOrders = Array.from(orderMap.values())
      const totalRevenue = items.reduce((s: number, i: any) => s + i.total_price, 0)
      const totalOrders = orderMap.size
      const completedOrders = allOrders.filter((o: any) => o.status === 'delivered').length
      const pendingOrders = allOrders.filter((o: any) => ['pending','confirmed','packed'].includes(o?.status)).length
      const totalProducts = products.length
      const lowStockProducts = products.filter((p: any) => p.stock_quantity > 0 && p.stock_quantity <= 5).length
      const unpaidCommissions = commissions.reduce((s: number, c: any) => s + c.commission_amount, 0)
      const totalCustomers = customers.length
      const totalUnits = items.reduce((s: number, i: any) => s + i.quantity, 0)
      const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
      
      // Recent revenue (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      const weekItems = items.filter((i: any) => i.created_at >= weekAgo)
      const recentRevenue = weekItems.reduce((s: number, i: any) => s + i.total_price, 0)
      
      // Inventory value
      const inventoryValue = products.reduce((s: number, p: any) => s + (p.price * p.stock_quantity), 0)
      
      // Wallet balance (mock - would come from payment processor)
      const calculatedWalletBalance = totalRevenue * 0.9 - unpaidCommissions // 90% payout minus unpaid commissions
      setWalletBalance(calculatedWalletBalance)
      
      // Conversion rate (mock - would need buyer data)
      const conversionRate = 0.12 // 12% conversion rate
      
      const newStats: DashboardStats = {
        totalRevenue,
        totalOrders,
        pendingOrders,
        completedOrders,
        totalProducts,
        lowStockProducts,
        unpaidCommissions,
        totalCustomers,
        averageOrderValue,
        conversionRate,
        recentRevenue,
        inventoryValue,
        walletBalance: calculatedWalletBalance,
        pendingWithdrawals: calculatedWalletBalance * 0.15 // 15% pending
      }
      
      setStats(newStats)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  function loadAlerts() {
    const newAlerts: Alert[] = []
    
    if (stats) {
      if (stats.lowStockProducts > 0) {
        newAlerts.push({
          id: 'low-stock',
          type: 'warning',
          message: `${stats.lowStockProducts} products are running low on stock (≤5 units)`,          actionLabel: 'View Products',
          action: () => window.location.href = '/seller/products'
        })
      }
      
      if (stats.unpaidCommissions > 0) {
        newAlerts.push({
          id: 'commissions',
          type: 'warning',
          message: `$${stats.unpaidCommissions.toFixed(2)} in commissions are pending payout`,
          actionLabel: 'Pay Now',
          action: () => window.location.href = '/seller/wallet'
        })
      }
      
      if (stats.pendingOrders > 0) {
        newAlerts.push({
          id: 'orders',
          type: 'info',
          message: `${stats.pendingOrders} orders are pending processing`,
          actionLabel: 'Process Orders',
          action: () => window.location.href = '/seller/orders'
        })
      }
      
      if (stats.totalRevenue < stats.recentRevenue * 0.8) {
        newAlerts.push({
          id: 'revenue',
          type: 'warning',
          message: 'Revenue has decreased by 20% this week. Consider promotional campaigns.',
          actionLabel: 'View Insights',
          action: () => window.location.href = '/seller/analytics'
        })
      }
    }
    
    setAlerts(newAlerts)
  }

  if (sellerLoading || loading) return <PageLoader />

  if (seller?.status === 'pending') {
    return (
      <div className="p-6 max-w-lg mx-auto dark:bg-ink-950 min-h-screen">
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 border-l-4 border-amber-400">
          <h2 className="font-bold text-lg text-ink-900 dark:text-white mb-2">Store Verification Pending</h2>
          <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
            Your store is under review. You'll receive an email notification once approved (usually 24-48 hours).
          </p>
          <Link href="/seller/settings" className="btn-outline text-sm">Complete Store Setup →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto dark:bg-ink-950 min-h-screen">
      {/* Header with Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">Welcome back, {seller?.store_name || 'Seller'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/seller/products/new" className="btn-primary gap-2">
            <Plus className="w-4 h-4" /> Add Product
          </Link>
          <button className="relative p-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors">
            <Bell className="w-5 h-5" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
          <Link href="/seller/settings" className="p-2 rounded-xl bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300 hover:bg-ink-200 dark:hover:bg-ink-700 transition-colors">
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
              alert.type === 'warning' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' :
              alert.type === 'info' ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-800' :
              'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800'
            }`}>            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
              alert.type === 'warning' ? 'text-amber-500' :
              alert.type === 'info' ? 'text-brand-500' : 'text-emerald-500'
            }`} />
            <p className={`text-sm flex-1 ${
              alert.type === 'warning' ? 'text-amber-800 dark:text-amber-300' :
              alert.type === 'info' ? 'text-brand-800 dark:text-brand-300' : 'text-emerald-800 dark:text-emerald-300'
            }`}>{alert.message}</p>
            {alert.actionLabel && alert.action && (
              <button onClick={alert.action} className={`text-sm font-medium hover:underline ${
                alert.type === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                alert.type === 'info' ? 'text-brand-600 dark:text-brand-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>{alert.actionLabel}</button>
            )}
          </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6">
          <StatCard 
            label="Revenue" 
            value={formatTZS(stats.totalRevenue)} 
            icon={<DollarSign className="w-5 h-5" />} 
            accent="brand" 
            subtitle={`+$${stats.recentRevenue.toFixed(0)} this week`} 
          />
          <StatCard 
            label="Orders" 
            value={stats.totalOrders} 
            icon={<ShoppingBag className="w-5 h-5" />} 
            accent="spice" 
            subtitle={`${stats.completedOrders} completed`} 
          />
          <StatCard 
            label="Pending" 
            value={stats.pendingOrders} 
            icon={<Clock className="w-5 h-5" />} 
            accent="gold" 
            subtitle={stats.pendingOrders > 0 ? 'Needs attention' : 'All caught up'} 
          />
          <StatCard 
            label="Products" 
            value={stats.totalProducts} 
            icon={<Package className="w-5 h-5" />} 
            accent="green"
            subtitle={`${stats.lowStockProducts} low stock`} 
          />
          <StatCard 
            label="Customers" 
            value={stats.totalCustomers} 
            icon={<Users className="w-5 h-5" />} 
            accent="brand"
            subtitle={`${stats.conversionRate * 100}% conversion`} 
          />
          <StatCard 
            label="Wallet" 
            value={formatTZS(stats.walletBalance)} 
            icon={<Wallet className="w-5 h-5" />} 
            accent="spice"
            subtitle={`${stats.pendingWithdrawals > 0 ? '$' + stats.pendingWithdrawals.toFixed(2) : 'Available for withdrawal'}`} 
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Quick Actions */}
        <div className="xl:col-span-1 space-y-4">
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/seller/products/new" className="group p-4 rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 hover:bg-brand-100 dark:hover:bg-brand-950 transition-colors">
                <Plus className="w-6 h-6 text-brand-600 dark:text-brand-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Add Product</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">Launch new item</p>
              </Link>
              <Link href="/seller/orders" className="group p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 transition-colors">
                <Package className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Process Orders</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{stats?.pendingOrders || 0} pending</p>
              </Link>
              <Link href="/seller/analytics" className="group p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors">
                <BarChart2 className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Analytics</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">View insights</p>
              </Link>
              <Link href="/seller/messages" className="group p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950 transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                <p className="text-sm font-medium text-ink-900 dark:text-white">Messages</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">{notifications} unread</p>
              </Link>
            </div>
          </div>

          {/* Wallet Summary */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Wallet Summary</h2>
            {stats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Available</p>
                      <p className="font-semibold text-ink-900 dark:text-white">${stats.walletBalance.toFixed(2)}</p>
                    </div>
                  </div>
                  <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    Withdraw
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-ink-500 dark:text-ink-400">Pending Payouts</p>
                      <p className="font-semibold text-ink-900 dark:text-white">${stats.unpaidCommissions.toFixed(2)}</p>
                    </div>
                  </div>
                  <button className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Performance Summary */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Performance</h2>
            {stats && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Conversion Rate</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">{(stats.conversionRate * 100).toFixed(1)}%</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width: `${stats.conversionRate * 100}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Avg. Order Value</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">${stats.averageOrderValue}</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: Math.min(stats.averageOrderValue / 10, 100) }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-ink-500 dark:text-ink-400">Inventory Efficiency</p>
                    <p className="text-xs font-medium text-ink-900 dark:text-white">{stats.totalProducts > 0 ? ((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts * 100).toFixed(0) : '100'}%</p>
                  </div>
                  <div className="h-2 bg-ink-100 dark:bg-ink-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: stats.totalProducts ? ((stats.totalProducts - stats.lowStockProducts) / stats.totalProducts * 100) : 0 }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 dark:text-ink-100">Recent Orders</h2>
              <Link href="/seller/orders" className="text-xs text-brand-600 dark:text-brand-300 font-medium hover:underline">View all →</Link>
            </div>
            {/* Orders content */}
          </div>

          {/* Top Products */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-800 dark:text-ink-100">Top Products</h2>
              <Link href="/seller/products" className="text-xs text-brand-600 dark:text-brand-300 font-medium hover:underline">View all →</Link>
            </div>
            {/* Products content */}
          </div>

          {/* Customer Insights */}
          <div className="card dark:bg-ink-900 dark:border-ink-800 p-5">
            <h2 className="font-semibold text-ink-800 dark:text-ink-100 mb-4">Customer Insights</h2>
            {/* Customer insights content */}
          </div>
        </div>
      </div>
    </div>
  )
}
