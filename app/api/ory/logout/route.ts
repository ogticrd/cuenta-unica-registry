import { NextResponse } from "next/server"
import { oryClient } from "@/lib/ory/client"
import { getServerCookies, extractSetCookieHeaders } from "@/lib/ory/cookies"
import { ROUTES } from "@/lib/constants/routes"

/**
 * POST /api/ory/logout
 *
 * Performs logout using Ory's self-service logout flow:
 * 1. Creates a logout flow (gets the logout URL/token)
 * 2. Calls the logout URL to invalidate the session
 * 3. Forwards Set-Cookie headers to clean up browser cookies
 *
 * Response:
 *   { success: true, redirect_to: string }
 */
export async function POST() {
    try {
        const cookie = await getServerCookies()

        // Step 1: Create a self-service logout flow for browser
        const { data: logoutFlow } = await oryClient.createBrowserLogoutFlow({
            cookie,
        })

        // Step 2: Perform the logout by calling the logout URL
        // The logout_url contains the token needed to invalidate the session
        const logoutToken = logoutFlow.logout_token

        const logoutResponse = await oryClient.updateLogoutFlow(
            {
                token: logoutToken,
            },
            {
                headers: {
                    Cookie: cookie,
                },
            }
        )

        // Step 3: Forward Set-Cookie headers from Ory to clean up browser cookies
        const response = NextResponse.json({
            success: true,
            redirect_to: ROUTES.login,
        })

        const setCookies = extractSetCookieHeaders(logoutResponse)
        for (const setCookie of setCookies) {
            response.headers.append("Set-Cookie", setCookie)
        }

        return response
    } catch (error: unknown) {
        console.error("[/api/ory/logout] Error during logout:", error)

        // If session is already expired/invalid, treat as success
        const status =
            error && typeof error === "object" && "response" in error
                ? (error as { response?: { status?: number } }).response?.status
                : undefined

        if (status === 401 || status === 403) {
            return NextResponse.json({
                success: true,
                redirect_to: ROUTES.login,
            })
        }

        return NextResponse.json(
            { success: false, error: "Failed to logout" },
            { status: 500 }
        )
    }
}
