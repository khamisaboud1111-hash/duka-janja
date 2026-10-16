'use client'

import { useEffect } from 'react'
import { useLangStore } from '@/store'
import { useThemeStore } from '@/store'
import type { Language, Theme } from '@/store'

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const cookie = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
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

export function ClientInitializer() {
  const langStore = useLangStore()
  const themeStore = useThemeStore()

  // Sync from cookies after hydration
  useEffect(() => {
    const langCookie = readCookie('lang')
    const themeCookie = readCookie('theme')
    const lang: Language = (langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr') ? langCookie : 'sw'
    const theme: Theme = themeCookie === 'dark' ? 'dark' : 'light'
    applyDir(lang)
    applyTheme(theme)
    langStore.getState().setLang(lang)
    themeStore.getState().setTheme(theme)
  }, [langStore, themeStore])

  return null
}
