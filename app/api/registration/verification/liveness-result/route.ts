import { NextResponse } from "next/server";
import {
  createVerifyLivenessPayload,
  verifyRegistrationLiveness,
} from "@/lib/services/registration/liveness-verification.service";
import { createRegistrationSessionCookie } from "@/lib/services/registration/registration-session.service";
import type {
  VerifyLivenessErrorCode,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

function createErrorResponse(code: VerifyLivenessErrorCode, status: number) {
  const payload: VerifyLivenessResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
    } | null;
    const result = await verifyRegistrationLiveness(body?.sessionId ?? "");

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
