"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Bell, User, Menu, X, Sparkles } from "lucide-react";
import { useUiStore } from "@/store";

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

export default function Navbar({ categories = [] }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-ink-900 dark:text-white hover:bg-ink-100 dark:hover:bg-ink-800"
              aria-label="Toggle Menu"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                DUKA JANJA
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                <Sparkles className="w-3 h-3 mr-1" /> Ultimate
              </span>
            </Link>
          </div>

          {/* Search Bar Experience */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search millions of products, verified stores & brands..."
                className="w-full bg-ink-100/50 dark:bg-ink-800/50 border border-ink-200 dark:border-ink-700 rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-inner transition-all"
              />
              <Search className="absolute left-4 top-3 w-4 h-4 text-ink-400 dark:text-ink-500" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bg-brand-500 text-white px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Actions & Navigation Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/wishlist" className="p-2.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-900 dark:text-white relative" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full"></span>
            </Link>

            <Link href="/checkout" className="p-2.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-900 dark:text-white relative" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            <Link href="/notifications" className="hidden sm:flex p-2.5 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-900 dark:text-white relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Link>

            <Link href="/settings" className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-full hover:bg-ink-100 dark:hover:bg-ink-800 border border-ink-200 dark:border-ink-700">
              <User className="w-5 h-5 text-brand-500" />
              <span className="hidden lg:inline text-xs font-medium">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: Render category pills if provided */}
      {categories.length > 0 && (
        <div className="hidden lg:flex items-center gap-4 px-8 py-2 border-t border-ink-200/40 dark:border-ink-700/40 bg-ink-100/20 dark:bg-ink-800/20 text-xs overflow-x-auto">
          <span className="font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Categories:</span>
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

    </header>
  );
}
