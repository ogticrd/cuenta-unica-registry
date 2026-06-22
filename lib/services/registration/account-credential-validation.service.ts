import "server-only";

import type {
  RegisterAccountErrorCode,
  RegisterAccountFieldErrors,
  RegisterAccountRequest,
} from "@/lib/types/registration/account";
import { normalizeCedula } from "@/lib/utils/cedula";
import {
  isBreachedPassword,
  isPasswordStrongEnough,
} from "@/lib/utils/password";

export type AccountCredentialValidationErrorCode = Extract<
  RegisterAccountErrorCode,
  | "password_cedula_similarity"
  | "password_email_similarity"
  | "password_weak"
  | "password_compromised"
>;

interface AccountCredentialValidationOptions {
  cedula?: string;
}

interface AccountCredentialValidationError {
  code: AccountCredentialValidationErrorCode;
  fieldErrors?: RegisterAccountFieldErrors;
}

function createPasswordError(
  code: AccountCredentialValidationErrorCode,
  messageKey: string,
): AccountCredentialValidationError {
  return {
    code,
    fieldErrors: {
      password: messageKey,
    },
  };
}

export async function validateRegistrationAccountCredentials(
  input: RegisterAccountRequest,
  options: AccountCredentialValidationOptions = {},
): Promise<AccountCredentialValidationError | null> {
  const cedula = normalizeCedula(options.cedula ?? "");

  if (cedula && input.password.includes(cedula)) {
    return createPasswordError(
      "password_cedula_similarity",
      "account.validation.password_cedula_similarity",
    );
  }

  const [emailLocalPart] = input.email.split("@");

  if (
    emailLocalPart &&
    input.password.toLowerCase().includes(emailLocalPart.toLowerCase())
  ) {
    return createPasswordError(
      "password_email_similarity",
      "account.validation.password_email_similarity",
    );
  }

  if (!isPasswordStrongEnough(input.password)) {
    return createPasswordError(
      "password_weak",
      "account.validation.password_weak",
    );
  }

  if (await isBreachedPassword(input.password)) {
    return createPasswordError(
      "password_compromised",
      "account.validation.password_compromised",
    );
  }

  return null;
}
