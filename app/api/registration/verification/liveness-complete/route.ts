import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applyAccountRegistrationCookies,
  completeRegistrationAccount,
} from "@/lib/services/registration/account-registration.service";
import { verifyRegistrationLiveness } from "@/lib/services/registration/liveness-verification.service";
import {
  clearRegistrationAccountDraftCookie,
  getRegistrationAccountDraft,
} from "@/lib/services/registration/registration-account-draft.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
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
    createRegistrationSessionCookie(
      session.cedula,
      "verified",
      session.returnUrl,
    ),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsedBody = livenessCompleteRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return createVerificationErrorResponse("invalid_payload", 400);
    }

    const livenessResult = await verifyRegistrationLiveness(
      parsedBody.data.sessionId,
    );

    if (!livenessResult.success) {
      return createVerificationErrorResponse(
        livenessResult.code,
        livenessResult.status,
      );
    }

    const draft = await getRegistrationAccountDraft();

    if (!draft) {
      const response = NextResponse.json(
        {
          success: false,
          stage: "account",
          code: "account_draft_missing",
        } satisfies CompleteLivenessRegistrationResponse,
        { status: 400 },
      );
      setVerifiedSessionCookie(response, livenessResult.session);
      response.cookies.set(clearRegistrationAccountDraftCookie());

      return response;
    }

    const accountResult = await completeRegistrationAccount(
      {
        email: draft.email,
        password: draft.password,
      },
      {
        draft,
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
