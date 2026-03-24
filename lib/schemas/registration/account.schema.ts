import { z } from "zod";

import {
  isBreachedPassword,
  isPasswordStrongEnough,
  PASSWORD_MIN_LENGTH,
} from "@/lib/utils/password";
import { normalizeCedula } from "@/lib/utils/cedula";

type Translate = (key: string) => string;

export const accountRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(PASSWORD_MIN_LENGTH),
});

function validatePasswordExcludesCedula(cedula: string) {
  return (data: { password: string }) => {
    if (!cedula) return true;
    return !data.password.includes(cedula);
  };
}

function validatePasswordExcludesEmailPrefix(data: {
  email: string;
  password: string;
}) {
  const [emailLocalPart] = data.email.split("@");
  if (!emailLocalPart) return true;
  return !data.password.toLowerCase().includes(emailLocalPart.toLowerCase());
}

export function createAccountSchema(t: Translate, cedula = "") {
  const normalizedCedula = normalizeCedula(cedula);

  return z
    .object({
      email: z
        .string()
        .email({ message: t("account.validation.email_invalid") }),
      confirmEmail: z
        .string()
        .email({ message: t("account.validation.email_invalid") }),
      password: z
        .string()
        .min(PASSWORD_MIN_LENGTH, {
          message: t("account.validation.password_min"),
        }),
      confirmPassword: z.string(),
    })
    .refine(validatePasswordExcludesCedula(normalizedCedula), {
      message: t("account.validation.password_cedula_similarity"),
      path: ["password"],
    })
    .refine(validatePasswordExcludesEmailPrefix, {
      message: t("account.validation.password_email_similarity"),
      path: ["password"],
    })
    .refine((data) => data.email === data.confirmEmail, {
      message: t("account.validation.email_mismatch"),
      path: ["confirmEmail"],
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("account.validation.password_mismatch"),
      path: ["confirmPassword"],
    })
    .refine(({ password }) => isPasswordStrongEnough(password), {
      message: t("account.validation.password_weak"),
      path: ["password"],
    })
    .refine(async ({ password }) => !(await isBreachedPassword(password)), {
      message: t("account.validation.password_compromised"),
      path: ["password"],
    });
}
