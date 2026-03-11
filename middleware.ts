import { createOryMiddleware } from "@ory/nextjs/middleware"
import oryConfig from "@/ory.config"
import createMiddleware from "next-intl/middleware"
import { type NextRequest } from "next/server"
import { LOCALES, DEFAULT_LOCALE } from "@/lib/constants/locales"

const oryMiddleware = createOryMiddleware(oryConfig)

const intlMiddleware = createMiddleware({
    locales: LOCALES,
    defaultLocale: DEFAULT_LOCALE,
    localePrefix: "never",       // no /es/ or /en/ in URLs
    localeDetection: false,      // we rely solely on the NEXT_LOCALE cookie
})

export function middleware(request: NextRequest) {
    // Run Ory first (handles auth redirects), then next-intl (sets locale header)
    const oryResponse = oryMiddleware(request)
    if (oryResponse) return oryResponse
    return intlMiddleware(request)
}

export const config = {}

