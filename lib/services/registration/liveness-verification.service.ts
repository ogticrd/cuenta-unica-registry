import "server-only";

import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";
import { getRegistrationLivenessChallenge } from "@/lib/services/registration/registration-liveness-challenge.service";
import { getRegistrationSession } from "@/lib/services/registration/registration-session.service";
import {
  compareFaces,
  type FaceComparisonResult,
  getLivenessResults,
  type LivenessResult,
} from "@/lib/services/registration/rekognition.service";
import type { RegistrationSession } from "@/lib/types/registration/session";
import type {
  VerifyLivenessErrorCode,
  VerifyLivenessResponse,
} from "@/lib/types/registration/verification";

const LIVENESS_THRESHOLD =
  Number(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 90;
const SIMILARITY_THRESHOLD =
  Number(process.env.FACE_SIMILARITY_THRESHOLD) || 80;

export type RegistrationLivenessVerificationResult =
  | {
      success: true;
      status: 200;
      session: RegistrationSession;
      confidence: number;
      similarity: number;
    }
  | {
      success: false;
      status: number;
      code: VerifyLivenessErrorCode;
    };

export function createVerifyLivenessPayload(
  result: RegistrationLivenessVerificationResult,
): VerifyLivenessResponse {
  if (!result.success) {
    return {
      success: false,
      code: result.code,
    };
  }

  return {
    success: true,
    confidence: result.confidence,
    similarity: result.similarity,
  };
}

export async function verifyRegistrationLiveness(
  sessionId: string,
): Promise<RegistrationLivenessVerificationResult> {
  const session = await getRegistrationSession();

  if (!session) {
    return {
      success: false,
      status: 400,
      code: "registration_session_missing",
    };
  }

  if (session.status === "verified") {
    return {
      success: false,
      status: 409,
      code: "verification_already_completed",
    };
  }

  if (!sessionId) {
    return {
      success: false,
      status: 400,
      code: "invalid_session_id",
    };
  }

  const challenge = await getRegistrationLivenessChallenge();

  if (
    !challenge ||
    challenge.registrationSessionId !== session.sessionId ||
    challenge.livenessSessionId !== sessionId
  ) {
    return {
      success: false,
      status: 400,
      code: "invalid_session_id",
    };
  }

  let liveness: LivenessResult;
  try {
    liveness = await getLivenessResults(sessionId);
  } catch (error) {
    console.error("[liveness-verification] Failed to get results:", error);
    return {
      success: false,
      status: 502,
      code: "rekognition_error",
    };
  }

  if (
    liveness.confidence < LIVENESS_THRESHOLD ||
    !liveness.referenceImageBytes
  ) {
    return {
      success: false,
      status: 400,
      code: "liveness_check_failed",
    };
  }

  let citizenPhoto: Uint8Array;
  try {
    citizenPhoto = await fetchCitizenPhoto(session.cedula);
  } catch (error) {
    console.error("[liveness-verification] Failed to fetch photo:", error);
    return {
      success: false,
      status: 502,
      code: "citizen_photo_unavailable",
    };
  }

  let comparison: FaceComparisonResult;
  try {
    comparison = await compareFaces(
      liveness.referenceImageBytes,
      citizenPhoto,
      SIMILARITY_THRESHOLD,
    );
  } catch (error) {
    console.error("[liveness-verification] Face comparison failed:", error);
    return {
      success: false,
      status: 502,
      code: "rekognition_error",
    };
  }

  if (!comparison.isMatch) {
    return {
      success: false,
      status: 400,
      code: "face_mismatch",
    };
  }

  return {
    success: true,
    status: 200,
    session,
    confidence: liveness.confidence,
    similarity: comparison.similarity,
  };
}
