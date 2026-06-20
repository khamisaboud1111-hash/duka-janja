import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm text-center">
        <SearchX className="w-12 h-12 text-ink-300 mx-auto mb-4" />
        <h1 className="font-display font-black text-2xl text-ink-900 mb-2">404</h1>
        <p className="text-sm text-ink-500 mb-6">Ukurasa huu haupatikani.</p>
        <Link href="/" className="btn-primary inline-flex">Rudi Nyumbani</Link>
      </div>
    </div>
  )
}
