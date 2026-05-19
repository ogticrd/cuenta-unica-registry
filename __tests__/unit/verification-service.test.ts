import { beforeEach, describe, expect, it, vi } from "vitest";
import { API } from "@/lib/constants/api";
import { verificationService } from "@/lib/services/registration/verification.service";

describe("verificationService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("createLivenessSession", () => {
    it("returns sessionId on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            sessionId: "liveness-session-123",
          }),
      } as Response);

      const result = await verificationService.createLivenessSession();

      expect(result).toEqual({
        success: true,
        sessionId: "liveness-session-123",
      });
    });

    it("sends the correct request shape", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({ success: true, sessionId: "liveness-session-123" }),
      } as Response);

      await verificationService.createLivenessSession();

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationLivenessSession,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("returns unexpected_error when JSON parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.reject(new Error("invalid json")),
      } as Response);

      const result = await verificationService.createLivenessSession();

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns unexpected_error when fetch throws", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

      const result = await verificationService.createLivenessSession();

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });
  });

  describe("verifyLiveness", () => {
    it("returns confidence and similarity on success", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            confidence: 99.5,
            similarity: 98.2,
          }),
      } as Response);

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: true,
        confidence: 99.5,
        similarity: 98.2,
      });
    });

    it("sends the correct request shape with sessionId in body", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: true,
            confidence: 99.5,
            similarity: 98.2,
          }),
      } as Response);

      await verificationService.verifyLiveness("session-abc");

      expect(fetchSpy).toHaveBeenCalledWith(
        API.registrationLivenessResult,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: "session-abc" }),
        }),
      );
    });

    it("returns unexpected_error when JSON parsing fails", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () => Promise.reject(new Error("invalid json")),
      } as Response);

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns unexpected_error when fetch throws", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);

      vi.spyOn(global, "fetch").mockRejectedValueOnce(new Error("offline"));

      const result = await verificationService.verifyLiveness("session-abc");

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(result).toEqual({
        success: false,
        code: "unexpected_error",
      });
    });

    it("returns error response from the API", async () => {
      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        json: () =>
          Promise.resolve({
            success: false,
            code: "liveness_check_failed",
          }),
      } as Response);

      const result = await verificationService.verifyLiveness("session-abc");

      expect(result).toEqual({
        success: false,
        code: "liveness_check_failed",
      });
    });
  });
});
