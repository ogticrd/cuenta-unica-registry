import { NextResponse } from "next/server";
import { emitAnalyticsEvent } from "@/lib/analytics/emitter";
import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";
import {
  createRegistrationSessionCookie,
  getRegistrationSession,
} from "@/lib/services/registration/registration-session.service";
import {
  compareFaces,
  type FaceComparisonResult,
  getLivenessResults,
  type LivenessResult,
} from "@/lib/services/registration/rekognition.service";
import type {
  VerifyLivenessErrorCode,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

const LIVENESS_THRESHOLD =
  Number(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 90;
const SIMILARITY_THRESHOLD =
  Number(process.env.FACE_SIMILARITY_THRESHOLD) || 80;

function createErrorResponse(code: VerifyLivenessErrorCode, status: number) {
  const payload: VerifyLivenessResponse = { success: false, code };
  return NextResponse.json(payload, { status });
}

async function emitLivenessOutcome(options: {
  success: boolean;
  errorCode?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  await emitAnalyticsEvent(
    {
      eventName: options.success
        ? "registration.liveness.succeeded"
        : "registration.liveness.failed",
      source: "registry-app",
      step: "liveness",
      outcome: options.success ? "succeeded" : "failed",
      ...(options.errorCode ? { errorCode: options.errorCode } : {}),
      ...(options.sessionId ? { sessionId: options.sessionId } : {}),
      ...(options.metadata ? { metadata: options.metadata } : {}),
    },
    { entryPath: "/api/registration/verification/liveness-result" },
  );
}

export async function POST(request: Request) {
  try {
    const session = await getRegistrationSession();

    if (!session) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "registration_session_missing",
        metadata: { stage: "session_check" },
      });
      return createErrorResponse("registration_session_missing", 400);
    }

    const body = (await request.json().catch(() => null)) as {
      sessionId?: string;
    } | null;

    if (!body?.sessionId) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "invalid_session_id",
        metadata: { stage: "request_body" },
      });
      return createErrorResponse("invalid_session_id", 400);
    }

    // Step 1: Retrieve liveness session results from AWS Rekognition
    let liveness: LivenessResult;
    try {
      liveness = await getLivenessResults(body.sessionId);
    } catch (error) {
      console.error("[liveness-result] Failed to get liveness results:", error);
      await emitLivenessOutcome({
        success: false,
        errorCode: "rekognition_error",
        sessionId: body.sessionId,
        metadata: { stage: "liveness_lookup" },
      });
      return createErrorResponse("rekognition_error", 502);
    }

    if (liveness.confidence < LIVENESS_THRESHOLD) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "liveness_check_failed",
        sessionId: body.sessionId,
        metadata: {
          stage: "confidence_check",
          confidence: liveness.confidence,
        },
      });
      return createErrorResponse("liveness_check_failed", 400);
    }

    if (!liveness.referenceImageBytes) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "liveness_check_failed",
        sessionId: body.sessionId,
        metadata: { stage: "reference_image_missing" },
      });
      return createErrorResponse("liveness_check_failed", 400);
    }

    // Step 2: Fetch the citizen's official photo
    let citizenPhoto: Uint8Array;
    try {
      citizenPhoto = await fetchCitizenPhoto(session.cedula);
    } catch (error) {
      console.error("[liveness-result] Failed to fetch citizen photo:", error);
      await emitLivenessOutcome({
        success: false,
        errorCode: "citizen_photo_unavailable",
        sessionId: body.sessionId,
        metadata: { stage: "citizen_photo_lookup" },
      });
      return createErrorResponse("citizen_photo_unavailable", 502);
    }

    // Step 3: Compare liveness reference image against the citizen photo
    let comparison: FaceComparisonResult;
    try {
      comparison = await compareFaces(
        liveness.referenceImageBytes,
        citizenPhoto,
        SIMILARITY_THRESHOLD,
      );
    } catch (error) {
      console.error("[liveness-result] Face comparison failed:", error);
      await emitLivenessOutcome({
        success: false,
        errorCode: "rekognition_error",
        sessionId: body.sessionId,
        metadata: { stage: "face_compare" },
      });
      return createErrorResponse("rekognition_error", 502);
    }

    if (!comparison.isMatch) {
      await emitLivenessOutcome({
        success: false,
        errorCode: "face_mismatch",
        sessionId: body.sessionId,
        metadata: {
          stage: "face_compare",
          similarity: comparison.similarity,
        },
      });
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
      createRegistrationSessionCookie(
        session.cedula,
        "verified",
        session.returnUrl,
      ),
    );
    await emitLivenessOutcome({
      success: true,
      sessionId: body.sessionId,
      metadata: {
        stage: "verified",
        confidence: liveness.confidence,
        similarity: comparison.similarity,
      },
    });

    return response;
  } catch (error) {
    console.error(
      "[/api/registration/verification/liveness-result] Failed:",
      error,
    );
    await emitLivenessOutcome({
      success: false,
      errorCode: "unexpected_error",
      metadata: { stage: "exception" },
    });
    return createErrorResponse("unexpected_error", 500);
  }
}
