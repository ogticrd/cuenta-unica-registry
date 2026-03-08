import { z } from "zod"

export const verifyCodeSchema = z.object({
  code: z.string().min(6, "El código debe tener 6 dígitos").max(6, "El código debe tener 6 dígitos"),
})

export type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>
