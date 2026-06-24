import { NextResponse } from "next/server";
import { z } from "zod";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { parseJsonRequest } from "@/lib/services/api-response";
import {
  createVerifyLivenessPayload,
  verifyRegistrationLiveness,
} from "@/lib/services/registration/liveness-verification.service";
import { clearRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { clearRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import { createRegistrationSessionCookieFromSession } from "@/lib/services/registration/registration-session.service";
import type {
  VerifyLivenessErrorCode,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

const livenessResultRequestSchema = z.object({
  sessionId: z.string().min(1),
});

function createErrorResponse(code: VerifyLivenessErrorCode, status: number) {
  const payload: VerifyLivenessResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

async function emitLivenessOutcome(options: {
  success: boolean;
  sessionId?: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "registration.liveness.succeeded"
        : "registration.liveness.failed",
      source: "registry-app",
      step: "liveness",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/verification/liveness-result" },
  );
}

export async function POST(request: Request) {
  try {
    const parsedBody = await parseJsonRequest(
      request,
      livenessResultRequestSchema,
    );

    if (!parsedBody.success) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "invalid_payload",
        metadata: { stage: "request_body" },
      });
      return createErrorResponse(parsedBody.code, 400);
    }

    const sessionId = parsedBody.data.sessionId;
    const result = await verifyRegistrationLiveness(sessionId);

    if (!result.success) {
      await emitLivenessOutcome({
        success: false,
        sessionId,
        errorCode: result.code,
        metadata: { stage: result.code },
      });
      const response = createErrorResponse(result.code, result.status);

      if (result.code === "account_draft_missing") {
        response.cookies.set(clearRegistrationAccountDraftCookie());
      }

      return response;
    }

    await emitLivenessOutcome({
      success: true,
      sessionId,
      metadata: {
        cedula: result.session.cedula,
        stage: "verified",
        confidence: result.confidence,
        similarity: result.similarity,
        evidence: {
          liveness: {
            provider: "aws_rekognition",
            status: "succeeded",
            confidence: result.confidence,
            similarity: result.similarity,
          },
        },
      },
    });

    const response = NextResponse.json(createVerifyLivenessPayload(result), {
      status: 200,
    });
    response.cookies.set(
      createRegistrationSessionCookieFromSession(result.session, "verified"),
    );
    response.cookies.set(clearRegistrationLivenessChallengeCookie());

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-result] Failed:",
      error,
    );
    await emitLivenessOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("unexpected_error", 500);
  }
}
