import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import { createServerClient } from '@/lib/supabase/server'

// Rider routes had no layout at all before this — meaning /rider/dashboard
// rendered under the bare root layout with no navbar, no sidebar, no way
// back to anything else in the app except the browser's back button. This
// mirrors the (marketplace) layout so riders get the same navigation shell
// everyone else does.
export default async function RiderLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order')

  return (
    <>
      <Navbar categories={categories ?? []} />
      <Sidebar />
      <div className="min-h-screen lg:pl-16 pb-20 sm:pb-8 bg-ink-50/50 dark:bg-ink-950">{children}</div>
    </>
  )
}
