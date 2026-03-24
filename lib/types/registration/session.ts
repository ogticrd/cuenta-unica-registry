export type RegistrationSessionStatus = "identified";

export interface RegistrationSession {
  cedula: string;
  status: RegistrationSessionStatus;
  issuedAt: number;
  expiresAt: number;
}

export type RegistrationVerificationErrorCode =
  | "registration_session_missing"
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
