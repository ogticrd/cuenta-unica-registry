import "server-only";

import { cookies } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  type Locale,
} from "@/lib/constants/locales";

export function normalizeServerLocale(locale: string | undefined): Locale {
  return LOCALES.includes(locale as Locale)
    ? (locale as Locale)
    : DEFAULT_LOCALE;
}

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  return normalizeServerLocale(cookieStore.get(LOCALE_COOKIE)?.value);
}
