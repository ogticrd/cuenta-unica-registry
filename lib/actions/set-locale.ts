"use server"

import { cookies } from "next/headers"
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/lib/constants/locales"

export async function setLocale(locale: Locale) {
    const cookieStore = await cookies()
    cookieStore.set(LOCALE_COOKIE, locale, {
        path: "/",
        maxAge: 31536000, // 1 year
        sameSite: "lax",
    })
}
