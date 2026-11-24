export type VidLaunchErrorCode =
  | "invalid_parameters"
  | "invalid_token"
  | "invalid_client"
  | "invalid_redirect_uri"
  | "citizen_not_found"
  | "service_unavailable";

export type VidLivenessErrorCode =
  | "invalid_payload"
  | "flow_expired"
  | "attempt_limit"
  | "invalid_session_id"
  | "liveness_check_failed"
  | "citizen_photo_unavailable"
  | "face_mismatch"
  | "rekognition_error"
  | "unexpected_error";

export type VidLivenessResponse =
  | { success: true; sessionId: string }
  | { success: true; redirectTo: string }
  | { success: false; code: VidLivenessErrorCode; stage: "start" | "complete" };
