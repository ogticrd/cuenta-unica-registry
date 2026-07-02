import { NextResponse } from "next/server";
import { z } from "zod";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { withRegistrationSessionAnalyticsContext } from "@/lib/analytics/registration-session-context";
import { parseJsonRequest } from "@/lib/services/api-response";
import {
  applyAccountRegistrationCookies,
  completeRegistrationAccount,
} from "@/lib/services/registration/account-registration.service";
import { verifyRegistrationLiveness } from "@/lib/services/registration/liveness-verification.service";
import { clearRegistrationAccountDraftCookie } from "@/lib/services/registration/registration-account-draft.service";
import { clearRegistrationLivenessChallengeCookie } from "@/lib/services/registration/registration-liveness-challenge.service";
import { createRegistrationSessionCookieFromSession } from "@/lib/services/registration/registration-session.service";
import type { RegistrationSession } from "@/lib/types/registration/session";
import type {
  CompleteLivenessRegistrationResponse,
  VerifyLivenessErrorCode,
} from "@/lib/types/registration/verification";

const livenessCompleteRequestSchema = z.object({
  sessionId: z.string().min(1),
});

async function emitLivenessOutcome(options: {
  success: boolean;
  sessionId?: string;
  errorCode?: string;
  registrationSession?: RegistrationSession | null;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    withRegistrationSessionAnalyticsContext(
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
      options.registrationSession,
    ),
    { entryPath: "/api/registration/verification/liveness-complete" },
  );
}

function createVerificationErrorResponse(
  code: VerifyLivenessErrorCode,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      stage: "verification",
      code,
    } satisfies CompleteLivenessRegistrationResponse,
    { status },
  );
}

function setVerifiedSessionCookie(
  response: NextResponse,
  session: RegistrationSession,
) {
  response.cookies.set(
    createRegistrationSessionCookieFromSession(session, "verified"),
  );
}

function emailVerificationFlowId(redirectTo: string | undefined) {
  if (!redirectTo) {
    return undefined;
  }

  try {
    const url = new URL(redirectTo, "https://registry.local");
    return url.searchParams.get("flow") || undefined;
  } catch {
    return undefined;
  }
}

async function emitAccountOutcomeFromLiveness(params: {
  accountResult: Awaited<ReturnType<typeof completeRegistrationAccount>>;
  email: string;
  registrationSession: RegistrationSession;
}) {
  const { accountResult, email, registrationSession } = params;
  const payload = accountResult.payload;

  if (!payload.success) {
    await emitAnalyticsEvent(
      withRegistrationSessionAnalyticsContext(
        {
          eventName: "identity.registration.failed",
          source: "registry-app",
          step: "account",
          outcome: "failed",
          errorCode: payload.code,
          metadata: {
            cedula: registrationSession.cedula,
            stage: payload.code,
            traits: {
              username: registrationSession.cedula,
              email,
            },
          },
        },
        registrationSession,
      ),
      { entryPath: "/api/registration/verification/liveness-complete" },
    );
    return;
  }

  const flowId = emailVerificationFlowId(payload.redirectTo);
  await emitAnalyticsEvent(
    withRegistrationSessionAnalyticsContext(
      {
        eventName: "identity.registration.succeeded",
        source: "registry-app",
        step: "account",
        outcome: "succeeded",
        ...(flowId ? { flowId } : {}),
        metadata: {
          cedula: registrationSession.cedula,
          stage: "registration_created",
          traits: {
            username: registrationSession.cedula,
            email,
          },
          links: {
            destination: payload.destination,
            ...(registrationSession.returnUrl
              ? { returnUrl: registrationSession.returnUrl }
              : {}),
            ...(flowId ? { emailVerificationFlowId: flowId } : {}),
          },
        },
      },
      registrationSession,
    ),
    { entryPath: "/api/registration/verification/liveness-complete" },
  );
}

export async function POST(request: Request) {
  let livenessOutcomeEmitted = false;

  try {
    const parsedBody = await parseJsonRequest(
      request,
      livenessCompleteRequestSchema,
    );

    if (!parsedBody.success) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "invalid_payload",
        metadata: { stage: "request_body" },
      });
      livenessOutcomeEmitted = true;
      return createVerificationErrorResponse(parsedBody.code, 400);
    }

    const sessionId = parsedBody.data.sessionId;
    const livenessResult = await verifyRegistrationLiveness(sessionId);

    if (!livenessResult.success) {
      await emitLivenessOutcome({
        success: false,
        sessionId,
        errorCode: livenessResult.code,
        registrationSession: livenessResult.session,
        metadata: { stage: livenessResult.code },
      });
      livenessOutcomeEmitted = true;

      if (livenessResult.code === "account_draft_missing") {
        const response = NextResponse.json(
          {
            success: false,
            stage: "account",
            code: "account_draft_missing",
          } satisfies CompleteLivenessRegistrationResponse,
          { status: livenessResult.status },
        );
        response.cookies.set(clearRegistrationAccountDraftCookie());

        return response;
      }

      return createVerificationErrorResponse(
        livenessResult.code,
        livenessResult.status,
      );
    }

    await emitLivenessOutcome({
      success: true,
      sessionId,
      registrationSession: livenessResult.session,
      metadata: {
        cedula: livenessResult.session.cedula,
        stage: "verified",
        confidence: livenessResult.confidence,
        similarity: livenessResult.similarity,
        evidence: {
          liveness: {
            provider: "aws_rekognition",
            status: "succeeded",
            confidence: livenessResult.confidence,
            similarity: livenessResult.similarity,
          },
        },
      },
    });
    livenessOutcomeEmitted = true;

    const accountResult = await completeRegistrationAccount(
      {
        email: livenessResult.accountDraft.email,
        password: livenessResult.accountDraft.password,
      },
      {
        draft: livenessResult.accountDraft,
        registrationSession: {
          ...livenessResult.session,
          status: "verified",
        },
      },
    );
    await emitAccountOutcomeFromLiveness({
      accountResult,
      email: livenessResult.accountDraft.email,
      registrationSession: livenessResult.session,
    });

    const payload: CompleteLivenessRegistrationResponse = accountResult.payload
      .success
      ? {
          success: true,
          confidence: livenessResult.confidence,
          similarity: livenessResult.similarity,
          destination: accountResult.payload.destination,
          redirectTo: accountResult.payload.redirectTo,
        }
      : {
          success: false,
          stage: "account",
          code: accountResult.payload.code,
          fieldErrors: accountResult.payload.fieldErrors,
        };

    const response = NextResponse.json(payload, {
      status: accountResult.status,
    });
    applyAccountRegistrationCookies(response, accountResult);
    response.cookies.set(clearRegistrationLivenessChallengeCookie());

    if (!accountResult.payload.success) {
      setVerifiedSessionCookie(response, livenessResult.session);
    }

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-complete] Failed:",
      error,
    );
    if (!livenessOutcomeEmitted) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "unexpected_error",
        metadata: { stage: "exception" },
      });
    }
    return createVerificationErrorResponse("unexpected_error", 500);
  }
}
