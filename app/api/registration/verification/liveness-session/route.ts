import { NextResponse } from "next/server";

import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import { createLivenessSession } from "@/lib/services/registration/rekognition.service";
import type {
  CreateLivenessSessionResponse,
  CreateLivenessSessionErrorCode,
} from "@/lib/types/registration/verification";

function createErrorResponse(
  code: CreateLivenessSessionErrorCode,
  status: number,
) {
  const payload: CreateLivenessSessionResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

export async function POST() {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      return createErrorResponse("registration_session_missing", 400);
    }

    const sessionId = await createLivenessSession();

    const payload: CreateLivenessSessionResponse = {
      success: true,
      sessionId,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-session] Failed to create liveness session:",
      error,
    );
    return createErrorResponse("rekognition_error", 502);
  }
}
