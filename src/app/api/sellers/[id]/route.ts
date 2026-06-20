import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('sellers')
    .select('*, profile:profiles(full_name, created_at)')
    .eq('store_slug', params.id)
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const { data: seller } = await supabase.from('sellers').select('user_id').eq('id', params.id).single()

  const isOwner = seller?.user_id === user.id
  const isAdmin = profile?.role === 'admin'
  if (!isOwner && !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Only admins can change status / commission_rate / is_featured
  if (!isAdmin) {
    delete body.status
    delete body.commission_rate
    delete body.is_featured
    delete body.verified_at
  }

  const { data, error } = await supabase
    .from('sellers')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })

  // Notify on status change by admin
  if (isAdmin && body.status) {
    const messages: Record<string, { en: string; sw: string }> = {
      approved:  { en: 'Your seller account has been approved!', sw: 'Akaunti yako ya muuzaji imeidhinishwa!' },
      suspended: { en: 'Your seller account has been suspended', sw: 'Akaunti yako ya muuzaji imesimamishwa' },
    }
    const msg = messages[body.status]
    if (msg) {
      await supabase.from('notifications').insert({
        user_id: data.user_id,
        type: body.status === 'approved' ? 'seller_approved' : 'seller_suspended',
        title_en: msg.en, title_sw: msg.sw,
        body_en: msg.en, body_sw: msg.sw,
        link: '/seller/dashboard',
      })
    }
  }

  return NextResponse.json({ data, error: null })
}
