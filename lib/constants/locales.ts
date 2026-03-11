/**
 * i18n / locale constants.
 * Single source of truth for supported languages, default locale, and cookie name.
 */
export const LOCALES = ["es", "en"] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = "es"
export const LOCALE_COOKIE = "NEXT_LOCALE"
