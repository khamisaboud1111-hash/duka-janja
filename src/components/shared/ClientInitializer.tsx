'use client'

import { useEffect } from 'react'
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

export function ClientInitializer() {
  // Resolve the real zustand stores during render (hooks are legal here).
  const langStore = useLangStore()
  const themeStore = useThemeStore()

  // Signal to CSS that the client has taken over, which re-enables reveal-on-
  // scroll animations. Until then globals.css forces hidden elements visible so
  // a hydration failure can never leave the page blank.
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', 'true')
  }, [])

  useEffect(() => {
    // Read cookies AFTER hydration - guaranteed to match server
    const langCookie = readCookie('lang')
    const themeCookie = readCookie('theme')

    const lang: Language = (langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr') ? langCookie : 'sw'
    const theme: Theme = themeCookie === 'dark' ? 'dark' : 'light'

    // Sync stores with cookie values (no-op if already matching)
    applyDir(lang)
    applyTheme(theme)

    // Use the stores' static API inside the effect. Calling a hook-selected
    // action here invoked the store hook outside of render, which is an invalid
    // hook call and took the whole app down with React error #321.
    langStore.getState().setLang(lang)
    themeStore.getState().setTheme(theme)
  }, [langStore, themeStore])

  return null
}