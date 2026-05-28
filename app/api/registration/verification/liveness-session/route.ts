import { NextResponse } from "next/server";

import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import {
  clearRegistrationAccountDraftCookie,
  getRegistrationAccountDraft,
  isRegistrationAccountDraftForSession,
} from "@/lib/services/registration/registration-account-draft.service";
import { createRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import { createLivenessSession } from "@/lib/services/registration/rekognition.service";
import type {
  CreateLivenessSessionErrorCode,
  CreateLivenessSessionResponse,
} from "@/lib/types/registration/verification";

function createErrorResponse(
  code: CreateLivenessSessionErrorCode,
  status: number,
  options?: { clearAccountDraft?: boolean },
) {
  const payload: CreateLivenessSessionResponse = { success: false, code };
  const response = NextResponse.json(payload, { status });

  if (options?.clearAccountDraft) {
    response.cookies.set(clearRegistrationAccountDraftCookie());
  }

  return response;
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
      outcome: options.success ? "started" : "failed",
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/verification/liveness-session" },
  );
}

export async function POST() {
  let session: Awaited<ReturnType<typeof getRegistrationSession>>;

  try {
    session = await getRegistrationSession();

    if (!session) {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: "registration_session_missing",
        metadata: { stage: "session_check" },
      });
      return createErrorResponse("registration_session_missing", 400);
    }

    if (session.status === "verified") {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: "verification_already_completed",
        metadata: { cedula: session.cedula, stage: "session_state" },
      });
      return createErrorResponse("verification_already_completed", 409);
    }

    const draft = await getRegistrationAccountDraft();

    if (!isRegistrationAccountDraftForSession(draft, session)) {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: "account_draft_missing",
        metadata: { cedula: session.cedula, stage: "account_draft" },
      });
      return createErrorResponse("account_draft_missing", 400, {
        clearAccountDraft: true,
      });
    }
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-session] Failed to read registration state:",
      error,
    );
    await emitLivenessSessionOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "state_read" },
    });
    return createErrorResponse("unexpected_error", 500);
  }

  try {
    const sessionId = await createLivenessSession();
    await emitLivenessSessionOutcome({
      success: true,
      sessionId,
      metadata: {
        cedula: session.cedula,
        stage: "created",
        evidence: { liveness: { provider: "aws_rekognition", status: "started" } },
        links: { livenessSessionId: sessionId },
      },
    });

    const payload: CreateLivenessSessionResponse = {
      success: true,
      sessionId,
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set(
      createRegistrationLivenessChallengeCookie(session, sessionId),
    );

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-session] Failed to create liveness session:",
      error,
    );
    await emitLivenessSessionOutcome({
      success: false,
      errorCode: "rekognition_error",
      metadata: { cedula: session?.cedula, stage: "exception" },
    });
    return createErrorResponse("rekognition_error", 502);
  }
}
