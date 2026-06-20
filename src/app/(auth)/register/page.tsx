'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const schema = z.object({
  full_name: z.string().min(2, 'Jina linahitajika'),
  email:     z.string().email('Barua pepe si sahihi'),
  phone:     z.string().min(10, 'Nambari ya simu inahitajika'),
  password:  z.string().min(8, 'Nywila inahitaji angalau herufi 8'),
  type:      z.enum(['buyer', 'seller']),
  // seller fields (optional here, completed in seller onboarding)
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultType = params.get('type') === 'seller' ? 'seller' : 'buyer'

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: defaultType },
  })

  const accountType = watch('type')

  async function onSubmit(data: FormData) {
    setLoading(true)

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role: data.type },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Update profile with role and phone
    if (authData.user) {
      await supabase.from('profiles').update({
        full_name: data.full_name,
        phone: data.phone,
        role: data.type,
      }).eq('id', authData.user.id)
    }

    toast.success('Akaunti imefunguliwa! Angalia barua pepe yako.')
    if (data.type === 'seller') router.push('/seller/settings?onboarding=true')
    else router.push('/')
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-2xl text-ink-900 mb-1">Fungua akaunti</h1>
          <p className="text-sm text-ink-500">Jiunge na Duka Janja leo</p>
        </div>

        {/* Type toggle */}
        <div className="flex bg-ink-100 rounded-xl p-1 mb-5">
          {(['buyer', 'seller'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue('type', type)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${accountType === type ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
            >
              {type === 'buyer' ? '🛍️ Mnunuzi' : '🏪 Muuzaji'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register('type')} />

          <div>
            <label className="label">Jina kamili</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('full_name')} placeholder="Jina lako kamili" className={`input pl-9 ${errors.full_name ? 'border-red-400' : ''}`} />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="label">Barua pepe</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('email')} type="email" autoComplete="email" placeholder="mfano@barua.com" className={`input pl-9 ${errors.email ? 'border-red-400' : ''}`} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label">Nambari ya simu</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('phone')} placeholder="255777000000" className={`input pl-9 ${errors.phone ? 'border-red-400' : ''}`} />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label">Nywila</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Angalau herufi 8" className={`input pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-1">
            {loading ? 'Inafungua...' : 'Fungua akaunti'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-4">
          Una akaunti tayari?{' '}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">Ingia hapa</Link>
        </p>
      </div>
    </div>
  )
}
