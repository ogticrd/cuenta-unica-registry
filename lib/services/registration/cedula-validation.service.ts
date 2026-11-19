import "server-only";

import { z } from "zod";
import {
  ApiResponseError,
  parseJsonResponse,
} from "@/lib/services/api-response";
import {
  hasValidCedulaFormat,
  isValidCedula,
  normalizeCedula,
} from "@/lib/utils/cedula";

const validationResponseSchema = z.object({ valid: z.boolean() });

type CedulaValidationResult =
  | { success: true }
  | {
      success: false;
      code: "invalid_cedula" | "cedula_validation_unavailable";
      status: 400 | 503;
    };

export async function validateCedula(
  cedula: string,
): Promise<CedulaValidationResult> {
  if (!hasValidCedulaFormat(cedula)) {
    return { success: false, code: "invalid_cedula", status: 400 };
  }

  const normalizedCedula = normalizeCedula(cedula);
  if (await isValidCedula(normalizedCedula)) return { success: true };

  let stage = "configuration";
  try {
    const validationApi = process.env.CEDULA_VALIDATION_API;
    if (!validationApi) throw new Error("Missing CEDULA_VALIDATION_API");

    const url = new URL(
      `${validationApi.replace(/\/$/, "")}/${normalizedCedula}/validate`,
    );
    stage = "request";
    const payload = await fetch(url, {
      cache: "no-store",
    }).then<unknown>(parseJsonResponse);

    stage = "response";
    const parsed = validationResponseSchema.safeParse(payload);
    if (!parsed.success) throw new Error("Invalid cedula validation response");

    return parsed.data.valid
      ? { success: true }
      : { success: false, code: "invalid_cedula", status: 400 };
  } catch (error) {
    console.error(
      "[cedula-validation] Validation unavailable",
      JSON.stringify({
        stage,
        status: error instanceof ApiResponseError ? error.status : undefined,
        name: error instanceof Error ? error.name : "UnknownError",
      }),
    );
    return {
      success: false,
      code: "cedula_validation_unavailable",
      status: 503,
    };
  }
}
