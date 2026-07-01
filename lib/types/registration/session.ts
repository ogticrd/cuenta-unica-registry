import type { AnalyticsContext } from "@/lib/analytics/context-core";

export type RegistrationSessionStatus = "identified" | "verified";

export interface RegistrationSession {
  sessionId: string;
  cedula: string;
  status: RegistrationSessionStatus;
  returnUrl?: string;
  analytics?: AnalyticsContext;
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
