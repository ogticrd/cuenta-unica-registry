import { z } from "zod";

import { CEDULA_DIGITS_LENGTH, hasValidCedulaFormat } from "@/lib/utils/cedula";

type Translate = (key: string) => string;

export function createCedulaSchema(t: Translate) {
  return z.object({
    cedula: z
      .string()
      .min(1, { message: t("identification.id_required") })
      .refine(
        (value) => value.replace(/-/g, "").length === CEDULA_DIGITS_LENGTH,
        {
          message: t("identification.id_invalid_length"),
        },
      )
      .refine(hasValidCedulaFormat, {
        message: t("identification.id_invalid"),
      }),
  });
}
