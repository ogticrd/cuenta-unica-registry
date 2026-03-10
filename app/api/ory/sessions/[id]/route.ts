import { NextResponse } from "next/server"
import { oryClient } from "@/lib/ory/client"
import { getServerCookies } from "@/lib/ory/cookies"

/**
 * DELETE /api/ory/sessions/[id]
 *
 * Disables a specific Ory session by its ID.
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookie = await getServerCookies()
        const { id: sessionId } = await params

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            )
        }

        // Disable the session in Ory
        await oryClient.disableMySession({
            id: sessionId,
            cookie,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("[/api/ory/sessions] Error disabling session:", error)
        return NextResponse.json(
            { error: "Failed to disable session", details: error.message },
            { status: 500 }
        )
    }
}
