import { NextResponse } from "next/server";
import { z } from "zod";
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

export async function POST(request: Request) {
  try {
    const parsedBody = await parseJsonRequest(
      request,
      livenessResultRequestSchema,
    );

    if (!parsedBody.success) {
      return createErrorResponse(parsedBody.code, 400);
    }

    const result = await verifyRegistrationLiveness(parsedBody.data.sessionId);

    if (!result.success) {
      const response = createErrorResponse(result.code, result.status);

      if (result.code === "account_draft_missing") {
        response.cookies.set(clearRegistrationAccountDraftCookie());
      }

      return response;
    }

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
    return createErrorResponse("unexpected_error", 500);
  }
}
