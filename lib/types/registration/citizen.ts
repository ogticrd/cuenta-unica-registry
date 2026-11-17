export interface CitizenLookupRequest {
  cedula: string;
  returnUrl?: string;
  recaptchaToken?: string;
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
  | "recaptcha_failed"
  | "identity_exists"
  | "citizen_not_found"
  | "unexpected_error";

export type CitizenLookupFieldErrors = Partial<Record<"cedula", string>>;

export type CitizenLookupResponse =
  | {
      success: true;
      citizen: CitizenLookupResult;
    }
  | {
      success: false;
      code: CitizenLookupErrorCode;
      fieldErrors?: CitizenLookupFieldErrors;
    };
