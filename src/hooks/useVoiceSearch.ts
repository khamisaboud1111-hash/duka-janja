'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLangStore } from '@/store'

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown

interface VoiceSearchOptions {
  onResult: (transcript: string) => void
  lang?: string
}

export function useVoiceSearch({ onResult, lang }: VoiceSearchOptions) {
  const storeLang = useLangStore((s) => s.lang)
  const displayLang = lang || storeLang
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognitionCtor = (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition as unknown as new () => unknown

    setIsSupported(!!SpeechRecognitionCtor)

    if (!SpeechRecognitionCtor) return

    const recognition = new (SpeechRecognitionCtor as unknown as new () => unknown)() as unknown as { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: (e: unknown) => void; onerror: () => void; onend: () => void; start: () => void; stop: () => void; abort: () => void }
    // Use Swahili locale if available, fallback to en
    const locale = displayLang === 'sw' ? 'sw-TZ' : displayLang === 'ar' ? 'ar-SA' : displayLang === 'fr' ? 'fr-FR' : 'en-US'
    ;(recognition as unknown as { lang: string }).lang = locale
    ;(recognition as unknown as { continuous: boolean }).continuous = false
    ;(recognition as unknown as { interimResults: boolean }).interimResults = false
    ;(recognition as unknown as { maxAlternatives: number }).maxAlternatives = 1

    recognition.onresult = (event: unknown) => {
      const e = event as { results: Array<Array<{ transcript: string }>> }
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) onResult(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition

    return () => {
      try { recognitionRef.current?.abort() } catch {}
    }
  }, [onResult, displayLang])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return
    try {
      ;(recognitionRef.current as unknown as { start: () => void }).start()
      setIsListening(true)
    } catch {
      setIsListening(false)
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    try { (recognitionRef.current as unknown as { stop: () => void })?.stop() } catch {}
    setIsListening(false)
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}
