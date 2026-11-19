import "server-only";
import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";
import {
  compareFaces,
  type FaceComparisonResult,
  getLivenessResults,
  type LivenessResult,
} from "@/lib/services/registration/rekognition.service";

const LIVENESS_THRESHOLD =
  Number(process.env.LIVENESS_CONFIDENCE_THRESHOLD) || 90;
const SIMILARITY_THRESHOLD =
  Number(process.env.FACE_SIMILARITY_THRESHOLD) || 80;

type CitizenLivenessErrorCode =
  | "liveness_check_failed"
  | "citizen_photo_unavailable"
  | "face_mismatch"
  | "rekognition_error";

type CitizenLivenessResult =
  | { success: true; status: 200; confidence: number; similarity: number }
  | { success: false; status: number; code: CitizenLivenessErrorCode };

export async function verifyCitizenLiveness(
  sessionId: string,
  cedula: string,
): Promise<CitizenLivenessResult> {
  let liveness: LivenessResult;
  try {
    liveness = await getLivenessResults(sessionId);
  } catch (error) {
    console.error("[citizen-liveness] Failed to get results", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
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
    citizenPhoto = await fetchCitizenPhoto(cedula);
  } catch (error) {
    console.error("[citizen-liveness] Failed to fetch photo", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
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
    console.error("[citizen-liveness] Face comparison failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
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
    confidence: liveness.confidence,
    similarity: comparison.similarity,
  };
}
