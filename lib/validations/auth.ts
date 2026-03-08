import { z } from "zod"

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Este campo es obligatorio")
    .refine((value) => {
      // Check if it's a valid email or cedula (11 digits)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const cedulaRegex = /^\d{11}$/
      return emailRegex.test(value) || cedulaRegex.test(value)
    }, "Ingrese una cédula válida (11 dígitos) o un correo electrónico válido"),
  password: z.string().min(1, "Este campo es obligatorio"),
})

export type LoginFormData = z.infer<typeof loginSchema>
