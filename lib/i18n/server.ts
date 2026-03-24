import { getTranslations, getLocale } from "next-intl/server";

export async function getT(namespace: string) {
  return getTranslations(namespace);
}

export async function getCurrentLocale() {
  return getLocale();
}
