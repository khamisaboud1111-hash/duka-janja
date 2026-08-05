"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  User,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  Store,
  Package,
  MessageSquare,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useUiStore, useLangStore, useThemeStore, useCartStore } from "@/store";
import { t } from "@/i18n/translations";
import { useNotifications } from "@/hooks/useNotifications";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { formatTZS, cn } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// Define the shape of individual category items
export interface Category {
  id: string | number;
  name: string;
  slug?: string;
  [key: string]: any;
}

// Define the TypeScript props interface including categories
interface NavbarProps {
  categories?: Category[];
}

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: { url: string; is_primary?: boolean } | null;
}

export default function Navbar({ categories = [] }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const lang = useLangStore((s) => s.lang);
  const theme = useThemeStore((s) => s.theme);
  const hasHydrated = useThemeStore((s) => s.hasHydrated);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const cartCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const { unreadCount } = useNotifications();
  const { profile, isAdmin, isSeller } = useUser();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Debounced command-palette-style search suggestions.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setSuggesting(false);
      setSuggestionsOpen(false);
      return;
    }
    setSuggesting(true);
    const handle = setTimeout(async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, images:product_images(url, is_primary)")
        .eq("status", "active")
        .ilike("name", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!error) setSuggestions((data ?? []) as Suggestion[]);
      setSuggesting(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [searchQuery, supabase]);

  // Close the suggestions panel when clicking outside the search box.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestionsOpen(false);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const primaryImage = (p: Suggestion) => p.image?.url ?? "";

  const themeIcon =
    hasHydrated && theme === "dark" ? (
      <Sun className="w-5 h-5" />
    ) : (
      <Moon className="w-5 h-5" />
    );

  const iconBtn =
    "p-2.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-900 dark:text-white relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <header className="sticky top-0 z-50 glass-card border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-ink-900 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label={t("toggleMenu", lang)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                DUKA JANJA
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3 h-3 mr-1" /> {t("ultimate", lang)}
              </span>
            </Link>
          </div>

          {/* Search Bar with live suggestions */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl mx-8 relative">
            <form onSubmit={handleSearch} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSuggestionsOpen(true)}
                placeholder={t("searchPlaceholder", lang)}
                aria-label={t("searchPlaceholder", lang)}
                className="w-full bg-ink-100/50 dark:bg-ink-800/50 border border-ink-200 dark:border-ink-700 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner transition-all"
              />
              <Search className="absolute left-4 top-3 w-4 h-4 text-ink-400 dark:text-ink-500" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bg-brand-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {t("searchButton", lang)}
              </button>
            </form>

            {suggestionsOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("products", lang)}
                </div>
                {suggesting ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">{t("searching", lang)}</div>
                ) : suggestions.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-muted-foreground">{t("noResults", lang)}</div>
                ) : (
                  <ul className="max-h-80 overflow-y-auto">
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/products/${p.slug}`}
                          onClick={() => setSuggestionsOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                        >
                          {primaryImage(p) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={primaryImage(p)}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-muted"
                            />
                          ) : (
                            <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">📦</span>
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm text-foreground truncate">{p.name}</span>
                          </span>
                          <span className="text-sm font-semibold text-foreground">{formatTZS(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/search?q=${encodeURIComponent(searchQuery)}`}
                  onClick={() => setSuggestionsOpen(false)}
                  className="block border-t border-border px-4 py-2.5 text-xs font-medium text-brand-600 dark:text-brand-300 hover:bg-muted transition-colors"
                >
                  {t("seeAll", lang)} →
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions & Navigation Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/wishlist" className={iconBtn} aria-label={t("wishlist", lang)}>
              <Heart className="w-5 h-5" />
            </Link>

            <Link href="/checkout" className={iconBtn} aria-label={t("cart", lang)}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <Link href="/notifications" className={cn(iconBtn, "hidden sm:flex")} aria-label={t("notifications", lang)}>
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            <button onClick={toggleTheme} className={iconBtn} aria-label={t("theme", lang)} title={t("theme", lang)}>
              {themeIcon}
            </button>

            {/* Account dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 border border-ink-200 dark:border-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t("account", lang)}>
                <User className="w-5 h-5 text-brand-500" />
                <span className="hidden lg:inline text-xs font-medium">{t("account", lang)}</span>
                <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-ink-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {profile ? (
                  <>
                    <DropdownMenuLabel>
                      <span className="block text-sm font-semibold">{profile.full_name || profile.email || t("account", lang)}</span>
                      <span className="block text-xs font-normal text-muted-foreground capitalize">{profile.role}</span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isSeller && (
                      <DropdownMenuItem asChild>
                        <Link href="/seller/dashboard"><Store className="mr-2 h-4 w-4" /> {t("sellerDashboard", lang)}</Link>
                      </DropdownMenuItem>
                    )}
                    {profile.role === "rider" && (
                      <DropdownMenuItem asChild>
                        <Link href="/rider/dashboard"><Package className="mr-2 h-4 w-4" /> {t("riderDashboard", lang)}</Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard"><ShieldCheck className="mr-2 h-4 w-4" /> {t("adminDashboard", lang)}</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/orders"><ShoppingCart className="mr-2 h-4 w-4" /> {t("orders", lang)}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/messages"><MessageSquare className="mr-2 h-4 w-4" /> {t("messages", lang)}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings"><User className="mr-2 h-4 w-4" /> {t("profile", lang)}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={async (e) => {
                      e.preventDefault()
                      await supabase.auth.signOut()
                      router.push("/login")
                    }}>
                      <LogOut className="mr-2 h-4 w-4" /> {t("logout", lang)}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login"><User className="mr-2 h-4 w-4" /> {t("login", lang)}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register"><Sparkles className="mr-2 h-4 w-4" /> {t("register", lang)}</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Category row (desktop) */}
        {categories.length > 0 && (
          <div className="hidden lg:flex items-center gap-4 px-8 py-2 border-t border-ink-200/40 dark:border-ink-700/40 bg-ink-100/20 dark:bg-ink-800/20 text-xs overflow-x-auto">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1 font-semibold text-ink-700 dark:text-ink-200 hover:text-brand-600 dark:hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded" aria-label={t("categories", lang)}>
                {t("categories", lang)}
                <ChevronDown className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/search">{t("allProducts", lang)}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.id} asChild>
                    <Link href={`/category/${cat.slug || cat.id}`}>{cat.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">{t("categoriesLabel", lang)}</span>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug || cat.id}`}
                className="hover:text-brand-500 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
