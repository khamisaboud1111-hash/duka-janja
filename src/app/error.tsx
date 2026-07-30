'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-white to-ink-50 dark:from-ink-950 dark:to-ink-900">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-2">Hitilafu imetokea</h1>
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-2">
          Samahani, kitu kimekosea wakati wa kupakia ukurasa huu.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-400 dark:text-ink-500 mb-6 font-mono">
            Kosa ID: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary">
            <RotateCw className="w-4 h-4" /> Jaribu tena
          </button>
          <Link href="/" className="btn-secondary">
            <Home className="w-4 h-4" /> Nyumbani
          </Link>
        </div>
      </div>
    </div>
  )
}
