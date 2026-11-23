import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { getOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";

/**
 * DELETE /api/ory/sessions/[id]
 *
 * Disables a specific Ory session by its ID.
 */
async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookie = await getServerCookies();
    const { id: sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          code: "ory_session_id_required",
          error: "Session ID is required",
        },
        { status: 400 },
      );
    }

    await getOryClient().disableMySession({
      id: sessionId,
      cookie,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    logger.error(
      "[/api/ory/sessions] Error disabling session:",
      { operation: "app.api.ory.sessions.[id].route" },
      error,
    );
    return NextResponse.json(
      {
        success: false,
        code: "ory_session_revoke_failed",
        error: "Failed to disable session",
      },
      { status: 500 },
    );
  }
}

export const DELETE = withRequestLogging(
  "/api/ory/sessions/[id]",
  handleDELETE,
);
