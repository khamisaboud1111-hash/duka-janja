'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
    })
    if (error) toast.error(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-6 sm:p-8">
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="font-bold text-lg text-ink-900 mb-2">Angalia barua pepe yako</h2>
            <p className="text-sm text-ink-500 mb-6">
              Tumekutumia kiungo cha kubadilisha nywila kwenye <strong>{email}</strong>
            </p>
            <Link href="/login" className="btn-primary inline-flex">Rudi kuingia</Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Link href="/login" className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600 mb-4">
                <ArrowLeft className="w-4 h-4" /> Rudi
              </Link>
              <h1 className="font-display font-black text-2xl text-ink-900 mb-1">Umesahau nywila?</h1>
              <p className="text-sm text-ink-500">Tutakutumia kiungo cha kubadilisha nywila</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Barua pepe</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="barua@mfano.com"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? 'Inatuma...' : 'Tuma kiungo'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
