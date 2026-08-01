'use client'

import { useEffect, useState, useMemo } from 'react'
import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, ArrowDownRight, Download, Clock, Banknote, Plus, ChevronRight } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, EmptyState, StatCard } from '@/components/ui'
import { formatTZS, formatDate } from '@/utils'
import toast from 'react-hot-toast'

interface Transaction {
  id: string
  type: 'earning' | 'withdrawal' | 'bonus'
  amount: number
  description: string
  created_at: string
  delivery_id?: string
}

interface WithdrawalRequest {
  id: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  method: string
  account_number: string
  created_at: string
}

export default function RiderWalletPage() {
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const [profileRes, transRes, withdrawalRes] = await Promise.all([
        supabase.from('rider_profiles').select('wallet_balance, payout_method, payout_account_number').eq('id', profile!.id).single(),
        supabase.from('rider_transactions').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('rider_withdrawals').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(20),
      ])
      if (profileRes.data) setBalance(profileRes.data.wallet_balance || 0)
      setTransactions((transRes.data ?? []) as Transaction[])
      setWithdrawals((withdrawalRes.data ?? []) as WithdrawalRequest[])
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  const stats = useMemo(() => {
    const earned = transactions.filter(t => t.type === 'earning').reduce((s, t) => s + t.amount, 0)
    const withdrawn = transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount), 0)
    const pending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0)
    return { earned, withdrawn, pending }
  }, [transactions, withdrawals])

  async function handleWithdraw() {
    const amount = parseInt(withdrawAmount)
    if (!amount || amount <= 0 || amount > balance) {
      toast.error('Kiasi si sahihi au hakuna salio la kutosha')
      return
    }
    setWithdrawing(true)
    try {
      const { error } = await supabase.from('rider_withdrawals').insert({
        rider_id: profile!.id,
        amount,
        status: 'pending',
        method: 'mpesa',
        account_number: '',
      })
      if (error) throw error
      toast.success('Ombi la kutoa pesa limetumwa')
      setWithdrawAmount('')
      setShowWithdrawForm(false)
      // Reload
      const { data } = await supabase.from('rider_withdrawals').select('*').eq('rider_id', profile!.id).order('created_at', { ascending: false }).limit(20)
      setWithdrawals((data ?? []) as WithdrawalRequest[])
    } catch {
      toast.error('Imeshindikana kutuma ombi')
    } finally {
      setWithdrawing(false)
    }
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-6">Pochi</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-brand-500 via-brand-600 to-teal-600 rounded-2xl p-6 text-white mb-6 shadow-lg">
        <p className="text-sm text-white/70 mb-1">Salio la Pochi</p>
        <p className="font-display font-black text-4xl mb-4">{formatTZS(balance)}</p>
        <div className="flex gap-2">
          <button onClick={() => setShowWithdrawForm(!showWithdrawForm)} className="flex-1 bg-white/20 hover:bg-white/30 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
            <ArrowUpRight className="w-4 h-4" /> Toa Pesa
          </button>
        </div>
      </div>

      {/* Withdraw Form */}
      {showWithdrawForm && (
        <div className="card rounded-2xl p-4 mb-4">
          <h3 className="font-semibold text-ink-900 dark:text-white mb-3">Toa Pesa</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
              placeholder="Kiasi (TZS)"
              className="input flex-1 text-sm"
              min={1000}
            />
            <button onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount} className="btn-primary text-sm px-4">
              {withdrawing ? 'Inatuma...' : 'Tuma'}
            </button>
          </div>
          <p className="text-xs text-ink-500 mt-2">Kiasi kidogo ni TZS 1,000</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Jumla ya Mapato" value={formatTZS(stats.earned)} icon={<TrendingUp className="w-5 h-5" />} accent="green" />
        <StatCard label="Zimetolewa" value={formatTZS(stats.withdrawn)} icon={<ArrowUpRight className="w-5 h-5" />} accent="spice" />
        <StatCard label="Zinasubiri" value={formatTZS(stats.pending)} icon={<Clock className="w-5 h-5" />} accent="gold" />
      </div>

      {/* Recent Withdrawals */}
      {withdrawals.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-ink-800 dark:text-white mb-3">Ombi la Kutoa Pesa</h2>
          <div className="space-y-2">
            {withdrawals.map(w => (
              <div key={w.id} className="card rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink-900 dark:text-white">{formatTZS(w.amount)}</p>
                  <p className="text-xs text-ink-500">{formatDate(w.created_at)}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  w.status === 'approved' ? 'bg-emerald-100 text-emerald-700'
                  : w.status === 'rejected' ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {w.status === 'approved' ? 'Imekubaliwa' : w.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div>
        <h2 className="font-semibold text-ink-800 dark:text-white mb-3">Historia ya Miamala</h2>
        {transactions.length === 0 ? (
          <EmptyState icon={<Banknote className="w-10 h-10" />} title="Hakuna miamala" description="Mapato yako yataonekana hapa" />
        ) : (
          <div className="space-y-1">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-3 border-b border-ink-50 dark:border-ink-800 last:border-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.type === 'earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-ink-100 text-ink-600'
                }`}>
                  {t.type === 'earning' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{t.description}</p>
                  <p className="text-xs text-ink-500">{formatDate(t.created_at)}</p>
                </div>
                <span className={`font-display font-bold text-sm ${t.type === 'earning' ? 'text-emerald-600' : 'text-ink-600'}`}>
                  {t.type === 'earning' ? '+' : '-'}{formatTZS(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
