'use client'

import { useEffect, useState } from 'react'
import { useLangStore } from '@/store'
import { useThemeStore } from '@/store'
import type { Language, Theme } from '@/store'

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookie = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
  return cookie?.split('=')[1]
}

function applyDir(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }
}

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
}

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const setLang = useLangStore((s) => s.setLang)
  const setTheme = useThemeStore((s) => s.setTheme)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    // Read cookies AFTER hydration - guaranteed to match server
    const langCookie = readCookie('lang')
    const themeCookie = readCookie('theme')

    const lang: Language = (langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr') ? langCookie : 'sw'
    const theme: Theme = themeCookie === 'dark' ? 'dark' : 'light'

    // Apply to DOM and sync stores
    applyDir(lang)
    applyTheme(theme)
    setLang(lang)
    setTheme(theme)
  }, [hydrated, setLang, setTheme])

  // Render nothing until hydrated (prevents any flash of wrong content)
  if (!hydrated) {
    return (
      <html lang="sw" dir="ltr" className="" suppressHydrationWarning>
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="format-detection" content="telephone=no" />
        </head>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <div id="main-content" />
        </body>
      </html>
    )
  }

  return children
}