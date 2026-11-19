import { NextResponse } from "next/server";

import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { withRegistrationSessionAnalyticsContext } from "@/lib/analytics/registration-session-context";
import {
  clearRegistrationAccountDraftCookie,
  getRegistrationAccountDraft,
  isRegistrationAccountDraftForSession,
} from "@/lib/services/registration/registration-account-draft.service";
import {
  createRegistrationBiometricStateCookie,
  getRegistrationBiometricState,
  prepareRegistrationBiometricAttempt,
  recordRegistrationBiometricSessionCreated,
} from "@/lib/services/registration/registration-biometric-attempt.service";
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
  options?: {
    clearAccountDraft?: boolean;
    retryAfterSeconds?: number;
  },
) {
  const payload: CreateLivenessSessionResponse = {
    success: false,
    code,
    ...(options?.retryAfterSeconds !== undefined
      ? { retryAfterSeconds: options.retryAfterSeconds }
      : {}),
  };
  const response = NextResponse.json(payload, { status });

  if (options?.clearAccountDraft) {
    response.cookies.set(clearRegistrationAccountDraftCookie());
  }

  return response;
}

async function emitLivenessSessionOutcome(options: {
  success: boolean;
  errorCode?: string;
  registrationSession?: Awaited<ReturnType<typeof getRegistrationSession>>;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    withRegistrationSessionAnalyticsContext(
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
      options.registrationSession,
    ),
    { entryPath: "/api/registration/verification/liveness-session" },
  );
}

export async function POST(request?: Request) {
  let session: Awaited<ReturnType<typeof getRegistrationSession>>;
  let biometricAttempt: ReturnType<typeof prepareRegistrationBiometricAttempt>;

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
        registrationSession: session,
        metadata: { cedula: session.cedula, stage: "session_state" },
      });
      return createErrorResponse("verification_already_completed", 409);
    }

    const draft = await getRegistrationAccountDraft();

    if (!isRegistrationAccountDraftForSession(draft, session)) {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: "account_draft_missing",
        registrationSession: session,
        metadata: { cedula: session.cedula, stage: "account_draft" },
      });
      return createErrorResponse("account_draft_missing", 400, {
        clearAccountDraft: true,
      });
    }

    const biometricState = await getRegistrationBiometricState();
    const forceNew = request
      ? new URL(request.url).searchParams.get("forceNew") === "true"
      : false;
    biometricAttempt = prepareRegistrationBiometricAttempt({
      state: biometricState,
      registrationSession: session,
      forceNew,
    });

    if (biometricAttempt.status === "blocked") {
      await emitLivenessSessionOutcome({
        success: false,
        errorCode: biometricAttempt.code,
        registrationSession: session,
        metadata: {
          cedula: session.cedula,
          stage: "attempt_limit",
          retryAfterSeconds: biometricAttempt.retryAfterSeconds,
        },
      });
      const response = createErrorResponse(biometricAttempt.code, 429, {
        retryAfterSeconds: biometricAttempt.retryAfterSeconds,
      });
      response.cookies.set(
        createRegistrationBiometricStateCookie(biometricAttempt.state),
      );
      return response;
    }

    if (biometricAttempt.status === "reuse") {
      await emitLivenessSessionOutcome({
        success: true,
        registrationSession: session,
        sessionId: biometricAttempt.sessionId,
        metadata: {
          cedula: session.cedula,
          stage: "reused",
          reused: true,
        },
      });
      const response = NextResponse.json<CreateLivenessSessionResponse>(
        { success: true, sessionId: biometricAttempt.sessionId },
        { status: 200 },
      );
      response.cookies.set(
        createRegistrationBiometricStateCookie(biometricAttempt.state),
      );
      response.cookies.set(
        createRegistrationLivenessChallengeCookie(
          session,
          biometricAttempt.sessionId,
        ),
      );
      return response;
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
    const sessionId = await createLivenessSession(
      biometricAttempt.clientRequestToken,
    );
    const biometricState = recordRegistrationBiometricSessionCreated({
      state: biometricAttempt.state,
      registrationSessionId: session.sessionId,
      sessionId,
      clientRequestToken: biometricAttempt.clientRequestToken,
      attemptNumber: biometricAttempt.attemptNumber,
    });
    await emitLivenessSessionOutcome({
      success: true,
      registrationSession: session,
      sessionId,
      metadata: {
        cedula: session.cedula,
        stage: "created",
        evidence: {
          liveness: { provider: "aws_rekognition", status: "started" },
        },
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
    response.cookies.set(
      createRegistrationBiometricStateCookie(biometricState),
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
      registrationSession: session,
      metadata: { cedula: session?.cedula, stage: "exception" },
    });
    return createErrorResponse("rekognition_error", 502);
  }
}
