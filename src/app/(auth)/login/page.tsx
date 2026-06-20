'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const schema = z.object({
  email:    z.string().email('Barua pepe si sahihi'),
  password: z.string().min(6, 'Nywila inahitaji angalau herufi 6'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password }: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Barua pepe au nywila si sahihi' : error.message)
      setLoading(false)
      return
    }
    toast.success('Karibu!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-2xl text-ink-900 mb-1">Karibu tena</h1>
          <p className="text-sm text-ink-500">Ingia kwenye akaunti yako</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Barua pepe</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="mfano@barua.com"
                className={`input pl-9 ${errors.email ? 'border-red-400' : ''}`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0">Nywila</label>
              <Link href="/forgot-password" className="text-xs text-brand-600 hover:underline">
                Umesahau nywila?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
            {loading ? 'Inaingia...' : 'Ingia'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-4">
          Huna akaunti?{' '}
          <Link href="/register" className="text-brand-600 font-semibold hover:underline">
            Fungua hapa
          </Link>
        </p>
      </div>
    </div>
  )
}
