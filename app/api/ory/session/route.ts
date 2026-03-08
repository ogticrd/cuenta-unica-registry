import { NextResponse } from "next/server"
import { oryClient } from "@/lib/ory/client"
import { getServerCookies } from "@/lib/ory/cookies"

/**
 * GET /api/ory/session
 *
 * Returns the current Ory session (whoami).
 * Forwards browser cookies to Ory server-side.
 *
 * Response:
 *   { isAuthenticated: true, identity: { id, traits } }
 *   or
 *   { isAuthenticated: false }
 */
export async function GET() {
    try {
        const cookie = await getServerCookies()

        const { data: session } = await oryClient.toSession({
            cookie,
        })

        return NextResponse.json({
            isAuthenticated: true,
            identity: {
                id: session.identity?.id,
                traits: session.identity?.traits,
                schema_id: session.identity?.schema_id,
            },
            session_id: session.id,
            expires_at: session.expires_at,
        })
    } catch (error: unknown) {
        // 401/403 means no valid session — not an error, just unauthenticated
        const status =
            error && typeof error === "object" && "response" in error
                ? (error as { response?: { status?: number } }).response?.status
                : undefined

        if (status === 401 || status === 403) {
            return NextResponse.json({ isAuthenticated: false }, { status: 200 })
        }

        console.error("[/api/ory/session] Error fetching session:", error)
        return NextResponse.json(
            { isAuthenticated: false, error: "Failed to fetch session" },
            { status: 500 }
        )
    }
}
