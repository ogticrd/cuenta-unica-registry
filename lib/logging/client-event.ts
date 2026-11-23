import { z } from "zod";

export const clientErrorCodes = [
  "unexpected_error",
  "invalid_payload",
  "invalid_cedula",
  "cedula_validation_unavailable",
  "recaptcha_failed",
  "identity_exists",
  "citizen_not_found",
  "recovery_not_found",
  "recovery_failed",
  "recovery_sessions_revocation_failed",
  "registration_session_missing",
  "verification_required",
  "account_draft_missing",
  "password_cedula_similarity",
  "password_email_similarity",
  "password_weak",
  "password_compromised",
  "ory_validation_error",
  "invalid_session_id",
  "liveness_check_failed",
  "citizen_photo_unavailable",
  "face_mismatch",
  "rekognition_error",
  "verification_already_completed",
  "biometric_attempt_limit_exceeded",
  "biometric_cooldown_active",
  "camera_error",
  "flow_expired",
  "attempt_limit",
  "missing_data",
  "invalid_code_length",
  "invalid_code",
  "ory_verification_error",
  "expired_code",
  "BAD_REQUEST",
  "SERVER_ERROR",
  "detector_error",
  "network_error",
] as const;

export const clientEventSchema = z.strictObject({
  event: z.enum([
    "client_error",
    "client_unhandled_rejection",
    "form_error",
    "biometric_detector_error",
    "biometric_session_timed_out",
    "recaptcha_token_generation_failed",
    "feedback_failed",
  ]),
  form: z
    .enum([
      "identification",
      "register",
      "account_recovery",
      "verification",
      "login",
      "vid",
      "feedback",
    ])
    .optional(),
  source: z.enum(["registration", "vid", "recovery"]).optional(),
  code: z.enum(clientErrorCodes).optional(),
  errorType: z
    .string()
    .regex(/^[A-Za-z][A-Za-z0-9_.]{0,63}$/)
    .optional(),
  stack: z.string().max(800).optional(),
  digest: z
    .string()
    .regex(/^[A-Za-z0-9_-]{1,80}$/)
    .optional(),
  detectorState: z
    .string()
    .regex(/^[A-Z_]{1,64}$/)
    .optional(),
  retryAfterSeconds: z.number().int().min(0).max(86400).optional(),
  messageIds: z.array(z.number().int()).max(20).optional(),
});

export type ClientEvent = z.infer<typeof clientEventSchema>;
