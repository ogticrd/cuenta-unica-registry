import { NextResponse } from "next/server";
import { logger } from "@/lib/logging/logger";
import { withRequestLogging } from "@/lib/logging/with-request-logging";

import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type { RegistrationVerificationResponse } from "@/lib/types/registration/session";

function createErrorResponse(
  code: "registration_session_missing" | "unexpected_error",
  status: number,
) {
  const payload: RegistrationVerificationResponse = {
    success: false,
    code,
  };

  return NextResponse.json(payload, { status });
}

async function handlePOST() {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      return createErrorResponse("registration_session_missing", 400);
    }

    return NextResponse.json(
      { success: true } satisfies RegistrationVerificationResponse,
      {
        status: 200,
      },
    );
  } catch (error) {
    logger.error(
      "[/api/registration/verification] Failed to validate registration session:",
      { operation: "app.api.registration.verification.route" },
      error,
    );
    return createErrorResponse("unexpected_error", 500);
  }
}

export const POST = withRequestLogging(
  "/api/registration/verification",
  handlePOST,
);
