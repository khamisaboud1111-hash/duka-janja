'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <AlertTriangle className="w-12 h-12 text-spice-500 mx-auto mb-4" />
        <h1 className="font-display font-black text-xl text-ink-900 mb-2">Hitilafu imetokea</h1>
        <p className="text-sm text-ink-500 mb-6">Samahani, kitu kimekosea. Jaribu tena au rudi nyumbani.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary gap-2">
            <RotateCw className="w-4 h-4" /> Jaribu tena
          </button>
          <Link href="/" className="btn-secondary">Nyumbani</Link>
        </div>
      </div>
    </div>
  )
}
