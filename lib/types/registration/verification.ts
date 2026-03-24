export type CreateLivenessSessionErrorCode =
  | "registration_session_missing"
  | "rekognition_error"
  | "unexpected_error";

export type CreateLivenessSessionResponse =
  | { success: true; sessionId: string }
  | { success: false; code: CreateLivenessSessionErrorCode };

export type VerifyLivenessErrorCode =
  | "registration_session_missing"
  | "invalid_session_id"
  | "liveness_check_failed"
  | "citizen_photo_unavailable"
  | "face_mismatch"
  | "rekognition_error"
  | "unexpected_error";

export type VerifyLivenessResponse =
  | {
      success: true;
      confidence: number;
      similarity: number;
    }
  | {
      success: false;
      code: VerifyLivenessErrorCode;
    };
