import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { LOCALE_COOKIE, DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants/locales"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeFromCookie = cookieStore.get(LOCALE_COOKIE)?.value

  const locale: Locale = LOCALES.includes(localeFromCookie as Locale)
    ? (localeFromCookie as Locale)
    : DEFAULT_LOCALE

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
