"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, Bell, User, Menu, X, Globe, Sparkles } from "lucide-react";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-foreground hover:bg-muted"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
                className="w-full bg-muted/50 border border-input rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-inner transition-all"
              />
              <Search className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
              <button 
                type="submit"
                className="absolute right-1.5 top-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick Actions & Navigation Shortcuts */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/wishlist" className="p-2.5 rounded-full hover:bg-muted text-foreground relative" aria-label="Wishlist">
              <Heart className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
            </Link>

            <Link href="/checkout" className="p-2.5 rounded-full hover:bg-muted text-foreground relative" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" />
            </Link>

            <Link href="/notifications" className="hidden sm:flex p-2.5 rounded-full hover:bg-muted text-foreground relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />
            </Link>

            <Link href="/settings" className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-full hover:bg-muted border border-border">
              <User className="w-5 h-5 text-primary" />
              <span className="hidden lg:inline text-xs font-medium">Account</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden glass-card border-b px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top duration-200">
          <form onSubmit={handleSearch} className="relative w-full mt-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-muted border border-input rounded-full py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Search className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
          </form>
          <div className="flex flex-col space-y-2 pt-2">
            <Link href="/" className="px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">Home</Link>
            <Link href="/search" className="px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">Explore Products</Link>
            <Link href="/orders" className="px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">My Orders</Link>
            <Link href="/notifications" className="px-3 py-2 rounded-lg hover:bg-muted text-sm font-medium">Notifications</Link>
          </div>
        </div>
      )}
    </header>
  );
}
