import { NextResponse } from "next/server";

import { isAccountRegistrationEnabled } from "@/lib/services/feature-flags/feature-flags.service";
import {
  createLivenessRegistrationSessionCookie,
  getRegistrationSession,
} from "@/lib/services/registration/registration-session.service";
import { createLivenessSession } from "@/lib/services/registration/rekognition.service";
import type {
  CreateLivenessSessionErrorCode,
  CreateLivenessSessionResponse,
} from "@/lib/types/registration/verification";

const MAX_LIVENESS_SESSION_ATTEMPTS = 3;

function createErrorResponse(
  code: CreateLivenessSessionErrorCode,
  status: number,
) {
  const payload: CreateLivenessSessionResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

export async function POST() {
  if (!(await isAccountRegistrationEnabled())) {
    return createErrorResponse("registration_disabled", 404);
  }

  const session = await getRegistrationSession();

  if (!session) {
    return createErrorResponse("registration_session_missing", 400);
  }

  if ((session.livenessSessionAttempts ?? 0) >= MAX_LIVENESS_SESSION_ATTEMPTS) {
    return createErrorResponse("too_many_liveness_sessions", 429);
  }

  try {
    const sessionId = await createLivenessSession();

    const payload: CreateLivenessSessionResponse = {
      success: true,
      sessionId,
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set(
      createLivenessRegistrationSessionCookie(session, sessionId),
    );

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-session] Failed to create liveness session:",
      error,
    );
    return createErrorResponse("rekognition_error", 502);
  }
}
