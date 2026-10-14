import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import type { Language } from '@/i18n/translations'

// ─── Cart Store ───────────────────────────────────────────────────────────────

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

export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0)

export const selectCartSubtotal = (state: CartStore) =>
  state.items.reduce((sum, item) => (item.product?.price ?? 0) * item.quantity + sum, 0)

export const selectCartTotalSavings = (state: CartStore) =>
  state.items.reduce((sum, item) => {
    const originalPrice = item.product?.compare_at_price ?? item.product?.price ?? 0
    const currentPrice = item.product?.price ?? 0
    return sum + Math.max(0, (originalPrice - currentPrice) * item.quantity)
  }, 0)

export const useCartStore = create<CartStore>()(
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

if (typeof window !== 'undefined') {
  const handleOnline = () => useCartStore.getState().setOnlineStatus(true)
  const handleOffline = () => useCartStore.getState().setOnlineStatus(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  useCartStore.getState().setOnlineStatus(navigator.onLine)
}

// ─── UI Store ─────────────────────────────────────────────────────────────────

interface UiStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiStore>()(() => ({
  sidebarOpen: false,
  setSidebarOpen: (open: boolean) => { /* no-op, set via setSidebarOpen */ },
  toggleSidebar: () => { /* no-op, set via setSidebarOpen */ },
}))

// ─── Language Store ───────────────────────────────────────────────────────────

function applyDir(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.cookie = `lang=${lang}; path=/; max-age=31536000`
  }
}

function getInitialLang(): Language {
  if (typeof document === 'undefined') return 'sw'
  const htmlLang = document.documentElement.lang
  return (htmlLang === 'ar' || htmlLang === 'en' || htmlLang === 'fr') ? htmlLang : 'sw'
}

interface LangStore {
  lang: Language
  setLang: (lang: Language) => void
}

export const useLangStore = create<LangStore>()(() => ({
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

// ─── Theme Store ──────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.cookie = `theme=${theme}; path=/; max-age=31536000`
  }
}

interface ThemeStore {
  theme: Theme
  highContrast: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleHighContrast: () => void
}

export const useThemeStore = create<ThemeStore>()(() => ({
  theme: (() => {
    if (typeof document === 'undefined') return 'light'
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })(),
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