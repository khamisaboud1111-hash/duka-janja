import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { DELIVERY_ZONES } from '@/utils'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('orders')
    .select(`*, items:order_items(*, product:products(name, images:product_images(*)))`)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

interface CreateOrderBody {
  items: Array<{ product_id: string; seller_id: string; quantity: number; unit_price: number }>
  delivery_zone: keyof typeof DELIVERY_ZONES
  delivery_address: string
  delivery_name: string
  delivery_phone: string
  payment_method: string
  payment_reference?: string
  notes?: string
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateOrderBody = await req.json()

  if (!body.items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

  // Verify stock availability
  for (const item of body.items) {
    const { data: product } = await supabase.from('products').select('stock_quantity, status').eq('id', item.product_id).single()
    if (!product || product.status !== 'active') {
      return NextResponse.json({ error: `Product ${item.product_id} is no longer available` }, { status: 400 })
    }
    if (product.stock_quantity < item.quantity) {
      return NextResponse.json({ error: `Insufficient stock for product ${item.product_id}` }, { status: 400 })
    }
  }

  const subtotal = body.items.reduce((s, i) => s + i.unit_price * i.quantity, 0)
  const deliveryFee = DELIVERY_ZONES[body.delivery_zone]?.fee ?? 0
  const commissionTotal = Math.round(subtotal * 0.05)
  const total = subtotal + deliveryFee

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      buyer_id: user.id,
      status: 'pending',
      subtotal,
      delivery_fee: deliveryFee,
      commission_amount: commissionTotal,
      total_amount: total,
      delivery_zone: body.delivery_zone,
      delivery_address: body.delivery_address,
      delivery_name: body.delivery_name,
      delivery_phone: body.delivery_phone,
      payment_method: body.payment_method,
      payment_reference: body.payment_reference ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message ?? 'Failed to create order' }, { status: 400 })
  }

  // Insert order items
  const orderItems = body.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
  }))
  await supabase.from('order_items').insert(orderItems)

  // Decrement stock for each product
  for (const item of body.items) {
    await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_quantity: item.quantity }).then(
      async (res) => {
        // Fallback if RPC doesn't exist: manual update
        if (res.error) {
          const { data: prod } = await supabase.from('products').select('stock_quantity, total_sold').eq('id', item.product_id).single()
          if (prod) {
            await supabase.from('products').update({
              stock_quantity: Math.max(0, prod.stock_quantity - item.quantity),
              total_sold: prod.total_sold + item.quantity,
            }).eq('id', item.product_id)
          }
        }
      }
    )
  }

  // Initial tracking event
  await supabase.from('order_tracking').insert({
    order_id: order.id, status: 'pending', note: 'Order received', created_by: user.id,
  })

  // Commission records per seller
  const sellerTotals: Record<string, number> = {}
  body.items.forEach((item) => {
    sellerTotals[item.seller_id] = (sellerTotals[item.seller_id] ?? 0) + item.unit_price * item.quantity
  })
  for (const [sellerId, amount] of Object.entries(sellerTotals)) {
    await supabase.from('commissions').insert({
      order_id: order.id,
      seller_id: sellerId,
      order_amount: amount,
      commission_rate: 5,
      commission_amount: Math.round(amount * 0.05),
    })

    // Notify seller
    const { data: seller } = await supabase.from('sellers').select('user_id').eq('id', sellerId).single()
    if (seller) {
      await supabase.from('notifications').insert({
        user_id: seller.user_id,
        type: 'order_placed',
        title_en: 'New order received',
        title_sw: 'Agizo jipya limepokelewa',
        body_en: `You have a new order worth ${amount} TZS.`,
        body_sw: `Una agizo jipya la TZS ${amount}.`,
        link: '/seller/orders',
      })
    }
  }

  return NextResponse.json({ data: order, error: null })
}
