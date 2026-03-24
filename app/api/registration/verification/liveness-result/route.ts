import { NextResponse } from "next/server";

import {
  getRegistrationSession,
  createRegistrationSessionCookie,
} from "@/lib/services/registration/registration-session.service";
import {
  getLivenessResults,
  compareFaces,
} from "@/lib/services/registration/rekognition.service";
import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";
import type {
  VerifyLivenessResponse,
  VerifyLivenessErrorCode,
} from "@/lib/types/registration/verification";

const LIVENESS_THRESHOLD =
  Number(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 90;
const SIMILARITY_THRESHOLD =
  Number(process.env.FACE_SIMILARITY_THRESHOLD) || 80;

function createErrorResponse(
  code: VerifyLivenessErrorCode,
  status: number,
) {
  const payload: VerifyLivenessResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

export async function POST(request: Request) {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      return createErrorResponse("registration_session_missing", 400);
    }

    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
    } | null;

    if (!body?.sessionId) {
      return createErrorResponse("invalid_session_id", 400);
    }

    // Step 1: Retrieve liveness session results from AWS Rekognition
    let liveness;
    try {
      liveness = await getLivenessResults(body.sessionId);
    } catch (error) {
      console.error(
        "[liveness-result] Failed to get liveness results:",
        error,
      );
      return createErrorResponse("rekognition_error", 502);
    }

    if (liveness.confidence < LIVENESS_THRESHOLD) {
      return createErrorResponse("liveness_check_failed", 400);
    }

    if (!liveness.referenceImageBytes) {
      return createErrorResponse("liveness_check_failed", 400);
    }

    // Step 2: Fetch the citizen's official photo
    let citizenPhoto: Uint8Array;
    try {
      citizenPhoto = await fetchCitizenPhoto(session.cedula);
    } catch (error) {
      console.error(
        "[liveness-result] Failed to fetch citizen photo:",
        error,
      );
      return createErrorResponse("citizen_photo_unavailable", 502);
    }

    // Step 3: Compare liveness reference image against the citizen photo
    let comparison;
    try {
      comparison = await compareFaces(
        liveness.referenceImageBytes,
        citizenPhoto,
        SIMILARITY_THRESHOLD,
      );
    } catch (error) {
      console.error("[liveness-result] Face comparison failed:", error);
      return createErrorResponse("rekognition_error", 502);
    }

    if (!comparison.isMatch) {
      return createErrorResponse("face_mismatch", 400);
    }

    // Step 4: Upgrade session to "verified"
    const payload: VerifyLivenessResponse = {
      success: true,
      confidence: liveness.confidence,
      similarity: comparison.similarity,
    };

    const response = NextResponse.json(payload, { status: 200 });
    response.cookies.set(
      createRegistrationSessionCookie(session.cedula, "verified", session.returnUrl),
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
