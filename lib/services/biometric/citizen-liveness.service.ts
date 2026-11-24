import { logger } from "@/lib/logging/logger";
import "server-only";
import { z } from "zod";
import { fetchCitizenPhoto } from "@/lib/services/registration/citizen-photo.service";
import {
  compareFaces,
  type FaceComparisonResult,
  getLivenessResults,
  type LivenessResult,
} from "@/lib/services/registration/rekognition.service";

function threshold(value: string | undefined, fallback: number) {
  const result = z.coerce.number().gt(0).lte(100).safeParse(value);
  return result.success ? result.data : fallback;
}

const LIVENESS_THRESHOLD = threshold(
  process.env.LIVENESS_CONFIDENCE_THRESHOLD,
  85,
);
const SIMILARITY_THRESHOLD = threshold(
  process.env.FACE_SIMILARITY_THRESHOLD,
  95,
);

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
  source: "registration" | "vid" = "registration",
): Promise<CitizenLivenessResult> {
  let liveness: LivenessResult;
  try {
    liveness = await getLivenessResults(sessionId);
  } catch (error) {
    logger.error(
      "[citizen-liveness] Failed to get results",
      {
        operation: "biometric.liveness",
        event: "biometric_liveness_result_lookup_failed",
        source,
        code: "rekognition_error",
        sessionId,
      },
      error,
    );
    return {
      success: false,
      status: 502,
      code: "rekognition_error",
    };
  }

  logger.info("Prueba de vida completada", {
    operation: "biometric.liveness",
    event: "rekognition_liveness_completed",
    source,
    sessionId,
    confidence: liveness.confidence,
    threshold: LIVENESS_THRESHOLD,
  });
  if (
    liveness.confidence <= LIVENESS_THRESHOLD ||
    !liveness.referenceImageBytes
  ) {
    logger.warn("La prueba de vida no superó la validación", {
      operation: "biometric.liveness",
      event: "biometric_liveness_low_confidence",
      source,
      code: "liveness_check_failed",
      confidence: liveness.confidence,
      threshold: LIVENESS_THRESHOLD,
    });
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
    logger.error(
      "[citizen-liveness] Failed to fetch photo",
      {
        operation: "biometric.citizen_photo",
        event: "biometric_jce_photo_unavailable",
        source,
        code: "citizen_photo_unavailable",
        sessionId,
      },
      error,
    );
    return {
      success: false,
      status: 502,
      code: "citizen_photo_unavailable",
    };
  }

  let comparison: FaceComparisonResult;
  try {
    logger.info("Iniciando comparación facial", {
      operation: "biometric.compare_faces",
      event: "rekognition_compare_faces_called",
      source,
    });
    comparison = await compareFaces(
      liveness.referenceImageBytes,
      citizenPhoto,
      SIMILARITY_THRESHOLD,
    );
  } catch (error) {
    logger.error(
      "[citizen-liveness] Face comparison failed",
      {
        operation: "biometric.compare_faces",
        event: "biometric_compare_faces_failed",
        source,
        code: "rekognition_error",
        sessionId,
      },
      error,
    );
    return {
      success: false,
      status: 502,
      code: "rekognition_error",
    };
  }

  if (!comparison.isMatch) {
    logger.warn("La comparación facial no coincide", {
      operation: "biometric.compare_faces",
      event: "biometric_face_mismatch",
      source,
      code: "face_mismatch",
      similarity: comparison.similarity,
      threshold: SIMILARITY_THRESHOLD,
    });
    return {
      success: false,
      status: 400,
      code: "face_mismatch",
    };
  }

  logger.info("Comparación facial aprobada", {
    operation: "biometric.compare_faces",
    event: "biometric_face_match_passed",
    source,
    confidence: liveness.confidence,
    similarity: comparison.similarity,
    threshold: SIMILARITY_THRESHOLD,
  });
  return {
    success: true,
    status: 200,
    confidence: liveness.confidence,
    similarity: comparison.similarity,
  };
}
