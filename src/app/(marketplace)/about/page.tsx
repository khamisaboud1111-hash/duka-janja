import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { Store, ShoppingBag, Package, Users, MapPin, Award, Globe } from "lucide-react";
import { createServerClient } from "@/lib/supabase/server";
import LText from "@/components/shared/LText";

async function getStats() {
  try {
    const supabase = createServerClient();
    const [sellersRes, productsRes, ordersRes, ridersRes] = await Promise.all([
      supabase.from("sellers").select("id", { count: "exact", head: true }).eq("status", "approved"),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "rider"),
    ]);
    return {
      sellers: sellersRes.count ?? 0,
      products: productsRes.count ?? 0,
      orders: ordersRes.count ?? 0,
      riders: ridersRes.count ?? 0,
    };
  } catch {
    return { sellers: 0, products: 0, orders: 0, riders: 0 };
  }
}

const values = [
  { icon: Store, title: "value1", desc: "value1Desc", color: "from-brand-500 to-teal-400" },
  { icon: Award, title: "value2", desc: "value2Desc", color: "from-amber-500 to-orange-400" },
  { icon: ShoppingBag, title: "value3", desc: "value3Desc", color: "from-purple-500 to-pink-400" },
  { icon: Users, title: "value4", desc: "value4Desc", color: "from-emerald-500 to-teal-400" },
];

export default async function AboutPage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen pb-20 sm:pb-8">
      <div className="page-container py-8 sm:py-12">
        {/* Hero Section */}
        <section className="text-center mb-16 sm:mb-24 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-4">
            <Globe className="w-3.5 h-3.5" />
            <LText k="about" />
          </span>

          <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-ink-900 dark:text-white leading-tight mb-4">
            <LText k="aboutTitle" />
          </h1>

          <p className="text-ink-500 dark:text-ink-300 text-sm sm:text-base max-w-2xl mx-auto">
            <LText k="aboutSubtitle" />
          </p>
        </section>

        {/* Stats */}
        <section className="mb-16 sm:mb-20">
          <div className="text-center mb-8">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white mb-2">
              <LText k="aboutStatsTitle" />
            </h2>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              Numbers that tell our story
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="card p-6 text-center group animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/25">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="font-display font-black text-3xl text-brand-600 dark:text-brand-400 mb-1">
                {stats.products.toLocaleString()}+
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                <LText k="aboutStatProducts" />
              </p>
            </div>

            <div className="card p-6 text-center group animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/25">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="font-display font-black text-3xl text-amber-600 dark:text-amber-400 mb-1">
                {stats.sellers.toLocaleString()}+
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                <LText k="aboutStatSellers" />
              </p>
            </div>

            <div className="card p-6 text-center group animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/25">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <div className="font-display font-black text-3xl text-purple-600 dark:text-purple-400 mb-1">
                {stats.orders.toLocaleString()}+
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                <LText k="aboutStatOrders" />
              </p>
            </div>

            <div className="card p-6 text-center group animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/25">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="font-display font-black text-3xl text-emerald-600 dark:text-emerald-400 mb-1">
                {stats.riders.toLocaleString()}+
              </div>
              <p className="text-xs text-ink-500 dark:text-ink-400 uppercase tracking-wider">
                <LText k="aboutStatRiders" />
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 items-center">
            <div className="space-y-5">
              <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white">
                <LText k="aboutOurStory" />
              </h2>
              <p className="text-ink-600 dark:text-ink-300 leading-relaxed">
                <LText k="aboutStoryDesc" />
              </p>
            </div>
            <div className="relative">
              <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-brand-500/20 to-amber-500/20 border border-white/20 dark:border-white/5 h-64">
                <Image
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1600&auto=format&fit=crop"
                  alt="Duka Janja story"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-ink-900 rounded-2xl p-5 shadow-2xl border border-white/20 dark:border-white/5 animate-float-slow">
                <p className="text-2xl font-black text-brand-600 dark:text-brand-400">Zanzibar</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">Since 2023</p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white mb-3">
              <LText k="aboutMission" />
            </h2>
            <p className="text-ink-500 dark:text-ink-300 max-w-2xl mx-auto">
              <LText k="aboutMissionDesc" />
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white mb-3">
              <LText k="aboutValues" />
            </h2>
            <p className="text-ink-500 dark:text-ink-300 max-w-2xl mx-auto">
              The principles that guide everything we build
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {values.map((value, i) => (
              <div
                key={i}
                className="card p-6 text-center group relative overflow-hidden animate-fade-up"
                style={{ animationDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}
                >
                  <value.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900 dark:text-white mb-2">
                  <LText k={value.title} />
                </h3>
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  <LText k={value.desc} />
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-br from-brand-500 via-brand-600 to-amber-500 rounded-3xl p-8 sm:p-12 mb-6 animate-gradient-pan">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white mb-3">
            <LText k="aboutTeam" />
          </h2>
          <p className="text-white/85 text-sm sm:text-base max-w-md mx-auto mb-6">
            <LText k="aboutTeamDesc" />
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 active:scale-95"
          >
            <LText k="startShopping" />
          </Link>
        </section>
      </div>
    </main>
  );
}
