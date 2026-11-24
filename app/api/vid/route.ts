import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ROUTES } from "@/lib/constants/routes";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";
import { authorizeVidLaunch } from "@/lib/services/vid/vid-launch.service";
import {
  createVidSessionCookie,
  VID_FLOW_DURATION_SECONDS,
} from "@/lib/services/vid/vid-session.service";
import type { VidLaunchErrorCode } from "@/lib/types/vid";

async function handleGET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  function redirectToVid(
    query: { flow: string } | { error: VidLaunchErrorCode },
  ) {
    return new NextResponse(null, {
      status: 303,
      headers: {
        Location: `${ROUTES.vid}?${new URLSearchParams(query)}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  }

  try {
    const launch = await authorizeVidLaunch(params);
    if (!launch.success) {
      return redirectToVid({ error: launch.code });
    }

    const id = randomUUID();
    const response = redirectToVid({ flow: id });
    response.cookies.set(
      createVidSessionCookie({
        id,
        cedula: launch.cedula,
        firstName: launch.firstName,
        redirectUri: launch.redirectUri,
        state: launch.state,
        expiresAt: Date.now() + VID_FLOW_DURATION_SECONDS * 1000,
      }),
    );
    return response;
  } catch (error) {
    logger.error(
      "[vid] Unable to start verification",
      {
        operation: "vid.launch",
        event: "vid_flow_creation_failed",
        source: "vid",
        code: "service_unavailable",
      },
      error,
    );
    return redirectToVid({ error: "service_unavailable" });
  }
}

export const GET = withRequestLogging("/api/vid", handleGET);
