import { NextResponse } from "next/server";
import { getOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";

/**
 * DELETE /api/ory/sessions/[id]
 *
 * Disables a specific Ory session by its ID.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookie = await getServerCookies();
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    await getOryClient().disableMySession({
      id: sessionId,
      cookie,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("[/api/ory/sessions] Error disabling session:", error);
    return NextResponse.json(
      { error: "Failed to disable session" },
      { status: 500 },
    );
  }
}
