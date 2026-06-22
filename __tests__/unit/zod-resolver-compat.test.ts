import { zodResolver } from "@hookform/resolvers/zod";
import type { ResolverOptions } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { createCedulaSchema } from "@/lib/schemas/registration";

describe("zodResolver compatibility", () => {
  it("returns field errors for Zod 4 issues instead of throwing", async () => {
    const schema = createCedulaSchema((key) => {
      const messages: Record<string, string> = {
        "identification.id_required": "La cédula es requerida",
        "identification.id_invalid_length": "La cédula debe tener 11 dígitos",
        "identification.id_invalid": "La cédula ingresada no es válida",
      };

      return messages[key] ?? key;
    });
    const resolver = zodResolver(schema);
    const options = {
      criteriaMode: "firstError",
      fields: {},
      names: ["cedula"],
      shouldUseNativeValidation: false,
    } satisfies ResolverOptions<{ cedula: string }>;

    const result = await resolver(
      { cedula: "000-0000000-0" },
      undefined,
      options,
    );

    expect(result.errors.cedula?.message).toBe(
      "La cédula ingresada no es válida",
    );
    expect(result.values).toEqual({});
  });
});
