import { z } from "zod";

import {
  CEDULA_DIGITS_LENGTH,
  isValidCedula,
  normalizeCedula,
} from "@/lib/utils/cedula";

type Translate = (key: string) => string;

export function createCedulaSchema(t: Translate) {
  return z.object({
    cedula: z
      .string()
      .min(1, { message: t("identification.id_required") })
      .refine(
        (value) => normalizeCedula(value).length === CEDULA_DIGITS_LENGTH,
        {
          message: t("identification.id_invalid_length"),
        },
      )
      .refine(
        async (value) => {
          const cedula = normalizeCedula(value);

          if (cedula.length !== CEDULA_DIGITS_LENGTH) {
            return true;
          }

          return isValidCedula(cedula);
        },
        {
          message: t("identification.id_invalid"),
        },
      ),
  });
}
