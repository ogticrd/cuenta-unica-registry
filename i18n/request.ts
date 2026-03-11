import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { LOCALE_COOKIE, DEFAULT_LOCALE } from "@/lib/constants/locales"

export default getRequestConfig(async () => {
    // Read locale from cookie, fallback to DEFAULT_LOCALE
    const cookieStore = await cookies()
    const locale = cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    }
})

