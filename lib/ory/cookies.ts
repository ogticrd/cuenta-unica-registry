/**
 * Helper utilities for forwarding cookies between
 * the browser → Next.js Route Handlers → Ory.
 */

import { headers } from "next/headers"

/**
 * Extract the cookie header from the incoming Next.js request.
 * Used to forward browser cookies to Ory server-side calls.
 */
export async function getServerCookies(): Promise<string> {
    const headersList = await headers()
    return headersList.get("cookie") || ""
}

/**
 * Extract all Set-Cookie headers from an Axios response
 * and return them as an array of strings.
 */
export function extractSetCookieHeaders(
    axiosResponse: { headers: Record<string, unknown> }
): string[] {
    const setCookie = axiosResponse.headers["set-cookie"]
    if (!setCookie) return []
    if (Array.isArray(setCookie)) return setCookie as string[]
    return [setCookie as string]
}

function parseCookiePairs(cookieHeader: string): Map<string, string> {
    const pairs = new Map<string, string>()

    for (const segment of cookieHeader.split(";")) {
        const trimmedSegment = segment.trim()
        if (!trimmedSegment) continue

        const separatorIndex = trimmedSegment.indexOf("=")
        if (separatorIndex === -1) continue

        const name = trimmedSegment.slice(0, separatorIndex).trim()
        const value = trimmedSegment.slice(separatorIndex + 1).trim()

        if (name) {
            pairs.set(name, value)
        }
    }

    return pairs
}

export function mergeCookieHeaders(
    baseCookieHeader: string,
    setCookies: string[]
): string {
    const mergedCookies = parseCookiePairs(baseCookieHeader)

    for (const setCookie of setCookies) {
        const cookiePair = setCookie.split(";")[0]?.trim()
        if (!cookiePair) continue

        const separatorIndex = cookiePair.indexOf("=")
        if (separatorIndex === -1) continue

        const name = cookiePair.slice(0, separatorIndex).trim()
        const value = cookiePair.slice(separatorIndex + 1).trim()

        if (name) {
            mergedCookies.set(name, value)
        }
    }

    return Array.from(mergedCookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ")
}
