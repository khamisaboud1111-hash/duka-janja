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

  // Reveal-on-scroll safety net.
  //
  // Several sections render inline `opacity: 0` from the server and rely on
  // framer-motion's whileInView to animate them in once the IntersectionObserver
  // fires. If that never fires - observer quirk, throttled tab, or an error
  // higher up - the element stays at opacity 0 forever and the user stares at a
  // black page even though hydration succeeded.
  //
  // Content must never depend on an animation to become visible. Once the page
  // has settled, force anything still hidden into view.
  useEffect(() => {
    const reveal = () => {
      document.querySelectorAll<HTMLElement>('[style*="opacity"]').forEach((el) => {
        if (getComputedStyle(el).opacity === '0') {
          el.style.setProperty('opacity', '1', 'important')
          el.style.setProperty('transform', 'none', 'important')
        }
      })
    }

    const timers = [
      window.setTimeout(reveal, 1200),
      window.setTimeout(reveal, 3000),
      window.setTimeout(reveal, 6000),
    ]

    window.addEventListener('scroll', reveal, { passive: true })
    return () => {
      timers.forEach(window.clearTimeout)
      window.removeEventListener('scroll', reveal)
    }
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

  // Capture any rendering/runtime error that escapes React's error boundary so
  // we can read it after a blank load instead of guessing.
  useEffect(() => {
  const storeErr = (reason: unknown) => {
    try {
      const msg = (reason instanceof Error ? reason.name + ': ' + reason.message : String(reason)).slice(0, 90)
      sessionStorage.setItem('dj_last_error', msg)
      document.title = 'ERR: ' + msg
    } catch {
      // best effort only
    }
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

  return null
}