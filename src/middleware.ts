import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SELLER_ROUTES = ['/seller']
const ADMIN_ROUTES = ['/admin']
const PROTECTED_ROUTES = ['/orders', '/wishlist', '/notifications', '/checkout']

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          res.cookies.set(name, '', { ...options, maxAge: 0 })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  const isSellerRoute = SELLER_ROUTES.some((r) => path.startsWith(r))
  const isAdminRoute  = ADMIN_ROUTES.some((r) => path.startsWith(r))
  const isProtected   = PROTECTED_ROUTES.some((r) => path.startsWith(r))

  if ((isSellerRoute || isAdminRoute || isProtected) && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && session) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*', '/orders/:path*', '/wishlist/:path*', '/notifications/:path*', '/checkout/:path*'],
}
