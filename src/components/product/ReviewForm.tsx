'use client'

import { useState } from 'react'
import { StarRating } from '@/components/ui/StarRating'
import { submitReview } from '@/hooks/useReviews'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  orderId: string
  productName: string
  onSubmitted?: () => void
}

export default function ReviewForm({ productId, orderId, productName, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { toast.error('Chagua nyota angalau moja'); return }
    setSubmitting(true)
    const { error } = await submitReview({ productId, orderId, rating, comment: comment.trim() || undefined })
    if (error) toast.error(error)
    else {
      toast.success('Asante kwa maoni yako!')
      onSubmitted?.()
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4 space-y-3">
      <p className="font-semibold text-sm text-ink-800">{productName}</p>
      <div>
        <label className="label">Ukadiriaji</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>
      <div>
        <label className="label">Maoni (hiari)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="input resize-none"
          placeholder="Eleza uzoefu wako na bidhaa hii..."
        />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary w-full justify-center">
        {submitting ? 'Inatuma...' : 'Tuma maoni'}
      </button>
    </form>
  )
}
