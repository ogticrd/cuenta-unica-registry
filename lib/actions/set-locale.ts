"use server"

import { cookies } from "next/headers"

const SUPPORTED_LOCALES = ["es", "en"] as const
type Locale = typeof SUPPORTED_LOCALES[number]

export async function setLocale(locale: Locale) {
    const cookieStore = await cookies()
    cookieStore.set("NEXT_LOCALE", locale, {
        path: "/",
        maxAge: 31536000, // 1 year
        sameSite: "lax",
    })
}
