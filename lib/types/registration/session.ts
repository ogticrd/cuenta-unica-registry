export type RegistrationSessionStatus = "identified" | "verified";

export interface RegistrationSession {
  cedula: string;
  status: RegistrationSessionStatus;
  returnUrl?: string;
  livenessSessionId?: string;
  livenessSessionAttempts?: number;
  issuedAt: number;
  expiresAt: number;
}

export type RegistrationVerificationErrorCode =
  | "registration_session_missing"
  | "registration_disabled"
  | "unexpected_error";

export type RegistrationSessionResetErrorCode = "unexpected_error";

export type RegistrationVerificationResponse =
  | {
      success: true;
    }
  | {
      success: false;
      code: RegistrationVerificationErrorCode;
    };

export type RegistrationSessionResetResponse =
  | {
      success: true;
    }
  | {
      success: false;
      code: RegistrationSessionResetErrorCode;
    };
