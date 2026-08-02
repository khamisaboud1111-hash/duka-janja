import { en, type TranslationKey } from './dictionaries/en'
import { sw } from './dictionaries/sw'
import { ar } from './dictionaries/ar'
import { fr } from './dictionaries/fr'

export type Language = 'en' | 'sw' | 'ar' | 'fr'

export const translations = { en, sw, ar, fr } as const

export type { TranslationKey }

export function t(key: TranslationKey, lang: Language): string {
  return (translations[lang] as Record<TranslationKey, string>)[key] ?? translations.en[key] ?? key
}
