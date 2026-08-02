'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import OnboardingCard, { type OnboardingMode, type AccountRole } from '@/components/onboarding/OnboardingCard'

function OnboardingInner() {
  const params = useSearchParams()

  const mode: OnboardingMode = params.get('mode') === 'signin' ? 'signin' : 'signup'

  const typeParam = params.get('type')
  const type: AccountRole | undefined =
    typeParam === 'buyer' || typeParam === 'seller' || typeParam === 'rider' ? typeParam : undefined

  return (
    <div className="flex justify-center">
      <OnboardingCard key={`${mode}-${type ?? 'none'}`} initialMode={mode} initialType={type} />
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  )
}
