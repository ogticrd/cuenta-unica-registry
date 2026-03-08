import { z } from "zod"

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Este campo es obligatorio"),
    newPassword: z
      .string()
      .min(1, "Este campo es obligatorio")
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
      ),
    confirmPassword: z.string().min(1, "Este campo es obligatorio"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["newPassword"],
  })

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
