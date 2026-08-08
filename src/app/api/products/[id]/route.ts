import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { z } from 'zod'

const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  price: z.number().positive().int().optional(),
  compare_at_price: z.number().positive().int().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  category_id: z.string().uuid().optional(),
  images: z.array(z.object({ url: z.string().url(), is_primary: z.boolean().default(false) })).optional(),
  sku: z.string().max(100).optional(),
}).strict()

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('products')
    .select(`*, seller:sellers(*), category:categories(*), images:product_images(*), reviews(*, buyer:profiles(full_name, avatar_url))`)
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 404 })
  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: product } = await supabase.from('products').select('seller_id, sellers(user_id)').eq('id', params.id).single()
  const sellerUserId = (product as any)?.sellers?.user_id
  if (sellerUserId !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.issues }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('products')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: product } = await supabase.from('products').select('seller_id, sellers(user_id)').eq('id', params.id).single()
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const sellerUserId = (product as any)?.sellers?.user_id
  if (sellerUserId !== user.id) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('products').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
