import { NextResponse } from "next/server";

import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import type { RegistrationVerificationResponse } from "@/lib/types/registration/session";

function createErrorResponse(
  code: "registration_session_missing" | "unexpected_error",
  status: number,
) {
  const payload: RegistrationVerificationResponse = {
    success: false,
    code,
  };

  return NextResponse.json(payload, { status });
}

export async function POST() {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      return createErrorResponse("registration_session_missing", 400);
    }

    return NextResponse.json(
      { success: true } satisfies RegistrationVerificationResponse,
      { status: 200 },
    );
  } catch (error) {
    console.error(
      "[/api/registration/verification] Failed to validate registration session:",
      error,
    );
    return createErrorResponse("unexpected_error", 500);
  }
}
