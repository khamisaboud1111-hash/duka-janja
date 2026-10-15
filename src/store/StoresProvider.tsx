'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import type { Language } from '@/i18n/translations'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'

interface CartStore {
  items: CartItem[]
  isOnline: boolean
  lastSynced: number
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  setOnlineStatus: (online: boolean) => void
  syncCart: () => void
}

interface UiStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

interface LangStore {
  lang: Language
  setLang: (lang: Language) => void
}

export type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  hasHydrated: boolean
  highContrast: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleHighContrast: () => void
}

export interface Stores {
  useCartStore: ReturnType<typeof create<CartStore>>
  useUiStore: ReturnType<typeof create<UiStore>>
  useLangStore: ReturnType<typeof create<LangStore>>
  useThemeStore: ReturnType<typeof create<ThemeStore>>
}

// ─── Store Factories (only run on client) ────────────────────────────────────

function createCartStore() {
  return create<CartStore>()(
    persist(
      (set, get) => ({
        items: [],
        isOnline: true,
        lastSynced: 0,

        addItem: (product, quantity = 1) => {
          set((state) => {
            const existing = state.items.find((i) => i.product.id === product.id)
            if (existing) {
              return {
                items: state.items.map((i) =>
                  i.product.id === product.id
                    ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock_quantity) }
                    : i
                ),
              }
            }
            return { items: [...state.items, { product, quantity }] }
          })
        },

        removeItem: (productId) => {
          set((state) => ({
            items: state.items.filter((i) => i.product.id !== productId),
          }))
        },

        updateQuantity: (productId, quantity) => {
          if (quantity <= 0) {
            get().removeItem(productId)
            return
          }
          set((state) => ({
            items: state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
          }))
        },

        clearCart: () => set({ items: [] }),

        setOnlineStatus: (online) => {
          set({ isOnline: online })
          if (online) get().syncCart()
        },

        syncCart: () => {
          set({ lastSynced: Date.now() })
        },
      }),
      {
        name: 'duka-janja-cart',
        partialize: (state) => ({
          items: state.items.map(({ product, quantity }) => ({
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              compare_at_price: product.compare_at_price,
              stock_quantity: product.stock_quantity,
              seller_id: product.seller_id,
              seller: product.seller ? { store_name: product.seller.store_name } : undefined,
              images: product.images?.map(img => ({ url: img.url, is_primary: img.is_primary })) ?? [],
            },
            quantity,
          })),
        }),
      }
    )
  )
}

function createUiStore() {
  return create<UiStore>()(() => ({
    sidebarOpen: false,
    setSidebarOpen: (open: boolean) => { /* no-op */ },
    toggleSidebar: () => { /* no-op */ },
  }))
}

function createLangStore() {
  return create<LangStore>()(() => ({
    lang: (() => {
      if (typeof document === 'undefined') return 'sw'
      const htmlLang = document.documentElement.lang
      return (htmlLang === 'ar' || htmlLang === 'en' || htmlLang === 'fr') ? htmlLang : 'sw'
    })(),
    setLang: (lang: Language) => {
      if (typeof document !== 'undefined') {
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
        document.cookie = `lang=${lang}; path=/; max-age=31536000`
      }
    },
  }))
}

function createThemeStore() {
  return create<ThemeStore>()(() => ({
    theme: (() => {
      if (typeof document === 'undefined') return 'light'
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    })(),
    hasHydrated: true,
    highContrast: false,
    toggleTheme: () => {
      if (typeof document === 'undefined') return
      const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
      document.documentElement.classList.toggle('dark', next === 'dark')
      document.cookie = `theme=${next}; path=/; max-age=31536000`
    },
    setTheme: (theme: Theme) => {
      if (typeof document === 'undefined') return
      document.documentElement.classList.toggle('dark', theme === 'dark')
      document.cookie = `theme=${theme}; path=/; max-age=31536000`
    },
    toggleHighContrast: () => {
      if (typeof document === 'undefined') return
      document.documentElement.classList.toggle('high-contrast')
    },
  }))
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoresContext = createContext<Stores | null>(null)

export function useStores() {
  const ctx = useContext(StoresContext)
  if (!ctx) throw new Error('useStores must be used within StoresProvider')
  return ctx
}

// ─── Provider ──────────────────────────────────────────────────────────────────

export function StoresProvider({ children }: { children: ReactNode }) {
  // Created synchronously so the server renders `children` instead of null.
  // Every factory guards its browser API access with `typeof document`, so this
  // is SSR-safe; creating them in useEffect left the whole app unrendered on the
  // server and made every useStores() call throw.
  const [stores] = useState<Stores>(() => ({
    useCartStore: createCartStore(),
    useUiStore: createUiStore(),
    useLangStore: createLangStore(),
    useThemeStore: createThemeStore(),
  }))

  useEffect(() => {
    // Initialize online/offline listeners
    const handleOnline = () => stores.useCartStore.getState().setOnlineStatus(true)
    const handleOffline = () => stores.useCartStore.getState().setOnlineStatus(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    stores.useCartStore.getState().setOnlineStatus(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [stores])

  return (
    <StoresContext.Provider value={stores}>
      {children}
    </StoresContext.Provider>
  )
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCartStore() {
  return useStores().useCartStore
}

export function useUiStore() {
  return useStores().useUiStore
}

export function useLangStore() {
  return useStores().useLangStore
}

export function useThemeStore() {
  return useStores().useThemeStore
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export const selectCartItemCount = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const selectCartSubtotal = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => (item.product?.price ?? 0) * item.quantity + sum, 0)

export const selectCartTotalSavings = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => {
    const originalPrice = item.product?.compare_at_price ?? item.product?.price ?? 0
    const currentPrice = item.product?.price ?? 0
    return sum + Math.max(0, (originalPrice - currentPrice) * item.quantity)
  }, 0)