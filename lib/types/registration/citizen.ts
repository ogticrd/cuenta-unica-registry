export interface CitizenLookupRequest {
  cedula: string;
  returnUrl?: string;
  recaptchaToken?: string;
  recoverAccess?: boolean;
}

export interface CitizenLookupResult {
  id: string;
  firstName: string;
}

export interface CitizenProfileResult {
  id: string;
  names: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender: "M" | "F";
}

export type CitizenLookupErrorCode =
  | "invalid_payload"
  | "invalid_cedula"
  | "cedula_validation_unavailable"
  | "recaptcha_failed"
  | "identity_exists"
  | "recovery_not_found"
  | "citizen_not_found"
  | "unexpected_error";

export type CitizenLookupFieldErrors = Partial<Record<"cedula", string>>;

export type CitizenLookupResponse =
  | {
      success: true;
      citizen: CitizenLookupResult;
      recovery?: true;
    }
  | {
      success: false;
      code: CitizenLookupErrorCode;
      fieldErrors?: CitizenLookupFieldErrors;
    };
