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

// Module-level error capture, active as soon as this module loads during
// client hydration. Errors thrown during hydration (before any useEffect
// runs) would otherwise leave a blank page with nothing to report.
if (typeof window !== 'undefined') {
  const storeErr = (reason: unknown) => {
    try {
      const err = reason instanceof Error ? reason : new Error(String(reason))
      const msg = err.name + ': ' + err.message + ' || Stack: ' + (err.stack || '').split(/\r?\n/).join(' › ')
      sessionStorage.setItem('dj_last_error', msg)
      document.title = 'ERR: ' + err.name + ': ' + err.message
      const d = document.getElementById('fatal-error-display')
      if (d) { d.style.display = 'block'; d.textContent = 'Fatal: ' + err.name + ': ' + err.message }
    } catch {
      // best effort
    }
  }

  const handleError = (event: ErrorEvent) => {
    storeErr(event.error || event.message)
  }
  const handleRejection = (event: PromiseRejectionEvent) => {
    storeErr(event.reason)
  }

  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleRejection)

  // Last-resort fallback: if anything blanks the page without throwing, show
  // the error in the document element itself.
  window.onerror = (message, source, lineno, colno, error) => {
    try {
      const msg = (error instanceof Error ? error.name + ': ' + error.message : String(message || error)).slice(0, 200)
      document.documentElement.innerHTML = '<div style="background:#8b1a1a;color:#fff;padding:2rem;font-family:system-ui,sans-serif;font-size:1.25rem">FATAL: ' + msg + '</div>'
    } catch {}
    return true
  }

export function ClientInitializer() {
  // Resolve the real zustand stores during render (hooks are legal here).
  const langStore = useLangStore()
  const themeStore = useThemeStore()

  useEffect(() => {
    // Signal to CSS that the client has taken over, which re-enables reveal-on-
    // scroll animations. Until then globals.css forces hidden elements visible
    // so a hydration failure can never leave the page blank.
    document.documentElement.setAttribute('data-hydrated', 'true')
  }, [])

  // Capture any rendering/runtime error that escapes React's error boundary so
  // we can read it after a blank load instead of guessing.
  useEffect(() => {
  const storeErr = (reason: unknown) => {
    try {
      const err = reason instanceof Error ? reason : new Error(String(reason))
      const msg = err.name + ': ' + err.message + ' || ' + (err.stack || '').split(/\r?\n/).join(' › ')
      sessionStorage.setItem('dj_last_error', msg)
      document.title = 'ERR: ' + msg
    } catch {
      // best effort only
    }
  }

    const origError = window.console.error.bind(window.console)
    window.console.error = (...args: unknown[]) => {
      origError(...args)
      storeErr(args[0])
    }

    const handleError = (event: ErrorEvent) => {
      storeErr(event.error || event.message)
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      storeErr(event.reason)
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.console.error = origError
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  // Read cookies AFTER hydration - guaranteed to match server
  useEffect(() => {
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
