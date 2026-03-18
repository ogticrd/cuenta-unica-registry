export interface RegisterAccountRequest {
  cedula: string
  email: string
  password: string
}

export type RegisterAccountDestination = "verification" | "login"

export type RegisterAccountFieldError = Partial<
  Record<"email" | "password", string>
>

export type RegisterAccountErrorCode =
  | "invalid_payload"
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
      fieldErrors?: RegisterAccountFieldError
      formError?: string
    }
