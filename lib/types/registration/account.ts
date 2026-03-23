export interface RegisterAccountRequest {
  email: string
  password: string
}

export interface RegisterAccountDraft {
  email: string
  confirmEmail: string
  password: string
  confirmPassword: string
}

export type RegisterAccountDestination = "verification" | "login" | "email-sent"

export type RegisterAccountFieldErrors = Partial<
  Record<"email" | "password", string>
>

export interface RegisterAccountStepErrors {
  code?: RegisterAccountErrorCode
  fieldErrors?: RegisterAccountFieldErrors
}

export type RegisterAccountErrorCode =
  | "invalid_payload"
  | "registration_session_missing"
  | "password_cedula_similarity"
  | "invalid_cedula"
  | "citizen_not_found"
  | "identity_exists"
  | "ory_validation_error"
  | "unexpected_error"

export type RegisterAccountResponse =
  | {
      success: true
      redirectTo: string
      destination: RegisterAccountDestination
    }
  | {
      success: false
      code: RegisterAccountErrorCode
      fieldErrors?: RegisterAccountFieldErrors
    }
