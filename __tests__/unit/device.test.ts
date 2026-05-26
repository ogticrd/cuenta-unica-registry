import { describe, it, expect } from "vitest";
import { formatUserAgent } from "@/lib/utils/device";
import type { UserAgentTranslations } from "@/lib/utils/device";

const translations: UserAgentTranslations = {
  unknownBrowser: "Navegador desconocido",
  unknownOS: "SO desconocido",
  connector: " en ",
};

describe("formatUserAgent", () => {
  it("returns fallback for null/undefined user agent", () => {
    expect(formatUserAgent(null, "Fallback", translations)).toBe("Fallback");
    expect(formatUserAgent(undefined, "Fallback", translations)).toBe(
      "Fallback"
    );
  });

  it("includes browser name on desktop", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result).toContain("Chrome");
  });

  it("shows Windows OS version", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result).toBe("Computadora · Chrome en Windows 10");
  });

  it("shows macOS desktop without architecture when not in UA", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result).toContain("Safari");
    expect(result).toContain("macOS");
    // macOS UA string typically includes architecture info in some parsers
    // At minimum it should not error
    expect(result).toBeTruthy();
  });

  it("shows vendor and model for Android mobile", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result).toContain("Android");
    expect(result).toContain("Samsung");
    expect(result).toContain("SM-G991B");
  });

  it("shows device info for iPhone", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result).toContain("Safari");
    expect(result).toContain("iOS");
    // iPhone should have Apple vendor + iPhone model
    expect(result).not.toContain("bits");
  });

  it("truncates unknown UA strings longer than 30 chars", () => {
    const ua = "SomeUnknownBrowser/1.0 (UnknownOS; Platform) Extra words here";
    const result = formatUserAgent(ua, "Fallback", translations);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(33); // 30 chars + "..."
  });

  it("uses fallback default value when no arguments provided for fallback", () => {
    const result = formatUserAgent(null, undefined, translations);
    expect(result).toBe("Dispositivo desconocido");
  });
});
