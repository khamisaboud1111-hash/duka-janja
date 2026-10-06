'use client'

import { Mic, MicOff, Loader2, AlertCircle } from 'lucide-react'
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
  const { isListening, isSupported, startListening, stopListening, error, permissionDenied } = useVoiceSearch({
    onResult: onTranscript,
  })

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
        className={cn(
          'flex items-center justify-center rounded-xl border-2 bg-ink-100 dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-400 dark:text-ink-500 cursor-not-allowed opacity-50',
          'min-w-[44px] min-h-[44px]',
          sizeClasses[size],
          className
        )}
        title={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
      >
        <MicOff className="w-4 h-4" />
      </button>
    )
  }

  if (permissionDenied) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa' : 'Microphone permission denied'}
        className={cn(
          'flex items-center justify-center rounded-xl border-2 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 cursor-not-allowed',
          'min-w-[44px] min-h-[44px]',
          sizeClasses[size],
          className
        )}
        title={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa. Weka ruhusa kwenye mipangilio ya kivinjari.' : 'Microphone permission denied. Enable in browser settings.'}
      >
        <AlertCircle className="w-4 h-4" />
      </button>
    )
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
          : error
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
            : 'bg-white dark:bg-ink-800 border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300 hover:border-brand-300 hover:text-brand-600',
        sizeClasses[size],
        className
      )}
      title={error || undefined}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : error ? <AlertCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}

// Inline variant for search bar
export function VoiceSearchInline({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { lang } = useLangStore()
  const { isListening, isSupported, startListening, stopListening, error, permissionDenied } = useVoiceSearch({
    onResult: onTranscript,
  })

  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
        className={cn(
          'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
          'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-500 cursor-not-allowed opacity-50'
        )}
        title={lang === 'sw' ? 'Tafuta kwa sauti haipatikani kwenye kivinjari hiki' : 'Voice search not supported in this browser'}
      >
        <MicOff className="w-4 h-4" />
      </button>
    )
  }

  if (permissionDenied) {
    return (
      <button
        type="button"
        disabled
        aria-label={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa' : 'Microphone permission denied'}
        className={cn(
          'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
          'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 cursor-not-allowed'
        )}
        title={lang === 'sw' ? 'Ruhusa ya sauti imekataliwa. Weka ruhusa kwenye mipangilio ya kivinjari.' : 'Microphone permission denied. Enable in browser settings.'}
      >
        <AlertCircle className="w-4 h-4" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={cn(
        'p-2 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center',
        isListening ? 'bg-red-50 dark:bg-red-950/30 text-red-600 animate-pulse' : error ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600' : 'text-ink-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20'
      )}
      aria-label={lang === 'sw' ? 'Sauti' : 'Voice'}
      title={error || undefined}
    >
      {isListening ? <Loader2 className="w-4 h-4 animate-spin" /> : error ? <AlertCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  )
}
