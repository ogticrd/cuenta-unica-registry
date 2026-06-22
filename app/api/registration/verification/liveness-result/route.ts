import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createVerifyLivenessPayload,
  verifyRegistrationLiveness,
} from "@/lib/services/registration/liveness-verification.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
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
    const body = await request.json().catch(() => null);
    const parsedBody = livenessResultRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return createErrorResponse("invalid_payload", 400);
    }

    const result = await verifyRegistrationLiveness(parsedBody.data.sessionId);

    if (!result.success) {
      return createErrorResponse(result.code, result.status);
    }

    const response = NextResponse.json(createVerifyLivenessPayload(result), {
      status: 200,
    });
    response.cookies.set(
      createRegistrationSessionCookie(
        result.session.cedula,
        "verified",
        result.session.returnUrl,
      ),
    );

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-result] Failed:",
      error,
    );
    return createErrorResponse("unexpected_error", 500);
  }
}
