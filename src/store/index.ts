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
  itemCount: () => number
  subtotal: () => number
}

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

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    { name: 'duka-janja-cart' }
  )
)

// ─── Language Store ───────────────────────────────────────────────────────────

interface LangStore {
  lang: Language
  setLang: (lang: Language) => void
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'sw',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'duka-janja-lang' }
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
      onRehydrateStorage: () => (state) => {
        state?.setTheme(state.theme)
        useThemeStore.setState({ hasHydrated: true })
      },
    }
  )
)
