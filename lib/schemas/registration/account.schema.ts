import { z } from "zod"

type Translate = (key: string) => string

export const accountRequestSchema = z.object({
  cedula: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(10),
})

export function createAccountSchema(t: Translate, cedula: string) {
  return z
    .object({
      email: z.string().email({ message: t("account.validation.email_invalid") }),
      confirmEmail: z
        .string()
        .email({ message: t("account.validation.email_invalid") }),
      password: z
        .string()
        .min(10, { message: t("account.validation.password_min") }),
      confirmPassword: z.string(),
    })
    .refine(
      (data) => {
        if (!cedula) {
          return true
        }

        return !data.password.includes(cedula)
      },
      {
        message: t("account.validation.password_cedula_similarity"),
        path: ["password"],
      },
    )
    .refine(
      (data) => {
        const [emailLocalPart] = data.email.split("@")

        if (!emailLocalPart) {
          return true
        }

        return !data.password
          .toLowerCase()
          .includes(emailLocalPart.toLowerCase())
      },
      {
        message: t("account.validation.password_email_similarity"),
        path: ["password"],
      },
    )
    .refine((data) => data.email === data.confirmEmail, {
      message: t("account.validation.email_mismatch"),
      path: ["confirmEmail"],
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("account.validation.password_mismatch"),
      path: ["confirmPassword"],
    })
}
