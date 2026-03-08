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
