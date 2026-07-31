import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Footer from '@/components/layout/Footer'
import { createServerClient } from '@/lib/supabase/server'

export default async function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order')

  return (
    <>
      <Navbar categories={categories ?? []} />
      <Sidebar />
      <MobileBottomNav />
      <div className="min-h-screen lg:pl-16 pb-16 lg:pb-0">{children}</div>
      <Footer />
    </>
  )
}
