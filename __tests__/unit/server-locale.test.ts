// Mock "server-only" since this module imports it
import { describe, expect, it, vi } from "vitest";
import {
  getServerLocale,
  normalizeServerLocale,
} from "@/lib/ory/server-locale";

const mockCookieGet = vi.fn();

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: (...args: unknown[]) => mockCookieGet(...args),
    }),
  ),
}));

describe("normalizeServerLocale", () => {
  it("returns 'es' for valid Spanish locale", () => {
    expect(normalizeServerLocale("es")).toBe("es");
  });

  it("returns 'en' for valid English locale", () => {
    expect(normalizeServerLocale("en")).toBe("en");
  });

  it("returns default locale for unsupported locale", () => {
    expect(normalizeServerLocale("fr")).toBe("es");
  });

  it("returns default locale for undefined", () => {
    expect(normalizeServerLocale(undefined)).toBe("es");
  });

  it("returns default locale for empty string", () => {
    expect(normalizeServerLocale("")).toBe("es");
  });

  it("is case-sensitive — normalizes uppercase locale", () => {
    expect(normalizeServerLocale("ES")).toBe("es");
  });
});

describe("getServerLocale", () => {
  it("returns the locale from the cookie when present", async () => {
    mockCookieGet.mockReturnValue({ value: "en" });
    const result = await getServerLocale();
    expect(result).toBe("en");
  });

  it("returns default locale when the cookie is missing", async () => {
    mockCookieGet.mockReturnValue(undefined);
    const result = await getServerLocale();
    expect(result).toBe("es");
  });
});
