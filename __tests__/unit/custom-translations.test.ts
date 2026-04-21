import { describe, expect, it } from "vitest";
import {
  oryCustomTranslations,
  translateOryMessageKey,
} from "@/lib/ory/custom-translations";

describe("translateOryMessageKey", () => {
  it("returns the Spanish translation for a known key", () => {
    const result = translateOryMessageKey("identities.messages.4000007", "es");

    expect(result).toBe("Ya existe una cuenta con este correo electrónico.");
  });

  it("returns the English translation for a known key", () => {
    const result = translateOryMessageKey("identities.messages.4000007", "en");

    expect(result).toBe("An account with this email already exists.");
  });

  it("returns the fallback when the key is unknown", () => {
    const result = translateOryMessageKey("unknown.key", "es", "Fallback text");

    expect(result).toBe("Fallback text");
  });

  it("returns the key itself when both key is unknown and no fallback provided", () => {
    const result = translateOryMessageKey("unknown.key", "es");

    expect(result).toBe("unknown.key");
  });

  it("translates all known password message keys for both locales", () => {
    const passwordKeys = [
      "identities.messages.4000005",
      "identities.messages.4000031",
      "identities.messages.4000032",
      "identities.messages.4000033",
      "identities.messages.4000034",
    ];

    for (const key of passwordKeys) {
      for (const locale of ["es", "en"] as const) {
        const result = translateOryMessageKey(key, locale);
        expect(result).not.toBe(key);
        expect(result.length).toBeGreaterThan(0);
      }
    }
  });

  it("has consistent keys across locales", () => {
    const esKeys = Object.keys(oryCustomTranslations.es);
    const enKeys = Object.keys(oryCustomTranslations.en);

    expect(esKeys).toEqual(enKeys);
  });
});
