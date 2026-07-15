'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Eye, EyeOff, ShoppingBag, Store, Bike, Check } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const ROLES = [
  {
    id: 'buyer' as const,
    label: 'Mnunuzi',
    tagline: 'Nunua bidhaa halisi za Zanzibar kwa urahisi na uhakika.',
    icon: ShoppingBag,
    // Free to use, Unsplash License
    photo: 'https://images.unsplash.com/photo-1758520388397-bf53b6e11bba?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'seller' as const,
    label: 'Muuzaji',
    tagline: 'Fungua duka lako na ufikie wateja kote Zanzibar.',
    icon: Store,
    // African market vendor, Dar es Salaam — free to use, Unsplash License
    photo: 'https://images.unsplash.com/photo-1687422808565-929533931584?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'rider' as const,
    label: 'Dereva',
    tagline: 'Pata kipato kwa kusafirisha bidhaa kwa bodaboda yako.',
    icon: Bike,
    // Boda boda, East Africa — free to use, Unsplash License
    photo: 'https://images.unsplash.com/photo-1754086988896-c607880ce10e?q=80&w=800&auto=format&fit=crop',
  },
]

const schema = z.object({
  full_name: z.string().min(2, 'Jina linahitajika'),
  email:     z.string().email('Barua pepe si sahihi'),
  phone:     z.string().min(10, 'Nambari ya simu inahitajika'),
  password:  z.string().min(8, 'Nywila inahitaji angalau herufi 8'),
  type:      z.enum(['buyer', 'seller', 'rider']),
  // seller/rider-specific details are completed in their own onboarding flows
})
type FormData = z.infer<typeof schema>

const TYPE_PARAM_MAP: Record<string, FormData['type']> = { seller: 'seller', rider: 'rider', buyer: 'buyer' }

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultType = TYPE_PARAM_MAP[params.get('type') ?? ''] ?? 'buyer'

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
      toast.error(error.message === 'User already registered' ? 'Barua pepe hii tayari imesajiliwa' : error.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      toast.error('Imeshindikana kufungua akaunti. Jaribu tena.')
      setLoading(false)
      return
    }

    // No session means the Supabase project still requires email
    // confirmation, so there's no authenticated context yet to update the
    // profile under RLS, and nothing to redirect the user into. Send them
    // to login with a clear message instead of a protected page that will
    // just bounce them.
    if (!authData.session) {
      toast.success('Akaunti imefunguliwa! Thibitisha barua pepe yako kisha uingie.')
      router.push('/login')
      setLoading(false)
      return
    }

    // We have a real session now (auto-confirm is on) — set the role/phone
    // under proper RLS auth context, and actually check for failure instead
    // of silently ignoring it.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone: data.phone, role: data.type })
      .eq('id', authData.user.id)

    if (profileError) {
      toast.error('Akaunti imefunguliwa lakini wasifu haukusasishwa. Jaribu tena kwenye mipangilio.')
      router.push('/')
      router.refresh()
      setLoading(false)
      return
    }

    toast.success('Karibu Duka Janja!')
    if (data.type === 'seller') router.push('/seller/settings?onboarding=true')
    else if (data.type === 'rider') router.push('/rider/apply')
    else router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 sm:p-8">
        <div className="text-center mb-5">
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-1">Fungua akaunti</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">Jiunge na Duka Janja leo</p>
        </div>

        {/* Role picker — buyer / seller / rider, each with real photography */}
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400 mb-2">
          Unataka kujiunga kama nani?
        </p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isSelected = accountType === role.id
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => setValue('type', role.id)}
                aria-pressed={isSelected}
                className={`relative rounded-2xl overflow-hidden aspect-[3/4] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  isSelected
                    ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-ink-900'
                    : 'ring-1 ring-ink-200 dark:ring-ink-700 opacity-75 hover:opacity-100'
                }`}
              >
                <Image src={role.photo} alt={role.label} fill sizes="120px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/0" />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 p-2 flex flex-col items-center gap-0.5">
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-[11px] leading-tight">{role.label}</span>
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-ink-500 dark:text-ink-400 text-center min-h-[2.2em] mb-4 px-1">
          {ROLES.find((r) => r.id === accountType)?.tagline}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <input type="hidden" {...register('type')} />

          <div>
            <label className="label dark:text-ink-300">Jina kamili</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('full_name')} placeholder="Jina lako kamili" className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.full_name ? 'border-red-400' : ''}`} />
            </div>
            {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div>
            <label className="label dark:text-ink-300">Barua pepe</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('email')} type="email" autoComplete="email" placeholder="mfano@barua.com" className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.email ? 'border-red-400' : ''}`} />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <label className="label dark:text-ink-300">Nambari ya simu</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('phone')} placeholder="255777000000" className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.phone ? 'border-red-400' : ''}`} />
            </div>
            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="label dark:text-ink-300">Nywila</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Angalau herufi 8" className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`} />
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

        <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-4">
          Una akaunti tayari?{' '}
          <Link href="/login" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">Ingia hapa</Link>
        </p>
      </div>
    </div>
  )
}
