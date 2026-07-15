import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-spice-50 dark:from-ink-950 dark:via-ink-900 dark:to-ink-950 flex flex-col">
      <header className="p-4 sm:p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">DJ</span>
          </div>
          <span className="font-display font-black text-brand-700 dark:text-brand-300 text-xl">Duka Janja</span>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>
      <footer className="p-4 text-center text-xs text-ink-400">
        © 2024 Duka Janja · Zanzibar, Tanzania
      </footer>
    </div>
  )
}
