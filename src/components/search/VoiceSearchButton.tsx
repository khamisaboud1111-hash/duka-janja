'use client'

import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceSearch } from '@/hooks/useVoiceSearch'
import { useLangStore } from '@/store'
import { cn } from '@/utils'

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function VoiceSearchButton({ onTranscript, className, size = 'md' }: VoiceSearchButtonProps) {
  const { lang } = useLangStore()
  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: onTranscript,
  })

  if (!isSupported) return null

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      aria-label={isListening ? (lang === 'sw' ? 'Acha kusikiliza' : 'Stop listening') : (lang === 'sw' ? 'Tafuta kwa sauti' : 'Voice search')}
      aria-pressed={isListening}
      className={cn(
        'flex items-center justify-center rounded-xl border-2 transition-all',
        'min-w-[44px] min-h-[44px]', // WCAG touch target
        isListening
          ? 'bg-red-500 border-red-500 text-white animate-pulse shadow-lg shadow-red-500/25'
          : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300 hover:text-brand-600',
        sizeClasses[size],
        className
      )}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}

// Inline variant for search bar
export function VoiceSearchInline({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { lang } = useLangStore()
  const { isListening, isSupported, startListening, stopListening } = useVoiceSearch({
    onResult: onTranscript,
  })

  if (!isSupported) return null

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={cn(
        'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
        isListening ? 'bg-red-50 dark:bg-red-950/30 text-red-600 animate-pulse' : 'text-ink-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20'
      )}
      aria-label={lang === 'sw' ? 'Sauti' : 'Voice'}
    >
      {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}
