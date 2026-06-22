export interface RegisterAccountRequest {
  email: string;
  password: string;
}

export interface RegisterAccountDraft {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
}

export type RegisterAccountDestination =
  | "verification"
  | "login"
  | "email-sent";

export type RegisterAccountFieldErrors = Partial<
  Record<"email" | "password", string>
>;

export interface RegisterAccountStepErrors {
  code?: RegisterAccountErrorCode;
  fieldErrors?: RegisterAccountFieldErrors;
}

export type RegisterAccountErrorCode =
  | "invalid_payload"
  | "registration_session_missing"
  | "verification_required"
  | "account_draft_missing"
  | "password_cedula_similarity"
  | "password_email_similarity"
  | "password_weak"
  | "password_compromised"
  | "invalid_cedula"
  | "citizen_not_found"
  | "identity_exists"
  | "ory_validation_error"
  | "unexpected_error";

export type RegisterAccountResponse =
  | {
      success: true;
      redirectTo: string;
      destination: RegisterAccountDestination;
    }
  | {
      success: false;
      code: RegisterAccountErrorCode;
      fieldErrors?: RegisterAccountFieldErrors;
    };

export type SaveRegisterAccountDraftErrorCode =
  | "invalid_payload"
  | "registration_session_missing"
  | "password_cedula_similarity"
  | "password_email_similarity"
  | "password_weak"
  | "password_compromised"
  | "unexpected_error";

export type SaveRegisterAccountDraftResponse =
  | {
      success: true;
      sessionStatus: "identified" | "verified";
    }
  | {
      success: false;
      code: SaveRegisterAccountDraftErrorCode;
      fieldErrors?: RegisterAccountFieldErrors;
    };
