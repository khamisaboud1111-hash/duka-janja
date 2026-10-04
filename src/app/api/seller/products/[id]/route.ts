import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('products')
      .select(`*, category:categories(name_sw, name_en), images:product_images(*), videos:product_videos(*)`)
      .eq('id', id)
      .eq('seller_id', seller.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ product: data }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Error loading product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('seller_id', seller.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 })
    }

    const body = await request.json()
    const { images, videos, ...updateData } = body

    // Update product
    const { data, error } = await supabase
      .from('products')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('seller_id', seller.id)
      .select()
      .single()

    if (error) throw error

    // Sync images if provided
    if (images !== undefined) {
      await supabase.from('product_images').delete().eq('product_id', id)
      if (images.length > 0) {
        const imageRows = images.map((url: string, i: number) => ({
          product_id: id,
          url,
          sort_order: i,
          is_primary: i === 0,
        }))
        const { error: imagesError } = await supabase.from('product_images').insert(imageRows)
        if (imagesError) throw imagesError
      }
    }

    // Sync videos if provided
    if (videos !== undefined) {
      await supabase.from('product_videos').delete().eq('product_id', id)
      if (videos.length > 0) {
        const videoRows = videos.map((url: string, i: number) => ({
          product_id: id,
          url,
          sort_order: i,
        }))
        const { error: videosError } = await supabase.from('product_videos').insert(videoRows)
        if (videosError) throw videosError
      }
    }

    return NextResponse.json({ product: data })
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id } = await params
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('seller_id', seller.id)
      .single()

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found or not authorized' }, { status: 404 })
    }

    // Delete related images and videos first
    await supabase.from('product_images').delete().eq('product_id', id)
    await supabase.from('product_videos').delete().eq('product_id', id)

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', seller.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}