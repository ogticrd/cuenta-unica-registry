import { describe, expect, it } from "vitest";
import {
  citizenLookupRequestSchema,
  getCitizenLookupFieldErrors,
} from "@/lib/schemas/registration";

describe("citizenLookupRequestSchema", () => {
  it("maps cedula payload issues to stable field errors", () => {
    const result = citizenLookupRequestSchema.safeParse({
      cedula: 40200612345,
      returnUrl: "http://localhost/dashboard",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(getCitizenLookupFieldErrors(result.error)).toEqual({
        cedula: "identification.id_invalid",
      });
    }
  });

  it("does not invent field errors for non-field payload issues", () => {
    const result = citizenLookupRequestSchema.safeParse({
      cedula: "40200612345",
      returnUrl: { href: "http://localhost/dashboard" },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(getCitizenLookupFieldErrors(result.error)).toBeUndefined();
    }
  });
});
