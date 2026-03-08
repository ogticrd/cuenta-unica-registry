import { z } from "zod"

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Este campo es obligatorio").email("Ingrese un correo electrónico válido"),
})

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>
