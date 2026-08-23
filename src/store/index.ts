import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import type { Language } from '@/i18n/translations'

// ─── Helpers ────────────────────────────────────────────────────────────────────

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'sw'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('sw')) return 'sw'
  if (lang.startsWith('ar')) return 'ar'
  if (lang.startsWith('fr')) return 'fr'
  return 'en'
}

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

// Selector functions — use these instead of store methods
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
        // In a real app, this would sync with server
        // For now, cart is already persisted in localStorage
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
            seller_id: product.seller_id,
            seller: product.seller ? { store_name: product.seller.store_name } : undefined,
          },
          quantity,
        })),
      }),
    }
  )
)

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  const handleOnline = () => useCartStore.getState().setOnlineStatus(true)
  const handleOffline = () => useCartStore.getState().setOnlineStatus(false)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  useCartStore.getState().setOnlineStatus(navigator.onLine)
}

// ─── UI Store (mobile sidebar drawer) ─────────────────────────────────────────

interface UiStore {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUiStore = create<UiStore>()((set) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))

// ─── Language Store ───────────────────────────────────────────────────────────

function applyDir(lang: Language) {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.cookie = `lang=${lang}; path=/; max-age=31536000`
  }
}

interface LangStore {
  lang: Language
  setLang: (lang: Language) => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: detectLanguage(),
      setLang: (lang) => {
        applyDir(lang)
        set({ lang })
      },
    }),
    {
      name: 'duka-janja-lang',
      partialize: (state) => ({ lang: state.lang }),
      onRehydrateStorage: () => (state) => {
        if (state) applyDir(state.lang)
      },
    }
  )
)

// ─── Theme Store (dark / light mode) ──────────────────────────────────────────

export type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  hasHydrated: boolean
  highContrast: boolean
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  toggleHighContrast: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      hasHydrated: false,
      highContrast: false,
      toggleTheme: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light'
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark')
        }
        set({ theme: next })
      },
      setTheme: (theme) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark')
        }
        set({ theme })
      },
      toggleHighContrast: () => {
        const next = !get().highContrast
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('high-contrast', next)
        }
        set({ highContrast: next })
      },
    }),
    {
      name: 'duka-janja-theme',
      partialize: (state) => ({ theme: state.theme, highContrast: state.highContrast }),
      onRehydrateStorage: () => (state) => {
        state?.setTheme(state.theme)
        useThemeStore.setState({ hasHydrated: true })
      },
    }
  )
)
