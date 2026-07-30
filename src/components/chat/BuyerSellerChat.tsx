'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/utils'
import type { ChatMessage } from '@/hooks/useChat'

interface BuyerSellerChatProps {
  messages: ChatMessage[]
  currentUserId: string
  otherPartyName: string
  loading: boolean
  sending: boolean
  onSend: (body: string) => Promise<void>
  onMarkRead: () => void
}

export default function BuyerSellerChat({
  messages,
  currentUserId,
  otherPartyName,
  loading,
  sending,
  onSend,
  onMarkRead,
}: BuyerSellerChatProps) {
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    onMarkRead()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length])

  async function handleSend() {
    if (!draft.trim()) return
    const body = draft
    setDraft('')
    await onSend(body)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-card overflow-hidden border border-ink-100">
      <div className="px-4 py-3 border-b border-ink-100 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
          {otherPartyName.charAt(0).toUpperCase()}
        </div>
        <p className="font-semibold text-ink-900 text-sm truncate">{otherPartyName}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[280px] max-h-[55vh]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-ink-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-ink-400 mt-8">Anza mazungumzo na {otherPartyName}</p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId
            return (
              <div key={m.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[78%] px-3.5 py-2 rounded-2xl text-sm',
                    isMine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-ink-100 text-ink-800 rounded-bl-sm'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div className={cn('flex items-center gap-1 mt-1', isMine ? 'justify-end text-brand-100' : 'justify-start text-ink-400')}>
                    <span className="text-[10px]">{relativeTime(m.created_at)}</span>
                    {isMine && m.read_at && <span className="text-[10px]">✓✓</span>}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-ink-100 p-3 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="Andika ujumbe..."
          className="input flex-1 text-sm py-2.5"
          maxLength={2000}
        />
        <button
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-brand-600 transition-colors flex-shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'sasa hivi'
  if (mins < 60) return `dakika ${mins}`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `saa ${hours}`
  const days = Math.floor(hours / 24)
  if (days < 7) return `siku ${days}`
  return new Date(iso).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })
}
