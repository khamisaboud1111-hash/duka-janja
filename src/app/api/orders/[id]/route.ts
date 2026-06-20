import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import type { OrderStatus } from '@/types'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select(`*, items:order_items(*, product:products(*, images:product_images(*))), tracking:order_tracking(*)`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 404 })

  // Verify access: buyer, seller of item, or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isOwner = data.buyer_id === user.id
  const isAdmin = profile?.role === 'admin'

  if (!isOwner && !isAdmin) {
    const { data: sellerCheck } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
    const isSellerOfItem = data.items?.some((item: any) => item.seller_id === sellerCheck?.id)
    if (!isSellerOfItem) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data, error: null })
}

const NEXT_STATUS: Record<string, OrderStatus> = {
  pending: 'confirmed', confirmed: 'packed', packed: 'out_for_delivery', out_for_delivery: 'delivered',
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { status, note } = await req.json() as { status: OrderStatus; note?: string }

  // Verify the requester is a seller of an item in this order, or admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    const { data: seller } = await supabase.from('sellers').select('id').eq('user_id', user.id).single()
    const { data: items } = await supabase.from('order_items').select('seller_id').eq('order_id', params.id)
    const owns = items?.some((i) => i.seller_id === seller?.id)
    if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: order, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error || !order) return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 400 })

  await supabase.from('order_tracking').insert({
    order_id: params.id, status, note: note ?? null, created_by: user.id,
  })

  // Notify buyer
  const statusMessages: Record<string, { en: string; sw: string }> = {
    confirmed:        { en: 'Your order has been confirmed', sw: 'Agizo lako limethibitishwa' },
    packed:           { en: 'Your order has been packed',     sw: 'Agizo lako limefungashwa' },
    out_for_delivery: { en: 'Your order is out for delivery',  sw: 'Agizo lako linasafirishwa' },
    delivered:        { en: 'Your order has been delivered',   sw: 'Agizo lako limefikishwa' },
    cancelled:        { en: 'Your order has been cancelled',   sw: 'Agizo lako limefutwa' },
  }
  const msg = statusMessages[status]
  if (msg) {
    await supabase.from('notifications').insert({
      user_id: order.buyer_id,
      type: `order_${status}`,
      title_en: msg.en, title_sw: msg.sw,
      body_en: `Order #${params.id.slice(-8).toUpperCase()}: ${msg.en}`,
      body_sw: `Agizo #${params.id.slice(-8).toUpperCase()}: ${msg.sw}`,
      link: `/orders/${params.id}`,
    })
  }

  return NextResponse.json({ data: order, error: null })
}
