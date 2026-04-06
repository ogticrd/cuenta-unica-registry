import { describe, expect, it } from "vitest";
import { normalizeServerLocale } from "@/lib/ory/server-locale";

// Mock "server-only" since this module imports it
import { vi } from "vitest";
vi.mock("server-only", () => ({}));

describe("normalizeServerLocale", () => {
  it("returns 'es' for valid Spanish locale", () => {
    expect(normalizeServerLocale("es")).toBe("es");
  });

  it("returns 'en' for valid English locale", () => {
    expect(normalizeServerLocale("en")).toBe("en");
  });

  it("returns default locale for unsupported locale 'fr'", () => {
    expect(normalizeServerLocale("fr")).toBe("es");
  });

  it("returns default locale for unsupported locale 'de'", () => {
    expect(normalizeServerLocale("de")).toBe("es");
  });

  it("returns default locale for undefined", () => {
    expect(normalizeServerLocale(undefined)).toBe("es");
  });

  it("returns default locale for empty string", () => {
    expect(normalizeServerLocale("")).toBe("es");
  });

  it("is case-sensitive — rejects uppercase locale", () => {
    expect(normalizeServerLocale("ES")).toBe("es");
  });
});
