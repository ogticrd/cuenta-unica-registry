import type { Session } from "@ory/client";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { getOryClient } from "@/lib/ory/client";
import { getServerCookies } from "@/lib/ory/cookies";

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
async function handleGET() {
  try {
    const cookie = await getServerCookies();

    const oryClient = getOryClient();
    const { data: session } = await oryClient.toSession({
      cookie,
    });

    let otherSessions: Session[] = [];
    try {
      const { data } = await oryClient.listMySessions({ cookie });
      otherSessions = data;
    } catch (error: unknown) {
      logger.error(
        "[/api/ory/session] Could not fetch other sessions:",
        { operation: "app.api.ory.session.route" },
        error,
      );
    }

    return NextResponse.json({
      isAuthenticated: true,
      identity: {
        id: session.identity?.id,
        traits: session.identity?.traits,
        schema_id: session.identity?.schema_id,
      },
      session,
      otherSessions,
    });
  } catch (error: unknown) {
    const status =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;

    if (status === 401 || status === 403) {
      return NextResponse.json({ isAuthenticated: false }, { status: 200 });
    }

    logger.error(
      "[/api/ory/session] Error fetching session:",
      { operation: "app.api.ory.session.route" },
      error,
    );
    return NextResponse.json(
      {
        success: false,
        isAuthenticated: false,
        code: "ory_session_fetch_failed",
        error: "Failed to fetch session",
      },
      { status: 500 },
    );
  }
}

export const GET = withRequestLogging("/api/ory/session", handleGET);
