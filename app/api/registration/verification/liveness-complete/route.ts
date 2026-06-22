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
import type { RegisterAccountErrorCode } from "@/lib/types/registration/account";
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

function createAccountErrorResponse(
  code: RegisterAccountErrorCode,
  status: number,
  session: RegistrationSession,
) {
  const response = NextResponse.json(
    {
      success: false,
      stage: "account",
      code,
    } satisfies CompleteLivenessRegistrationResponse,
    { status },
  );
  setVerifiedSessionCookie(response, session);

  return response;
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

    let draft: Awaited<ReturnType<typeof getRegistrationAccountDraft>>;

    try {
      draft = await getRegistrationAccountDraft();
    } catch (error) {
      console.error(
        "[/api/registration/verification/liveness-complete] Failed to read account draft:",
        error,
      );

      return createAccountErrorResponse(
        "unexpected_error",
        500,
        livenessResult.session,
      );
    }

    if (!draft) {
      const response = createAccountErrorResponse(
        "account_draft_missing",
        400,
        livenessResult.session,
      );
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
