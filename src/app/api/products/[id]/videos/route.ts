import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id: productId } = await params

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify product ownership
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify seller ownership
    const { data: seller } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!seller || seller.id !== product.seller_id) {
      return NextResponse.json({ error: 'Not authorized to upload videos for this product' }, { status: 403 })
    }

    // Parse form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const thumbnailFile = formData.get('thumbnail') as File | null
    const caption = formData.get('caption') as string | null
    const hashtags = formData.get('hashtags') as string | null
    const durationSeconds = parseInt(formData.get('duration') as string || '0')

    if (!videoFile) {
      return NextResponse.json({ error: 'Video file is required' }, { status: 400 })
    }

    // Validate video file
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    if (!allowedTypes.includes(videoFile.type)) {
      return NextResponse.json({ error: 'Invalid video format. Use MP4, WebM, MOV, or MKV' }, { status: 400 })
    }

    // Limit video size (50MB max)
    const maxSize = 50 * 1024 * 1024
    if (videoFile.size > maxSize) {
      return NextResponse.json({ error: 'Video too large. Maximum 50MB' }, { status: 400 })
    }

    // Upload video to storage
    const videoPath = `product-videos/${productId}/${Date.now()}-${videoFile.name}`
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from('product-media')
      .upload(videoPath, videoFile, {
        contentType: videoFile.type,
        upsert: false
      })

    if (videoError) {
      console.error('Video upload error:', videoError)
      return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 })
    }

    // Get video public URL
    const { data: { publicUrl: videoUrl } } = supabase.storage
      .from('product-media')
      .getPublicUrl(videoUpload.path)

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null
    if (thumbnailFile) {
      const allowedThumbTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (allowedThumbTypes.includes(thumbnailFile.type) && thumbnailFile.size <= 5 * 1024 * 1024) {
        const thumbPath = `product-videos/${productId}/thumbnails/${Date.now()}-${thumbnailFile.name}`
        const { data: thumbUpload } = await supabase.storage
          .from('product-media')
          .upload(thumbPath, thumbnailFile, { contentType: thumbnailFile.type, upsert: false })

        if (thumbUpload) {
          const { data: { publicUrl } } = supabase.storage
            .from('product-media')
            .getPublicUrl(thumbUpload.path)
          thumbnailUrl = publicUrl
        }
      }
    }

    // Parse hashtags
    const hashtagArray = hashtags
      ? hashtags.split(',').map(h => h.trim().replace(/^#/, '')).filter(Boolean)
      : []

    // Create video record
    const { data: video, error: videoRecordError } = await supabase
      .from('product_videos')
      .insert({
        product_id: productId,
        seller_id: seller.id,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        duration_seconds: durationSeconds,
        caption,
        hashtags: hashtagArray
      })
      .select()
      .single()

    if (videoRecordError) {
      console.error('Video record error:', videoRecordError)
      // Cleanup uploaded file
      await supabase.storage.from('product-media').remove([videoUpload.path])
      return NextResponse.json({ error: 'Failed to save video' }, { status: 500 })
    }

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Video upload API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const { id: productId } = await params

    const { data: videos, error } = await supabase
      .from('product_videos')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ videos: videos ?? [] })
  } catch (error) {
    console.error('Get videos error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}