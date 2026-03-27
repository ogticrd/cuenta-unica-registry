"use client";

import { useLocale as useNextIntlLocale, useTranslations } from "next-intl";

/**
 * Abstraction hook for translations.
 *
 * Usage:
 *   const t = useT("login")
 *   t("card_title")
 *
 * If the i18n library changes in the future, only this file needs updating.
 */
export function useT(namespace: string) {
  return useTranslations(namespace);
}

/**
 * Abstraction hook for reading the current locale.
 *
 * Usage:
 *   const locale = useLocale() // "es" | "en"
 */
export function useLocale() {
  return useNextIntlLocale();
}
