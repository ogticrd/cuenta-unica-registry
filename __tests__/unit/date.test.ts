import { describe, expect, it } from "vitest";
import { formatSessionDate, getRelativeTime } from "@/lib/utils/date";

describe("date utils", () => {
  describe("getRelativeTime", () => {
    it("returns empty string if date is not provided", () => {
      expect(getRelativeTime(null)).toBe("");
      expect(getRelativeTime(undefined)).toBe("");
    });

    it("returns empty string if date is invalid", () => {
      expect(getRelativeTime("invalid-date")).toBe("");
    });

    it("returns relative time in spanish by default", () => {
      // Create a date slightly in the past
      const date = new Date(Date.now() - 60000); // 1 minute ago
      expect(getRelativeTime(date)).toContain("hace 1 minuto");
    });

    it("returns relative time in english if specified", () => {
      const date = new Date(Date.now() - 60000); // 1 minute ago
      expect(getRelativeTime(date, "en")).toContain("1 minute ago");
    });
  });

  describe("formatSessionDate", () => {
    it("returns fallback if value is not provided", () => {
      expect(formatSessionDate(undefined, "fallback")).toBe("fallback");
      expect(formatSessionDate("", "fallback")).toBe("fallback");
    });

    it("returns fallback if date is invalid", () => {
      expect(formatSessionDate("invalid-date", "fallback")).toBe("fallback");
    });

    it("formats a valid date according to the locale", () => {
      const dateStr = "2023-01-01T12:00:00Z";
      const result = formatSessionDate(dateStr, "fallback", "en-US");
      expect(result).not.toBe("fallback");
      expect(result).toContain("1/1/2023");
    });
  });
});
