import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function POST(request: Request) {
  try {
    const parsedBody = await parseJsonRequest(
      request,
      livenessCompleteRequestSchema,
    );

    if (!parsedBody.success) {
      return createVerificationErrorResponse(parsedBody.code, 400);
    }

    const livenessResult = await verifyRegistrationLiveness(
      parsedBody.data.sessionId,
    );

    if (!livenessResult.success) {
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
    return createVerificationErrorResponse("unexpected_error", 500);
  }
}
