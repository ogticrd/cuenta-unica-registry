import { z } from "zod";
import type { CitizenLookupFieldErrors } from "@/lib/types/registration/citizen";

export const citizenLookupRequestSchema = z.object({
  cedula: z.string(),
  returnUrl: z.string().optional(),
});

export function getCitizenLookupFieldErrors(
  error: z.ZodError,
): CitizenLookupFieldErrors | undefined {
  const hasCedulaError = error.issues.some(
    (issue) => issue.path[0] === "cedula",
  );

  return hasCedulaError ? { cedula: "identification.id_invalid" } : undefined;
}
