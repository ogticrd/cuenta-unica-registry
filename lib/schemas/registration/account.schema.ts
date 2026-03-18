import { z } from "zod"

type Translate = (key: string) => string

export function createAccountSchema(t: Translate) {
  return z
    .object({
      email: z.string().email({ message: t("account.validation.email_invalid") }),
      confirmEmail: z
        .string()
        .email({ message: t("account.validation.email_invalid") }),
      password: z
        .string()
        .min(8, { message: t("account.validation.password_min") })
        .regex(/[A-Z]/, { message: t("account.validation.password_uppercase") })
        .regex(/[a-z]/, { message: t("account.validation.password_lowercase") })
        .regex(/[0-9]/, { message: t("account.validation.password_number") }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.email === data.confirmEmail, {
      message: t("account.validation.email_mismatch"),
      path: ["confirmEmail"],
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("account.validation.password_mismatch"),
      path: ["confirmPassword"],
    })
}
