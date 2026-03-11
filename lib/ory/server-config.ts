import "server-only"

import { cookies } from "next/headers"
import { getOryConfig } from "@/ory.config"
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/constants/locales"

function normalizeLocale(locale: string | undefined): Locale {
  return LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE
}

export async function getServerOryConfig() {
  const cookieStore = await cookies()
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value)
  return getOryConfig(locale)
}
