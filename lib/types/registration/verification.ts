import type {
  RegisterAccountDestination,
  RegisterAccountErrorCode,
  RegisterAccountFieldErrors,
} from "./account";

export type CreateLivenessSessionErrorCode =
  | "registration_session_missing"
  | "account_draft_missing"
  | "verification_already_completed"
  | "rekognition_error"
  | "unexpected_error";

export type CreateLivenessSessionResponse =
  | { success: true; sessionId: string }
  | { success: false; code: CreateLivenessSessionErrorCode };

export type VerifyLivenessErrorCode =
  | "invalid_payload"
  | "registration_session_missing"
  | "account_draft_missing"
  | "verification_already_completed"
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

export type CompleteLivenessRegistrationResponse =
  | {
      success: true;
      confidence: number;
      similarity: number;
      redirectTo: string;
      destination: RegisterAccountDestination;
    }
  | {
      success: false;
      stage: "verification";
      code: VerifyLivenessErrorCode;
    }
  | {
      success: false;
      stage: "account";
      code: RegisterAccountErrorCode;
      fieldErrors?: RegisterAccountFieldErrors;
    };
