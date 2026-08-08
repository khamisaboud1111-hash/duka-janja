import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '@/types'
import type { Language } from '@/i18n/translations'

// ─── Cart Store ───────────────────────────────────────────────────────────────

interface CartStore {
  items: CartItem[]
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
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
    // Arabic reads right-to-left; every other language is left-to-right.
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
      lang: 'sw',
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
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

// The server always renders `theme: 'light'` (it has no access to
// localStorage). If the persisted value on the client is 'dark', zustand's
// persist middleware rehydrates it right after the store is created —
// before Navbar's first paint — so the icon React renders on the client
// no longer matches what the server sent down. React then throws a
// hydration-mismatch error the moment that component re-renders (e.g. on
// the dark-mode click itself). `hasHydrated` lets consumers hold off on
// theme-dependent UI for one tick until client and server agree.
export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: 'light',
      hasHydrated: false,
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
    }),
    {
      name: 'duka-janja-theme',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        state?.setTheme(state.theme)
        useThemeStore.setState({ hasHydrated: true })
      },
    }
  )
)
