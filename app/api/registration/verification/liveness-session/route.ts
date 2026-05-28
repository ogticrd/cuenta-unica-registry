import { NextResponse } from "next/server";

import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import { createLivenessSession } from "@/lib/services/registration/rekognition.service";
import type {
  CreateLivenessSessionErrorCode,
  CreateLivenessSessionResponse,
} from "@/lib/types/registration/verification";

function createErrorResponse(
  code: CreateLivenessSessionErrorCode,
  status: number,
) {
  const payload: CreateLivenessSessionResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

async function emitLivenessSessionOutcome(options: {
  success: boolean;
  errorCode?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "registration.liveness.session_created"
        : "registration.liveness.session_failed",
      source: "registry-app",
      step: "liveness",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/verification/liveness-session" },
  );
}

export async function POST() {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: "registration_session_missing",
        metadata: { stage: "session_check" },
      });
      return createErrorResponse("registration_session_missing", 400);
    }

    const sessionId = await createLivenessSession();
    await emitLivenessSessionOutcome({
      success: true,
      sessionId,
      metadata: { stage: "created" },
    });

    const payload: CreateLivenessSessionResponse = {
      success: true,
      sessionId,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-session] Failed to create liveness session:",
      error,
    );
    await emitLivenessSessionOutcome({
      success: false,
      errorCode: "rekognition_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("rekognition_error", 502);
  }
}
